import { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, firestoreDb } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isFreshLogin: boolean;
  clearFreshLogin: () => void;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isFreshLogin: false,
  clearFreshLogin: () => {},
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFreshLogin, setIsFreshLogin] = useState<boolean>(() => {
    return sessionStorage.getItem('is_fresh_login') === 'true';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && firestoreDb) {
        // Save user metadata to firestore for admin visibility
        try {
          await setDoc(doc(firestoreDb, 'users', currentUser.uid), {
            email: currentUser.email,
            displayName: currentUser.displayName,
            lastLoginAt: serverTimestamp(),
            createdAt: currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime) : serverTimestamp()
          }, { merge: true });
        } catch (e) {
          console.error("Failed to update user metadata", e);
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      sessionStorage.setItem('is_fresh_login', 'true');
      setIsFreshLogin(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      sessionStorage.removeItem('is_fresh_login');
      setIsFreshLogin(false);
      console.error('Error signing in with Google', error);
      throw error;
    }
  };

  const clearFreshLogin = () => {
    sessionStorage.removeItem('is_fresh_login');
    setIsFreshLogin(false);
  };

  const logout = async () => {
    try {
      if (user) {
        sessionStorage.removeItem(`migration_checked_${user.uid}`);
      }
      sessionStorage.removeItem('is_fresh_login');
      setIsFreshLogin(false);
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isFreshLogin, clearFreshLogin, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
