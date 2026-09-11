import { useState, useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import { useAuth } from './useAuth';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { firestoreDb } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { issueOfflineLease, verifyOfflineLease, revokeOfflineLease, requestServerOfflineLease } from '@/lib/offlineLease';

export interface BetaAccessState {
  hasAccess: boolean;
  isSoftLocked?: boolean;
  paymentStatus: 'pending' | 'approved' | 'rejected' | 'succeeded' | null;
  paymentRejectionNote: string | null;
  vaultActivationRequired: boolean;
  vaultProvenance: any | null;
  offlineLeaseValid: boolean;
  offlineHoursRemaining: number;
  loading: boolean;
  trialExpiresAt?: string | number | null;
  trialStartedAt?: any | null;
  isTrialAuthoritative?: boolean;
}

// ── Singleton State & Subscription Hub ──────────────────────────────────────────
// Ensures exactly 1 Firestore onSnapshot listener exists across all hook instances.
let currentUserId: string | null = null;
let activeUnsubscribe: (() => void) | null = null;
const subscribers = new Set<(state: BetaAccessState) => void>();

export function cleanupBetaAccessSubscription() {
  if (activeUnsubscribe) {
    activeUnsubscribe();
    activeUnsubscribe = null;
    console.log('[useBetaAccess] Cleaned up real-time entitlements listener.');
  }
  currentUserId = null;
}

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
      trialExpiresAt: null,
      trialStartedAt: null,
      isTrialAuthoritative: false,
    };
  }

  const leaseCheck = verifyOfflineLease(uid);
  // Authoritative offline entitlement must be backed by a cryptographically verified offline lease
  const isLocallyValid = leaseCheck.isValid && !leaseCheck.isExpired && !leaseCheck.isTampered;

  return {
    hasAccess: isLocallyValid,
    paymentStatus: null,
    paymentRejectionNote: null,
    vaultActivationRequired: false,
    vaultProvenance: null,
    offlineLeaseValid: leaseCheck.isValid,
    offlineHoursRemaining: leaseCheck.hoursRemaining,
    loading: !isLocallyValid, // True (loading) only if we do not have a valid cryptographic lease cached on Frame 0
    isSoftLocked: false,
    trialExpiresAt: null,
    trialStartedAt: null,
    isTrialAuthoritative: false,
  };
}

let singletonState: BetaAccessState = getInitialStateForUser(null);

function updateSingleton(newState: Partial<BetaAccessState>) {
  singletonState = { ...singletonState, ...newState };
  subscribers.forEach((cb) => cb(singletonState));
}

function isCurrentlyInStudySession() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return path.startsWith('/subjects/') || path.startsWith('/mistakes') || path.startsWith('/radar');
}

function setupSingletonListener(uid: string, userObj?: User | null) {
  if (currentUserId === uid && activeUnsubscribe) {
    return;
  }

  cleanupBetaAccessSubscription();
  if (typeof window !== 'undefined' && (window as any)._leaseInterval) {
    clearInterval((window as any)._leaseInterval);
  }


  currentUserId = uid;
  singletonState = getInitialStateForUser(uid);
  subscribers.forEach((cb) => cb(singletonState));

  if (!firestoreDb) return;

  // Poll offline lease expiration every minute
  (window as any)._leaseInterval = setInterval(() => {
    if (currentUserId !== uid) return;
    const leaseCheck = verifyOfflineLease(uid);
    const isLocallyValid = leaseCheck.isValid && !leaseCheck.isExpired && !leaseCheck.isTampered;
    
    if (!isLocallyValid && singletonState.hasAccess) {
      if (isCurrentlyInStudySession()) {
        updateSingleton({
          isSoftLocked: true,
          offlineLeaseValid: false,
          offlineHoursRemaining: 0,
        });
      } else {
        updateSingleton({
          hasAccess: false,
          isSoftLocked: false,
          offlineLeaseValid: false,
          offlineHoursRemaining: 0,
        });
      }
    } else if (isLocallyValid) {
      updateSingleton({
        offlineLeaseValid: true,
        offlineHoursRemaining: leaseCheck.hoursRemaining,
      });
    }
  }, 60000);


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
          if (userObj) {
            requestServerOfflineLease(userObj).catch(() => {});
          }
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
          trialExpiresAt: data.trialExpiresAt || null,
          trialStartedAt: data.trialStartedAt || null,
          isTrialAuthoritative: Boolean(data.trialExpiresAt),
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
          trialExpiresAt: null,
          trialStartedAt: null,
          isTrialAuthoritative: false,
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
      cleanupBetaAccessSubscription();
      const initialUnauth = getInitialStateForUser(null);
      setState(initialUnauth);
      return;
    }

    // Subscribe component state to singleton updates
    const handleUpdate = (updated: BetaAccessState) => setState(updated);
    subscribers.add(handleUpdate);

    // Initialize or verify singleton listener
    setupSingletonListener(user.uid, user);

    return () => {
      subscribers.delete(handleUpdate);
    };
  }, [user, isImpersonating, impersonatedUser]);

  // Server-authoritative trial activation & sync
  useEffect(() => {
    if (!user || state.hasAccess || state.trialExpiresAt) return;
    let isCancelled = false;

    async function syncServerTrial() {
      try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/auth/activate-trial', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (!res.ok) return;
        const data = await res.json();
        if (!isCancelled && data.success && data.trialExpiresAt) {
          updateSingleton({
            trialExpiresAt: data.trialExpiresAt,
            trialStartedAt: data.trialStartedAt,
            isTrialAuthoritative: true,
          });
        }
      } catch (err) {
        console.warn('[useBetaAccess] Network error during trial sync:', err);
      }
    }

    syncServerTrial();
    return () => {
      isCancelled = true;
    };
  }, [user, state.hasAccess, state.trialExpiresAt]);

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

  if (state.trialExpiresAt) {
    const expiryMs =
      typeof state.trialExpiresAt === 'string'
        ? new Date(state.trialExpiresAt).getTime()
        : typeof state.trialExpiresAt === 'number'
        ? state.trialExpiresAt
        : 0;

    const diffMs = expiryMs - Date.now();
    if (diffMs > 0) {
      isTrialActive = true;
      trialDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    } else {
      isTrialExpired = true;
    }
  } else if (user && user.metadata && user.metadata.creationTime) {
    const createdAt = new Date(user.metadata.creationTime);
    const now = Date.now();
    const diffMs = now - createdAt.getTime();
    // Guard against negative clock drift / retroactive system clock manipulation
    const diffDays = diffMs < 0 ? 999 : Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Trial logic fallback
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
    isSoftLocked: state.isSoftLocked,
    clearVaultActivationFlag
  };
}
