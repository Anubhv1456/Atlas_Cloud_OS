import { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, firestoreDb } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/db/schema';
import { localDb } from '@/db/localDb';
import { cleanupBetaAccessSubscription } from '@/hooks/useBetaAccess';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Immediately resolve loading state so cached session mounts with 0ms delay offline
      setLoading(false);
      
      if (currentUser && firestoreDb) {
        // Retrieve affiliate ID if present
        const affiliateId = localStorage.getItem('atlas_affiliate_id');
        const updateData: any = {
          email: currentUser.email,
          displayName: currentUser.displayName,
          lastLoginAt: serverTimestamp(),
          createdAt: currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime) : serverTimestamp()
        };
        
        if (affiliateId) {
          updateData.affiliateId = affiliateId;
          updateData.referredBy = affiliateId;
        }

        // Non-blocking fire-and-forget background sync for user metadata
        setDoc(doc(firestoreDb, 'users', currentUser.uid), updateData, { merge: true }).catch((e) => {
          console.warn("User metadata background sync deferred (offline):", e);
        });
      }
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // 1. Teardown active Firestore subscriptions
      cleanupBetaAccessSubscription();

      // 2. Forcibly clear all IndexedDB tables to prevent cross-account contamination
      await Promise.all([
        db.subjects.clear(),
        db.systems.clear(),
        db.curriculumSets.clear(),
        db.revisionSets.clear(),
        db.history.clear(),
        db.pyqYears.clear(),
        db.scoreLogs.clear(),
        db.uiPreferences.clear(),
        db.topicProgress.clear(),
        db.mistakeLogs.clear(),
        db.recommendationSkips.clear(),
        db.operationalModes.clear(),
        localDb.sync_meta.clear(),
        localDb.mutation_queue.clear(),
        localDb.local_snapshots.clear(),
      ]);

      // 3. Clear sensitive session & local storage (preserving UI theme only)
      sessionStorage.clear();
      const keysToRemove = Object.keys(localStorage).filter(
        (key) =>
          (key.startsWith('atlas_') || key.startsWith('beta_access_')) &&
          key !== 'atlas_theme_mode'
      );
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // 4. Terminate Firebase session
      await firebaseSignOut(auth);

      // 5. Replace route to prevent back-button state resurrection
      window.location.replace('/login');
    } catch (error) {
      console.error('[useAuth] Error during secure sign-out teardown:', error);
      window.location.replace('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, signOut: logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
