// ATLAS Score-Driven Spaced Repetition (SDSR) Engine

import { TopicProgress } from '@/db/types';

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

export interface SDSRCalibrationResult {
  newInterval: number;
  nextRevisionDate: Date;
  updatedTopicProgress: Partial<TopicProgress>;
}

/**
 * Calculates the next revision interval based on performance score and topic volatility.
 * 
 * @param progress - Current topic progress object
 * @param score - The QBank or test score (0.0 to 1.0)
 * @param subjectName - The name of the subject, used to determine volatility
 * @param globalRetentionScore - The user's global retention score (average of last N QBank scores, 0.0 to 1.0). Default to 0.70.
 * @returns Object containing the new interval, next revision date, and the updated fields for the progress.
 */
export function calibrateSDSR(
  progress: TopicProgress,
  score: number,
  subjectName: string,
  globalRetentionScore: number = 0.70
): SDSRCalibrationResult {
  const now = new Date();
  
  // 1. Calculate Base Interval
  let baseInterval = progress.currentRevisionInterval;
  
  if (!baseInterval) {
    // Cold Start Solution
    if (score < 0.50) baseInterval = 3;
    else if (score <= 0.70) baseInterval = 7;
    else if (score <= 0.85) baseInterval = 14;
    else baseInterval = 21;
  } else {
    if (progress.lastRevisionDate) {
      const actualIntervalDays = (now.getTime() - progress.lastRevisionDate.getTime()) / (1000 * 60 * 60 * 24);
      // Lateness Correction: Reward them for remembering it late if they score well
      if (score >= 0.70 && actualIntervalDays > baseInterval) {
        baseInterval = actualIntervalDays;
      }
    }
  }

  // 2. Calculate Performance Modifier (Pm)
  let Pm = 1.0;
  if (score < 0.50) {
    // Linear with floor for failures
    Pm = Math.max(0.2, 2 * score);
  } else {
    // Continuous curve with a softer ceiling (~2.8 at 100%)
    Pm = 1.0 + ((score - 0.50) * 3.6);
  }

  // 3. Apply Volatility (Dm) & Personal Calibration (Alpha)
  const Dm = getVolatilityIndex(subjectName);
  const alpha = 0.85 + (globalRetentionScore * 0.3);

  let newInterval = baseInterval * Pm * Dm * alpha;

  // 4. Bound & Save
  newInterval = Math.max(3, newInterval); // Never review a macro-topic sooner than 3 days
  newInterval = Math.min(150, newInterval); // Cap at 150 days

  const nextRevisionDate = new Date(now.getTime() + (newInterval * 24 * 60 * 60 * 1000));

  // 5. Build Event History
  const revisionEvent = { date: now.toISOString(), 
    topicId: progress.topicId,
    score,
    previousInterval: progress.currentRevisionInterval,
    newInterval,
    reviewedAt: now.toISOString(),
  };

  const updatedRevisionHistory = [...(progress.revisionHistory || []), revisionEvent];

  const updatedTopicProgress: Partial<TopicProgress> = {
    lastRevisionDate: now,
    nextRevisionDate,
    currentRevisionInterval: newInterval,
    revisionCount: (progress.revisionCount || 0) + 1,
    revisionHistory: updatedRevisionHistory,
    updatedAt: now,
  };

  return {
    newInterval,
    nextRevisionDate,
    updatedTopicProgress,
  };
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
