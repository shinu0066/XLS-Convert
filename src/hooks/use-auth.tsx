
"use client";

import type { User, AuthError } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
  type UserCredential,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { checkIfAdminUserExistsInFirestore } from '@/lib/firebase-admin-service'; 
import { createUserProfileInFirestore, getUserProfileFromFirestore, type UserProfile } from '@/lib/firebase-user-service';

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<User | null>;
  signIn: (data: SignInData) => Promise<User | null>;
  signInWithGoogle: () => Promise<User | null>;
  signOut: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const parseDisplayName = (displayName: string | null): { firstName: string; lastName: string } => {
  if (!displayName) return { firstName: 'User', lastName: '' };
  const nameParts = displayName.split(' ');
  const firstName = nameParts[0] || 'User';
  const lastName = nameParts.slice(1).join(' ');
  return { firstName, lastName };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null); 
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthStateChange = async (user: User | null) => {
      setLoading(true);

      if (user) {
        try {
          const isActualAdmin = await checkIfAdminUserExistsInFirestore(user.uid);
          if (isActualAdmin) {
            setCurrentUser(null);
            setUserProfile(null);
          } else {
            setCurrentUser(user);
            const profile = await getUserProfileFromFirestore(user.uid);
            setUserProfile(profile);
          }
        } catch (e) {
          console.error("[AuthHook] onAuthStateChanged: Error during user validation", e);
          setCurrentUser(null);
          setUserProfile(null);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }

      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange, (error) => {
      console.error("[AuthHook] Main AuthState Error in onAuthStateChanged listener:", error);
      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false);
    });
      
    return () => {
      unsubscribe();
    };
  }, []); 

  const signUp = async (data: SignUpData): Promise<User | null> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (userCredential.user) {
        // Also update the user's displayName in Firebase Auth
        await updateProfile(userCredential.user, {
            displayName: `${data.firstName} ${data.lastName}`
        });

        // Create the profile in Firestore
        await createUserProfileInFirestore(
          userCredential.user.uid,
          data.firstName,
          data.lastName,
          data.email
        );
        return userCredential.user;
      }
      return null;
    } catch (error) {
      throw error as AuthError; 
    }
  };

  const signIn = async (data: SignInData): Promise<User | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      if (userCredential.user) {
        const isActualAdmin = await checkIfAdminUserExistsInFirestore(userCredential.user.uid);
        if (isActualAdmin) {
          await firebaseSignOut(auth); 
          throw new Error("Admin accounts should use the admin login panel.");
        }
        return userCredential.user;
      }
      return null;
    } catch (error) {
      throw error as AuthError; 
    }
  };

  const signInWithGoogle = async (): Promise<User | null> => {
    const provider = new GoogleAuthProvider();
    try {
      const result: UserCredential = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user) {
        const isActualAdmin = await checkIfAdminUserExistsInFirestore(user.uid);
        if (isActualAdmin) {
          await firebaseSignOut(auth); 
          throw new Error("Admin accounts should use the admin login panel for Google Sign-In.");
        }
        
        const additionalInfo = getAdditionalUserInfo(result);
        if (additionalInfo?.isNewUser) {
          const { firstName, lastName } = parseDisplayName(user.displayName);
          await createUserProfileInFirestore(user.uid, firstName, lastName, user.email!);
        }
        return user;
      }
      return null;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'auth/popup-closed-by-user'
      ) {
        return null;
      }
      throw error as AuthError;
    }
  };

  const signOutUser = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("[AuthHook] Sign-Out error:", error);
    }
  };

  const sendPasswordResetEmailFunc = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error as AuthError;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut: signOutUser,
    sendPasswordResetEmail: sendPasswordResetEmailFunc,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
