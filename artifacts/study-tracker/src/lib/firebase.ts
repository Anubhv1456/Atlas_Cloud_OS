import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, initializeAuth, Auth, browserLocalPersistence, browserPopupRedirectResolver } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, setLogLevel } from "firebase/firestore";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import firebaseConfig from "../firebase-applet-config.json";

// Silence verbose internal connection retry and offline warning logs
try {
  setLogLevel('silent');
} catch (e) {
  // Ignore if setLogLevel fails
}

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

// Use explicit init to avoid IndexedDB issues on HMR
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

const firestoreSettings = {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  experimentalAutoDetectLongPolling: true,
};

try {
  dbInstance = customDbId 
    ? initializeFirestore(app, firestoreSettings, customDbId)
    : initializeFirestore(app, firestoreSettings);
} catch (e) {
  dbInstance = customDbId ? getFirestore(app, customDbId) : getFirestore(app);
}

export const firestoreDb = dbInstance;
export const googleProvider = new GoogleAuthProvider();




