
"use client";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
  orderBy,
  getDoc,
  limit,
} from 'firebase/firestore';
import { firestore, auth } from './firebase';

const USER_FILES_COLLECTION = 'userFiles';

// --- Interfaces ---
export interface StoredDocument {
  id: string; // Firestore document ID
  fileName: string;
  fileData?: string; // The Base64 encoded string
  uploadedAt: Timestamp;
  userId: string;
}

// --- Helper Functions ---

/**
 * Converts a File object to a Base64 encoded string.
 * @param file The file to convert.
 * @returns A promise that resolves with the Base64 string (without the data URI prefix).
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the "data:application/pdf;base64," prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Converts a Base64 string back to a downloadable PDF file.
 * @param base64Data The Base64 string of the PDF.
 * @param fileName The name for the downloaded file.
 */
export function base64ToPDF(base64Data: string, fileName: string): void {
  try {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    // Create a link and trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up the object URL
  } catch (error) {
    console.error("Error converting Base64 to PDF:", error);
    // Potentially show a toast to the user
  }
}


// --- Firestore Service Functions ---

/**
 * Fetches all document metadata for a given user, then filters for files from the last 24 hours.
 * @param userId The UID of the logged-in user.
 * @returns An array of StoredDocument objects.
 */
export async function getRecentUserDocuments(userId: string): Promise<StoredDocument[]> {
  if (!userId) return [];

  const twentyFourHoursAgo = Timestamp.fromMillis(Date.now() - (24 * 60 * 60 * 1000));

  try {
    // Attempt server-side filtering with composite index
    // REQUIRED FIREBASE COMPOSITE INDEX:
    // Collection: userFiles
    // Fields: userId (Ascending), uploadedAt (Descending)
    // Create at: https://console.firebase.google.com/project/_/firestore/indexes
    const q = query(
      collection(firestore, USER_FILES_COLLECTION),
      where("userId", "==", userId),
      where("uploadedAt", ">=", twentyFourHoursAgo),
      orderBy("uploadedAt", "desc"),
      limit(50)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as StoredDocument));

  } catch (indexError: any) {
    // Fallback to client-side filtering if composite index doesn't exist
    console.warn('User files composite index not found. Using client-side filtering. Create index: userId (Ascending) + uploadedAt (Descending)', indexError);
    
    try {
      const fallbackQuery = query(
        collection(firestore, USER_FILES_COLLECTION),
        where("userId", "==", userId),
        orderBy("uploadedAt", "desc"),
        limit(50)
      );

      const querySnapshot = await getDocs(fallbackQuery);
      const allUserDocs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as StoredDocument));

      // Client-side filtering for the 24-hour window
      const recentDocs = allUserDocs.filter(doc => 
        doc.uploadedAt.toMillis() >= twentyFourHoursAgo.toMillis()
      );
      
      return recentDocs;
    } catch (error) {
      console.error("Error fetching user documents:", error);
      throw error;
    }
  }
}

/**
 * Fetches a single document with its Base64 data.
 * @param docId The ID of the Firestore document.
 * @returns The full StoredDocument object including fileData, or null if not found.
 */
export async function getDocumentWithData(docId: string): Promise<StoredDocument | null> {
    const docRef = doc(firestore, USER_FILES_COLLECTION, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as StoredDocument;
    }
    return null;
}


/**
 * Uploads a new PDF file for a user after converting it to Base64.
 * Checks the user's upload limit before proceeding.
 * @param file The PDF file to upload.
 * @returns The ID of the newly created document.
 */
export async function uploadDocument(file: File): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in to upload files.");
  }

  // Check upload limit first
  const recentDocs = await getRecentUserDocuments(user.uid);
  if (recentDocs.length >= 10) {
    throw new Error("Upload limit reached. You can store a maximum of 10 files in a 24-hour period.");
  }

  const base64Data = await fileToBase64(file);

  const docData = {
    fileName: file.name,
    fileData: base64Data,
    uploadedAt: Timestamp.now(),
    userId: user.uid,
  };

  const docRef = await addDoc(collection(firestore, USER_FILES_COLLECTION), docData);
  return docRef.id;
}


/**
 * Deletes a document from Firestore.
 * @param docId The ID of the document to delete.
 */
export async function deleteDocument(docId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("Authentication required to delete files.");
    }
    // For security, you might add a rule in Firestore to ensure a user can only delete their own docs.
    const docRef = doc(firestore, USER_FILES_COLLECTION, docId);
    await deleteDoc(docRef);
}

// NOTE on Automatic Cleanup:
// The requirement for automatically deleting files older than 24 hours is best handled
// by a server-side process like a Firebase Cloud Function scheduled to run periodically (e.g., every hour).
// The client-side `getRecentUserDocuments` function ensures that users only SEE files from the last 24 hours,
// but a server-side function is needed to perform the actual deletion from the database to manage storage.
// This file does not include the Cloud Function code, which would need to be deployed separately in your Firebase project.
