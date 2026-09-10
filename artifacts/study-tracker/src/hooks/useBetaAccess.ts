import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { firestoreDb } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { issueOfflineLease, verifyOfflineLease, revokeOfflineLease } from '@/lib/offlineLease';

export interface BetaAccessState {
  hasAccess: boolean;
  paymentStatus: 'pending' | 'approved' | 'rejected' | null;
  paymentRejectionNote: string | null;
  vaultActivationRequired: boolean;
  vaultProvenance: any | null;
  offlineLeaseValid: boolean;
  offlineHoursRemaining: number;
  loading: boolean;
}

// ── Singleton State & Subscription Hub ──────────────────────────────────────────
// Ensures exactly 1 Firestore onSnapshot listener exists across all hook instances.
let currentUserId: string | null = null;
let activeUnsubscribe: (() => void) | null = null;
const subscribers = new Set<(state: BetaAccessState) => void>();

function getInitialStateForUser(uid: string | null): BetaAccessState {
  if (!uid) {
    return {
      hasAccess: false,
      paymentStatus: null,
      paymentRejectionNote: null,
      vaultActivationRequired: false,
      vaultProvenance: null,
      offlineLeaseValid: true,
      offlineHoursRemaining: 72,
      loading: false,
    };
  }

  const localAccess = typeof window !== 'undefined' ? localStorage.getItem(`beta_access_${uid}`) : null;
  const isLocallyValid = localAccess === 'true';
  const leaseCheck = verifyOfflineLease(uid);

  return {
    hasAccess: isLocallyValid,
    paymentStatus: null,
    paymentRejectionNote: null,
    vaultActivationRequired: false,
    vaultProvenance: null,
    offlineLeaseValid: leaseCheck.isValid,
    offlineHoursRemaining: leaseCheck.hoursRemaining,
    loading: false, // Instant synchronous hydration (0ms offline latency)
  };
}

let singletonState: BetaAccessState = getInitialStateForUser(null);

function updateSingleton(newState: Partial<BetaAccessState>) {
  singletonState = { ...singletonState, ...newState };
  subscribers.forEach((cb) => cb(singletonState));
}

function setupSingletonListener(uid: string) {
  if (currentUserId === uid && activeUnsubscribe) {
    return;
  }

  if (activeUnsubscribe) {
    activeUnsubscribe();
    activeUnsubscribe = null;
  }

  currentUserId = uid;
  singletonState = getInitialStateForUser(uid);
  subscribers.forEach((cb) => cb(singletonState));

  if (!firestoreDb) return;

  const userRef = doc(firestoreDb, 'users', uid);
  activeUnsubscribe = onSnapshot(
    userRef,
    (snap) => {
      if (currentUserId !== uid) return;

      if (snap.exists()) {
        const data = snap.data();
        const isBeta = data.betaAccess === true;

        if (isBeta) {
          localStorage.setItem(`beta_access_${uid}`, 'true');
          issueOfflineLease(uid);
        } else {
          localStorage.removeItem(`beta_access_${uid}`);
          revokeOfflineLease(uid);
        }

        updateSingleton({
          hasAccess: isBeta,
          paymentStatus: data.paymentStatus || null,
          paymentRejectionNote: data.paymentRejectionNote || null,
          vaultActivationRequired: Boolean(data.vaultActivationRequired),
          vaultProvenance: data.vaultImportProvenance || null,
          offlineLeaseValid: true,
          offlineHoursRemaining: 72,
          loading: false,
        });
      } else {
        localStorage.removeItem(`beta_access_${uid}`);
        revokeOfflineLease(uid);

        updateSingleton({
          hasAccess: false,
          paymentStatus: null,
          paymentRejectionNote: null,
          vaultActivationRequired: false,
          vaultProvenance: null,
          loading: false,
        });
      }
    },
    (error) => {
      console.warn("Singleton Firestore access listener error (offline):", error);
      updateSingleton({ loading: false });
    }
  );
}

export function useBetaAccess() {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();

  const [state, setState] = useState<BetaAccessState>(() => {
    if (isImpersonating && impersonatedUser) {
      return {
        hasAccess: Boolean(impersonatedUser.betaAccess),
        paymentStatus: (impersonatedUser.paymentStatus as any) || null,
        paymentRejectionNote: null,
        vaultActivationRequired: false,
        vaultProvenance: null,
        offlineLeaseValid: true,
        offlineHoursRemaining: 72,
        loading: false,
      };
    }
    if (!user) return getInitialStateForUser(null);
    return currentUserId === user.uid ? singletonState : getInitialStateForUser(user.uid);
  });

  useEffect(() => {
    if (isImpersonating && impersonatedUser) {
      setState({
        hasAccess: Boolean(impersonatedUser.betaAccess),
        paymentStatus: (impersonatedUser.paymentStatus as any) || null,
        paymentRejectionNote: null,
        vaultActivationRequired: false,
        vaultProvenance: null,
        offlineLeaseValid: true,
        offlineHoursRemaining: 72,
        loading: false,
      });
      return;
    }

    if (!user) {
      if (activeUnsubscribe) {
        activeUnsubscribe();
        activeUnsubscribe = null;
        currentUserId = null;
      }
      const initialUnauth = getInitialStateForUser(null);
      setState(initialUnauth);
      return;
    }

    // Subscribe component state to singleton updates
    const handleUpdate = (updated: BetaAccessState) => setState(updated);
    subscribers.add(handleUpdate);

    // Initialize or verify singleton listener
    setupSingletonListener(user.uid);

    return () => {
      subscribers.delete(handleUpdate);
    };
  }, [user, isImpersonating, impersonatedUser]);

  const grantAccess = async () => {
    if (!user) return;

    if (firestoreDb) {
      try {
        const userRef = doc(firestoreDb, 'users', user.uid);
        await setDoc(userRef, {
          betaAccess: true,
          paymentStatus: 'approved',
          vaultActivationRequired: false,
          updatedAt: new Date()
        }, { merge: true });
      } catch (e) {
        console.error("Error granting access", e);
      }
    }
    localStorage.setItem(`beta_access_${user.uid}`, 'true');
    issueOfflineLease(user.uid);
    updateSingleton({ hasAccess: true, paymentStatus: 'approved' });
  };

  const clearVaultActivationFlag = async () => {
    if (!user || !firestoreDb) return;
    try {
      const userRef = doc(firestoreDb, 'users', user.uid);
      await setDoc(userRef, {
        vaultActivationRequired: false,
        updatedAt: new Date()
      }, { merge: true });
      updateSingleton({ vaultActivationRequired: false });
    } catch (e) {
      console.error("Error clearing vault activation flag", e);
    }
  };

  let isTrialActive = false;
  let isTrialExpired = false;
  let trialDaysRemaining = 0;

  if (user && user.metadata && user.metadata.creationTime) {
    const createdAt = new Date(user.metadata.creationTime);
    const diffDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Trial logic
    if (diffDays <= 14) {
      isTrialActive = true;
      trialDaysRemaining = 14 - diffDays;
    } else {
      isTrialExpired = true;
    }
  }

  // Override trial status if user has paid/been granted access
  if (state.hasAccess) {
    isTrialActive = false;
    isTrialExpired = false;
    trialDaysRemaining = 0;
  }

  return { 
    hasAccess: Boolean(state.hasAccess), 
    isFreeTier: state.hasAccess === false,
    isTrialActive,
    isTrialExpired,
    trialDaysRemaining,
    paymentStatus: state.paymentStatus, 
    paymentRejectionNote: state.paymentRejectionNote, 
    vaultActivationRequired: state.vaultActivationRequired,
    vaultProvenance: state.vaultProvenance,
    offlineLeaseValid: state.offlineLeaseValid,
    offlineHoursRemaining: state.offlineHoursRemaining,
    loading: state.loading, 
    grantAccess,
    clearVaultActivationFlag
  };
}
