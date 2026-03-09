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
import { doc, setDoc, onSnapshot, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserRole } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  linkedUserId: string | null;       // currently selected child
  linkedUserIds: string[];           // all linked children
  setSelectedChild: (childId: string) => void;
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
  const [linkedUserIds, setLinkedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential).catch((error) => {
        console.error('Firebase Google sign-in error:', error);
      });
    }
  }, [googleResponse]);

  const { expoPushToken, error: notificationError } = useNotifications(user?.uid);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;
    let unsubscribePendingLink: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubscribeDoc) { unsubscribeDoc(); unsubscribeDoc = null; }
      if (unsubscribePendingLink) { unsubscribePendingLink(); unsubscribePendingLink = null; }

      if (firebaseUser) {
        unsubscribeDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role as UserRole);

            // Multi-child: support both old (linkedUserId) and new (linkedUserIds) format
            const ids: string[] = userData.linkedUserIds || (userData.linkedUserId ? [userData.linkedUserId] : []);
            setLinkedUserIds(ids);
            // Selected child = explicit selection or first in list
            setLinkedUserId(userData.selectedChildId || ids[0] || null);

            // If parent with no children yet, watch for pending link signal
            if (userData.role === 'parent' && ids.length === 0) {
              if (!unsubscribePendingLink) {
                unsubscribePendingLink = onSnapshot(
                  doc(db, 'linkingCodes', `pending_${firebaseUser.uid}`),
                  async (pendingDoc) => {
                    if (pendingDoc.exists()) {
                      const { childId } = pendingDoc.data();
                      await updateDoc(doc(db, 'users', firebaseUser.uid), {
                        linkedUserIds: arrayUnion(childId),
                        linkedUserId: childId, // keep backward compat
                        selectedChildId: childId,
                      });
                      await deleteDoc(doc(db, 'linkingCodes', `pending_${firebaseUser.uid}`));
                    }
                  }
                );
              }
            } else if (ids.length > 0 && unsubscribePendingLink) {
              // But still watch for additional children linking
              // (new pending docs use pending_{parentId}_{timestamp} but for simplicity keep same key)
            }
          }
          setLoading(false);
        });
      } else {
        setUserRole(null);
        setLinkedUserId(null);
        setLinkedUserIds([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
      if (unsubscribePendingLink) unsubscribePendingLink();
    };
  }, []);

  useEffect(() => {
    if (notificationError) console.error('Notification error:', notificationError);
  }, [notificationError]);

  const setSelectedChild = async (childId: string) => {
    setLinkedUserId(childId);
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), { selectedChildId: childId });
    }
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name,
      email,
      role,
      createdAt: new Date(),
      linkedUserId: null,
      linkedUserIds: [],
      totalPoints: 0,
      badges: [],
    });
    setUserRole(role);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    if (!googleRequest) {
      throw new Error('Google Sign-In is not configured. Please add OAuth client IDs.');
    }
    await googlePromptAsync();
  };

  const logout = async () => {
    await signOut(auth);
    setUserRole(null);
    setLinkedUserId(null);
    setLinkedUserIds([]);
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
    linkedUserIds,
    setSelectedChild,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
