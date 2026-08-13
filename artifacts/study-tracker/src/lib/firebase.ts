import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, initializeAuth, Auth, browserLocalPersistence, browserPopupRedirectResolver } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import firebaseConfig from "../firebase-applet-config.json";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics safely
let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

// Use explicit init to avoid IndexedDB issues on HMR (Database is closing/hidden)
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  });
} catch (e) {
  auth = getAuth(app); // fallback if already initialized
}

export { app, auth, analytics };

let dbInstance;
const customDbId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;

try {
  dbInstance = customDbId 
    ? initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }, customDbId)
    : initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
} catch (e) {
  dbInstance = customDbId ? getFirestore(app, customDbId) : getFirestore(app);
}

export const firestoreDb = dbInstance;
export const googleProvider = new GoogleAuthProvider();



