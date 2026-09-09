import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { firestoreDb } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { issueOfflineLease, verifyOfflineLease, revokeOfflineLease } from '@/lib/offlineLease';

export function useBetaAccess() {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [paymentRejectionNote, setPaymentRejectionNote] = useState<string | null>(null);
  const [vaultActivationRequired, setVaultActivationRequired] = useState(false);
  const [vaultProvenance, setVaultProvenance] = useState<any | null>(null);
  const [offlineLeaseValid, setOfflineLeaseValid] = useState(true);
  const [offlineHoursRemaining, setOfflineHoursRemaining] = useState(72);
  const [isTrial, setIsTrial] = useState(false);
  const [hasClaimedTrial, setHasClaimedTrial] = useState(false);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const snapshotHandledRef = useRef(false);

  useEffect(() => {
    if (isImpersonating && impersonatedUser) {
      const rawExp = impersonatedUser.betaAccessExpiresAt;
      const exp = typeof rawExp === 'number' ? rawExp : rawExp?.toMillis ? rawExp.toMillis() : rawExp ? new Date(rawExp).getTime() : null;
      const isExpired = exp && exp < Date.now();
      const hasCandidateAccess = Boolean(impersonatedUser.betaAccess && !isExpired);

      const isTrialCandidate = Boolean(impersonatedUser.isTrial);

      setHasAccess(hasCandidateAccess);
      setExpiresAt(exp);
      setIsTrial(isTrialCandidate);
      setHasClaimedTrial(Boolean(impersonatedUser.hasClaimedTrial || impersonatedUser.isTrial));
      setIsTrialExpired(Boolean(isTrialCandidate && isExpired));
      setPaymentStatus((impersonatedUser.paymentStatus as any) || null);
      setPaymentRejectionNote(null);
      setVaultActivationRequired(false);
      setVaultProvenance(null);
      setOfflineLeaseValid(true);
      setOfflineHoursRemaining(72);
      setLoading(false);
      return;
    }

    if (!user) {
      setHasAccess(false);
      setExpiresAt(null);
      setIsTrial(false);
      setHasClaimedTrial(false);
      setIsTrialExpired(false);
      setPaymentStatus(null);
      setPaymentRejectionNote(null);
      setVaultActivationRequired(false);
      setVaultProvenance(null);
      setOfflineLeaseValid(true);
      setLoading(false);
      return;
    }

    snapshotHandledRef.current = false;

    // 1. Immediate local hydration (0ms offline latency)
    const localAccess = localStorage.getItem(`beta_access_${user.uid}`);
    const localExpiry = localStorage.getItem(`beta_access_expiry_${user.uid}`);
    const leaseCheck = verifyOfflineLease(user.uid);
    setOfflineLeaseValid(leaseCheck.isValid);
    setOfflineHoursRemaining(leaseCheck.hoursRemaining);

    let isLocallyValid = false;
    if (localAccess === 'true') {
      if (localExpiry) {
        const expTime = parseInt(localExpiry, 10);
        if (new Date().getTime() < expTime) {
          isLocallyValid = true;
          setExpiresAt(expTime);
        } else {
          localStorage.removeItem(`beta_access_${user.uid}`);
          localStorage.removeItem(`beta_access_expiry_${user.uid}`);
          revokeOfflineLease(user.uid);
        }
      } else {
        // Lifetime access or active lease
        isLocallyValid = true;
      }
    }

    // Set optimistic access state immediately
    if (isLocallyValid) {
      setHasAccess(true);
    }

    // If no Firestore available, resolve immediately
    if (!firestoreDb) {
      setHasAccess(isLocallyValid);
      setLoading(false);
      return;
    }

    // 2. 300ms Race-Timeout Fallback
    // If onSnapshot hangs (e.g. offline / poor signal), unblock App.tsx root mount
    const offlineFallbackTimer = setTimeout(() => {
      if (!snapshotHandledRef.current) {
        setHasAccess(isLocallyValid);
        setLoading(false);
      }
    }, 300);

    const userRef = doc(firestoreDb, 'users', user.uid);

    // 3. Real-time Cloud Synchronization
    const unsubscribe = onSnapshot(
      userRef,
      async (snap) => {
        snapshotHandledRef.current = true;
        clearTimeout(offlineFallbackTimer);

        if (snap.exists()) {
          const data = snap.data();
          setPaymentStatus(data.paymentStatus || null);
          setPaymentRejectionNote(data.paymentRejectionNote || null);
          setVaultActivationRequired(Boolean(data.vaultActivationRequired));
          setVaultProvenance(data.vaultImportProvenance || null);

          const isTrialAcc = Boolean(data.isTrial);
          const hasClaimed = Boolean(data.hasClaimedTrial || data.isTrial);
          setIsTrial(isTrialAcc);
          setHasClaimedTrial(hasClaimed);

          if (data.betaAccess === true) {
            const expTime = data.betaAccessExpiresAt?.toMillis
              ? data.betaAccessExpiresAt.toMillis()
              : data.betaAccessExpiresAt;

            if (expTime && new Date().getTime() > expTime) {
              // Expired access
              localStorage.removeItem(`beta_access_${user.uid}`);
              localStorage.removeItem(`beta_access_expiry_${user.uid}`);
              revokeOfflineLease(user.uid);
              setHasAccess(false);
              setExpiresAt(null);
              setIsTrialExpired(Boolean(isTrialAcc || hasClaimed));
              setDoc(userRef, { betaAccess: false }, { merge: true }).catch(() => {});
            } else {
              // Valid active access -> Issue / refresh bounded offline lease
              localStorage.setItem(`beta_access_${user.uid}`, 'true');
              issueOfflineLease(user.uid, expTime);
              setOfflineLeaseValid(true);
              setOfflineHoursRemaining(72);

              if (expTime) {
                localStorage.setItem(`beta_access_expiry_${user.uid}`, expTime.toString());
                setExpiresAt(expTime);
              } else {
                setExpiresAt(null); // Lifetime
              }
              setIsTrialExpired(false);
              setHasAccess(true);
            }
          } else {
            // Access revoked or absent
            localStorage.removeItem(`beta_access_${user.uid}`);
            localStorage.removeItem(`beta_access_expiry_${user.uid}`);
            revokeOfflineLease(user.uid);
            setHasAccess(false);
            setExpiresAt(null);
            setIsTrialExpired(Boolean(isTrialAcc || hasClaimed));
          }
        } else {
          localStorage.removeItem(`beta_access_${user.uid}`);
          localStorage.removeItem(`beta_access_expiry_${user.uid}`);
          revokeOfflineLease(user.uid);
          setHasAccess(false);
          setExpiresAt(null);
          setIsTrial(false);
          setHasClaimedTrial(false);
          setIsTrialExpired(false);
          setPaymentStatus(null);
          setPaymentRejectionNote(null);
          setVaultActivationRequired(false);
          setVaultProvenance(null);
        }
        setLoading(false);
      },
      (error) => {
        console.warn("Firestore access snapshot skipped (offline):", error);
        snapshotHandledRef.current = true;
        clearTimeout(offlineFallbackTimer);
        setHasAccess(isLocallyValid);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(offlineFallbackTimer);
      unsubscribe();
    };
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
          paymentStatus: 'pending',
          betaAccessExpiresAt: expTime,
          vaultActivationRequired: false,
          updatedAt: new Date()
        }, { merge: true });
      } catch (e) {
        console.error("Error granting beta access", e);
      }
    }
    localStorage.setItem(`beta_access_${user.uid}`, 'true');
    localStorage.setItem(`beta_access_expiry_${user.uid}`, expTime.toString());
    issueOfflineLease(user.uid);
    setHasAccess(true);
    setExpiresAt(expTime);
  };

  /**
   * Activates an instant clinical trial pass for a candidate (e.g. 7 or 14 days)
   */
  const claimTrial = async (customDays?: number): Promise<boolean> => {
    if (!user || !firestoreDb) return false;
    try {
      const days = customDays || 7;
      const expTime = Date.now() + (days * 24 * 60 * 60 * 1000);
      const userRef = doc(firestoreDb, 'users', user.uid);

      let affiliateId: string | undefined;
      if (typeof window !== 'undefined') {
        affiliateId = localStorage.getItem('atlas_affiliate_id') || undefined;
      }

      const payload: any = {
        betaAccess: true,
        isTrial: true,
        hasClaimedTrial: true,
        trialStartedAt: new Date(),
        paymentStatus: 'pending',
        betaAccessExpiresAt: expTime,
        vaultActivationRequired: false,
        updatedAt: new Date()
      };
      if (affiliateId) {
        payload.referredBy = affiliateId;
        payload.affiliateId = affiliateId;
      }

      await setDoc(userRef, payload, { merge: true });

      localStorage.setItem(`beta_access_${user.uid}`, 'true');
      localStorage.setItem(`beta_access_expiry_${user.uid}`, expTime.toString());
      issueOfflineLease(user.uid, expTime);
      setHasAccess(true);
      setExpiresAt(expTime);
      setIsTrial(true);
      setHasClaimedTrial(true);
      setIsTrialExpired(false);
      return true;
    } catch (err) {
      console.error("Failed to claim trial:", err);
      return false;
    }
  };

  const trialDaysRemaining = expiresAt && isTrial && hasAccess
    ? Math.max(0, Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const clearVaultActivationFlag = async () => {
    if (!user || !firestoreDb) return;
    try {
      const userRef = doc(firestoreDb, 'users', user.uid);
      await setDoc(userRef, {
        vaultActivationRequired: false,
        updatedAt: new Date()
      }, { merge: true });
      setVaultActivationRequired(false);
    } catch (e) {
      console.error("Error clearing vault activation flag", e);
    }
  };

  return { 
    hasAccess, 
    expiresAt, 
    paymentStatus, 
    paymentRejectionNote, 
    vaultActivationRequired,
    vaultProvenance,
    offlineLeaseValid,
    offlineHoursRemaining,
    isTrial,
    hasClaimedTrial,
    isTrialExpired,
    trialDaysRemaining,
    loading, 
    grantAccess,
    claimTrial,
    clearVaultActivationFlag
  };
}
