
"use client";

import { collection, addDoc, serverTimestamp, type FieldValue } from 'firebase/firestore';
import { firestore } from './firebase';

const CONVERSION_LOGS_COLLECTION = 'conversion_logs';

export interface ConversionLogData {
  timestamp: FieldValue; // Firestore Server Timestamp
  userType: 'guest' | 'loggedIn';
  userId?: string;
}

/**
 * Logs a conversion event to Firestore.
 * This function can remain if you still want to log conversions for purposes
 * other than displaying them on the admin dashboard.
 * If you want to completely remove all conversion logging, you can delete this function
 * and its usages.
 */
export async function logConversionToFirestore(
  userType: 'guest' | 'loggedIn',
  userId?: string
): Promise<void> {
  try {
    const logData: ConversionLogData = {
      timestamp: serverTimestamp(),
      userType,
    };
    if (userId && userType === 'loggedIn') {
      logData.userId = userId;
    }
    await addDoc(collection(firestore, CONVERSION_LOGS_COLLECTION), logData);
    // console.log('[AnalyticsService] Conversion logged to Firestore:', logData);
  } catch (error) {
    console.error('[AnalyticsService] Error logging conversion to Firestore:', error);
    // Decide if you want to re-throw or handle silently
  }
}

// Removed getTotalConversionsCount and getAggregatedConversionData
// as the dashboard will no longer display conversion analytics.
