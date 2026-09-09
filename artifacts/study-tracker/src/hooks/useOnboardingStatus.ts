import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { firestoreDb } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/db';
import { localDb } from '@/db/localDb';
import { generateHLC } from '@/lib/hlc';

/**
 * Pillar 2: Triple-Layer Persistence & Self-Healing
 * Synchronizes onboarding completion state across:
 * 1. LocalStorage (fast 0ms cache)
 * 2. IndexedDB Workspace (survives cookie/storage clears)
 * 3. Firestore Cloud Profile (cross-device synchronization)
 */
export async function syncOnboardingCompletedToAllTiers(userId?: string | null): Promise<void> {
  const uid = userId;
  const now = new Date();

  // Tier 1: Fast Synchronous Local Cache
  try {
    if (uid) {
      localStorage.setItem(`onboarding_completed_${uid}`, 'true');
    } else {
      localStorage.setItem('onboarding_completed_guest', 'true');
    }
    localStorage.setItem('atlas_onboarding_completed', 'true');
  } catch (err) {
    console.warn('[OnboardingSync] LocalStorage write error:', err);
  }

  // Tier 2: IndexedDB Workspace Persistence
  try {
    const prefRecord = {
      id: 'onboarding_status',
      type: 'onboarding' as const,
      entityId: 0,
      onboardingCompleted: true,
      updatedAt: now,
      hlc: generateHLC(),
    };
    await localDb.uiPreferences.put(prefRecord).catch(() => {});
    await db.uiPreferences.put(prefRecord).catch(() => {});
  } catch (err) {
    console.warn('[OnboardingSync] IndexedDB write error:', err);
  }

  // Tier 3: Cloud Profile Persistence
  if (uid && firestoreDb) {
    try {
      const userRef = doc(firestoreDb, 'users', uid);
      await setDoc(userRef, { onboardingCompleted: true, updatedAt: now }, { merge: true });
    } catch (err) {
      console.warn('[OnboardingSync] Cloud sync deferred (offline):', err);
    }
  }

  // Broadcast event across components and open tabs
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('atlas-onboarding-updated', { detail: { completed: true } }));
  }
}

export function useOnboardingStatus() {
  const { user, loading: authLoading } = useAuth();
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Fast synchronous check if any local cache key or saved exam profile is already configured
  const getFastSynchronousStatus = useCallback((): boolean | null => {
    try {
      // 1. Explicit local completion keys
      const explicitGuest = localStorage.getItem('onboarding_completed_guest') === 'true';
      const explicitGlobal = localStorage.getItem('atlas_onboarding_completed') === 'true';
      const explicitUser = user ? localStorage.getItem(`onboarding_completed_${user.uid}`) === 'true' : false;
      if (explicitGuest || explicitGlobal || explicitUser) {
        return true;
      }

      // 2. Active beta or trial access indicates completed onboarding
      if (user) {
        const localBeta = localStorage.getItem(`beta_access_${user.uid}`) === 'true';
        if (localBeta) return true;
      }

      // 3. User already has a custom configured exam profile saved in localStorage
      const rawExamProfile = localStorage.getItem('atlas_user_exam_profile');
      if (rawExamProfile) {
        try {
          const parsed = JSON.parse(rawExamProfile);
          if (parsed && (parsed.targetExamDate || parsed.hasCompletedTriage || (parsed.targetExam && parsed.targetExam !== 'NEET PG / INI-CET'))) {
            return true;
          }
        } catch {
          // ignore JSON parsing errors
        }
      }
    } catch {
      // ignore storage errors
    }
    return null;
  }, [user]);

  useEffect(() => {
    // Pillar 4: Strict Auth Hydration — Never evaluate while auth is still loading
    if (authLoading) {
      return;
    }

    let isMounted = true;

    async function evaluateOnboardingStatus() {
      // 1. Fast path: Check synchronous flags
      const fastStatus = getFastSynchronousStatus();
      if (fastStatus === true) {
        if (isMounted) {
          setHasOnboarded(true);
          setLoading(false);
        }
        // Self-heal other storage tiers in background
        syncOnboardingCompletedToAllTiers(user?.uid).catch(() => {});
        return;
      }

      // 2. Tier 2 Check: IndexedDB (Dexie / localDb)
      try {
        const pref = await localDb.uiPreferences.get('onboarding_status').catch(() => null)
          || await db.uiPreferences.get('onboarding_status').catch(() => null);
        if (pref && pref.onboardingCompleted) {
          if (isMounted) {
            setHasOnboarded(true);
            setLoading(false);
          }
          syncOnboardingCompletedToAllTiers(user?.uid).catch(() => {});
          return;
        }
      } catch (err) {
        console.warn('[OnboardingStatus] Error checking IndexedDB:', err);
      }

      // 3. Pillar 1: Data-Informed Self-Detection (Heuristic Inference)
      // Check if user already has active subjects, history logs, or scores in database
      try {
        const [subCountLocal, histCountLocal, scoreCountLocal, subCountDb, histCountDb, scoreCountDb] = await Promise.all([
          localDb.subjects.count().catch(() => 0),
          localDb.history.count().catch(() => 0),
          localDb.scoreLogs.count().catch(() => 0),
          db.subjects.count().catch(() => 0),
          db.history.count().catch(() => 0),
          db.scoreLogs.count().catch(() => 0)
        ]);

        const hasExistingStudyData = (
          subCountLocal > 0 ||
          histCountLocal > 0 ||
          scoreCountLocal > 0 ||
          subCountDb > 0 ||
          histCountDb > 0 ||
          scoreCountDb > 0
        );

        if (hasExistingStudyData) {
          if (isMounted) {
            setHasOnboarded(true);
            setLoading(false);
          }
          syncOnboardingCompletedToAllTiers(user?.uid).catch(() => {});
          return;
        }
      } catch (err) {
        console.warn('[OnboardingStatus] Heuristic inference check warning:', err);
      }

      // 4. Tier 3 Check: Cloud Profile (Firestore)
      if (user && firestoreDb) {
        try {
          const userRef = doc(firestoreDb, 'users', user.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.onboardingCompleted || data.betaAccess || data.targetExam || data.trialDaysAwarded) {
              if (isMounted) {
                setHasOnboarded(true);
                setLoading(false);
              }
              syncOnboardingCompletedToAllTiers(user.uid).catch(() => {});
              return;
            }
          }
        } catch (err) {
          console.warn('[OnboardingStatus] Cloud profile fetch error:', err);
        }
      }

      // 5. Pillar 4: Graceful Degradation — Only mark as false if user is genuinely fresh
      if (isMounted) {
        setHasOnboarded(false);
        setLoading(false);
      }
    }

    evaluateOnboardingStatus();

    // Listen to onboarding updates from other tabs or components
    const handleUpdate = () => {
      if (isMounted) {
        setHasOnboarded(true);
        setLoading(false);
      }
    };

    window.addEventListener('atlas-onboarding-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('atlas-onboarding-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user, authLoading, getFastSynchronousStatus]);

  const markOnboarded = async () => {
    setHasOnboarded(true);
    setLoading(false);
    await syncOnboardingCompletedToAllTiers(user?.uid);
  };

  return { hasOnboarded, loading, markOnboarded };
}
