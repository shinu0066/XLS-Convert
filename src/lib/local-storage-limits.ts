
"use client";

import { logConversionToFirestore } from '@/lib/firebase-analytics-service';

// --- CONFIGURATION ---

const GUEST_FREE_TIER_KEY_PREFIX = "XLSCONVERT_GUEST_CONVERSIONS";
const USER_FREE_TIER_KEY_PREFIX = "XLSCONVERT_USER_CONVERSIONS_";

// The number of free conversions allowed.
const MAX_GUEST_CONVERSIONS = 1;
const MAX_LOGGED_IN_CONVERSIONS = 5;

// The time window for the free tier limit, in milliseconds (24 hours).
const FREE_TIER_WINDOW_MS = 24 * 60 * 60 * 1000;

const PLAN_KEY_PREFIX = "XLSCONVERT_ACTIVE_PLAN_";
const MONTH_MS = 30 * 24 * 60 * 60 * 1000; // Approx 30 days
const YEAR_MS = 365 * 24 * 60 * 60 * 1000; // Approx 365 days
const TRIAL_DURATION_MS = (days: number) => days * 24 * 60 * 60 * 1000;

// --- INTERFACES ---

interface ConversionRecord {
  timestamp: number;
}

export interface ActivePlan {
  name: string;
  totalConversions: number;
  usedConversions: number;
  activatedAt: number;
  billingCycle: 'monthly' | 'annual';
  isTrial?: boolean;
  trialEndsAt?: number;
}

export interface PlanDetails {
  id: string;
  name: string;
  conversions: number;
  cycle: 'monthly' | 'annual';
  price: number;
  trialDays?: number;
}

export interface LimitStatus {
  allowed: boolean;
  remaining: number;
  timeToWaitMs?: number;
  onPlan: boolean;
  planName?: string;
  isPlanExhausted?: boolean;
  isTrial?: boolean;
  trialEndsAt?: number;
}

// --- CORE HELPER FUNCTIONS ---

function getStoredTimestamps(key: string): ConversionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error(`[LocalStorageLimits] Error reading from local storage for key "${key}":`, error);
    localStorage.removeItem(key); // Clear corrupted data
    return [];
  }
}

function saveTimestamps(key: string, timestamps: ConversionRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(timestamps));
  } catch (error) {
    console.error(`[LocalStorageLimits] Error writing to local storage for key "${key}":`, error);
  }
}

// --- PLAN MANAGEMENT ---

function getPlanKey(userId: string | null): string {
  return userId ? `${PLAN_KEY_PREFIX}${userId}` : `${PLAN_KEY_PREFIX}guest`;
}

export function activatePlan(userId: string | null, planDetails: PlanDetails): ActivePlan {
  const planKey = getPlanKey(userId);
  const newPlan: ActivePlan = {
    name: planDetails.name,
    totalConversions: planDetails.conversions,
    usedConversions: 0,
    activatedAt: Date.now(),
    billingCycle: planDetails.cycle,
    isTrial: !!(planDetails.trialDays && planDetails.trialDays > 0),
    trialEndsAt: planDetails.trialDays && planDetails.trialDays > 0 ? Date.now() + TRIAL_DURATION_MS(planDetails.trialDays) : undefined,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(planKey, JSON.stringify(newPlan));
    } catch (error) {
      console.error("[LocalStorageLimits] Error saving active plan:", error);
    }
  }
  return newPlan;
}

export function getActivePlan(userId: string | null): ActivePlan | null {
  if (typeof window === 'undefined' || !userId) return null;
  const planKey = getPlanKey(userId);
  try {
    const item = localStorage.getItem(planKey);
    if (!item) return null;

    const plan = JSON.parse(item) as ActivePlan;
    const now = Date.now();
    const planDuration = plan.billingCycle === 'monthly' ? MONTH_MS : YEAR_MS;

    if (now - plan.activatedAt > planDuration) {
      localStorage.removeItem(planKey);
      return null;
    }
    return plan;
  } catch (error) {
    console.error("[LocalStorageLimits] Error reading active plan:", error);
    localStorage.removeItem(planKey);
    return null;
  }
}

function consumePlanConversion(userId: string | null): boolean {
  if (typeof window === 'undefined') return false;
  const activePlan = getActivePlan(userId);
  if (activePlan && activePlan.usedConversions < activePlan.totalConversions) {
    activePlan.usedConversions += 1;
    try {
      localStorage.setItem(getPlanKey(userId), JSON.stringify(activePlan));
      return true;
    } catch (error) {
      console.error("[LocalStorageLimits] Error updating plan conversions:", error);
      return false;
    }
  }
  return false;
}

// --- FREE TIER MANAGEMENT ---

function getFreeTierKey(userId: string | null): string {
  return userId ? `${USER_FREE_TIER_KEY_PREFIX}${userId}` : GUEST_FREE_TIER_KEY_PREFIX;
}

function getFreeTierLimit(userId: string | null): number {
  return userId ? MAX_LOGGED_IN_CONVERSIONS : MAX_GUEST_CONVERSIONS;
}

// --- PUBLIC API ---

/**
 * Checks if a conversion is allowed for the user.
 * It first checks for a paid plan, then falls back to the free tier.
 * @param userId - The user's ID or null for a guest.
 * @param conversionsRequested - The number of conversions being attempted (for batch processing).
 */
export function checkConversionLimit(userId: string | null, conversionsRequested: number = 1): LimitStatus {
  const activePlan = getActivePlan(userId);

  // 1. Check for active paid plan
  if (activePlan) {
    const isCurrentlyInTrial = activePlan.isTrial && activePlan.trialEndsAt && Date.now() < activePlan.trialEndsAt;
    const remainingPlanConversions = activePlan.totalConversions - activePlan.usedConversions;
    if (remainingPlanConversions >= conversionsRequested) {
      return {
        allowed: true,
        remaining: remainingPlanConversions,
        onPlan: true,
        planName: activePlan.name,
        isTrial: !!isCurrentlyInTrial,
        trialEndsAt: activePlan.trialEndsAt,
      };
    } else {
      return { // Plan quota is exhausted or not enough for batch
        allowed: false,
        remaining: remainingPlanConversions,
        onPlan: true,
        planName: activePlan.name,
        isPlanExhausted: true,
        isTrial: !!isCurrentlyInTrial,
        trialEndsAt: activePlan.trialEndsAt,
      };
    }
  }

  // 2. Fallback to free tier logic
  const freeTierKey = getFreeTierKey(userId);
  const freeTierLimit = getFreeTierLimit(userId);
  const now = Date.now();

  const allTimestamps = getStoredTimestamps(freeTierKey);
  // A conversion is valid if it happened within the last 24 hours.
  const validTimestamps = allTimestamps.filter(record => (now - record.timestamp) < FREE_TIER_WINDOW_MS);

  // Clean up expired timestamps from local storage.
  if (validTimestamps.length !== allTimestamps.length) {
    saveTimestamps(freeTierKey, validTimestamps);
  }

  const remainingConversions = freeTierLimit - validTimestamps.length;

  if (remainingConversions >= conversionsRequested) {
    return { allowed: true, remaining: remainingConversions, onPlan: false, isTrial: false };
  } else {
    // If limit is reached, calculate time until the oldest conversion expires.
    const oldestTimestamp = validTimestamps.length > 0 ? validTimestamps.sort((a, b) => a.timestamp - b.timestamp)[0].timestamp : now;
    const timeToWaitMs = (oldestTimestamp + FREE_TIER_WINDOW_MS) - now;
    return {
      allowed: false,
      remaining: 0,
      timeToWaitMs: Math.max(0, timeToWaitMs),
      onPlan: false,
      isTrial: false
    };
  }
}

/**
 * Records a new conversion for the user.
 * It tries to consume a plan conversion first, otherwise records a free tier conversion.
 */
export function recordConversion(userId: string | null): void {
  // Try to use a plan conversion first.
  if (consumePlanConversion(userId)) {
    // Log to analytics if needed
  } else {
    // Otherwise, record it against the free tier.
    const freeTierKey = getFreeTierKey(userId);
    const now = Date.now();
    const currentTimestamps = getStoredTimestamps(freeTierKey);
    
    // This filter is for safety, ensuring we don't build up an infinitely large array.
    const validTimestamps = currentTimestamps.filter(record => (now - record.timestamp) < FREE_TIER_WINDOW_MS);
    
    validTimestamps.push({ timestamp: now });
    saveTimestamps(freeTierKey, validTimestamps);
  }

  // Log the conversion to Firestore for backend analytics
  logConversionToFirestore(userId ? 'loggedIn' : 'guest', userId || undefined).catch(error => {
    console.warn("[LocalStorageLimits] Failed to log conversion to Firestore:", error);
  });
}

/**
 * NEW FUNCTION: Ends all active trials by removing plan data from local storage.
 * To be called from an admin dashboard button for cleanup.
 */
export function endAllTrials(): number {
  if (typeof window === 'undefined') {
    console.warn("endAllTrials can only be run in the browser.");
    return 0;
  }
  
  let clearedCount = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PLAN_KEY_PREFIX)) {
      try {
        const planData = JSON.parse(localStorage.getItem(key) || '{}') as ActivePlan;
        if (planData.isTrial) {
          localStorage.removeItem(key);
          clearedCount++;
          console.log(`Cleared accidental trial for key: ${key}`);
        }
      } catch (e) {
        console.error(`Error processing potential trial key ${key}:`, e);
      }
    }
  }
  return clearedCount;
}


/**
 * Formats milliseconds into a human-readable string (e.g., "1 hour, 30 minutes").
 */
export function formatTime(milliseconds: number): string {
  if (milliseconds <= 0) return "a moment";

  let totalSeconds = Math.ceil(milliseconds / 1000);
  let hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  if (seconds > 0 && hours === 0 && minutes < 5) parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
  if (parts.length === 0) return "less than a minute";
  
  return parts.join(', ');
}

    