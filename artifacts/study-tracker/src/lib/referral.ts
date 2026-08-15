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
 */
export async function claimReferralCode(
  code: string, 
  user: User
): Promise<{ success: boolean; message: string; trialDaysAwarded?: number }> {
  if (!firestoreDb || !user || !code) {
    return { success: false, message: 'Invalid referral context' };
  }

  try {
    const config = await getReferralConfig();
    if (!config.enabled) {
      return { success: false, message: 'Referral program is currently paused' };
    }

    const cleanCode = code.trim().toUpperCase();
    const codeDetails = await getReferralCodeDetails(cleanCode);

    if (!codeDetails) {
      return { success: false, message: 'Invalid or expired invite pass' };
    }

    // Prevent self-referral
    if (codeDetails.ownerUid === user.uid) {
      return { success: false, message: 'Cannot claim your own invite pass' };
    }

    const userRef = doc(firestoreDb, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : null;

    // Check if user already claimed a code
    if (userData?.referredByCode) {
      return { success: false, message: 'Invite pass already claimed on this account' };
    }

    // Check quota on referrer
    if (codeDetails.totalClaimed >= config.maxPassesPerUser) {
      return { success: false, message: 'This candidate has reached their colleague pass limit' };
    }

    // Provision referee trial access
    const trialDays = config.refereeTrialDays || 15;
    const now = Date.now();
    const expiryTimestamp = now + (trialDays * 24 * 60 * 60 * 1000);

    const referralRecordId = `${codeDetails.ownerUid}_${user.uid}`;
    const referralRecordRef = doc(firestoreDb, 'referrals', referralRecordId);

    const record: ReferralRecord = {
      id: referralRecordId,
      referrerUid: codeDetails.ownerUid,
      refereeUid: user.uid,
      refereeEmail: user.email || '',
      refereeName: user.displayName || 'Candidate Doctor',
      code: cleanCode,
      status: 'claimed',
      bonusDaysAwarded: config.referrerBonusDays,
      claimedAt: new Date(),
    };

    await setDoc(referralRecordRef, record);

    // Increment code claim counter
    const codeRef = doc(firestoreDb, 'referralCodes', cleanCode);
    await updateDoc(codeRef, {
      totalClaimed: increment(1)
    });

    // Update referee account
    await setDoc(userRef, {
      betaAccess: true,
      betaAccessExpiresAt: expiryTimestamp,
      isTrial: true,
      referredByCode: cleanCode,
      referredByUid: codeDetails.ownerUid,
      referralStatus: 'claimed',
      updatedAt: new Date()
    }, { merge: true });

    // Stash local storage for instant offline UI
    localStorage.setItem(`beta_access_${user.uid}`, 'true');
    localStorage.setItem(`beta_access_expiry_${user.uid}`, expiryTimestamp.toString());
    sessionStorage.removeItem('atlas_pending_ref_code');

    return { 
      success: true, 
      message: `Activated ${trialDays}-day Clinical Trial Pass!`,
      trialDaysAwarded: trialDays
    };
  } catch (e) {
    console.error('[Referral Engine] Error claiming code:', e);
    return { success: false, message: 'Failed to apply referral pass' };
  }
}

/**
 * Triggers atomic reward qualification when a referee completes their first study session (>= min minutes)
 */
export async function qualifyReferral(
  refereeUid: string, 
  sessionDurationMinutes: number
): Promise<boolean> {
  if (!firestoreDb || !refereeUid) return false;

  try {
    const config = await getReferralConfig();
    if (!config.enabled) return false;

    const minMinutes = config.minStudyMinutesToQualify || 10;
    if (sessionDurationMinutes < minMinutes) {
      return false;
    }

    const refereeRef = doc(firestoreDb, 'users', refereeUid);
    const refereeSnap = await getDoc(refereeRef);
    if (!refereeSnap.exists()) return false;

    const refereeData = refereeSnap.data();
    const referrerUid = refereeData?.referredByUid;
    const refCode = refereeData?.referredByCode;

    if (!referrerUid || refereeData?.referralStatus === 'qualified') {
      return false; // Already qualified or not referred
    }

    const referralRecordId = `${referrerUid}_${refereeUid}`;
    const referralRecordRef = doc(firestoreDb, 'referrals', referralRecordId);
    const recordSnap = await getDoc(referralRecordRef);

    if (!recordSnap.exists()) return false;

    const bonusDays = config.referrerBonusDays || 14;
    const bonusMillis = bonusDays * 24 * 60 * 60 * 1000;

    // 1. Mark referral as qualified
    await updateDoc(referralRecordRef, {
      status: 'qualified',
      qualifiedAt: new Date()
    });

    // 2. Mark referee as qualified
    await updateDoc(refereeRef, {
      referralStatus: 'qualified',
      updatedAt: new Date()
    });

    // 3. Increment code qualified counter
    if (refCode) {
      const codeRef = doc(firestoreDb, 'referralCodes', refCode);
      await updateDoc(codeRef, {
        totalQualified: increment(1)
      }).catch(() => {});
    }

    // 4. Extend Referrer's Access Expiry
    const referrerRef = doc(firestoreDb, 'users', referrerUid);
    const referrerSnap = await getDoc(referrerRef);
    if (referrerSnap.exists()) {
      const refData = referrerSnap.data();
      const currentExpiry = refData.betaAccessExpiresAt?.toMillis
        ? refData.betaAccessExpiresAt.toMillis()
        : (refData.betaAccessExpiresAt || Date.now());

      const newExpiry = Math.max(Date.now(), currentExpiry) + bonusMillis;

      await updateDoc(referrerRef, {
        betaAccess: true,
        betaAccessExpiresAt: newExpiry,
        pendingReferralRewardToast: {
          colleagueName: refereeData.displayName || 'Your batchmate',
          bonusDays,
          grantedAt: Date.now()
        },
        updatedAt: new Date()
      });
    }

    return true;
  } catch (e) {
    console.error('[Referral Engine] Error qualifying referral:', e);
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
