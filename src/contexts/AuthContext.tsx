import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, onSnapshot, updateDoc, arrayUnion, deleteDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserRole } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
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
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
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
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubscribeDoc) { unsubscribeDoc(); unsubscribeDoc = null; }

      if (firebaseUser) {
        unsubscribeDoc = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (userDoc) => {
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserRole(userData.role as UserRole);

              // Multi-child: support both old (linkedUserId) and new (linkedUserIds) format
              const ids: string[] = userData.linkedUserIds || (userData.linkedUserId ? [userData.linkedUserId] : []);
              setLinkedUserIds(ids);
              // Selected child = explicit selection or first in list
              setLinkedUserId(userData.selectedChildId || ids[0] || null);
            }
            setLoading(false);
          },
          (error) => {
            // Suppress offline errors silently — app will retry when connection restores
            console.warn('Firestore snapshot error:', error.code);
            setLoading(false);
          }
        );
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
    };
  }, []);

  // Listen for pending child-link signals (child wrote pending_{parentId}, we process it)
  useEffect(() => {
    if (!user) return;

    const pendingRef = doc(db, 'linkingCodes', `pending_${user.uid}`);
    const unsubscribe = onSnapshot(pendingRef, async (pendingDoc) => {
      if (pendingDoc.exists()) {
        const { childId } = pendingDoc.data();
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            linkedUserIds: arrayUnion(childId),
            linkedUserId: childId,
            selectedChildId: childId,
          });
          await deleteDoc(pendingRef);
        } catch (err) {
          console.error('Failed to process pending child link:', err);
        }
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

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
    if (Platform.OS === 'web') {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email,
            role: 'parent',
            createdAt: new Date(),
            linkedUserId: null,
            linkedUserIds: [],
            totalPoints: 0,
            badges: [],
          });
          // Set role immediately to avoid race condition where auth listener
          // fires before Firestore snapshot sees the new doc
          setUserRole('parent');
        }
      } catch (error: any) {
        console.error('Google Sign-In Error:', error.code, error.message);
        throw error;
      }
    } else {
      // Native: use expo-auth-session
      if (!googleRequest) {
        throw new Error('Google Sign-In is not configured. Please add OAuth client IDs.');
      }
      await googlePromptAsync();
    }
  };

  const signInWithApple = async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Sign in with Apple is only available on iOS.');
    }

    // Apple + Firebase requires a nonce: send the SHA256 hash to Apple,
    // then pass the raw nonce to Firebase so it can verify the ID token.
    const rawNonce = Array.from(Crypto.getRandomBytes(32))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    );

    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!appleCredential.identityToken) {
      throw new Error('Apple Sign-In did not return an identity token.');
    }

    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({
      idToken: appleCredential.identityToken,
      rawNonce,
    });

    const result = await signInWithCredential(auth, credential);
    const firebaseUser = result.user;

    // First sign-in: Apple only sends fullName/email once. Persist the
    // user doc immediately so the Firestore listener doesn't race ahead.
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const existing = await getDoc(userDocRef);
    if (!existing.exists()) {
      const fullName = appleCredential.fullName;
      const composedName = [fullName?.givenName, fullName?.familyName]
        .filter(Boolean)
        .join(' ')
        .trim();
      await setDoc(userDocRef, {
        name: composedName || firebaseUser.displayName || 'User',
        email: appleCredential.email || firebaseUser.email || null,
        role: 'parent',
        createdAt: new Date(),
        linkedUserId: null,
        linkedUserIds: [],
        totalPoints: 0,
        badges: [],
      });
      setUserRole('parent');
    }
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
    signInWithApple,
    logout,
    linkedUserId,
    linkedUserIds,
    setSelectedChild,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
