
import { db } from '@/db';
import { calculateBlockMemoryLoss, getTopicMemoryLoss, getInitialInterval, isSoftRecalibrating, calculateKnapsackPriority } from '@/db';
import { ALL_SUBJECTS, ALL_SYSTEMS } from '@/data/ontology';
import { getSubjectWeightageInfo, getYearMultiplier } from '@/lib/recommendation-engine';
import { getLocalExamProfile } from '@/lib/examProfile';
import { isSubjectInProfScope, getAllowedSubjectsForProfile } from '@/lib/curriculumScope';
import { CurriculumSet, StudySystem, ScoreLog, TopicProgress, MistakeLog, OperationalModeRecord, DEFAULT_OPERATIONAL_MODE, HistoryEntry } from '@/db/types';
import { getDaysSinceLastStudy } from '@/db/queries';
import { calculateSubjectFriction, SUBJECT_METRICS_PROFILE } from '@/lib/ai/frictionEngine';

export type RecommendationArchetype = 
  | 'tactical_strike' 
  | 'clinical_duty' 
  | 'remediation_clinic' 
  | 'flow_momentum' 
  | 'soft_recalibration' 
  | 'tactical_sprint' 
  | 'zenith' 
  | 'holiday';

export type SessionBudget = 'quick' | 'standard' | 'deep';

export interface RationaleBadge {
  label: string;
  variant: 'amber' | 'emerald' | 'destructive' | 'primary' | 'muted';
  iconType?: 'clock' | 'target' | 'alert' | 'zap' | 'book';
}

export interface AlgorithmWhyBreakdown {
  priorityScore: number;
  subjectName: string;
  examWeightage: number;
  retrievabilityPercent: number;
  memoryDecayPercent: number;
  activeMistakes: number;
  weakTopicsCount: number;
  revisionPass: number;
  depthLabel: string;
  estimatedMinutes?: number;
  circadianAffinity: string;
  formulaString: string;
  rationaleNarrative: string;
  budgetInfluence?: string;
}

export interface NextActionRecommendation {
  id: string;
  type: 'curriculumSet' | 'system' | 'spotDrill';
  title: string;
  subjectName: string;
  systemName: string;
  subjectId: number;
  systemId: number;
  curriculumSetId?: string;
  depth: 'rapid' | 'standard' | 'deep';
  isLengthy: boolean;
  isQuickEligible: boolean;
  estimatedMinutes?: number;
  priorityScore: number;
  archetype: RecommendationArchetype;
  rationaleBadges: RationaleBadge[];
  whyBreakdown: AlgorithmWhyBreakdown;
  topicCount?: number;
  weakCount?: number;
  mistakeCount?: number;
  inferredScore?: number;
  daysOverdue?: number;
  isAgingPin?: boolean;
  wasPinned?: boolean;
  revisionCount?: number;
  statusText: string;
  isMicroSliced?: boolean;
  priorityOverrideNotice?: string;
}

export interface SubjectInitiationOption {
  subjectId: number | string;
  subjectName: string;
  phase: string;
  weight: number;
  tag: string;
  systemCount: number;
  estimatedHours: number;
  reason: string;
  rationaleType: 'exact_year' | 'high_yield_core' | 'foundational_rapid' | 'clinical_pillar';
  firstSystemId?: number | string;
  firstSystemName?: string;
}

export interface NextActionEngineResult {
  primary: NextActionRecommendation | null;
  fallback: NextActionRecommendation | null;
  upcomingQueue?: NextActionRecommendation[];
  sessionBudget: SessionBudget;
  totalCandidatesEvaluated: number;
  quickEligibleCount: number;
  isTriageMode: boolean;
  isFreshState: boolean;
  hasAnyCurriculumSets: boolean;
  hasPendingSyllabus: boolean;
  operationalMode: OperationalModeRecord;
  circadianPeriod: 'morning' | 'midday' | 'evening';
  circadianLabel: string;
  sessionsCompletedToday: number;
  minutesStudiedToday: number;
  suggestedStarterSubjects?: SubjectInitiationOption[];
  recalibrationStatus?: {
    active: boolean;
    daysRemaining: number;
    progressRatio: number;
  };
  activeSprintSummary?: {
    subjectNames: string[];
    targetDate: string | null;
  };
}

export interface EngineOptions {
  sessionBudget?: SessionBudget;
  skipIds?: string[];
  targetExam?: string;
  operationalMode?: OperationalModeRecord;
}

export interface DurationCalculationParams {
  topicCount: number;
  weakCount: number;
  mistakeCount: number;
  revisionPassCount: number;
  isSystemLengthy: boolean;
  isBlockLengthy?: boolean;
  paceMultiplier?: number;
  adaptiveSkipMultiplier?: number;
}

/**
 * State-of-the-art multi-factor dynamic duration estimation with user pacing feedback loop.
 */
export function calculateEstimatedDurationMinutes(params: DurationCalculationParams): number {
  const {
    topicCount,
    weakCount,
    mistakeCount,
    revisionPassCount,
    isSystemLengthy,
    isBlockLengthy = false,
    paceMultiplier = 1.0,
    adaptiveSkipMultiplier = 1.0
  } = params;

  const baseTime = 3;
  const effectiveTopics = Math.max(1, topicCount || 1);
  const topicTime = effectiveTopics * 4;

  const weakPenalty = (weakCount || 0) * 3;
  const mistakePenalty = (mistakeCount || 0) * 1.5;

  let passMultiplier = 1.0;
  if (revisionPassCount === 0) passMultiplier = 1.5;      // First-pass acquisition / learning
  else if (revisionPassCount === 1) passMultiplier = 1.0; // Initial consolidation
  else if (revisionPassCount === 2) passMultiplier = 0.7; // Active recall
  else passMultiplier = 0.45;                             // High-speed refresh (Pass 3+)

  const isLengthyOverall = Boolean(isSystemLengthy || isBlockLengthy);
  const lengthyMultiplier = isLengthyOverall ? 1.6 : 1.0;
  const effectivePace = Math.max(0.5, Math.min(2.5, (paceMultiplier || 1.0) * (adaptiveSkipMultiplier || 1.0)));

  const rawMinutes = (baseTime + topicTime + weakPenalty + mistakePenalty) * passMultiplier * lengthyMultiplier * effectivePace;

  return Math.max(8, Math.min(120, Math.round(rawMinutes)));
}

/**
 * Evaluates current time of day for circadian learning affinity.
 */
export function getCircadianContext(now: Date = new Date()): {
  period: 'morning' | 'midday' | 'evening';
  label: string;
} {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) {
    return { period: 'morning', label: 'Morning Prime Cortex • High Synthesis' };
  } else if (hour >= 12 && hour < 18) {
    return { period: 'midday', label: 'Midday Active Recall • Clinical Vignettes' };
  } else {
    return { period: 'evening', label: 'Evening Volatiles • High-Speed Refresh' };
  }
}

export async function getNextActionRecommendation(
  options: EngineOptions = {}
): Promise<NextActionEngineResult> {
  const localSkipIds = new Set(options.skipIds || []);
  const targetExam = options.targetExam || 'NEET PG';
  const now = new Date();

  // Circadian evaluation
  const circadian = getCircadianContext(now);

  // 1. Fetch active Operational Mode
  const operationalMode = options.operationalMode || (await db.operationalModes.get('current')) || DEFAULT_OPERATIONAL_MODE;
  const mode = operationalMode.mode || 'standard';
  const isTacticalSprint = mode === 'tactical_sprint';
  const isClinicalDuty = mode === 'clinical_duty';
  const isFinalLap = mode === 'final_lap';
  const isHoliday = mode === 'holiday';

  // 2. Fetch history for today to detect momentum & daily volume
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const historyEntries: HistoryEntry[] = await db.history.filter(h => !h.deletedAt).toArray();
  const todayHistory = historyEntries.filter(h => new Date(h.completedAt).getTime() >= todayStart.getTime());
  const sessionsCompletedToday = todayHistory.length;
  const minutesStudiedToday = todayHistory.reduce((acc, h) => acc + (h.durationMinutes || 20), 0);

  if (isHoliday) {
    return {
      hasAnyCurriculumSets: true,
      hasPendingSyllabus: false,
      primary: null,
      fallback: null,
      sessionBudget: 'quick',
      totalCandidatesEvaluated: 0,
      quickEligibleCount: 0,
      isTriageMode: false,
      isFreshState: false,
      operationalMode,
      circadianPeriod: circadian.period,
      circadianLabel: circadian.label,
      sessionsCompletedToday,
      minutesStudiedToday,
      recalibrationStatus: undefined,
      activeSprintSummary: undefined
    };
  }

  // In Clinical Duty mode, force quick session budget and cap to 30 min micro-doses
  const sessionBudget: SessionBudget = isClinicalDuty ? 'quick' : (options.sessionBudget || 'quick');

  // Recalibration status check
  const recalibrationStatus = isSoftRecalibrating(operationalMode, now);

  // 3. Fetch persistent skips & parse adaptive pacing feedback
  const persistentSkips = await db.recommendationSkips.filter(s => {
    if (!s.expiresAt) return false;
    const expTime = new Date(s.expiresAt).getTime();
    return !isNaN(expTime) && expTime > now.getTime();
  }).toArray();
  const adaptiveFeedbackMultipliers = new Map<string, number>();

  for (const s of persistentSkips) {
    if (s.reason === 'needs_deep_work') {
      adaptiveFeedbackMultipliers.set(s.targetId, 1.5);
      if (sessionBudget === 'quick') {
        localSkipIds.add(s.targetId);
      }
    } else if (s.reason === 'fast_recall') {
      adaptiveFeedbackMultipliers.set(s.targetId, 0.75);
    } else {
      localSkipIds.add(s.targetId);
      if (s.reason === 'too_difficult') {
        adaptiveFeedbackMultipliers.set(s.targetId, 1.35);
      }
    }
  }

  // 4. Triage Mode Check (only outside soft recalibration)
  const daysSinceLastStudy = await getDaysSinceLastStudy();
  const isTriageMode = daysSinceLastStudy > 3 && !recalibrationStatus.active && !isClinicalDuty;

  const allDbSubjects = await db.subjects.filter(s => !s.deletedAt).toArray();
  const profile = getLocalExamProfile();
  const activeExam = targetExam || profile.targetExam;
  const activeYear = profile.currentYear || 'Final MBBS';

  // Apply strict MBBS Professional Exam filter if active
  const isMBBSProf = true; // Use global AcademicPhases filter for all exams
  
  let subjects = isMBBSProf 
    ? allDbSubjects.filter(s => isSubjectInProfScope(s.name, activeExam, activeYear))
    : [...allDbSubjects];
  
  let systems = await db.systems.filter(s => !s.deletedAt).toArray();
  
  const setTable = db.curriculumSets || db.revisionSets;
  let curriculumSets: CurriculumSet[] = setTable 
    ? await setTable.filter(s => !s.deletedAt).toArray() 
    : [];

  if (isMBBSProf) {
    const profSubjectIds = new Set(subjects.map(s => String(s.id)));
    systems = systems.filter(sys => profSubjectIds.has(String(sys.subjectId)));
    curriculumSets = curriculumSets.filter(set => profSubjectIds.has(String(set.subjectId)));
  }

  const sprintSubjectIds = new Set((operationalMode.targetSubjectIds || []).map(String));

  // ── Tactical Sprint Filter: strictly isolate sprint subjects ───────────────
  if (isTacticalSprint && sprintSubjectIds.size > 0) {
    subjects = subjects.filter(s => {
      if (sprintSubjectIds.has(String(s.id))) return true;
      if (s.ontologySubjectId && sprintSubjectIds.has(String(s.ontologySubjectId))) return true;
      const matchesTarget = operationalMode.targetSubjectIds?.some(tid => {
        const onto = ALL_SUBJECTS.find(os => String(os.id) === String(tid));
        return onto && s.name && onto.name.toLowerCase() === s.name.toLowerCase();
      });
      return Boolean(matchesTarget);
    });

    const activeDbSubjectIds = new Set(subjects.map(s => String(s.id)));
    systems = systems.filter(sys => activeDbSubjectIds.has(String(sys.subjectId)));
    curriculumSets = curriculumSets.filter(set => activeDbSubjectIds.has(String(set.subjectId)));
  }
    
  const topicProgresses: TopicProgress[] = await db.topicProgress.toArray();
  let activeMistakes: MistakeLog[] = await db.mistakeLogs.filter(m => !m.deletedAt && !m.resolved).toArray();
  
  if (isTacticalSprint && sprintSubjectIds.size > 0) {
    const activeDbSubjectIds = new Set(subjects.map(s => String(s.id)));
    activeMistakes = activeMistakes.filter(m => m.subjectId && (sprintSubjectIds.has(String(m.subjectId)) || activeDbSubjectIds.has(String(m.subjectId))));
  }

  const weakTopicMap = new Set(
    topicProgresses.filter(tp => tp.isWeak).map(tp => tp.topicId)
  );

  // Map mistakes by curriculumSetId and systemId
  const mistakesBySetId = new Map<string, number>();
  const mistakesBySystemId = new Map<number, number>();
  for (const m of activeMistakes) {
    if (m.curriculumSetId) {
      mistakesBySetId.set(m.curriculumSetId, (mistakesBySetId.get(m.curriculumSetId) || 0) + 1);
    }
    if (m.systemId) {
      mistakesBySystemId.set(m.systemId, (mistakesBySystemId.get(m.systemId) || 0) + 1);
    }
  }

  // 4b. Compute real-time Subject Friction & Memory Decay metrics across all subjects
  const subjectFrictionMap = new Map<string, ReturnType<typeof calculateSubjectFriction>>();
  for (const s of allDbSubjects) {
    const subId = s.id !== undefined ? s.id : s.name;
    const friction = calculateSubjectFriction(s.name, subId, activeMistakes, historyEntries, curriculumSets);
    subjectFrictionMap.set(s.name, friction);
  }

  const subjectMap = new Map<number, string>(subjects.map(s => [s.id!, s.name]));
  const systemMap = new Map<number, StudySystem>(systems.map(sys => [sys.id!, sys]));

  const rawCandidates: NextActionRecommendation[] = [];
  const systemsWithSets = new Set<number>();

  // 5. Process Study Blocks (Primary Scheduling Entity)
  for (const set of curriculumSets) {
    if (!set.id) continue;
    const candidateId = `set:${set.id}`;
    
    const parentSystem = systemMap.get(set.systemId);
    if (parentSystem) {
      systemsWithSets.add(parentSystem.id!);
    }
    
    if (localSkipIds.has(candidateId)) continue;
    
    const subjectName = subjectMap.get(set.subjectId as number) || 
       ALL_SUBJECTS.find(s => String(s.id) === String(set.subjectId))?.name || 'Medical Subject';
    const systemName = parentSystem?.name || 'System';
    
    const topicCount = Array.isArray(set.topicIds) ? set.topicIds.length : 0;
    const weakTopicsInSet = (set.topicIds || []).filter(tid => weakTopicMap.has(tid)).length;
    const activeMistakesInSet = (set.id ? mistakesBySetId.get(set.id) : 0) || 0;
    
    const yieldInfo = getSubjectWeightageInfo(subjectName, targetExam);
    const yieldWeight = yieldInfo.weight || 70;
    
    const setDepth: 'rapid' | 'standard' | 'deep' = set.depth || (set.isLengthy ? 'deep' : ((set.topicIds && set.topicIds.length <= 3) ? 'rapid' : 'standard'));
    const isLengthy = setDepth === 'deep' || Boolean(set.isLengthy);
    // Strict rapid qualification: explicitly marked rapid OR compact (<= 3 topics)
    const isQuickEligible = setDepth === 'rapid' || (topicCount <= 3 && setDepth !== 'deep');
    
    let daysOverdue = 0;
    let isOverdue = false;
    let isDueToday = false;
    
    if (set.nextRevisionDate) {
      const revDate = new Date(set.nextRevisionDate);
      const diffMs = now.getTime() - revDate.getTime();
      const diffDays = diffMs / (1000 * 3600 * 24);
      if (diffDays >= 1) {
        isOverdue = true;
        daysOverdue = Math.floor(diffDays);
      } else if (diffDays >= -0.5) {
        isDueToday = true;
      }
    }
    
    // Only use true revision date for recency calculation (never set.updatedAt, which changes on edits)
    const hasStudiedBefore = Boolean(set.lastRevisionDate);
    const lastDate = set.lastRevisionDate ? new Date(set.lastRevisionDate) : null;
    const stability = set.currentRevisionInterval && set.currentRevisionInterval > 0 
      ? set.currentRevisionInterval 
      : getInitialInterval('Average');
    const baseDecayFactor = parentSystem && typeof parentSystem.decayFactor === 'number' && parentSystem.decayFactor > 0 
      ? parentSystem.decayFactor 
      : 1.0;
    
    const daysSinceLastRev = lastDate ? Math.max(0, (now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)) : Infinity;
    
    let topicMemoryLosses: number[] = [];
    if (lastDate && Array.isArray(set.topicIds) && set.topicIds.length > 0) {
      topicMemoryLosses = set.topicIds.map(tid => {
        const isWeak = weakTopicMap.has(tid);
        return getTopicMemoryLoss(lastDate, stability, isWeak, baseDecayFactor, now);
      });
    }
    
    let baseMemoryLoss = topicMemoryLosses.length > 0 ? calculateBlockMemoryLoss(topicMemoryLosses) : 0;
    
    // If block is overdue, ensure memory loss accurately reflects elapsed revision debt
    if (isOverdue && baseMemoryLoss < 40) {
      baseMemoryLoss = Math.min(100, Math.round(50 + daysOverdue * 3.5));
    } else if (isDueToday && baseMemoryLoss < 25) {
      baseMemoryLoss = 30;
    }
    
    const yieldModifier = yieldWeight >= 85 ? 1.2 : (yieldWeight <= 40 ? 0.8 : 1.0);
    
    let actionIndex = 0;

    if (hasStudiedBefore) {
      actionIndex = Math.min(100, Math.round(baseMemoryLoss * yieldModifier));
      if (isOverdue) {
        actionIndex += Math.min(30, daysOverdue * 2.5);
      } else if (isDueToday) {
        actionIndex += 15;
      }
    } else {
      // First-Pass Acquisition: Unstudied block prioritised by high-yield subject weightage
      const baseAcquisitionScore = Math.round(yieldWeight * 0.85); // 60-85 for high-yield NEET PG / MBBS
      actionIndex = baseAcquisitionScore;
      if (isOverdue) {
        actionIndex += Math.min(30, daysOverdue * 2.5);
      } else if (isDueToday) {
        actionIndex += 15;
      }
    }

    // Weak topics boost
    if (weakTopicsInSet > 0) {
      actionIndex += Math.min(20, weakTopicsInSet * 5);
    }

    // ── Subject Memory Decay & Friction Boost ────────────────────────────────
    const subFriction = subjectFrictionMap.get(subjectName);
    if (subFriction && !isTacticalSprint) {
      if (subFriction.decayUrgency === 'CRITICAL') {
        actionIndex += Math.min(50, Math.round(subFriction.frictionScore * 0.7));
      } else if (subFriction.decayUrgency === 'ELEVATED') {
        actionIndex += Math.min(25, Math.round(subFriction.frictionScore * 0.4));
      }
    }

    // ── Soft Recalibration Knapsack Scoring ─────────────────────────────────
    if (recalibrationStatus.active) {
      const knapsackScore = calculateKnapsackPriority({
        subjectWeight: 100,
        yieldWeight,
        memoryLoss: Math.max(baseMemoryLoss, !hasStudiedBefore ? 60 : 0),
        estimatedMinutes: setDepth === 'rapid' ? 15 : setDepth === 'deep' ? 45 : 30,
        mistakeBonus: activeMistakesInSet * 8
      });
      actionIndex = Math.min(100, Math.round(knapsackScore * 2.5));
    } else {
      if (activeMistakesInSet > 0) {
        actionIndex += Math.min(25, activeMistakesInSet * 5);
      }
    }
    
    // Recent exposure suppression (last 18 hours) - only if actually studied in the last 18 hours
    if (hasStudiedBefore && daysSinceLastRev < 0.75) {
      actionIndex = 0;
    }
    
    let isPinned = false;
    let isAgingPin = false;
    let wasPinned = false;
    
    if (set.focus === 'primary') {
      const pinDate = set.focusUpdatedAt ? new Date(set.focusUpdatedAt) : now;
      const hoursSincePin = (now.getTime() - pinDate.getTime()) / (1000 * 3600);
      
      if (hoursSincePin > 168) {
        wasPinned = true;
      } else {
        isPinned = true;
        actionIndex += 1000; // Force position #1
        if (hoursSincePin >= 48) {
          isAgingPin = true;
        }
      }
    }
    
    // Triage Mode Filter:
    // When student returns after >3 days, prioritize urgent/overdue items and mistakes
    if (isTriageMode && !isPinned) {
      if (isOverdue || isDueToday || activeMistakesInSet > 0) {
        actionIndex = Math.max(actionIndex, 82); // Elevate to triage priority
      } else if (actionIndex < 60) {
        // Filter out non-urgent, non-overdue future items
        continue;
      }
    }

    const revisionCount = set.revisionCount || 0;

    // Determine Archetype
    let archetype: RecommendationArchetype = 'tactical_strike';
    if (isTacticalSprint) {
      archetype = 'tactical_sprint';
    } else if (isClinicalDuty) {
      archetype = 'clinical_duty';
    } else if (recalibrationStatus.active) {
      archetype = 'soft_recalibration';
    } else if (activeMistakesInSet >= 2 || (weakTopicsInSet >= 2 && baseMemoryLoss > 60)) {
      archetype = 'remediation_clinic';
    } else if (sessionsCompletedToday >= 1) {
      archetype = 'flow_momentum';
    } else {
      archetype = 'tactical_strike';
    }
    
    // Build Rationale Badges
    const badges: RationaleBadge[] = [];

    if (archetype === 'tactical_sprint') {
      badges.push({ label: '🎯 Sprint Target', variant: 'primary', iconType: 'target' });
    } else if (archetype === 'clinical_duty') {
      badges.push({ label: '🌙 Duty Micro-Dose', variant: 'emerald', iconType: 'zap' });
    } else if (archetype === 'remediation_clinic') {
      badges.push({ label: `⚠️ Diagnostic Gap (${activeMistakesInSet} Mistakes)`, variant: 'destructive', iconType: 'alert' });
    } else if (archetype === 'flow_momentum') {
      badges.push({ label: `🔥 Momentum (${sessionsCompletedToday} done)`, variant: 'primary', iconType: 'zap' });
    }

    if (recalibrationStatus.active && isOverdue) {
      badges.push({ label: '⚡ Recalibration Step', variant: 'primary', iconType: 'zap' });
    } else if (isTriageMode && (isOverdue || isDueToday || activeMistakesInSet > 0) && !isPinned) {
      badges.push({ label: '🚨 Triage Priority', variant: 'destructive', iconType: 'alert' });
    } else if (isOverdue) {
      badges.push({ label: `⚡ Overdue (${daysOverdue}d)`, variant: 'amber', iconType: 'clock' });
    } else if (isDueToday) {
      badges.push({ label: '🕒 Due Today', variant: 'amber', iconType: 'clock' });
    } else if (!hasStudiedBefore) {
      badges.push({ label: '📖 First-Pass Intake', variant: 'primary', iconType: 'target' });
    }
    
    if (yieldWeight >= 85 && !isTacticalSprint) {
      badges.push({ label: '🎯 High Yield (90%+)', variant: 'primary', iconType: 'target' });
    }
    
    const isBlockWeak = weakTopicsInSet > 0 || (topicMemoryLosses.length > 0 && topicMemoryLosses.some(loss => loss > 80));
    if (isBlockWeak && archetype !== 'remediation_clinic') {
      badges.push({ 
        label: weakTopicsInSet > 1 ? `⚠️ ${weakTopicsInSet} Weak Topics` : '⚠️ Weak Area', 
        variant: 'destructive', 
        iconType: 'alert' 
      });
    }

    if (activeMistakesInSet > 0 && archetype !== 'remediation_clinic') {
      badges.push({
        label: `⚠️ ${activeMistakesInSet} Mistake${activeMistakesInSet > 1 ? 's' : ''}`,
        variant: 'destructive',
        iconType: 'alert'
      });
    }
    
    let statusText = '';
    if (isTacticalSprint) {
      statusText = isOverdue
        ? `${daysOverdue}d overdue • Sprint Pass #${revisionCount + 1}`
        : isDueToday
        ? `Due today • Sprint Pass #${revisionCount + 1}`
        : `Sprint Focus • Pass #${revisionCount + 1} (Retention ~${Math.round(100 - baseMemoryLoss)}%)`;
    } else if (recalibrationStatus.active && isOverdue) {
      statusText = `Smoothing Quota (Day ${Math.max(1, 10 - recalibrationStatus.daysRemaining)}/10)`;
    } else if (archetype === 'remediation_clinic') {
      statusText = `${activeMistakesInSet} unresolved clinical errors • High-friction zone`;
    } else if (isOverdue) {
      statusText = `${daysOverdue} days overdue (Pass #${revisionCount + 1})`;
    } else if (isDueToday) {
      statusText = `Due today (Pass #${revisionCount + 1})`;
    } else if (!hasStudiedBefore) {
      statusText = `First-Pass Intake • High-Yield ${subjectName}`;
    } else {
      statusText = `Pass #${revisionCount + 1} scheduled • Retention ~${Math.round(100 - baseMemoryLoss)}%`;
    }

    // Build Transparent Algorithmic "Why" Breakdown
    const retrievabilityPercent = hasStudiedBefore 
      ? Math.max(10, Math.min(100, Math.round(100 - baseMemoryLoss))) 
      : 100;
    const memoryDecayPercent = hasStudiedBefore ? Math.round(baseMemoryLoss) : 0;

    const formulaString = recalibrationStatus.active
      ? `Priority (${actionIndex}) = [Yield (${yieldWeight}%) × Decay (${memoryDecayPercent}%)] + [Mistakes (${activeMistakesInSet}) × 5] [Knapsack Pacing]`
      : !hasStudiedBefore
      ? `Priority (${actionIndex}) = [First-Pass Intake] × High-Yield (${yieldWeight}%)`
      : `Priority (${actionIndex}) = [Yield (${yieldWeight}%) × Decay (${memoryDecayPercent}%)] + [Mistakes (${activeMistakesInSet}) × 5]${isOverdue ? ` + Overdue (${daysOverdue}d)` : ''}`;

    const depthLabel = setDepth === 'rapid' ? 'Rapid Recall' : setDepth === 'deep' ? 'Deep Focus' : 'Standard Review';

    const rationaleNarrative = archetype === 'remediation_clinic'
      ? `High diagnostic friction detected. You have ${activeMistakesInSet} unresolved mistake(s) and retention has fallen to ${retrievabilityPercent}%. Immediate active remediation recommended to reinforce neural pathways.`
      : archetype === 'clinical_duty'
      ? `Calibrated for hospital ward duty: rapid recall action targeting volatile high-yield concepts.`
      : archetype === 'soft_recalibration'
      ? `Paced via Knapsack decay redistribution to clear accumulated memory decay smoothly without debt anxiety.`
      : !hasStudiedBefore
      ? `Targeted for First-Pass foundational intake. High exam weightage (${yieldWeight}%) in ${subjectName}. Completing this initializes spaced repetition scheduling.`
      : isOverdue
      ? `Critical spaced repetition step overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}. Memory decay is calculated at ${memoryDecayPercent}% based on Ebbinghaus forgetting curves. Immediate active recall required to stabilize memory retention.`
      : `Targeted for Pass #${revisionCount + 1}. Retention is calculated at ${retrievabilityPercent}% based on Ebbinghaus decay curves and high exam weightage (${yieldWeight}%).`;

    const whyBreakdown: AlgorithmWhyBreakdown = {
      priorityScore: actionIndex,
      subjectName,
      examWeightage: yieldWeight,
      retrievabilityPercent,
      memoryDecayPercent,
      activeMistakes: activeMistakesInSet,
      weakTopicsCount: weakTopicsInSet,
      revisionPass: revisionCount + 1,
      depthLabel,
      circadianAffinity: circadian.label,
      formulaString,
      rationaleNarrative
    };
    
    rawCandidates.push({
      id: candidateId,
      type: 'curriculumSet',
      title: set.name,
      subjectName,
      systemName,
      subjectId: Number(set.subjectId),
      systemId: set.systemId,
      curriculumSetId: set.id,
      depth: setDepth,
      isLengthy,
      isQuickEligible,
      priorityScore: actionIndex,
      archetype,
      rationaleBadges: badges,
      whyBreakdown,
      topicCount,
      weakCount: weakTopicsInSet,
      mistakeCount: activeMistakesInSet,
      inferredScore: retrievabilityPercent,
      daysOverdue: isOverdue ? daysOverdue : 0,
      revisionCount,
      statusText,
      isAgingPin,
      wasPinned
    });
  }

  // 5b. Evaluate critically decaying subjects from Friction Engine if they don't have high-priority set candidates
  if (!isTacticalSprint) {
    for (const sub of subjects) {
      const subFriction = subjectFrictionMap.get(sub.name);
      if (subFriction && (subFriction.decayUrgency === 'CRITICAL' || subFriction.daysSinceReview >= 25)) {
        const alreadyHasHighCandidate = rawCandidates.some(c => c.subjectName.toLowerCase() === sub.name.toLowerCase() && c.priorityScore >= 80);
        if (!alreadyHasHighCandidate) {
          const subSystems = systems.filter(sys => String(sys.subjectId) === String(sub.id));
          const targetSys = subSystems.find(s => !s.contentCompleted) || subSystems[0];
          const sysId = targetSys?.id || (typeof sub.id === 'number' ? sub.id : 1);
          const sysName = targetSys?.name || subFriction.recommendedTopic || `${sub.name} Core`;
          
          const frictionScore = Math.min(130, Math.round(85 + subFriction.frictionScore * 0.75));
          const candidateId = `friction_drill:${sub.id}:${sysId}`;
          if (!localSkipIds.has(candidateId)) {
            rawCandidates.push({
              id: candidateId,
              type: 'spotDrill',
              title: `${sub.name} • High-Yield Core`,
              subjectName: sub.name,
              systemName: sysName,
              subjectId: Number(sub.id),
              systemId: Number(sysId),
              depth: 'rapid',
              isLengthy: false,
              isQuickEligible: true,
              priorityScore: frictionScore,
              archetype: subFriction.unresolvedMistakes > 0 ? 'remediation_clinic' : 'tactical_strike',
              rationaleBadges: [
                { label: '🔥 Critical Decay', variant: 'destructive', iconType: 'alert' },
                { label: `⚡ ${subFriction.daysSinceReview}d Unreviewed`, variant: 'amber', iconType: 'clock' }
              ],
              whyBreakdown: {
                priorityScore: frictionScore,
                subjectName: sub.name,
                examWeightage: subFriction.examWeightage,
                retrievabilityPercent: Math.max(10, Math.round(100 - (subFriction.daysSinceReview / (subFriction.subjectHalfLifeDays * 2)) * 100)),
                memoryDecayPercent: Math.min(95, Math.round((subFriction.daysSinceReview / subFriction.subjectHalfLifeDays) * 35)),
                activeMistakes: subFriction.unresolvedMistakes,
                weakTopicsCount: 0,
                revisionPass: 1,
                depthLabel: 'Rapid Recall',
                circadianAffinity: circadian.label,
                formulaString: `Friction Priority (${frictionScore}) = [Decay (${subFriction.daysSinceReview}d / Half-Life ${subFriction.subjectHalfLifeDays}d)] × Weight (${subFriction.examWeightage})`,
                rationaleNarrative: `${sub.name} has entered critical memory decay (${subFriction.daysSinceReview} days unreviewed). High-yield exam weightage (${subFriction.examWeightage}%) requires immediate rapid recall intervention.`
              },
              topicCount: 3,
              weakCount: 0,
              mistakeCount: subFriction.unresolvedMistakes,
              inferredScore: 30,
              daysOverdue: Math.max(0, subFriction.daysSinceReview - subFriction.subjectHalfLifeDays),
              revisionCount: 0,
              statusText: `${subFriction.daysSinceReview}d unreviewed • Critical Memory Decay`
            });
          }
        }
      }
    }
  }

  const totalCandidatesEvaluated = rawCandidates.length;

  // Rank all raw candidates by priorityScore descending
  rawCandidates.sort((a, b) => b.priorityScore - a.priorityScore);

  let filteredCandidates: NextActionRecommendation[] = [];

  if (sessionBudget === 'quick' || isClinicalDuty) {
    // Quick / Clinical budget: prioritize candidates with strict Rapid Recall intent or compact focus
    const rapidCandidates = rawCandidates.filter(c => c.depth === 'rapid' || c.isQuickEligible);
    
    if (rapidCandidates.length > 0) {
      filteredCandidates = rapidCandidates.map(c => ({
        ...c,
        whyBreakdown: {
          ...c.whyBreakdown,
          budgetInfluence: 'Filtered for Rapid Recall mode: matched short compact high-yield targets.'
        }
      }));
    } else if (rawCandidates.length > 0) {
      // Intelligent Spot Drill Slicing: Derive focused Rapid Recall Spot Drill from top candidate
      const topDeep = rawCandidates[0];
      const isTopOverdue = (topDeep.daysOverdue || 0) > 0;
      const overrideNotice = isTopOverdue
        ? `Serving #1 Overdue Priority: No dedicated Rapid blocks in queue. Sliced into a Spot Drill to clear urgent debt.`
        : `No dedicated Rapid blocks in queue. Sliced top candidate into a focused recall drill.`;

      const microSlicedPrimary: NextActionRecommendation = {
        ...topDeep,
        id: `${topDeep.id}:spot_drill`,
        type: 'spotDrill',
        title: `${topDeep.title} • Rapid Drill`,
        depth: 'rapid',
        isLengthy: false,
        isQuickEligible: true,
        isMicroSliced: true,
        priorityOverrideNotice: overrideNotice,
        statusText: isClinicalDuty 
          ? `Duty Micro-Dose • ${topDeep.subjectName}` 
          : `Rapid Drill • ${topDeep.statusText}`,
        rationaleBadges: [
          { label: isClinicalDuty ? '🌙 Clinical Micro-Dose' : '⚡ Rapid Drill', variant: 'amber', iconType: 'zap' },
          ...topDeep.rationaleBadges.filter(b => b.iconType !== 'clock')
        ],
        whyBreakdown: {
          ...topDeep.whyBreakdown,
          depthLabel: 'Rapid Recall',
          formulaString: `Spot drill derived from high-yield core block (${topDeep.title})`,
          budgetInfluence: `Rapid Recall mode active: converted top overdue candidate (${topDeep.title}) into an accelerated spot drill.`
        }
      };

      filteredCandidates = [microSlicedPrimary];

      if (rawCandidates.length > 1) {
        const secondDeep = rawCandidates[1];
        filteredCandidates.push({
          ...secondDeep,
          id: `${secondDeep.id}:spot_drill`,
          type: 'spotDrill',
          title: `${secondDeep.title} • Rapid Drill`,
          depth: 'rapid',
          isLengthy: false,
          isQuickEligible: true,
          isMicroSliced: true,
          statusText: isClinicalDuty 
            ? `Duty Micro-Dose • ${secondDeep.subjectName}` 
            : `Rapid Drill • ${secondDeep.statusText}`,
          rationaleBadges: [
            { label: isClinicalDuty ? '🌙 Clinical Micro-Dose' : '⚡ Rapid Drill', variant: 'amber', iconType: 'zap' },
            ...secondDeep.rationaleBadges.filter(b => b.iconType !== 'clock')
          ],
          whyBreakdown: {
            ...secondDeep.whyBreakdown,
            depthLabel: 'Rapid Recall',
            formulaString: `Spot drill derived from secondary candidate (${secondDeep.title})`,
            budgetInfluence: `Filtered for Rapid Recall mode.`
          }
        });
      }
    }
  } else if (sessionBudget === 'deep') {
    // Deep Focus budget: Prioritize deep focus blocks & comprehensive topics
    const deepCandidates = rawCandidates.filter(c => c.depth === 'deep' || c.isLengthy);

    if (deepCandidates.length > 0) {
      filteredCandidates = deepCandidates.map(c => ({
        ...c,
        whyBreakdown: {
          ...c.whyBreakdown,
          budgetInfluence: 'Deep Focus mode active: prioritized comprehensive multi-topic and lengthy organ systems.'
        }
      }));
    } else if (rawCandidates.length > 0) {
      // Fallback: Frame top candidate as Comprehensive Deep Review
      const topCand = rawCandidates[0];
      const isTopOverdue = (topCand.daysOverdue || 0) > 0;
      const overrideNotice = isTopOverdue
        ? `No dedicated Deep blocks in queue — Prioritizing urgent ${topCand.daysOverdue}d overdue debt for full comprehensive recall.`
        : `No dedicated Deep blocks in queue — Expanded top candidate into a comprehensive deep review session.`;

      const deepFramedPrimary: NextActionRecommendation = {
        ...topCand,
        depth: 'deep',
        isLengthy: true,
        priorityOverrideNotice: overrideNotice,
        statusText: `Deep Focus Review • ${topCand.statusText}`,
        rationaleBadges: [
          { label: '🔬 Deep Comprehensive Review', variant: 'primary', iconType: 'book' },
          ...topCand.rationaleBadges.filter(b => !b.label.includes('Standard') && b.iconType !== 'zap')
        ],
        whyBreakdown: {
          ...topCand.whyBreakdown,
          depthLabel: 'Deep Focus',
          budgetInfluence: `Deep Focus mode active: no native lengthy blocks in queue, expanding priority block (${topCand.title}) into full theory + Q-Bank review.`
        }
      };

      filteredCandidates = [deepFramedPrimary, ...rawCandidates.slice(1).map(c => ({
        ...c,
        whyBreakdown: {
          ...c.whyBreakdown,
          budgetInfluence: `Ranked within Deep Focus queue.`
        }
      }))];
    }
  } else {
    // Standard Review budget: Prioritize standard balanced sets and due systems
    const standardCandidates = rawCandidates.filter(c => c.depth === 'standard');

    if (standardCandidates.length > 0) {
      filteredCandidates = standardCandidates.map(c => ({
        ...c,
        whyBreakdown: {
          ...c.whyBreakdown,
          budgetInfluence: 'Standard mode active: calibrated for standard balanced review blocks.'
        }
      }));
    } else {
      filteredCandidates = rawCandidates.map(c => ({
        ...c,
        whyBreakdown: {
          ...c.whyBreakdown,
          budgetInfluence: 'Standard review queue prioritized by Ebbinghaus memory decay and NEET exam yield.'
        }
      }));
    }
  }

  // In Clinical Duty mode, cap total candidate presentation to 3 micro-actions
  if (isClinicalDuty) {
    filteredCandidates = filteredCandidates.slice(0, 3);
  }

  const quickEligibleCount = rawCandidates.filter(c => c.depth === 'rapid' || c.isQuickEligible).length;
  
  const primary = filteredCandidates[0] || null;
  const fallback = filteredCandidates[1] || (filteredCandidates.length > 1 ? filteredCandidates.find(c => c.id !== primary?.id) : null) || null;
  const upcomingQueue = filteredCandidates.slice(1, 5);

  const hasAnyCurriculumSets = curriculumSets.length > 0;
  const totalSyllabusSystemCount = ALL_SYSTEMS.length;
  const hasPendingSyllabus = systems.some(s => !s.contentCompleted) || systems.length < totalSyllabusSystemCount;

  // Compute active sprint summary if tactical sprint is active
  const activeSprintSummary = isTacticalSprint && operationalMode.targetSubjectIds && operationalMode.targetSubjectIds.length > 0
    ? {
        subjectNames: operationalMode.targetSubjectIds.map(id => {
          const dbSub = allDbSubjects.find(sub => String(sub.id) === String(id));
          if (dbSub) return dbSub.name;
          const ontoSub = ALL_SUBJECTS.find(sub => String(sub.id) === String(id));
          if (ontoSub) return ontoSub.name;
          const fuzzy = allDbSubjects.find(sub => sub.name && sub.name.toLowerCase().includes(String(id).toLowerCase()));
          return fuzzy ? fuzzy.name : null;
        }).filter(Boolean) as string[],
        targetDate: operationalMode.targetDate || null
      }
    : undefined;

  // Compute top 3 recommended starter subjects when queue has no active items or user needs new subject direction
  const eligibleStarterSubjects = isMBBSProf ? subjects : allDbSubjects;
  
  // Group systems and completion by subject
  const unstartedOrLowProgressSubjects: SubjectInitiationOption[] = [];

  for (const sub of eligibleStarterSubjects) {
    const subSystems = systems.filter(s => String(s.subjectId) === String(sub.id));
    const completedCount = subSystems.filter(s => s.contentCompleted).length;
    const isUnstarted = completedCount === 0;
    const isUnder25Percent = subSystems.length > 0 && (completedCount / subSystems.length) < 0.25;

    if (isUnstarted || isUnder25Percent) {
      const weightage = getSubjectWeightageInfo(sub.name, targetExam);
      const yearMultiplier = getYearMultiplier(weightage.phase, activeYear);
      const systemCount = subSystems.length || 6;
      const estimatedHours = Math.round(systemCount * 2.5);

      // Determine Rationale Type & Description
      let rationaleType: SubjectInitiationOption['rationaleType'] = 'high_yield_core';
      let reason = '';

      if (yearMultiplier >= 2.5) {
        rationaleType = 'exact_year';
        reason = `Directly aligned with your ${activeYear} syllabus (${weightage.tag})`;
      } else if (weightage.weight >= 90) {
        rationaleType = 'high_yield_core';
        reason = `High-yield exam pillar • ${weightage.tag}`;
      } else if (systemCount <= 5) {
        rationaleType = 'foundational_rapid';
        reason = `Compact high-scoring subject (${systemCount} systems • ~${estimatedHours}h complete)`;
      } else {
        rationaleType = 'clinical_pillar';
        reason = `${weightage.tag} • Core medical foundation`;
      }

      const initiationScore = (weightage.weight * 0.45) + (yearMultiplier * 30) + (isUnstarted ? 25 : 15);
      const firstSys = subSystems.find(s => !s.contentCompleted) || subSystems[0];

      unstartedOrLowProgressSubjects.push({
        subjectId: sub.id!,
        subjectName: sub.name,
        phase: weightage.phase,
        weight: Math.round(initiationScore),
        tag: weightage.tag,
        systemCount,
        estimatedHours,
        reason,
        rationaleType,
        firstSystemId: firstSys?.id,
        firstSystemName: firstSys?.name
      });
    }
  }

  // Sort by initiation score descending and take top 3
  let suggestedStarterSubjects = unstartedOrLowProgressSubjects
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  // Robust fallback: if all subjects have some progress, still provide top 3 subjects
  if (suggestedStarterSubjects.length === 0 && eligibleStarterSubjects.length > 0) {
    suggestedStarterSubjects = eligibleStarterSubjects
      .map(sub => {
        const subSystems = systems.filter(s => String(s.subjectId) === String(sub.id));
        const weightage = getSubjectWeightageInfo(sub.name, targetExam);
        const yearMultiplier = getYearMultiplier(weightage.phase, activeYear);
        const systemCount = subSystems.length || 6;
        const firstSys = subSystems.find(s => !s.contentCompleted) || subSystems[0];
        return {
          subjectId: sub.id!,
          subjectName: sub.name,
          phase: weightage.phase,
          weight: Math.round((weightage.weight * 0.45) + (yearMultiplier * 30)),
          tag: weightage.tag,
          systemCount,
          estimatedHours: Math.round(systemCount * 2.5),
          reason: `High-yield exam pillar • ${weightage.tag}`,
          rationaleType: 'high_yield_core' as const,
          firstSystemId: firstSys?.id,
          firstSystemName: firstSys?.name
        };
      })
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);
  }

  // Detect fresh user / no progress state (e.g. fresh onboarding or cleared progress)
  const isFreshState = historyEntries.length === 0 && 
    !systems.some(s => s.contentCompleted || (s.revisionPassCount && s.revisionPassCount > 0)) &&
    !curriculumSets.some(c => Boolean(c.lastRevisionDate) || (c.revisionCount && c.revisionCount > 0));

  return {
    hasAnyCurriculumSets,
    hasPendingSyllabus,
    primary,
    fallback,
    upcomingQueue,
    sessionBudget,
    totalCandidatesEvaluated,
    quickEligibleCount,
    isTriageMode,
    isFreshState,
    operationalMode,
    circadianPeriod: circadian.period,
    circadianLabel: circadian.label,
    sessionsCompletedToday,
    minutesStudiedToday,
    suggestedStarterSubjects,
    recalibrationStatus: recalibrationStatus.active ? recalibrationStatus : undefined,
    activeSprintSummary
  };
}

