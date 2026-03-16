import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, enableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyA_xT_8V7l07Itzm-JDyG42GVMOWqKDY2I",
  authDomain: "latzet-meonesh-e1375.firebaseapp.com",
  projectId: "latzet-meonesh-e1375",
  storageBucket: "latzet-meonesh-e1375.firebasestorage.app",
  messagingSenderId: "104592303789",
  appId: "1:104592303789:web:52b94d924d3c92c4578824",
  measurementId: "G-2DWXXNQ4QP",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Web uses getAuth (supports signInWithPopup), native uses initializeAuth with AsyncStorage
let auth: ReturnType<typeof getAuth>;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}
export { auth };

// Initialize Firestore
export const db = getFirestore(app);

// On web, explicitly enable network to avoid stuck-offline state
if (Platform.OS === 'web') {
  enableNetwork(db).catch(() => {});
}

// Initialize Storage
export const storage = getStorage(app);

export default app;
