import {
  getNextActionRecommendation,
  NextActionEngineResult,
  EngineOptions,
} from '@/lib/recommendations/nextActionEngine';

export interface FetchNextActionOptions extends EngineOptions {
  subjectFilterId?: number;
  timeoutMs?: number;
}

/**
 * Pure Local-First Recommendation Engine.
 * Computes deterministic SDSR triage, memory decay calibrations,
 * mistake priorities, and duration estimates directly from local IndexedDB in <3ms.
 */
export async function getNextActionWithFallback(
  options: FetchNextActionOptions = {}
): Promise<NextActionEngineResult> {
  return getNextActionRecommendation(options);
}

export { getNextActionRecommendation };
