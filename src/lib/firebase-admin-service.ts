
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp, query, limit } from 'firebase/firestore';
import { firestore } from './firebase'; // Ensure firestore is exported from firebase.ts

const ADMIN_COLLECTION = 'admins';

/**
 * Checks if a user with the given UID is registered as an admin in Firestore.
 */
export async function checkIfAdminUserExistsInFirestore(uid: string): Promise<boolean> {
  if (!uid) return false;
  try {
    const adminDocRef = doc(firestore, ADMIN_COLLECTION, uid);
    const adminDocSnap = await getDoc(adminDocRef);
    return adminDocSnap.exists();
  } catch (error) {
    console.error("Error checking if admin user exists in Firestore:", error);
    // In case of error, assume user is not admin to be safe
    return false;
  }
}

/**
 * Checks if any admin documents exist in the Firestore 'admins' collection.
 * This is used to determine if the initial admin setup has been performed.
 */
export async function checkIfAnyAdminSetupInFirestore(): Promise<boolean> {
  try {
    const adminsCollectionRef = collection(firestore, ADMIN_COLLECTION);
    const q = query(adminsCollectionRef, limit(1));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking if any admin exists in Firestore:", error);
    return false;
  }
}

/**
 * Adds a new admin user to the Firestore 'admins' collection.
 */
export async function addAdminToFirestore(uid: string, email: string | null): Promise<void> {
  if (!uid) throw new Error("UID is required to add an admin to Firestore.");
  try {
    const adminDocRef = doc(firestore, ADMIN_COLLECTION, uid);
    await setDoc(adminDocRef, {
      email: email || 'N/A',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding admin to Firestore:", error);
    throw error;
  }
}

export interface AdminUserData {
  id: string; // UID
  email: string;
  createdAt: Date | null; // Firestore Timestamp converted to Date
}

/**
 * Fetches a list of all admin users from the 'admins' collection in Firestore.
 */
export async function getAdminUsersList(): Promise<AdminUserData[]> {
  try {
    const adminsCollectionRef = collection(firestore, ADMIN_COLLECTION);
    const querySnapshot = await getDocs(adminsCollectionRef);
    const adminUsers: AdminUserData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let createdAtDate = null;
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAtDate = data.createdAt.toDate();
      }
      adminUsers.push({
        id: doc.id,
        email: data.email || 'N/A',
        createdAt: createdAtDate,
      });
    });
    return adminUsers;
  } catch (error) {
    console.error("Error fetching admin users list:", error);
    throw error; // Re-throw to be handled by the caller
  }
}
