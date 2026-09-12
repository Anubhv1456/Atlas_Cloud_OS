import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { firestoreDb } from '@/lib/firebase';

interface RoleState {
  isAdmin: boolean;
  isModerator: boolean;
  timestamp: number;
}

// Global in-memory cache keyed by user UID (valid for 5 minutes)
const roleCache = new Map<string, RoleState>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export function useRole() {
  const { user, loading: authLoading } = useAuth();
  
  // Initialize with in-memory cached state if available
  const cached = user ? roleCache.get(user.uid) : null;
  const isCacheFresh = cached && (Date.now() - cached.timestamp < CACHE_TTL_MS);

  const [isAdmin, setIsAdmin] = useState<boolean>(isCacheFresh ? cached.isAdmin : false);
  const [isModerator, setIsModerator] = useState<boolean>(isCacheFresh ? cached.isModerator : false);
  const [loading, setLoading] = useState<boolean>(!isCacheFresh);

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

      // If fresh cached value exists, skip re-evaluating
      const existing = roleCache.get(user.uid);
      if (existing && Date.now() - existing.timestamp < CACHE_TTL_MS) {
        if (isMounted) {
          setIsAdmin(existing.isAdmin);
          setIsModerator(existing.isModerator);
          setLoading(false);
        }
        return;
      }

      try {
        // 1. Check Custom Claims first (Best Practice, avoids billable reads)
        const token = await user.getIdTokenResult();
        let foundAdmin = !!(token.claims.admin || token.claims.isAdmin || token.claims.role === 'admin' || token.claims.role === 'superadmin');
        let foundMod = !!(token.claims.moderator || token.claims.role === 'moderator');

        if (foundAdmin || foundMod) {
          roleCache.set(user.uid, {
            isAdmin: foundAdmin,
            isModerator: foundMod,
            timestamp: Date.now(),
          });
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
              if (data.role === 'admin' || data.isAdmin) foundAdmin = true;
              if (data.role === 'moderator') foundMod = true;
            }
          }
        }

        roleCache.set(user.uid, {
          isAdmin: foundAdmin,
          isModerator: foundMod,
          timestamp: Date.now(),
        });

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
