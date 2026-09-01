import { db, MistakeLog, HistoryEntry } from '@/db';
import { ALL_SUBJECTS } from '@/data/ontology';
import { 
  AtlasClinicalAction, 
  ActionLogStudyPayload, 
  ActionUpsertMistakePayload, 
  ActionCalibrateDecayPayload, 
  ActionRecordScorePayload 
} from './actionSchemas';

export interface OptimisticMutationResult {
  success: boolean;
  actionId: string;
  entityId?: string | number;
  message: string;
  error?: string;
}

/**
 * Resolves a subject ID or fallback name to canonical ID in database
 */
async function resolveSubjectId(subjectName: string): Promise<{ subjectId: number | string; canonicalName: string }> {
  const clean = subjectName.trim().toLowerCase();
  const dbSubjects = await db.subjects.toArray();
  const match = dbSubjects.find(s => s.name.toLowerCase() === clean);
  if (match && match.id !== undefined) {
    return { subjectId: match.id, canonicalName: match.name };
  }

  const ont = ALL_SUBJECTS.find(o => o.name.toLowerCase() === clean || o.id.toLowerCase() === clean);
  if (ont) {
    return { subjectId: ont.id, canonicalName: ont.name };
  }

  return { subjectId: subjectName, canonicalName: subjectName };
}

/**
 * Resolves or finds system/unit ID within a subject
 */
async function resolveSystemId(subjectId: number | string, systemName?: string): Promise<{ systemId?: number | string; canonicalName: string }> {
  if (!systemName) return { canonicalName: 'General Core' };
  const clean = systemName.trim().toLowerCase();
  
  const systems = await db.systems.where('subjectId').equals(subjectId as any).toArray();
  const match = systems.find(s => s.name.toLowerCase().includes(clean) || clean.includes(s.name.toLowerCase()));
  if (match && match.id !== undefined) {
    return { systemId: match.id, canonicalName: match.name };
  }

  const curriculums = await db.curriculumSets.toArray();
  const cMatch = curriculums.find(c => c.name.toLowerCase().includes(clean));
  if (cMatch && cMatch.id !== undefined) {
    return { systemId: cMatch.id, canonicalName: cMatch.name };
  }

  return { canonicalName: systemName };
}

/**
 * Optimistically executes clinical mutations into IndexedDB in 0ms with local transactions
 */
export async function executeOptimisticMutation(action: AtlasClinicalAction): Promise<OptimisticMutationResult> {
  try {
    switch (action.actionType) {
      case 'ACTION_LOG_STUDY': {
        const payload = action.payload as ActionLogStudyPayload;
        const { subjectId, canonicalName } = await resolveSubjectId(payload.subjectName);
        const { systemId, canonicalName: sysName } = await resolveSystemId(subjectId, payload.systemName);

        const duration = Math.max(5, payload.durationMinutes || 45);
        const completedAt = new Date().toISOString();

        // 1. Write to history log
        const historyId = await db.history.add({
          subjectId: subjectId as any,
          systemId: systemId as any,
          durationMinutes: duration,
          completedAt,
          notes: payload.notes || `Voice Study Block: ${canonicalName} • ${sysName}`,
          createdAt: completedAt,
          updatedAt: completedAt,
        });

        // 2. Update system completion & revision status if unit exists
        if (systemId && typeof systemId === 'number') {
          const sys = await db.systems.get(systemId);
          if (sys) {
            const revCount = (sys.revisionCount || 0) + 1;
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + Math.min(30, Math.pow(2, revCount) * 3));

            await db.systems.update(systemId, {
              contentCompleted: true,
              lastRevisionDate: completedAt,
              revisionCount: revCount,
              nextRevisionDate: nextDate.toISOString(),
              updatedAt: completedAt,
            });
          }
        }

        return {
          success: true,
          actionId: action.id,
          entityId: historyId,
          message: `Logged ${duration}m to ${canonicalName} (${sysName})`,
        };
      }

      case 'ACTION_UPSERT_MISTAKE': {
        const payload = action.payload as ActionUpsertMistakePayload;
        const { subjectId, canonicalName } = await resolveSubjectId(payload.subjectName);
        const { systemId } = await resolveSystemId(subjectId, payload.systemName);

        const now = new Date().toISOString();
        const fullRule = payload.pearlRule;
        const trap = payload.pitfallTrap || '';
        const stem = payload.triggerStem || '';

        const mistakePayload: Partial<MistakeLog> = {
          subjectId: subjectId as any,
          systemId: (systemId as any) || undefined,
          title: payload.systemName || canonicalName,
          questionSummary: stem || `High-Yield Recall: ${payload.systemName || canonicalName}`,
          keyTakeaway: fullRule,
          pitfall: trap,
          errorType: (payload.errorType as any) || 'CONCEPTUAL_CONFUSION',
          isVolatile: !!payload.isVolatile,
          tags: ['voice-copilot', canonicalName.toLowerCase(), ...(payload.isVolatile ? ['volatile'] : [])],
          resolved: false,
          source: payload.source || 'Voice Co-Pilot',
          createdAt: now,
          updatedAt: now,
        };

        const mistakeId = await db.mistakeLogs.add(mistakePayload as MistakeLog);

        return {
          success: true,
          actionId: action.id,
          entityId: mistakeId,
          message: `Saved Mistakes Journal Pearl for ${canonicalName}`,
        };
      }

      case 'ACTION_CALIBRATE_DECAY': {
        const payload = action.payload as ActionCalibrateDecayPayload;
        const { subjectId, canonicalName } = await resolveSubjectId(payload.subjectName);
        const { systemId } = await resolveSystemId(subjectId, payload.systemName);

        if (systemId && typeof systemId === 'number') {
          const sys = await db.systems.get(systemId);
          if (sys) {
            const nextDate = new Date();
            const days = payload.customIntervalDays || 2;
            nextDate.setDate(nextDate.getDate() + days);

            await db.systems.update(systemId, {
              nextRevisionDate: nextDate.toISOString(),
              decayFactor: payload.action === 'ACCELERATE_DECAY' ? 1.5 : 0.8,
              updatedAt: new Date().toISOString(),
            });
          }
        }

        return {
          success: true,
          actionId: action.id,
          message: `Calibrated memory decay interval for ${canonicalName}`,
        };
      }

      case 'ACTION_RECORD_SCORE': {
        const payload = action.payload as ActionRecordScorePayload;
        const now = new Date().toISOString();

        const scoreId = await db.scoreLogs.add({
          testName: payload.testName || 'Mock Grand Test',
          score: payload.score,
          totalMarks: payload.totalMarks || 100,
          timestamp: now,
          weakAreas: (payload.weakAreas || []) as any,
          notes: 'Voice Co-Pilot Score Submission',
          createdAt: now,
          updatedAt: now,
        });

        return {
          success: true,
          actionId: action.id,
          entityId: scoreId,
          message: `Recorded score ${payload.score}/${payload.totalMarks || 200}`,
        };
      }

      default:
        return {
          success: true,
          actionId: action.id,
          message: 'Clinical query answered without state mutation',
        };
    }
  } catch (err: any) {
    console.error('[OptimisticMutations] Execution error:', err);
    return {
      success: false,
      actionId: action.id,
      message: 'Failed to commit mutation locally',
      error: err?.message || 'IndexedDB transaction error',
    };
  }
}
