
import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe, serverTimestamp } from 'firebase/firestore';
import { firestore, auth } from './firebase'; // Added auth
import type { GeneralSiteSettings } from '@/types/site-settings';

// AdSettings is part of GeneralSiteSettings
type AdSettings = Pick<GeneralSiteSettings, 'adLoaderScript'>;

const ADS_SETTINGS_COLLECTION = 'site_settings';
const ADS_SETTINGS_DOC_ID = 'ads_config';

export async function getAdSettings(): Promise<AdSettings | null> {
  try {
    const docRef = doc(firestore, ADS_SETTINGS_COLLECTION, ADS_SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AdSettings;
    }
    return null; // No settings found
  } catch (error) {
    console.error("Error fetching ad settings:", error);
    throw error;
  }
}

export async function updateAdSettings(settings: Partial<AdSettings>): Promise<void> {
  try {
    const currentUser = auth.currentUser;
    console.log("Attempting to update ad settings. Authenticated admin UID:", currentUser?.uid, "Settings:", settings);
     if (!currentUser) {
      console.error("No authenticated user found when trying to update ad settings.");
      throw new Error("Authentication required to update ad settings.");
    }
    // Client-side admin check is primarily handled by useAdminAuth hook
    // const isAdmin = await checkIfAdminUserExistsInFirestore(currentUser.uid);
    // if (!isAdmin) {
    //   console.error("User is not authorized as admin to update ad settings.");
    //   throw new Error("User is not authorized as admin.");
    // }

    const docRef = doc(firestore, ADS_SETTINGS_COLLECTION, ADS_SETTINGS_DOC_ID);
    await setDoc(docRef, { ...settings, lastUpdated: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error("Error updating ad settings in Firestore:", error);
    throw error;
  }
}

export function subscribeToAdSettings(
  callback: (settings: AdSettings | null) => void
): Unsubscribe {
  const docRef = doc(firestore, ADS_SETTINGS_COLLECTION, ADS_SETTINGS_DOC_ID);
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as AdSettings);
    } else {
      callback(null); // No settings configured
    }
  }, (error) => {
    console.error("Error in ad settings subscription:", error);
    callback(null); // Notify on error
  });
  return unsubscribe;
}
