import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { firestoreDb } from './firebase';
import { getCachedDoc } from './firestoreCache';
import { User } from 'firebase/auth';
export * from '@/types/growth';
import type { ReferralCodeEntity } from '@/types/growth';

export interface ReferralConfig {
  enabled: boolean;
  refereeTrialDays: number;
  referrerBonusDays: number;
  maxPassesPerUser: number;
  minStudyMinutesToQualify: number;
  allowDownstreamInvites: boolean;
  updatedAt?: any;
}

export const DEFAULT_REFERRAL_CONFIG: ReferralConfig = {
  enabled: true,
  refereeTrialDays: 15,
  referrerBonusDays: 14,
  maxPassesPerUser: 3,
  minStudyMinutesToQualify: 10,
  allowDownstreamInvites: true,
};

export interface ReferralCodeDoc {
  code: string;
  ownerUid: string;
  ownerEmail?: string;
  ownerDisplayName?: string;
  totalClaimed: number;
  totalQualified: number;
  createdAt: any;
}

export interface ReferralRecord {
  id: string;
  referrerUid: string;
  refereeUid: string;
  refereeEmail: string;
  refereeName?: string;
  code: string;
  status: 'claimed' | 'qualified' | 'revoked';
  bonusDaysAwarded: number;
  claimedAt: any;
  qualifiedAt?: any;
}

export interface UserReferralStatus {
  referralCode: string;
  passesRemaining: number;
  maxPasses: number;
  totalClaimed: number;
  totalQualified: number;
  history: ReferralRecord[];
  config: ReferralConfig;
}

/**
 * Reads global referral policy from Firestore (/config/referral_settings) with Cache-First optimization (P3)
 */
export async function getReferralConfig(): Promise<ReferralConfig> {
  if (!firestoreDb) return DEFAULT_REFERRAL_CONFIG;
  try {
    const cfgRef = doc(firestoreDb, 'config', 'referral_settings');
    const snap = await getCachedDoc(cfgRef);
    if (snap.exists()) {
      return { ...DEFAULT_REFERRAL_CONFIG, ...(snap.data() as ReferralConfig) };
    }
  } catch (e) {
    console.warn('[Referral Engine] Could not load referral config, using defaults:', e);
  }
  return DEFAULT_REFERRAL_CONFIG;
}

/**
 * Saves global referral policy from Admin Console
 */
export async function saveReferralConfig(config: Partial<ReferralConfig>): Promise<void> {
  if (!firestoreDb) return;
  const cfgRef = doc(firestoreDb, 'config', 'referral_settings');
  await setDoc(cfgRef, {
    ...config,
    updatedAt: new Date()
  }, { merge: true });
}

/**
 * Generates an elegant, deterministic academic referral slug (e.g. "ANUBH82")
 */
function generateCodeSlug(user: { email?: string | null; displayName?: string | null; uid: string }): string {
  let base = '';
  if (user.displayName) {
    base = user.displayName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5);
  } else if (user.email) {
    base = user.email.split('@')[0].replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5);
  }
  if (!base || base.length < 3) {
    base = 'ATLAS';
  }
  const rand = Math.floor(10 + Math.random() * 90);
  return `${base}${rand}`;
}

/**
 * Ensures user has an assigned referral code in /users/{uid} and /referralCodes/{code}
 */
export async function ensureUserReferralCode(user: User): Promise<string> {
  if (!firestoreDb || !user) return 'ATLAS77';

  try {
    const userRef = doc(firestoreDb, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data()?.referralCode) {
      return userSnap.data()!.referralCode;
    }

    // Generate unique code
    let code = generateCodeSlug(user);
    let attempts = 0;
    while (attempts < 5) {
      const codeRef = doc(firestoreDb, 'referralCodes', code);
      const codeSnap = await getDoc(codeRef);
      if (!codeSnap.exists()) break;
      code = generateCodeSlug(user);
      attempts++;
    }

    const config = await getReferralConfig();
    const codeRef = doc(firestoreDb, 'referralCodes', code);

    await setDoc(codeRef, {
      code,
      ownerUid: user.uid,
      ownerEmail: user.email || '',
      ownerDisplayName: user.displayName || 'Doctor',
      totalClaimed: 0,
      totalQualified: 0,
      createdAt: new Date()
    });

    await setDoc(userRef, {
      referralCode: code,
      passesRemaining: config.maxPassesPerUser,
      updatedAt: new Date()
    }, { merge: true });

    return code;
  } catch (e) {
    console.error('[Referral Engine] Error generating referral code:', e);
    return 'ATLAS77';
  }
}

/**
 * Normalizes legacy ReferralCodeDoc into canonical ReferralCodeEntity schema
 */
export function normalizeLegacyReferralCode(legacy: ReferralCodeDoc): ReferralCodeEntity {
  return {
    code: legacy.code,
    type: 'batchmate',
    ownerUid: legacy.ownerUid,
    ownerEmail: legacy.ownerEmail || '',
    ownerDisplayName: legacy.ownerDisplayName || 'Doctor',
    status: 'active',
    stats: {
      totalClaims: legacy.totalClaimed || 0,
      totalQualified: legacy.totalQualified || 0,
      totalConversions: 0,
      activeSeats: legacy.totalClaimed || 0,
    },
    config: {
      maxClaims: 3,
      refereeTrialDays: 15,
      referrerBonusDays: 14,
    },
    createdAt: legacy.createdAt || new Date(),
    updatedAt: legacy.createdAt || new Date(),
  };
}

/**
 * Resolves a referral or partner code using the Phase 1 Unified Access Bridge:
 * 1. Checks canonical path /referral_codes/{code}
 * 2. If not found, gracefully falls back to legacy path /referralCodes/{code}
 */
export async function resolveReferralCode(code: string): Promise<ReferralCodeEntity | null> {
  if (!firestoreDb || !code) return null;
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;

  try {
    // 1. Primary: Canonical /referral_codes/{code}
    const canonicalRef = doc(firestoreDb, 'referral_codes', cleanCode);
    const canonicalSnap = await getDoc(canonicalRef);
    if (canonicalSnap.exists()) {
      const data = canonicalSnap.data();
      return {
        code: cleanCode,
        type: data.type || 'batchmate',
        ownerUid: data.ownerUid || '',
        ownerEmail: data.ownerEmail || '',
        ownerDisplayName: data.ownerDisplayName || 'Doctor',
        status: data.status || 'active',
        stats: {
          totalClaims: data.stats?.totalClaims ?? data.totalClaimed ?? 0,
          totalQualified: data.stats?.totalQualified ?? data.totalQualified ?? 0,
          totalConversions: data.stats?.totalConversions ?? 0,
          activeSeats: data.stats?.activeSeats ?? data.totalClaimed ?? 0,
        },
        config: {
          maxClaims: data.config?.maxClaims ?? 3,
          refereeTrialDays: data.config?.refereeTrialDays ?? 15,
          referrerBonusDays: data.config?.referrerBonusDays ?? 14,
        },
        createdAt: data.createdAt,
        updatedAt: data.updatedAt || data.createdAt,
      } as ReferralCodeEntity;
    }

    // 2. Secondary: Fallback to legacy /referralCodes/{code}
    const legacyRef = doc(firestoreDb, 'referralCodes', cleanCode);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists()) {
      const legacyData = legacySnap.data() as ReferralCodeDoc;
      return normalizeLegacyReferralCode(legacyData);
    }
  } catch (e) {
    console.error('[Referral Bridge] Error resolving referral code:', e);
  }

  return null;
}

/**
 * Fetches referral code details to display inviter info on landing screen.
 * Leverages resolveReferralCode for transparent canonical-to-legacy lookup,
 * returning a ReferralCodeDoc for full backward compatibility with UI components.
 */
export async function getReferralCodeDetails(code: string): Promise<ReferralCodeDoc | null> {
  const resolved = await resolveReferralCode(code);
  if (!resolved) return null;

  return {
    code: resolved.code,
    ownerUid: resolved.ownerUid,
    ownerEmail: resolved.ownerEmail,
    ownerDisplayName: resolved.ownerDisplayName,
    totalClaimed: resolved.stats.totalClaims,
    totalQualified: resolved.stats.totalQualified,
    createdAt: resolved.createdAt,
  };
}

/**
 * Claims a referral code when a referee signs up / completes enrollment
 * Authenticates with the serverless API to perform atomic transaction and secure writes
 */
export async function claimReferralCode(
  code: string, 
  user: User,
  sourceParam?: GrowthSourceParam
): Promise<{ success: boolean; message: string; trialDaysAwarded?: number }> {
  if (!user || !code) {
    return { success: false, message: 'Invalid referral context' };
  }

  const cleanCode = code.trim().toUpperCase();
  const resolvedSource = sourceParam || 
    (sessionStorage.getItem('atlas_pending_ref_source') as GrowthSourceParam) || 
    'ref';

  try {
    const idToken = await user.getIdToken();
    const res = await fetch('/api/referral/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ 
        code: cleanCode,
        sourceParam: resolvedSource,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, message: data.message || 'Failed to apply referral pass' };
    }

    // Stash local storage for instant offline UI
    if (data.expiryTimestamp) {
      localStorage.setItem(`beta_access_${user.uid}`, 'true');
      localStorage.setItem(`beta_access_expiry_${user.uid}`, data.expiryTimestamp.toString());
    }
    localStorage.setItem(`onboarding_completed_${user.uid}`, 'true');
    localStorage.setItem('atlas_onboarding_completed', 'true');
    sessionStorage.removeItem('atlas_pending_ref_code');
    sessionStorage.removeItem('atlas_pending_ref_source');

    return { 
      success: true, 
      message: data.message || `Activated ${data.trialDaysAwarded || 15}-Day Study Pass!`,
      trialDaysAwarded: data.trialDaysAwarded || 15
    };
  } catch (e: any) {
    console.error('[Referral Engine] Error claiming code via server API:', e);
    return { success: false, message: 'Network error claiming referral pass. Please check your connection.' };
  }
}

/**
 * Triggers atomic reward settlement when a referee completes their first study session (>= min minutes)
 * Dispatches to /api/referral/settle with trigger 'study_milestone' and referee ID token for atomic transaction
 */
export async function qualifyReferral(
  refereeUid: string, 
  sessionDurationMinutes: number
): Promise<boolean> {
  if (!refereeUid) return false;

  try {
    const { auth } = await import('./firebase');
    const currentUser = auth?.currentUser;
    if (!currentUser || currentUser.uid !== refereeUid) return false;

    const idToken = await currentUser.getIdToken();
    
    // Primary: Call unified settle endpoint
    let res = await fetch('/api/referral/settle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ 
        trigger: 'study_milestone',
        sessionDurationMinutes 
      }),
    });

    // Fallback: If 404, fallback to legacy qualify action
    if (res.status === 404) {
      res = await fetch('/api/referral/qualify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ sessionDurationMinutes }),
      });
    }

    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.success && (data.qualified || data.alreadySettled));
  } catch (e) {
    console.error('[Referral Engine] Error qualifying referral via server API:', e);
    return false;
  }
}

/**
 * Fetches full referral dashboard status for the logged-in candidate
 */
export async function getUserReferralStatus(user: User): Promise<UserReferralStatus> {
  const config = await getReferralConfig();
  const defaultStatus: UserReferralStatus = {
    referralCode: '',
    passesRemaining: config.maxPassesPerUser,
    maxPasses: config.maxPassesPerUser,
    totalClaimed: 0,
    totalQualified: 0,
    history: [],
    config
  };

  if (!firestoreDb || !user) return defaultStatus;

  try {
    const code = await ensureUserReferralCode(user);
    defaultStatus.referralCode = code;

    // Fetch referral records where referrerUid === user.uid
    const q = query(
      collection(firestoreDb, 'referrals'),
      where('referrerUid', '==', user.uid)
    );
    const snap = await getDocs(q);

    const history: ReferralRecord[] = [];
    let totalClaimed = 0;
    let totalQualified = 0;

    snap.forEach((docSnap) => {
      const data = docSnap.data() as ReferralRecord;
      history.push(data);
      totalClaimed++;
      if (data.status === 'qualified') {
        totalQualified++;
      }
    });

    const passesRemaining = Math.max(0, config.maxPassesPerUser - totalClaimed);

    return {
      referralCode: code,
      passesRemaining,
      maxPasses: config.maxPassesPerUser,
      totalClaimed,
      totalQualified,
      history: history.sort((a, b) => (b.claimedAt?.toMillis?.() || 0) - (a.claimedAt?.toMillis?.() || 0)),
      config
    };
  } catch (e) {
    console.error('[Referral Engine] Error loading user referral status:', e);
    return defaultStatus;
  }
}
