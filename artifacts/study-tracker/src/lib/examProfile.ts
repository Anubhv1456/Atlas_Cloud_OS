import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestoreDb, auth } from './firebase';

export interface ExamProfile {
  targetExam: string;
  targetExamDate: string;
  targetQBankSize?: number;
  hasCompletedTriage?: boolean;
  curriculum: string;
  targetScore: string;
  dailyQuestionGoal: number;
  currentYear?: string;
  startedStudying?: 'yes' | 'fresh';
}

const LOCAL_STORAGE_KEY = 'atlas_user_exam_profile';

export const DEFAULT_EXAM_OPTIONS = [
  'NEET PG / INI-CET',
  'USMLE Step 1',
  'USMLE Step 2 CK',
  'MBBS Professional Exams'
];

export const DEFAULT_CURRICULUM_OPTIONS = [
  'Organ-System Based (Cardiology, Neurology, etc.)',
  'Subject-Based (Anatomy, Pharmacology, Pathology, etc.)',
  'Clinical Rotations (Internal Med, Surgery, Pediatrics, etc.)'
];

export const DEFAULT_EXAM_PROFILE: ExamProfile = {
  targetExam: 'NEET PG / INI-CET',
  targetExamDate: '',
  curriculum: 'Subject-Based (Anatomy, Pharmacology, Pathology, etc.)',
  targetScore: '',
  dailyQuestionGoal: 40,
  currentYear: 'Final MBBS',
};

export function getLocalExamProfile(): ExamProfile {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_EXAM_PROFILE, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to read exam profile from localStorage', err);
  }
  return DEFAULT_EXAM_PROFILE;
}

export function setLocalExamProfile(profile: ExamProfile) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save exam profile to localStorage', err);
  }
}

// 5-minute in-memory cache and in-flight request deduplication
interface ExamProfileCacheEntry {
  profile: ExamProfile;
  timestamp: number;
}

const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const memoryCache = new Map<string, ExamProfileCacheEntry>();
const inFlightRequests = new Map<string, Promise<ExamProfile>>();

export function invalidateExamProfileCache(userId?: string) {
  if (userId) {
    memoryCache.delete(userId);
    inFlightRequests.delete(userId);
  } else {
    memoryCache.clear();
    inFlightRequests.clear();
  }
}

export async function fetchExamProfile(userId?: string): Promise<ExamProfile> {
  const local = getLocalExamProfile();
  const uid = userId || auth.currentUser?.uid;
  if (!uid || !firestoreDb) return local;

  // 1. Check 5-minute in-memory cache
  const cached = memoryCache.get(uid);
  const now = Date.now();
  if (cached && (now - cached.timestamp < PROFILE_CACHE_TTL_MS)) {
    return cached.profile;
  }

  // 2. Return active in-flight request if one is already pending for this user
  const inFlight = inFlightRequests.get(uid);
  if (inFlight) {
    return inFlight;
  }

  // 3. Initiate request with in-flight deduplication
  const fetchPromise = (async (): Promise<ExamProfile> => {
    try {
      // Race network fetch with a 400ms timeout for instant offline loads
      const cloudFetchPromise = async (): Promise<ExamProfile | null> => {
        try {
          const userRef = doc(firestoreDb, `users/${uid}`);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            const profileFromCloud: ExamProfile = {
              targetExam: data.targetExam ?? local.targetExam ?? '',
              targetExamDate: data.targetExamDate ?? local.targetExamDate ?? '',
              targetQBankSize: data.targetQBankSize ?? local.targetQBankSize,
              hasCompletedTriage: data.hasCompletedTriage ?? local.hasCompletedTriage,
              curriculum: data.curriculum ?? local.curriculum ?? DEFAULT_EXAM_PROFILE.curriculum,
              targetScore: data.targetScore ?? local.targetScore ?? '',
              dailyQuestionGoal: data.dailyQuestionGoal ?? local.dailyQuestionGoal ?? 40,
              currentYear: data.currentYear ?? local.currentYear ?? DEFAULT_EXAM_PROFILE.currentYear,
              startedStudying: data.startedStudying ?? local.startedStudying ?? 'yes',
            };
            setLocalExamProfile(profileFromCloud);
            memoryCache.set(uid, { profile: profileFromCloud, timestamp: Date.now() });
            return profileFromCloud;
          }
        } catch (err) {
          console.warn('Exam profile cloud fetch deferred (offline):', err);
        }
        return null;
      };

      const cloudProfile = await Promise.race([
        cloudFetchPromise(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 400))
      ]);
      
      if (cloudProfile) {
        return cloudProfile;
      }
    } catch (e) {
      // Return local on timeout/error
    } finally {
      inFlightRequests.delete(uid);
    }
    
    // Cache local profile briefly on fallback
    memoryCache.set(uid, { profile: local, timestamp: Date.now() });
    return local;
  })();

  inFlightRequests.set(uid, fetchPromise);
  return fetchPromise;
}

export async function saveExamProfile(profile: ExamProfile, userId?: string): Promise<void> {
  setLocalExamProfile(profile);
  const uid = userId || auth.currentUser?.uid;
  if (!uid) return;

  // Immediate update to memory cache
  memoryCache.set(uid, { profile, timestamp: Date.now() });
  inFlightRequests.delete(uid);

  if (!firestoreDb) return;
  try {
    const userRef = doc(firestoreDb, `users/${uid}`);
    await setDoc(userRef, {
      targetExam: profile.targetExam,
      targetExamDate: profile.targetExamDate,
      targetQBankSize: profile.targetQBankSize ?? 3000,
      hasCompletedTriage: profile.hasCompletedTriage ?? false,
      curriculum: profile.curriculum,
      targetScore: profile.targetScore,
      dailyQuestionGoal: profile.dailyQuestionGoal,
      currentYear: profile.currentYear || 'Final MBBS',
      startedStudying: profile.startedStudying || 'yes',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save exam profile to cloud', err);
  }
}
