import { db } from '@/db';
import { getLocalExamProfile, ExamProfile } from '@/lib/examProfile';
import { ALL_SUBJECTS } from '@/data/ontology';
import { isRevisionDue, today, getSystemMemoryLoss, getRetrievability } from '@/db/revisionEngine';
import { generateCognitiveProfile, CognitiveDiagnosticProfile } from '@/lib/ai/diagnosticService';
import { SUBJECT_METRICS_PROFILE, calculateSubjectFriction } from './frictionEngine';
import { getAISettings } from './aiSettingsStorage';
import { buildAtlasMentorSystemPrompt } from './mentorPrompt';

export { generateCognitiveProfile };
export type { CognitiveDiagnosticProfile };

export interface SubjectSummary {
  id: number | string;
  name: string;
  systemsTotal: number;
  systemsCompleted: number;
  completionPercent: number;
  isHighYield: boolean;
  focus?: 'primary' | 'secondary' | null;
  retrievabilityScore: number;
  memoryLossPercent: number;
  halfLifeDays: number;
  activeMistakesCount: number;
}

export interface DueReviewItem {
  subjectName: string;
  systemName: string;
  revisionCount: number;
  lastRevisionDate?: string | null;
  nextRevisionDate?: string | null;
  daysOverdue: number;
  decayFactor?: number;
  isHighYield?: boolean;
  status?: string;
  weakAreas?: string;
  retrievability: number;
}

export interface MistakePearlSummary {
  subjectName: string;
  systemName: string;
  ruleText: string;
  errorType: string;
  tags: string[];
  isVolatile: boolean;
  source?: string;
}

export interface ScoreSummary {
  testName: string;
  score: number;
  totalMarks?: number;
  percent: number;
  date: string;
  weakAreas: string[];
}

export interface LiveAtlasContext {
  generatedAt: string;
  exam: {
    targetExam: string;
    targetExamDate: string | null;
    daysRemaining: number | null;
    operationalMode: string;
    dailyCapacityMinutes: number;
    currentStreakDays: number;
    todayLoggedMinutes: number;
  };
  curriculum: {
    totalSubjects: number;
    totalUnits: number;
    completedUnits: number;
    overallProgressPercent: number;
    subjectBreakdown: SubjectSummary[];
  };
  urgentDecayQueue: DueReviewItem[];
  notebookPearls: {
    totalCount: number;
    volatileCount: number;
    recentPearls: MistakePearlSummary[];
  };
  recentScores: ScoreSummary[];
  diagnosticProfile: CognitiveDiagnosticProfile;
  circadianPacing: {
    isPeakStudyWindow: boolean;
    status: 'FRESH' | 'OPTIMAL' | 'FATIGUE_RISK' | 'RECOVERY_WINDOW';
  };
}

/**
 * Calculates days remaining until target exam date
 */
function calculateDaysRemaining(targetDateStr?: string | null): number | null {
  if (!targetDateStr) return null;
  try {
    const target = new Date(targetDateStr);
    if (isNaN(target.getTime())) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  } catch {
    return null;
  }
}

/**
 * Serializes the full live state of the user's Atlas database into a structured object.
 * Non-blocking with in-memory map aggregations (<5ms execution).
 */
export async function getLiveAtlasContext(): Promise<LiveAtlasContext> {
  const examProfile: ExamProfile = getLocalExamProfile();

  // Run independent table reads in parallel
  const [
    rawSubjects,
    rawSystems,
    rawCurriculumSets,
    rawMistakes,
    rawScores,
    rawOpMode,
    rawHistory,
  ] = await Promise.all([
    db.subjects.toArray().then(res => res.filter(s => !s.deletedAt)).catch(() => []),
    db.systems.toArray().then(res => res.filter(s => !s.deletedAt)).catch(() => []),
    db.curriculumSets.toArray().then(res => res.filter(c => !c.deletedAt)).catch(() => []),
    db.mistakeLogs.toArray().then(res => res.filter(m => !m.deletedAt)).catch(() => []),
    db.scoreLogs.orderBy('timestamp').reverse().toArray().then(res => res.filter(s => !s.deletedAt)).catch(() => []),
    db.operationalModes.get('current').catch(() => null),
    db.history.orderBy('completedAt').reverse().toArray().then(res => res.filter(h => !h.deletedAt)).catch(() => []),
  ]);

  const diagnosticProfile = generateCognitiveProfile(rawMistakes, rawSubjects, rawCurriculumSets);

  // Combine systems and curriculumSets for a canonical unit list
  const allUnits = rawSystems.length > 0 ? rawSystems : rawCurriculumSets;

  // Build subject lookup map
  const subjectMap = new Map<string | number, string>();
  for (const s of rawSubjects) {
    if (s.id !== undefined) subjectMap.set(s.id, s.name);
  }
  for (const ont of ALL_SUBJECTS) {
    if (!subjectMap.has(ont.id)) {
      subjectMap.set(ont.id, ont.name);
    }
  }

  const now = today();

  // Aggregate curriculum completion by subject along with Retrievability & Decay factors
  const subjectSummaries: SubjectSummary[] = rawSubjects.map(sub => {
    const subId = sub.id!;
    const unitsForSub = allUnits.filter(u => String(u.subjectId) === String(subId));
    const total = unitsForSub.length;
    const completed = unitsForSub.filter(u => u.contentCompleted || (u.contentUnitsCompleted && u.contentUnitsTotal && u.contentUnitsCompleted >= u.contentUnitsTotal)).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Check ontology high yield flag and metric profile
    const ontMatch = ALL_SUBJECTS.find(o => String(o.id) === String(subId) || o.name.toLowerCase() === sub.name.toLowerCase());
    const isHighYield = ontMatch ? ontMatch.tier === 'T1' : false;
    const metricProfile = SUBJECT_METRICS_PROFILE[sub.name];
    const halfLife = metricProfile?.halfLifeDays || 14;

    // Calculate active mistakes for this subject
    const subjectMistakes = rawMistakes.filter(m => !m.resolved && (String(m.subjectId) === String(subId) || m.subjectId === sub.name));

    // Calculate retrievability across units
    let avgRetrievability = 100;
    if (unitsForSub.length > 0) {
      const scores = unitsForSub.map(u => getRetrievability(u, rawCurriculumSets, now, rawMistakes));
      avgRetrievability = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    return {
      id: subId,
      name: sub.name,
      systemsTotal: total,
      systemsCompleted: completed,
      completionPercent: pct,
      isHighYield,
      focus: sub.focus,
      retrievabilityScore: avgRetrievability,
      memoryLossPercent: 100 - avgRetrievability,
      halfLifeDays: halfLife,
      activeMistakesCount: subjectMistakes.length,
    };
  }).sort((a, b) => {
    // Primary focus first, then by lowest retrievability score / highest decay
    if (a.focus === 'primary' && b.focus !== 'primary') return -1;
    if (b.focus === 'primary' && a.focus !== 'primary') return 1;
    return a.retrievabilityScore - b.retrievabilityScore;
  });

  const totalUnits = allUnits.length;
  const completedUnits = allUnits.filter(u => u.contentCompleted || (u.contentUnitsCompleted && u.contentUnitsTotal && u.contentUnitsCompleted >= u.contentUnitsTotal)).length;
  const overallProgressPercent = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

  // Calculate overdue & decaying units
  const dueUnits: DueReviewItem[] = [];

  for (const unit of allUnits) {
    const isDue = isRevisionDue(unit, rawCurriculumSets, now);
    const retrievability = getRetrievability(unit, rawCurriculumSets, now, rawMistakes);

    if (isDue || retrievability < 75 || (unit.decayFactor && unit.decayFactor > 1.2) || unit.status === 'Weak') {
      let daysOverdue = 0;
      if (unit.nextRevisionDate) {
        const nextRev = new Date(unit.nextRevisionDate);
        if (!isNaN(nextRev.getTime())) {
          const diff = now.getTime() - nextRev.getTime();
          daysOverdue = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
        }
      }

      const subName = subjectMap.get(unit.subjectId!) || 'General';

      dueUnits.push({
        subjectName: subName,
        systemName: unit.name,
        revisionCount: unit.revisionCount || 0,
        lastRevisionDate: unit.lastRevisionDate ? String(unit.lastRevisionDate) : null,
        nextRevisionDate: unit.nextRevisionDate ? String(unit.nextRevisionDate) : null,
        daysOverdue,
        decayFactor: unit.decayFactor,
        isHighYield: unit.isHighYield,
        status: unit.status,
        weakAreas: unit.weakAreas,
        retrievability,
      });
    }
  }

  // Sort due units by lowest retrievability and overdue days
  dueUnits.sort((a, b) => a.retrievability - b.retrievability || b.daysOverdue - a.daysOverdue);
  const topDueUnits = dueUnits.slice(0, 8);

  // Aggregate 20th Notebook mistake pearls
  const unresolvedMistakes = rawMistakes.filter(m => !m.resolved);
  const volatileMistakes = unresolvedMistakes.filter(m => m.isVolatile);

  const recentPearls: MistakePearlSummary[] = unresolvedMistakes
    .sort((a, b) => (b.isVolatile ? 1 : 0) - (a.isVolatile ? 1 : 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)
    .map(m => {
      const subName = subjectMap.get(m.subjectId!) || 'Clinical';
      const sysMatch = allUnits.find(u => String(u.id) === String(m.systemId));
      return {
        subjectName: subName,
        systemName: sysMatch?.name || m.title || 'General Unit',
        ruleText: m.keyTakeaway,
        errorType: m.errorType,
        tags: m.tags || [],
        isVolatile: !!m.isVolatile,
        source: m.source,
      };
    });

  // Aggregate recent test scores
  const recentScores: ScoreSummary[] = rawScores.slice(0, 5).map(s => {
    const total = s.totalMarks || (s.maxScore ? s.maxScore : 200);
    const scoreVal = s.score;
    const pct = total > 0 ? Math.round((scoreVal / total) * 100) : 0;
    const weakList: string[] = [];
    if (s.weakAreas) {
      if (Array.isArray(s.weakAreas)) {
        weakList.push(...s.weakAreas);
      } else if (typeof s.weakAreas === 'string') {
        weakList.push(...s.weakAreas.split(',').map(w => w.trim()).filter(Boolean));
      }
    }
    return {
      testName: s.testName || s.examName || s.testType || 'Mock Grand Test',
      score: scoreVal,
      totalMarks: total,
      percent: pct,
      date: s.timestamp ? new Date(s.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      weakAreas: weakList,
    };
  });

  // Target date & countdown
  const targetDate = rawOpMode?.targetDate || examProfile.targetExamDate || null;
  const daysRemaining = calculateDaysRemaining(targetDate);

  // Today study minutes
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayEntries = rawHistory.filter(h => new Date(h.completedAt).getTime() >= startOfDay.getTime());
  const todayLoggedMinutes = todayEntries.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

  // Streak calculation
  const dates = new Set(rawHistory.map(entry => {
    const d = new Date(entry.completedAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }));
  let timeToCheck = startOfDay.getTime();
  if (!dates.has(timeToCheck)) {
    timeToCheck -= 86400000;
  }
  let streakDays = 0;
  while (dates.has(timeToCheck)) {
    streakDays++;
    timeToCheck -= 86400000;
  }

  // Circadian State
  const currentHour = new Date().getHours();
  const isPeakStudyWindow = (currentHour >= 9 && currentHour <= 13) || (currentHour >= 15 && currentHour <= 19);
  let pacingStatus: 'FRESH' | 'OPTIMAL' | 'FATIGUE_RISK' | 'RECOVERY_WINDOW' = 'OPTIMAL';
  if (currentHour >= 23 || currentHour < 5 || todayLoggedMinutes >= 420) {
    pacingStatus = 'FATIGUE_RISK';
  } else if (todayLoggedMinutes === 0 && (currentHour >= 6 && currentHour <= 10)) {
    pacingStatus = 'FRESH';
  } else if (todayLoggedMinutes >= 240 && isPeakStudyWindow) {
    pacingStatus = 'RECOVERY_WINDOW';
  }

  return {
    generatedAt: new Date().toISOString(),
    exam: {
      targetExam: examProfile.targetExam || 'NEET PG',
      targetExamDate: targetDate,
      daysRemaining,
      operationalMode: rawOpMode?.mode || 'standard',
      dailyCapacityMinutes: rawOpMode?.dailyCapacityMinutes || 180,
      currentStreakDays: streakDays,
      todayLoggedMinutes,
    },
    curriculum: {
      totalSubjects: rawSubjects.length || 19,
      totalUnits,
      completedUnits,
      overallProgressPercent,
      subjectBreakdown: subjectSummaries,
    },
    urgentDecayQueue: topDueUnits,
    notebookPearls: {
      totalCount: unresolvedMistakes.length,
      volatileCount: volatileMistakes.length,
      recentPearls,
    },
    recentScores,
    diagnosticProfile,
    circadianPacing: {
      isPeakStudyWindow,
      status: pacingStatus,
    },
  };
}

/**
 * Minifies the LiveAtlasContext into a high-density, token-efficient system instruction block.
 */
export function formatContextForSystemPrompt(ctx: LiveAtlasContext, isRoutine = false): string {
  if (isRoutine) {
    return `[ATLAS CONTEXT] Exam: ${ctx.exam.targetExam} (${ctx.exam.daysRemaining !== null ? ctx.exam.daysRemaining + 'd' : 'Unset'}) | Streak: ${ctx.exam.currentStreakDays}d | Today: ${ctx.exam.todayLoggedMinutes}m`;
  }

  const lines: string[] = [];

  lines.push(`[ATLAS 360° GRAPH] Exam: ${ctx.exam.targetExam} (${ctx.exam.daysRemaining !== null ? ctx.exam.daysRemaining + 'd' : 'Unset'}) | Mode: ${ctx.exam.operationalMode} | Streak: ${ctx.exam.currentStreakDays}d | Today: ${ctx.exam.todayLoggedMinutes}m | Overall: ${ctx.curriculum.overallProgressPercent}% | Pacing: ${ctx.circadianPacing.status}`);

  // Top 3 Decaying & High Friction Subjects
  const decayingSubs = ctx.curriculum.subjectBreakdown
    .filter((s) => s.retrievabilityScore < 80 || s.activeMistakesCount > 0)
    .slice(0, 3);
  if (decayingSubs.length > 0) {
    lines.push(
      `Decaying Subjects: ` +
        decayingSubs
          .map((s) => `${s.name} (${s.retrievabilityScore}% retrievable, ${s.activeMistakesCount} active traps)`)
          .join('; ')
    );
  }

  // Top 3 Due / Urgent Decay Units
  if (ctx.urgentDecayQueue.length > 0) {
    lines.push(
      `Urgent Review Due: ` +
        ctx.urgentDecayQueue
          .slice(0, 3)
          .map((d) => `[${d.subjectName}] ${d.systemName} (${d.retrievability}%, ${d.daysOverdue}d overdue)`)
          .join('; ')
    );
  }

  // Top 3 20th Notebook Volatile Rules & Traps
  if (ctx.notebookPearls.recentPearls.length > 0) {
    lines.push(
      `Recent 20th NB Traps: ` +
        ctx.notebookPearls.recentPearls
          .slice(0, 3)
          .map((p) => `[${p.subjectName}] ${p.ruleText}`)
          .join(' | ')
    );
  }

  // Latest Test Score
  if (ctx.recentScores.length > 0) {
    const latest = ctx.recentScores[0];
    lines.push(
      `Latest Test: ${latest.testName} (${latest.score}/${latest.totalMarks}, ${latest.percent}%)${
        latest.weakAreas.length > 0 ? ' Weak: ' + latest.weakAreas.slice(0, 3).join(', ') : ''
      }`
    );
  }

  return lines.join('\n');
}

/**
 * Convenience helper to get the fully serialized system prompt context string directly.
 */
export async function getSerializedSystemPromptContext(isRoutine = false): Promise<string> {
  try {
    const settings = getAISettings();
    const ctx = await getLiveAtlasContext();
    const formatted = formatContextForSystemPrompt(ctx, isRoutine);
    return buildAtlasMentorSystemPrompt(formatted, isRoutine, settings.mentorshipStyle, settings.clinicalDepth);
  } catch (err) {
    console.error('[ContextPackager] Error packaging context:', err);
    return buildAtlasMentorSystemPrompt('ATLAS STATE: Default Offline Mode', isRoutine);
  }
}

export const packageAtlasContext = getSerializedSystemPromptContext;
