import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { firestoreDb } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export function useBetaAccess() {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [paymentRejectionNote, setPaymentRejectionNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHasAccess(false);
      setExpiresAt(null);
      setPaymentStatus(null);
      setPaymentRejectionNote(null);
      setLoading(false);
      return;
    }

    // Check local storage initial state
    const localAccess = localStorage.getItem(`beta_access_${user.uid}`);
    const localExpiry = localStorage.getItem(`beta_access_expiry_${user.uid}`);
    let isLocallyValid = false;

    if (localAccess === 'true' && localExpiry) {
      const expTime = parseInt(localExpiry, 10);
      if (new Date().getTime() < expTime) {
        isLocallyValid = true;
        setExpiresAt(expTime);
      } else {
        localStorage.removeItem(`beta_access_${user.uid}`);
        localStorage.removeItem(`beta_access_expiry_${user.uid}`);
      }
    }

    if (!firestoreDb) {
      setHasAccess(isLocallyValid);
      setLoading(false);
      return;
    }

    const userRef = doc(firestoreDb, 'users', user.uid);

    // Subscribe to real-time changes so revocation/approval from admin console takes immediate effect
    const unsubscribe = onSnapshot(
      userRef,
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setPaymentStatus(data.paymentStatus || null);
          setPaymentRejectionNote(data.paymentRejectionNote || null);

          if (data.betaAccess === true) {
            const expTime = data.betaAccessExpiresAt?.toMillis
              ? data.betaAccessExpiresAt.toMillis()
              : data.betaAccessExpiresAt;

            if (expTime && new Date().getTime() > expTime) {
              // Expired access
              localStorage.removeItem(`beta_access_${user.uid}`);
              localStorage.removeItem(`beta_access_expiry_${user.uid}`);
              setHasAccess(false);
              setExpiresAt(null);
              await setDoc(userRef, { betaAccess: false }, { merge: true }).catch(() => {});
            } else {
              // Valid access
              localStorage.setItem(`beta_access_${user.uid}`, 'true');
              if (expTime) {
                localStorage.setItem(`beta_access_expiry_${user.uid}`, expTime.toString());
                setExpiresAt(expTime);
              } else {
                setExpiresAt(null); // Lifetime
              }
              setHasAccess(true);
            }
          } else {
            // Access revoked or absent
            localStorage.removeItem(`beta_access_${user.uid}`);
            localStorage.removeItem(`beta_access_expiry_${user.uid}`);
            setHasAccess(false);
            setExpiresAt(null);
          }
        } else {
          localStorage.removeItem(`beta_access_${user.uid}`);
          localStorage.removeItem(`beta_access_expiry_${user.uid}`);
          setHasAccess(false);
          setExpiresAt(null);
          setPaymentStatus(null);
          setPaymentRejectionNote(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to beta access state:", error);
        setHasAccess(isLocallyValid);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const grantAccess = async () => {
    if (!user) return;

    // Default 90 days / 3 months expiration for Closed Beta
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 90);
    const expTime = expiryDate.getTime();

    if (firestoreDb) {
      try {
        const userRef = doc(firestoreDb, 'users', user.uid);
        await setDoc(userRef, {
          betaAccess: true,
          betaAccessExpiresAt: expTime,
          updatedAt: new Date()
        }, { merge: true });
      } catch (e) {
        console.error("Error granting beta access", e);
      }
    }
    localStorage.setItem(`beta_access_${user.uid}`, 'true');
    localStorage.setItem(`beta_access_expiry_${user.uid}`, expTime.toString());
    setHasAccess(true);
    setExpiresAt(expTime);
  };

  return { hasAccess, expiresAt, paymentStatus, paymentRejectionNote, loading, grantAccess };
}
