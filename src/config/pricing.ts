
import type React from 'react';
import { Package, Zap, Briefcase, CheckCircle2 } from 'lucide-react';

/** Set to true to re-enable annual billing (e.g. after 3 months). */
export const ANNUAL_BILLING_ENABLED = false;

export interface PlanFeature {
  text: string;
  icon?: React.ElementType;
  available: boolean; // To easily show/hide or style differently
}

export interface Plan {
  id: 'starter' | 'professional' | 'business';
  name: string;
  icon: React.ElementType;
  monthlyPrice: number;
  annualPrice: number;
  monthlyConversions: number;
  annualConversions: number;
  features: PlanFeature[];
  ctaText?: string;
  highlight?: boolean;
  trialDays?: number;
  // PayPal Plan IDs
  monthlyPlanId?: string; // e.g., P-XXXXX
  annualPlanId?: string;  // e.g., P-YYYYY
}

export const PRICING_PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Package,
    monthlyPrice: 29.99,
    annualPrice: 299.99, // ~$25/month when billed annually
    monthlyConversions: 400,
    annualConversions: 4800,
    monthlyPlanId: 'P-3UN42152FX9222143NBZ4XIA', 
    annualPlanId: 'P-3UN42152FX9222143NBZ4XIA', // Using same ID for demo
    features: [
      { text: 'Basic PDF layout analysis', icon: CheckCircle2, available: true },
      { text: 'Standard processing speed', icon: CheckCircle2, available: true },
      { text: 'Email support', icon: CheckCircle2, available: true },
      { text: 'Advanced AI structuring', icon: CheckCircle2, available: false },
      { text: 'Priority queue', icon: CheckCircle2, available: false },
    ],
    ctaText: 'Get Started',
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: Zap,
    monthlyPrice: 59.99,
    annualPrice: 599.99, // ~$50/month when billed annually
    monthlyConversions: 1000,
    annualConversions: 12000,
    monthlyPlanId: 'P-3UN42152FX9222143NBZ4XIA', // Using same ID for demo
    annualPlanId: 'P-3UN42152FX9222143NBZ4XIA', // Using same ID for demo
    features: [
      { text: 'Advanced AI structuring', icon: CheckCircle2, available: true },
      { text: 'Enhanced processing speed', icon: CheckCircle2, available: true },
      { text: 'Priority email support', icon: CheckCircle2, available: true },
      { text: 'Larger file size limits', icon: CheckCircle2, available: true },
      { text: 'Priority queue', icon: CheckCircle2, available: false },
    ],
    ctaText: 'Get Started',
    highlight: true,
  },
  {
    id: 'business',
    name: 'Business',
    icon: Briefcase,
    monthlyPrice: 149.99,
    annualPrice: 1499.99, // ~$125/month when billed annually
    monthlyConversions: 4000,
    annualConversions: 48000,
    monthlyPlanId: 'P-3UN42152FX9222143NBZ4XIA', // Using same ID for demo
    annualPlanId: 'P-3UN42152FX9222143NBZ4XIA', // Using same ID for demo
    features: [
      { text: 'Advanced AI structuring', icon: CheckCircle2, available: true },
      { text: 'Highest processing speed', icon: CheckCircle2, available: true },
      { text: '24/7 dedicated support', icon: CheckCircle2, available: true },
      { text: 'Largest file size limits', icon: CheckCircle2, available: true },
      { text: 'Dedicated priority queue', icon: CheckCircle2, available: true },
    ],
    ctaText: 'Get Started',
  },
];

// Helper to get feature text dynamically based on cycle
export const getDynamicFeatureText = (
  baseText: string,
  monthlyValue: number | string,
  annualValue: number | string,
  cycle: 'monthly' | 'annual'
): string => {
  if (baseText.toLowerCase().includes('conversion')) {
    return cycle === 'monthly'
      ? `${monthlyValue} conversions/month`
      : `${annualValue} conversions/year`;
  }
  return baseText;
};
