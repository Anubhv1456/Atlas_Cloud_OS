import { auth } from '@/lib/firebase';
import {
  getNextActionRecommendation,
  NextActionEngineResult,
  EngineOptions,
} from '@/lib/recommendations/nextActionEngine';
import { db } from '@/db';
import { getDaysSinceLastStudy } from '@/db/queries';

export interface FetchNextActionOptions extends EngineOptions {
  subjectFilterId?: number;
  timeoutMs?: number;
}

/**
 * Client API Abstraction Layer with Progressive Fallback.
 *
 * 1. Online: Authenticates with Firebase ID Token & requests secure serverless evaluation via /api/recommendations/next-action.
 * 2. Offline / Error / Timeout: Gracefully falls back to local IndexedDB evaluation using local SDSR engine.
 */
export async function getNextActionWithFallback(
  options: FetchNextActionOptions = {}
): Promise<NextActionEngineResult> {
  const timeoutMs = options.timeoutMs || 3500;
  const isOnline = typeof window !== 'undefined' && navigator.onLine;

  if (isOnline && auth.currentUser) {
    try {
      // Obtain current Firebase ID Token
      const token = await auth.currentUser.getIdToken(/* forceRefresh */ false).catch(() => null);

      if (token) {
        // Collect current IndexedDB data to send to serverless handler
        const subjects = await db.subjects.filter((s) => !s.deletedAt).toArray().catch(() => []);
        const systems = await db.systems.filter((s) => !s.deletedAt).toArray().catch(() => []);
        const setTable = db.curriculumSets || db.revisionSets;
        const curriculumSets = setTable
          ? await setTable.filter((s) => !s.deletedAt).toArray().catch(() => [])
          : [];
        const topicProgresses = await db.topicProgress.toArray().catch(() => []);
        const daysSinceLastStudy = await getDaysSinceLastStudy().catch(() => 0);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch('/api/recommendations/next-action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            curriculumSets,
            systems,
            subjects,
            topicProgresses,
            daysSinceLastStudy,
            skipIds: options.skipIds || [],
            sessionBudget: options.sessionBudget || 'quick',
            targetExam: options.targetExam || 'NEET PG',
            subjectFilterId: options.subjectFilterId,
          }),
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.recommendations) {
            return data.recommendations as NextActionEngineResult;
          }
        }
      }
    } catch (err) {
      console.warn('[NextAction API Layer] Serverless fetch failed/timed out, using local fallback:', err);
    }
  }

  // Graceful Offline / Fallback Path
  return getNextActionRecommendation(options);
}
