import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { firestoreDb } from '@/lib/firebase';

export function useRole() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkRoles() {
      if (!user) {
        if (isMounted) {
          setIsAdmin(false);
          setIsModerator(false);
          setLoading(false);
        }
        return;
      }

      try {
        // 1. Check Custom Claims first (Best Practice, avoids billable reads)
        const token = await user.getIdTokenResult();
        let foundAdmin = !!token.claims.admin;
        let foundMod = !!token.claims.moderator;

        if (foundAdmin || foundMod) {
          if (isMounted) {
            setIsAdmin(foundAdmin);
            setIsModerator(foundMod);
            setLoading(false);
          }
          return;
        }

        // 2. Fallback: Check Firestore documents if token claims aren't set yet
        if (firestoreDb) {
          // Check legacy admins collection for bootstrapping
          const adminDoc = await getDoc(doc(firestoreDb, 'admins', user.uid));
          if (adminDoc.exists()) {
            foundAdmin = true;
          } else {
            // Check user profile for role assignments
            const userDoc = await getDoc(doc(firestoreDb, 'users', user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              if (data.role === 'admin') foundAdmin = true;
              if (data.role === 'moderator') foundMod = true;
            }
          }
        }

        if (isMounted) {
          setIsAdmin(foundAdmin);
          setIsModerator(foundMod);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to check user roles", err);
        if (isMounted) {
          setIsAdmin(false);
          setIsModerator(false);
          setLoading(false);
        }
      }
    }

    if (!authLoading) {
      checkRoles();
    }

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  return { 
    isAdmin, 
    isModerator, 
    isStaff: isAdmin || isModerator, 
    loading: authLoading || loading 
  };
}
