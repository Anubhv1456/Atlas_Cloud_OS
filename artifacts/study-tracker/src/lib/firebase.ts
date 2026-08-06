import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, initializeAuth, browserLocalPersistence, browserPopupRedirectResolver } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB23xBbSVe1eehDAiyUSz_HOvKyPdfxytM",
  authDomain: "atlas-cloud-6f1c6.firebaseapp.com",
  projectId: "atlas-cloud-6f1c6",
  storageBucket: "atlas-cloud-6f1c6.firebasestorage.app",
  messagingSenderId: "661277140008",
  appId: "1:661277140008:web:684fca0f349ac6d574011d",
  measurementId: "G-5VYZMRJVYE"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use explicit init to avoid IndexedDB issues on HMR (Database is closing/hidden)
let auth;
try {
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  });
} catch (e) {
  auth = getAuth(app); // fallback if already initialized
}

let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (e) {
  firestoreDb = getFirestore(app);
}

export { app, auth, firestoreDb };
export const googleProvider = new GoogleAuthProvider();

