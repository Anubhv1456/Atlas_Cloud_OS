// ATLAS Score-Driven Spaced Repetition (SDSR) Engine



// Topic Volatility Maps
// Pharmacology, Microbiology, Biochemistry, Anatomy -> High Volatility (0.85)
// Physiology, Pathology -> Low Volatility (1.15)
// Everything else -> Standard (1.0)
const VOLATILITY_MAP: Record<string, number> = {
  'Pharmacology': 0.85,
  'Microbiology': 0.85,
  'Biochemistry': 0.85,
  'Anatomy': 0.85,
  'Physiology': 1.15,
  'Pathology': 1.15,
};

export function getVolatilityIndex(subjectName: string): number {
  return VOLATILITY_MAP[subjectName] || 1.0;
}



import { StudySystem } from '@/db/types';

export function calibrateSystemSDSR(
  system: StudySystem,
  score: number,
  subjectName: string,
  globalRetentionScore: number = 0.70
): Partial<StudySystem> {
  const now = new Date();
  let baseInterval = system.currentRevisionInterval;

  if (!baseInterval) {
    if (score < 0.50) baseInterval = 3;
    else if (score <= 0.70) baseInterval = 7;
    else if (score <= 0.85) baseInterval = 14;
    else baseInterval = 21;
  } else {
    if (system.lastRevisionDate) {
      const actualIntervalDays = (now.getTime() - new Date(system.lastRevisionDate).getTime()) / (1000 * 60 * 60 * 24);
      if (score >= 0.70 && actualIntervalDays > baseInterval) {
        baseInterval = actualIntervalDays;
      }
    }
  }

  let Pm = 1.0;
  if (score < 0.50) {
    Pm = Math.max(0.2, 2 * score);
  } else {
    Pm = 1.0 + ((score - 0.50) * 3.6);
  }

  const Dm = getVolatilityIndex(subjectName);
  const alpha = 0.85 + (globalRetentionScore * 0.3);

  let newInterval = baseInterval * Pm * Dm * alpha;
  newInterval = Math.max(3, newInterval);
  newInterval = Math.min(150, newInterval);

  const nextRevisionDate = new Date(now.getTime() + (newInterval * 24 * 60 * 60 * 1000));

  // Determine standard confidence enum based on score to keep UI consistent
  let status: 'Strong' | 'Average' | 'Weak' = 'Average';
  if (score >= 0.75) status = 'Strong';
  else if (score < 0.50) status = 'Weak';

  return {
    status,
    lastRevisionDate: now,
    nextRevisionDate,
    currentRevisionInterval: newInterval,
    revisionCount: (system.revisionCount || 0) + 1,
    updatedAt: now,
  };
}


import { CurriculumSet } from '@/db/types';

export interface CurriculumSetSDSRResult {
  newInterval: number;
  nextRevisionDate: Date;
  updatedSet: Partial<CurriculumSet>;
}

export function calibrateCurriculumSetSDSR(
  curriculumSet: CurriculumSet,
  score: number,
  subjectName: string = 'General',
  globalRetentionScore: number = 0.70
): CurriculumSetSDSRResult {
  const normalizedScore = score > 1 ? score / 100 : score;
  const now = new Date();
  let baseInterval = curriculumSet.currentRevisionInterval;

  if (!baseInterval) {
    if (normalizedScore < 0.50) baseInterval = 3;
    else if (normalizedScore <= 0.70) baseInterval = 7;
    else if (normalizedScore <= 0.85) baseInterval = 14;
    else baseInterval = 21;
  } else {
    if (curriculumSet.lastRevisionDate) {
      const actualIntervalDays = (now.getTime() - new Date(curriculumSet.lastRevisionDate).getTime()) / (1000 * 60 * 60 * 24);
      if (normalizedScore >= 0.70 && actualIntervalDays > baseInterval) {
        baseInterval = actualIntervalDays;
      }
    }
  }

  let Pm = 1.0;
  if (normalizedScore < 0.50) {
    Pm = Math.max(0.2, 2 * normalizedScore);
  } else {
    Pm = 1.0 + ((normalizedScore - 0.50) * 3.6);
  }

  const Dm = getVolatilityIndex(subjectName);
  const alpha = 0.85 + (globalRetentionScore * 0.3);
  let newInterval = baseInterval * Pm * Dm * alpha;
  newInterval = Math.max(3, Math.min(150, newInterval));

  const nextRevisionDate = new Date(now.getTime() + (newInterval * 24 * 60 * 60 * 1000));
  const count = curriculumSet.revisionCount || 0;
  const oldAvg = curriculumSet.averageScore ?? normalizedScore;
  const newAverageScore = (oldAvg * count + normalizedScore) / (count + 1);

  const updatedSet: any = {
    currentRevisionInterval: Math.round(newInterval),
    nextRevisionDate,
    lastRevisionDate: now,
    revisionCount: count + 1,
    averageScore: newAverageScore,
    updatedAt: now,
  };

  return {
    newInterval: Math.round(newInterval),
    nextRevisionDate,
    updatedSet,
  };
}
