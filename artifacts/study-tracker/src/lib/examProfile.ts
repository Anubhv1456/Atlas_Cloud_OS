import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestoreDb, auth } from './firebase';

export interface ExamProfile {
  targetExam: string;
  targetExamDate: string;
  curriculum: string;
  targetScore: string;
  dailyQuestionGoal: number;
  currentYear?: string;
  startedStudying?: 'yes' | 'fresh';
}

const LOCAL_STORAGE_KEY = 'atlas_user_exam_profile';

export const DEFAULT_EXAM_OPTIONS = [
  'USMLE Step 1',
  'USMLE Step 2 CK',
  'USMLE Step 3',
  'NEET PG',
  'INI-CET',
  'MBBS Professional Exams',
  'PLAB 1 / PLAB 2',
  'MCCQE Part 1',
  'AMC CAT MCQ',
  'NExT Exam',
  'Other Medical Board'
];

export const DEFAULT_CURRICULUM_OPTIONS = [
  'Organ-System Based (Cardiology, Neurology, etc.)',
  'Subject-Based (Anatomy, Pharmacology, Pathology, etc.)',
  'Clinical Rotations (Internal Med, Surgery, Pediatrics, etc.)'
];

export const DEFAULT_EXAM_PROFILE: ExamProfile = {
  targetExam: 'NEET PG',
  targetExamDate: '',
  curriculum: 'Organ-System Based (Cardiology, Neurology, etc.)',
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

export async function fetchExamProfile(userId?: string): Promise<ExamProfile> {
  const local = getLocalExamProfile();
  const uid = userId || auth.currentUser?.uid;
  if (!uid || !firestoreDb) return local;

  try {
    const userRef = doc(firestoreDb, `users/${uid}`);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const profileFromCloud: ExamProfile = {
        targetExam: data.targetExam || local.targetExam || '',
        targetExamDate: data.targetExamDate || local.targetExamDate || '',
        curriculum: data.curriculum || local.curriculum || DEFAULT_EXAM_PROFILE.curriculum,
        targetScore: data.targetScore || local.targetScore || '',
        dailyQuestionGoal: data.dailyQuestionGoal || local.dailyQuestionGoal || 40,
      };
      setLocalExamProfile(profileFromCloud);
      return profileFromCloud;
    }
  } catch (err) {
    console.error('Failed to fetch exam profile from cloud', err);
  }

  return local;
}

export async function saveExamProfile(profile: ExamProfile, userId?: string): Promise<void> {
  setLocalExamProfile(profile);
  const uid = userId || auth.currentUser?.uid;
  if (!uid || !firestoreDb) return;

  try {
    const userRef = doc(firestoreDb, `users/${uid}`);
    await setDoc(userRef, {
      targetExam: profile.targetExam,
      targetExamDate: profile.targetExamDate,
      curriculum: profile.curriculum,
      targetScore: profile.targetScore,
      dailyQuestionGoal: profile.dailyQuestionGoal,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save exam profile to cloud', err);
  }
}
