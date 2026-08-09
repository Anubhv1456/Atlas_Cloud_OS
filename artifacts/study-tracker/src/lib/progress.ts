import { StudySystem } from '@/db';
import { CurriculumSet } from '@/db/types';

/**
 * Calculates a single system's progress percentage (0 - 100).
 *
 * Each set has 2 main tasks:
 * 1) Content task
 * 2) QBank task
 */
export function calculateSystemProgress(curriculumSets: CurriculumSet[]): number {
  if (!curriculumSets || curriculumSets.length === 0) return 0;
  
  let completed = 0;
  curriculumSets.forEach(set => {
    if (set.contentCompleted) completed++;
    if (set.qbankCompleted) completed++;
  });
  
  return Math.round((completed / (curriculumSets.length * 2)) * 100);
}

/**
 * Calculates a subject's progress percentage (0 - 100)
 */
export function calculateSubjectProgress(curriculumSets: CurriculumSet[]): number {
  if (!curriculumSets || curriculumSets.length === 0) return 0;
  
  let completed = 0;
  curriculumSets.forEach(set => {
    if (set.contentCompleted) completed++;
    if (set.qbankCompleted) completed++;
  });
  
  return Math.round((completed / (curriculumSets.length * 2)) * 100);
}

/**
 * Calculates overall progress percentage (0 - 100) across all systems in the application.
 */
export function calculateOverallProgress(curriculumSets: CurriculumSet[]): number {
  if (!curriculumSets || curriculumSets.length === 0) return 0;
  
  let completed = 0;
  curriculumSets.forEach(set => {
    if (set.contentCompleted) completed++;
    if (set.qbankCompleted) completed++;
  });
  
  return Math.round((completed / (curriculumSets.length * 2)) * 100);
}
