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
        const rawSubjects = await db.subjects.filter((s) => !s.deletedAt).toArray().catch(() => []);
        const rawSystems = await db.systems.filter((s) => !s.deletedAt).toArray().catch(() => []);
        const setTable = db.curriculumSets || db.revisionSets;
        const rawCurriculumSets = setTable
          ? await setTable.filter((s) => !s.deletedAt).toArray().catch(() => [])
          : [];
        const rawTopicProgresses = await db.topicProgress.toArray().catch(() => []);
        const daysSinceLastStudy = await getDaysSinceLastStudy().catch(() => 0);

        // Map to lightweight payloads to optimize request body size
        const subjects = rawSubjects.map(s => ({ id: s.id, name: s.name }));
        const systems = rawSystems.map(sys => ({
          id: sys.id,
          name: sys.name,
          decayFactor: sys.decayFactor,
          contentCompleted: sys.contentCompleted
        }));
        const curriculumSets = rawCurriculumSets.map(set => ({
          id: set.id,
          name: set.name,
          subjectId: set.subjectId,
          systemId: set.systemId,
          topicIds: set.topicIds,
          focus: set.focus,
          focusUpdatedAt: set.focusUpdatedAt,
          nextRevisionDate: set.nextRevisionDate,
          lastRevisionDate: set.lastRevisionDate,
          currentRevisionInterval: set.currentRevisionInterval,
          revisionCount: set.revisionCount,
          updatedAt: set.updatedAt
        }));
        const topicProgresses = rawTopicProgresses.map(tp => ({
          topicId: tp.topicId,
          isWeak: tp.isWeak
        }));

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
