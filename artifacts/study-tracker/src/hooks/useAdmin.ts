import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { firestoreDb } from '@/lib/firebase';

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function checkAdmin() {
      if (!user) {
        if (isMounted) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      try {
        // 1. Check Custom Claims first (Best Practice)
        const token = await user.getIdTokenResult();
        if (token.claims.admin) {
          if (isMounted) {
            setIsAdmin(true);
            setLoading(false);
          }
          return;
        }

        // 2. Fallback: Check Firestore admins collection for bootstrapping
        // This is only checked if the user doesn't have the custom claim,
        // so it won't impact performance once the claim is set.
        if (firestoreDb) {
          const adminDoc = await getDoc(doc(firestoreDb, 'admins', user.uid));
          if (adminDoc.exists()) {
            if (isMounted) {
              setIsAdmin(true);
              setLoading(false);
            }
            return;
          }
        }

        if (isMounted) {
          setIsAdmin(false);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to check admin status", err);
        if (isMounted) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    }

    if (!authLoading) {
      checkAdmin();
    }

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  return { isAdmin, loading: authLoading || loading };
}
