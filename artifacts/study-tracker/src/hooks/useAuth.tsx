import { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, firestoreDb } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
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
        // Non-blocking fire-and-forget background sync for user metadata
        setDoc(doc(firestoreDb, 'users', currentUser.uid), {
          email: currentUser.email,
          displayName: currentUser.displayName,
          lastLoginAt: serverTimestamp(),
          createdAt: currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime) : serverTimestamp()
        }, { merge: true }).catch((e) => {
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
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
