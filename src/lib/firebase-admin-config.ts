
import * as admin from 'firebase-admin';

// This file is for SERVER-SIDE use only.

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

if (!serviceAccount) {
    if (process.env.NODE_ENV === 'production') {
        console.warn("FIREBASE_SERVICE_ACCOUNT environment variable not set. API routes requiring admin privileges will fail.");
    } else {
        console.log("FIREBASE_SERVICE_ACCOUNT not set. Using default app for development. API routes may fail if admin privileges are required.");
    }
}

const appName = 'firebase-admin-app';

// Check if the app is already initialized to avoid errors
if (!admin.apps.some(app => app!.name === appName)) {
  admin.initializeApp({
    credential: serviceAccount ? admin.credential.cert(serviceAccount) : undefined, // Use default for local dev if no service account
  }, appName);
}

export const getFirebaseAdminApp = () => admin.app(appName);
