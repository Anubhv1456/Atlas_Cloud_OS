import { CognitiveDelta } from './types';
import { 
  AtlasClinicalAction, 
  ClinicalActionType, 
  ActionLogStudyPayload, 
  ActionUpsertMistakePayload, 
  ActionTriggerDrillPayload,
  ActionCalibrateDecayPayload,
  ActionRecordScorePayload 
} from './actionSchemas';

/**
 * Transforms incoming model CognitiveDelta or raw structured JSON chunk
 * into strongly typed, client-executable AtlasClinicalAction objects.
 */
export function extractClinicalActionsFromDelta(delta: CognitiveDelta): AtlasClinicalAction[] {
  const actions: AtlasClinicalAction[] = [];
  const now = Date.now();

  switch (delta.intent) {
    case 'ACTION_LOG_STUDY': {
      if (delta.studyLog) {
        const payload: ActionLogStudyPayload = {
          subjectName: delta.studyLog.subjectName || 'General',
          systemName: delta.studyLog.systemName,
          durationMinutes: delta.studyLog.durationMinutes || 45,
          confidenceLevel: delta.studyLog.confidenceLevel || 'medium',
          notes: delta.executiveSummary,
        };

        actions.push({
          id: `act_log_${now}_${Math.random().toString(36).substring(2, 6)}`,
          actionType: 'ACTION_LOG_STUDY',
          title: `Log ${payload.durationMinutes}m Study Session`,
          description: `${payload.subjectName} • ${payload.systemName || 'Core Unit'}`,
          isConfirmed: false,
          payload,
          createdAt: now,
        });
      }
      break;
    }

    case 'ACTION_ADD_MISTAKE': {
      if (delta.mistakeLog) {
        const payload: ActionUpsertMistakePayload = {
          subjectName: delta.mistakeLog.subjectName || 'Clinical Core',
          systemName: delta.mistakeLog.systemName,
          pearlRule: delta.mistakeLog.keyTakeaway || delta.executiveSummary,
          triggerStem: delta.mistakeLog.title,
          pitfallTrap: delta.mistakeLog.pitfall,
          isVolatile: !!delta.mistakeLog.isVolatile,
          errorType: (delta.mistakeLog.errorType as any) || 'CONCEPTUAL_CONFUSION',
          source: delta.mistakeLog.source || 'Voice Co-Pilot',
        };

        actions.push({
          id: `act_mistake_${now}_${Math.random().toString(36).substring(2, 6)}`,
          actionType: 'ACTION_UPSERT_MISTAKE',
          title: `Save 20th Notebook Pearl`,
          description: `${payload.subjectName} • ${payload.pearlRule.slice(0, 48)}...`,
          isConfirmed: false,
          payload,
          createdAt: now,
        });
      }
      break;
    }

    case 'ACTION_RECORD_SCORE': {
      if (delta.scoreLog) {
        const payload: ActionRecordScorePayload = {
          testName: delta.scoreLog.testName || 'Mock Grand Test',
          score: delta.scoreLog.score,
          totalMarks: delta.scoreLog.totalMarks || 200,
          weakAreas: delta.scoreLog.weakAreas || [],
        };

        actions.push({
          id: `act_score_${now}_${Math.random().toString(36).substring(2, 6)}`,
          actionType: 'ACTION_RECORD_SCORE',
          title: `Record Exam Score`,
          description: `${payload.testName}: ${payload.score}/${payload.totalMarks}`,
          isConfirmed: false,
          payload,
          createdAt: now,
        });
      }
      break;
    }

    case 'CLINICAL_QUERY':
    default: {
      // Check if the summary or advice hints at a rapid drill recommendation
      if (delta.recommendation && delta.recommendation.subjectName) {
        const payload: ActionTriggerDrillPayload = {
          subjectName: delta.recommendation.subjectName,
          systemName: delta.recommendation.systemName,
          drillType: '15M_RAPID',
        };

        actions.push({
          id: `act_drill_${now}_${Math.random().toString(36).substring(2, 6)}`,
          actionType: 'ACTION_TRIGGER_DRILL',
          title: `Socratic Recall Drill`,
          description: `Recommended 15m review for ${payload.subjectName}`,
          isConfirmed: false,
          payload,
          createdAt: now,
        });
      }
      break;
    }
  }

  return actions;
}
