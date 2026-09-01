import { db } from '@/db';
import { generateHLC } from '@/lib/hlc';
import { logMistake } from '@/db/mutations';
import { recordStudyBlockRevision } from '@/db/revisionEngine';
import { 
  ParsedAtlasAction, 
  ActionAddMistake, 
  ActionLogStudy, 
  ActionRecordScore, 
  ActionClinicalQuery 
} from './intentParser';
import { toast } from 'sonner';

export interface ActionExecutionResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Centrally routes confirmed AI proposals into Dexie & Firestore tables with zero risk of direct unapproved writes.
 */
export async function executeAtlasAction(action: ParsedAtlasAction): Promise<ActionExecutionResult> {
  try {
    switch (action.action) {
      case 'ACTION_ADD_MISTAKE': {
        const mistake = action as ActionAddMistake;

        // Try to match systemId if systemName is provided
        let resolvedSystemId: number | string = 0;
        if (mistake.systemName) {
          const cleanSys = mistake.systemName.trim().toLowerCase();
          const sysList = await db.systems
            .where('subjectId')
            .equals(mistake.subjectId)
            .toArray()
            .then(res => res.filter(s => !s.deletedAt));
          
          const matched = sysList.find(s => 
            s.name.toLowerCase() === cleanSys || 
            s.name.toLowerCase().includes(cleanSys) || 
            cleanSys.includes(s.name.toLowerCase())
          );
          if (matched && matched.id !== undefined) {
            resolvedSystemId = matched.id;
          }
        }

        const mistakeId = await logMistake({
          subjectId: mistake.subjectId,
          systemId: resolvedSystemId,
          title: mistake.systemName || mistake.tag,
          clinicalTrigger: mistake.clinicalTrigger || undefined,
          tags: mistake.tag ? [mistake.tag] : ['General Pearl'],
          isVolatile: mistake.isUrgent,
          errorType: mistake.errorType || 'concept',
          keyTakeaway: mistake.ruleText || mistake.keyTakeaway,
          source: mistake.source || 'Custom',
        });

        return {
          success: true,
          message: `Mistake logged to Mistakes Journal (${mistake.tag})`,
          data: { mistakeId },
        };
      }

      case 'ACTION_LOG_STUDY': {
        const study = action as ActionLogStudy;
        const result = await recordStudyBlockRevision({
          subjectId: study.subjectId,
          subjectName: study.subjectName,
          systemName: study.systemName,
          durationMinutes: study.durationMinutes,
          confidenceLevel: study.confidenceLevel,
          topicsStudied: study.topicsStudied,
        });

        toast.success('Study Session Logged 📚', {
          description: `${study.subjectName} • ${study.durationMinutes} mins • Next recall in ${result.intervalDays}d`,
        });

        return {
          success: true,
          message: `Logged ${study.durationMinutes} mins study for ${study.subjectName} — recall in ${result.intervalDays} days`,
          data: result,
        };
      }

      case 'ACTION_RECORD_SCORE': {
        const scoreRec = action as ActionRecordScore;
        const total = scoreRec.totalMarks > 0 ? scoreRec.totalMarks : 200;
        const percentage = Math.round((scoreRec.score / total) * 100);
        const now = new Date();

        const scoreId = await db.scoreLogs.add({
          title: scoreRec.testName,
          score: scoreRec.score,
          total,
          percentage,
          type: 'gt',
          timestamp: now,
          weakSubjects: scoreRec.weakSubjects,
          notes: scoreRec.notes || undefined,
          createdAt: now,
          updatedAt: now,
          hlc: generateHLC(),
        });

        // Add history timeline log for exam completion
        await db.history.add({
          subjectId: 0,
          subjectName: 'Grand Test',
          systemId: 0,
          systemName: scoreRec.testName,
          taskKey: 'gt_score',
          taskLabel: `${scoreRec.testName}: ${scoreRec.score}/${total} (${percentage}%)`,
          completedAt: now,
          createdAt: now,
          updatedAt: now,
          hlc: generateHLC(),
        });

        toast.success('Test Score Logged 🎯', {
          description: `${scoreRec.testName}: ${scoreRec.score}/${total} (${percentage}%)`,
        });

        return {
          success: true,
          message: `Recorded test score: ${scoreRec.score}/${total} (${percentage}%)`,
          data: { scoreId },
        };
      }

      case 'ACTION_CLINICAL_QUERY': {
        const query = action as ActionClinicalQuery;
        return {
          success: true,
          message: query.reply,
          data: query,
        };
      }

      default:
        return {
          success: false,
          message: 'Unknown action type',
        };
    }
  } catch (err: any) {
    console.error('[executeAtlasAction] Execution error:', err);
    toast.error('Failed to commit AI action', {
      description: err.message || 'Database error occurred.',
    });
    return {
      success: false,
      message: err.message || 'Database write error',
    };
  }
}
