
"use client";

import type { User, AuthError } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
} from 'firebase/auth';
import type React from 'react';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth } from '@/lib/firebase'; 
import type { AuthFormValues } from '@/components/admin/admin-auth-form'; 
import { 
  checkIfAdminUserExistsInFirestore,
  addAdminToFirestore 
} from '@/lib/firebase-admin-service';

interface AdminAuthContextType {
  adminUser: User | null; 
  loading: boolean; 
  adminSignUp: (values: AuthFormValues) => Promise<User | null>;
  adminSignIn: (values: AuthFormValues) => Promise<User | null>;
  adminSignOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null); 
  const [adminUser, setAdminUser] = useState<User | null>(null); 
  const [loading, setLoading] = useState(true);

  const validateAndSetAdminUser = useCallback(async (user: User | null) => {
    setLoading(true);
    if (user) {
      const isFirestoreAdmin = await checkIfAdminUserExistsInFirestore(user.uid);
      if (isFirestoreAdmin) {
        setAdminUser(user);
      } else {
        setAdminUser(null); 
      }
    } else {
      setAdminUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user); 
      validateAndSetAdminUser(user);
    }, (error) => {
      console.error("Admin AuthState Error:", error);
      setFirebaseUser(null);
      setAdminUser(null);
      setLoading(false);
    });
      
    return () => unsubscribe();
  }, [validateAndSetAdminUser]);

  const adminSignUp = async (values: AuthFormValues): Promise<User | null> => {
    setLoading(true);
    try {
      // Password confirmation should be handled by the form schema
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      if (userCredential.user) {
        // Add every new signup via this flow to the admins collection
        await addAdminToFirestore(userCredential.user.uid, userCredential.user.email);
        // onAuthStateChanged will trigger validation and set adminUser for this new admin
        return userCredential.user; 
      }
      return null;
    } catch (error) {
      console.error("Admin Sign up error:", error);
      throw error; 
    } finally {
       // setLoading(false) will be handled by the onAuthStateChanged/validateAndSetAdminUser flow
    }
  };

  const adminSignIn = async (values: AuthFormValues): Promise<User | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      if (userCredential.user) {
        const isFirestoreAdmin = await checkIfAdminUserExistsInFirestore(userCredential.user.uid);
        if (isFirestoreAdmin) {
          // The onAuthStateChanged should handle setting adminUser.
          // To ensure adminUser is set for this specific call for immediate UI updates:
          setAdminUser(userCredential.user); 
          setLoading(false);
          return userCredential.user;
        } else {
          await firebaseSignOut(auth); 
          setAdminUser(null);
          setLoading(false);
          throw new Error("You are not authorized to access the admin panel.");
        }
      }
      setLoading(false); 
      return null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Admin Sign in error:", errorMessage);
      setAdminUser(null); 
      setLoading(false); 
      throw error; 
    }
  };

  const adminSignOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Admin Sign out error:", error);
      setLoading(false);
    } 
  };

  const value = {
    adminUser,
    loading,
    adminSignUp,
    adminSignIn,
    adminSignOut,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
