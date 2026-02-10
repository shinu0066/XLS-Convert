
import { doc, setDoc, getDoc, serverTimestamp, type FieldValue, type Timestamp } from 'firebase/firestore';
import { firestore } from './firebase';

const USERS_COLLECTION = 'users';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  createdAt: FieldValue;
  // You can add more fields here later, e.g., photoURL, preferences, etc.
}

/**
 * Creates a user profile document in Firestore.
 * @param uid The user's unique ID from Firebase Authentication.
 * @param firstName The user's first name.
 * @param lastName The user's last name.
 * @param email The user's email.
 */
export async function createUserProfileInFirestore(
  uid: string,
  firstName: string,
  lastName: string,
  email: string
): Promise<void> {
  if (!uid) {
    throw new Error("User UID not provided for profile creation.");
  }
  try {
    const userDocRef = doc(firestore, USERS_COLLECTION, uid);
    const profileData: UserProfile = {
      firstName,
      lastName,
      email,
      createdAt: serverTimestamp(),
    };
    await setDoc(userDocRef, profileData);
  } catch (error) {
    console.error("Error creating user profile in Firestore for UID:", uid, error);
    throw error;
  }
}

/**
 * Fetches a user profile from Firestore.
 * @param uid The user's unique ID.
 * @returns The user profile data or null if not found.
 */
export async function getUserProfileFromFirestore(uid: string): Promise<UserProfile | null> {
  if (!uid) return null;
  try {
    const userDocRef = doc(firestore, USERS_COLLECTION, uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile from Firestore:", error);
    return null;
  }
}
