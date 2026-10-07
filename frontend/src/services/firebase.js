// Firebase core
import { initializeApp } from "firebase/app";

// Firebase services
import { getFirestore } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getStorage } from "firebase/storage";          // ← added

// Firebase configuration (shared)
const firebaseConfig = {
   apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (ONCE)
const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);

// Authentication (for login later)
export const auth = getAuth(app);

// Storage                                               // ← added
export const storage = getStorage(app);                 // ← added

//  Analytics (safe for localhost & Vite)
let analytics;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

let authInitialized = false;
let authPromise = new Promise((resolve) => {
  const unsub = onAuthStateChanged(auth, (user) => {
    authInitialized = true;
    resolve(user);
    unsub();
  });
});

export const getAuthHeaders = async () => {
  let user = auth.currentUser;
  if (!authInitialized && !user) {
    user = await authPromise;
  }
  
  if (!user) return {};
  try {
    const token = await user.getIdToken(true); // true = force refresh token with latest claims
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',     // added so backend accepts JSON body
    };
  } catch (error) {
    console.error("Error getting auth token:", error);
    return {};
  }
};

export { analytics };