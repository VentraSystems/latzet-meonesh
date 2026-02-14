import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserRole } from '../types';
import { useNotifications } from '../hooks/useNotifications';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  linkedUserId: string | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [linkedUserId, setLinkedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize push notifications for the current user
  const { expoPushToken, error: notificationError } = useNotifications(user?.uid);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Get user role and linked user from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role as UserRole);
          setLinkedUserId(userData.linkedUserId || null);
        }
      } else {
        setUserRole(null);
        setLinkedUserId(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Log notification errors
  useEffect(() => {
    if (notificationError) {
      console.error('Notification error:', notificationError);
    }
  }, [notificationError]);

  // Log when push token is registered
  useEffect(() => {
    if (expoPushToken) {
      console.log('Push token registered:', expoPushToken);
    }
  }, [expoPushToken]);

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name,
      email,
      role,
      createdAt: new Date(),
      linkedUserId: null,
    });

    setUserRole(role);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    // Note: Google Sign-In requires additional setup with expo-auth-session
    // This is a placeholder for now
    alert('Google Sign-In will be implemented in the next phase!');
  };

  const logout = async () => {
    await signOut(auth);
    setUserRole(null);
    setLinkedUserId(null);
  };

  const value = {
    user,
    userRole,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    linkedUserId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
