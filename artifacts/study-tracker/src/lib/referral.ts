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
import { User } from 'firebase/auth';

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
 * Reads global referral policy from Firestore (/config/referral_settings)
 */
export async function getReferralConfig(): Promise<ReferralConfig> {
  if (!firestoreDb) return DEFAULT_REFERRAL_CONFIG;
  try {
    const cfgRef = doc(firestoreDb, 'config', 'referral_settings');
    const snap = await getDoc(cfgRef);
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
 * Fetches referral code details to display inviter info on landing screen
 */
export async function getReferralCodeDetails(code: string): Promise<ReferralCodeDoc | null> {
  if (!firestoreDb || !code) return null;
  try {
    const cleanCode = code.trim().toUpperCase();
    const codeRef = doc(firestoreDb, 'referralCodes', cleanCode);
    const snap = await getDoc(codeRef);
    if (snap.exists()) {
      return snap.data() as ReferralCodeDoc;
    }
  } catch (e) {
    console.error('[Referral Engine] Error resolving referral code details:', e);
  }
  return null;
}

/**
 * Claims a referral code when a referee signs up / completes enrollment
 * Authenticates with the serverless API to perform atomic transaction and secure writes
 */
export async function claimReferralCode(
  code: string, 
  user: User
): Promise<{ success: boolean; message: string; trialDaysAwarded?: number }> {
  if (!user || !code) {
    return { success: false, message: 'Invalid referral context' };
  }

  const cleanCode = code.trim().toUpperCase();

  try {
    const idToken = await user.getIdToken();
    const res = await fetch('/api/referral/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ code: cleanCode }),
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
 * Triggers atomic reward qualification when a referee completes their first study session (>= min minutes)
 * Dispatches to serverless API with referee ID token for atomic Firestore transaction
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
    const res = await fetch('/api/referral/qualify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ sessionDurationMinutes }),
    });

    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.success && data.qualified);
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
