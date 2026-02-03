
"use client";

import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe, serverTimestamp } from 'firebase/firestore';
import { firestore, auth } from './firebase';
import type { AllPopupSettings, PopupConfig, PopupType } from '@/types/popup-settings';
import { DEFAULT_POPUP_SETTINGS } from '@/types/popup-settings';

const SETTINGS_COLLECTION = 'site_settings';
const POPUPS_CONFIG_DOC_ID = 'popups_config'; // Single document to hold all popup settings
const FULL_POPUPS_PATH = `${SETTINGS_COLLECTION}/${POPUPS_CONFIG_DOC_ID}`;

/**
 * Fetches all popup configurations from Firestore.
 * Returns default settings if no configuration is found.
 */
export async function getPopupSettings(): Promise<AllPopupSettings> {
  const docRef = doc(firestore, SETTINGS_COLLECTION, POPUPS_CONFIG_DOC_ID);
  console.log(`[PopupService] Attempting to GET popup settings from path: ${FULL_POPUPS_PATH}`);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as Partial<AllPopupSettings>;
      console.log(`[PopupService] Successfully fetched popup settings from ${FULL_POPUPS_PATH}. Data:`, data);
      // Merge with defaults to ensure all popup types are present
      return {
        bottomPopup: { ...DEFAULT_POPUP_SETTINGS.bottomPopup, ...data.bottomPopup },
        topNavbarPopup: { ...DEFAULT_POPUP_SETTINGS.topNavbarPopup, ...data.topNavbarPopup },
        centerScreenPopup: { ...DEFAULT_POPUP_SETTINGS.centerScreenPopup, ...data.centerScreenPopup },
        lastUpdated: data.lastUpdated || serverTimestamp(),
      };
    }
    console.log(`[PopupService] No popup settings document found at ${FULL_POPUPS_PATH}. Returning defaults.`);
    return { ...DEFAULT_POPUP_SETTINGS, lastUpdated: serverTimestamp() }; // Return deep copy of defaults
  } catch (error) {
    console.error(`[PopupService] Error fetching popup settings from ${FULL_POPUPS_PATH}:`, error);
    // In case of error, return defaults to prevent app crash
    return { ...DEFAULT_POPUP_SETTINGS, lastUpdated: serverTimestamp() };
  }
}

/**
 * Updates all popup configurations in Firestore.
 * Requires admin authentication.
 */
export async function updatePopupSettings(settings: AllPopupSettings): Promise<void> {
  const currentUser = auth.currentUser;
  const userUidForLog = currentUser ? currentUser.uid : 'null (unauthenticated)';
  console.log(`[PopupService] Attempting to UPDATE popup settings at path: ${FULL_POPUPS_PATH}. User UID: ${userUidForLog}`);

  if (!currentUser) {
    console.error(`[PopupService] Update failed: Authentication required to update popup settings at ${FULL_POPUPS_PATH}.`);
    throw new Error("Authentication required to update popup settings.");
  }
  
  // Note: The actual admin check (exists in 'admins' collection) is enforced by Firestore security rules.
  // This client-side check primarily ensures a user is logged in.

  try {
    const docRef = doc(firestore, SETTINGS_COLLECTION, POPUPS_CONFIG_DOC_ID);
    const settingsToSave: AllPopupSettings = {
      ...settings,
      lastUpdated: serverTimestamp(),
    };
    
    await setDoc(docRef, settingsToSave, { merge: true });
    console.log(`[PopupService] Successfully updated popup settings at ${FULL_POPUPS_PATH}.`);
  } catch (error) {
    console.error(`[PopupService] Error updating popup settings in Firestore at ${FULL_POPUPS_PATH}. User UID: ${userUidForLog}. Error:`, error);
    throw error; // Re-throw to be handled by the calling UI component (e.g., to show a toast)
  }
}

/**
 * Subscribes to real-time updates for popup configurations.
 * @param callback Function to call with the latest popup settings.
 * @returns Unsubscribe function.
 */
export function subscribeToPopupSettings(
  callback: (settings: AllPopupSettings) => void
): Unsubscribe {
  const docRef = doc(firestore, SETTINGS_COLLECTION, POPUPS_CONFIG_DOC_ID);
  console.log(`[PopupService] Subscribing to popup settings at path: ${FULL_POPUPS_PATH}`);

  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as Partial<AllPopupSettings>;
      console.log(`[PopupService] Subscription update received for ${FULL_POPUPS_PATH}. Data:`, data);
       // Merge with defaults to ensure all popup types are present
      const fullSettings = {
        bottomPopup: { ...DEFAULT_POPUP_SETTINGS.bottomPopup, ...data.bottomPopup },
        topNavbarPopup: { ...DEFAULT_POPUP_SETTINGS.topNavbarPopup, ...data.topNavbarPopup },
        centerScreenPopup: { ...DEFAULT_POPUP_SETTINGS.centerScreenPopup, ...data.centerScreenPopup },
        lastUpdated: data.lastUpdated,
      };
      callback(fullSettings);
    } else {
      console.log(`[PopupService] Subscription: No document at ${FULL_POPUPS_PATH}. Using defaults.`);
      callback({ ...DEFAULT_POPUP_SETTINGS }); // Return deep copy of defaults
    }
  }, (error) => {
    console.error(`[PopupService] Error in popup settings subscription for ${FULL_POPUPS_PATH}:`, error);
    callback({ ...DEFAULT_POPUP_SETTINGS }); // Fallback to defaults on error
  });
  return unsubscribe;
}

// Firestore security rules reminder (to be placed in Firebase console):
/*
service cloud.firestore {
  match /databases/{database}/documents {
    // ... other rules ...

    match /site_settings/popups_config {
      allow read: if true; // Or if request.auth != null;
      allow write: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
  }
}
*/
