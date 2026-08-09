import { StudySystem } from '@/db';

/**
 * Calculates a single system's progress percentage (0 - 100).
 *
 * Each system has 2 main tasks:
 * 1) Content task:
 *    - 1.0 (100%) if system.contentCompleted is true
 *    - (contentUnitsCompleted / contentUnitsTotal) if contentInitialized and total > 0
 *    - 0.0 otherwise
 * 2) QBank task:
 *    - 1.0 if system.qbankDone is true
 *    - 0.0 otherwise
 *
 * System progress is the average of these 2 task fractions: ((contentValue + qbankValue) / 2) * 100.
 */
export function calculateSystemProgress(system: StudySystem): number {
  let contentValue = 0;
  if (system.contentCompleted) {
    contentValue = 1;
  } else if (system.contentInitialized && system.contentUnitsTotal > 0) {
    contentValue = Math.min(1, Math.max(0, system.contentUnitsCompleted / system.contentUnitsTotal));
  }

  const qbankValue = system.qbankDone ? 1 : 0;

  return ((contentValue + qbankValue) / 2) * 100;
}

/**
 * Calculates a subject's progress percentage (0 - 100) by taking the average
 * of the progress values across all systems in that subject.
 */
export function calculateSubjectProgress(systems: StudySystem[]): number {
  if (systems.length === 0) return 0;
  const sum = systems.reduce((acc, sys) => acc + calculateSystemProgress(sys), 0);
  return Math.round(sum / systems.length);
}

/**
 * Calculates overall progress percentage (0 - 100) across all systems in the application.
 */
export function calculateOverallProgress(systems: StudySystem[]): number {
  if (systems.length === 0) return 0;
  const sum = systems.reduce((acc, sys) => acc + calculateSystemProgress(sys), 0);
  return Math.round(sum / systems.length);
}


import { TopicProgress } from '@/db/types';

/**
 * Calculates completed tasks out of total topics tasks.
 * Each topic has 2 tasks: content and qbank.
 */
export function calculateCompletedTopicTasks(topicProgresses: TopicProgress[]): number {
  return topicProgresses.reduce((acc, tp) => {
    let done = 0;
    if (tp.contentStatus === 'completed') done++;
    if (tp.qbankStatus === 'completed') done++;
    return acc + done;
  }, 0);
}

/**
 * Calculates overall progress percentage (0 - 100) across given topics.
 */
export function calculateTopicsProgressPercentage(topicProgresses: TopicProgress[], totalTopics: number): number {
  if (totalTopics === 0) return 0;
  const sum = topicProgresses.reduce((acc, tp) => {
    let val = 0;
    if (tp.contentStatus === 'completed') val += 0.5;
    if (tp.qbankStatus === 'completed') val += 0.5;
    return acc + val;
  }, 0);
  return Math.round((sum / totalTopics) * 100);
}
