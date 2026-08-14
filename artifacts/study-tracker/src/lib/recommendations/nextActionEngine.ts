
import { db } from '@/db';
import { calculateBlockMemoryLoss, getTopicMemoryLoss, getInitialInterval } from '@/db';
import { ALL_SUBJECTS, ALL_SYSTEMS } from '@/data/ontology';
import { getSubjectWeightageInfo } from '@/lib/recommendation-engine';
import { CurriculumSet, StudySystem, ScoreLog, TopicProgress, MistakeLog } from '@/db/types';
import { getDaysSinceLastStudy } from '@/db/queries';

export interface RationaleBadge {
  label: string;
  variant: 'amber' | 'emerald' | 'destructive' | 'primary' | 'muted';
  iconType?: 'clock' | 'target' | 'alert' | 'zap' | 'book';
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
  isLengthy: boolean;
  isQuickEligible: boolean;
  estimatedMinutes: number;
  priorityScore: number;
  rationaleBadges: RationaleBadge[];
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
}

export interface NextActionEngineResult {
  primary: NextActionRecommendation | null;
  fallback: NextActionRecommendation | null;
  sessionBudget: 'quick' | 'deep';
  totalCandidatesEvaluated: number;
  quickEligibleCount: number;
  isTriageMode: boolean;
  hasAnyCurriculumSets: boolean;
  hasPendingSyllabus: boolean;
}

export interface EngineOptions {
  sessionBudget?: 'quick' | 'deep';
  skipIds?: string[];
  targetExam?: string;
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
 *
 * 1. Base calibration overhead (3 min)
 * 2. Topic volume (4 min per topic)
 * 3. Cognitive retrieval load: weak topics (+3m each) and active mistake queue (+1.5m each)
 * 4. Pass velocity decay: Pass 0 (1.5x), Pass 1 (1.0x), Pass 2 (0.7x), Pass 3+ (0.45x)
 * 5. System/Block lengthy toggles (1.6x)
 * 6. Historical student pacing & feedback multipliers (0.5x - 2.5x)
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

export async function getNextActionRecommendation(
  options: EngineOptions = {}
): Promise<NextActionEngineResult> {
  const sessionBudget = options.sessionBudget || 'quick';
  const localSkipIds = new Set(options.skipIds || []);
  const targetExam = options.targetExam || 'NEET PG';
  const now = new Date();

  // 1. Fetch persistent skips & parse adaptive pacing feedback
  const persistentSkips = await db.recommendationSkips.filter(s => s.expiresAt > now).toArray();
  const adaptiveFeedbackMultipliers = new Map<string, number>();

  for (const s of persistentSkips) {
    if (s.reason === 'needs_deep_work') {
      adaptiveFeedbackMultipliers.set(s.targetId, 1.5);
      // If user is currently in quick mode, hide this block since it needs deep work
      if (sessionBudget === 'quick') {
        localSkipIds.add(s.targetId);
      }
    } else if (s.reason === 'fast_recall') {
      adaptiveFeedbackMultipliers.set(s.targetId, 0.75);
    } else {
      // Standard skips (already_studied, not_today, not_relevant, too_difficult, etc.)
      localSkipIds.add(s.targetId);
      if (s.reason === 'too_difficult') {
        adaptiveFeedbackMultipliers.set(s.targetId, 1.35);
      }
    }
  }

  // 2. Triage Mode Check
  const daysSinceLastStudy = await getDaysSinceLastStudy();
  const isTriageMode = daysSinceLastStudy > 3;

  const subjects = await db.subjects.filter(s => !s.deletedAt).toArray();
  const systems = await db.systems.filter(s => !s.deletedAt).toArray();
  
  const setTable = db.curriculumSets || db.revisionSets;
  const curriculumSets: CurriculumSet[] = setTable 
    ? await setTable.filter(s => !s.deletedAt).toArray() 
    : [];
    
  const topicProgresses: TopicProgress[] = await db.topicProgress.toArray();
  const activeMistakes: MistakeLog[] = await db.mistakeLogs.filter(m => !m.deletedAt && !m.resolved).toArray();
  
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

  const subjectMap = new Map<number, string>(subjects.map(s => [s.id!, s.name]));
  const systemMap = new Map<number, StudySystem>(systems.map(sys => [sys.id!, sys]));

  const rawCandidates: NextActionRecommendation[] = [];
  const systemsWithSets = new Set<number>();

  // 3. Process Study Blocks (Primary Scheduling Entity)
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
    
    // Explicit system-level and set-level lengthy toggles and pacing multipliers
    const isSystemLengthy = Boolean(parentSystem?.isLengthy);
    const isBlockLengthy = Boolean(set.isLengthy);
    const revisionCount = set.revisionCount || 0;
    const combinedPace = (set.paceMultiplier || 1.0) * (parentSystem?.paceMultiplier || 1.0);
    const adaptiveMultiplier = adaptiveFeedbackMultipliers.get(candidateId) || 
      (parentSystem?.id ? adaptiveFeedbackMultipliers.get(`sys:${parentSystem.id}`) : 1.0) || 1.0;
    
    // Dynamic mathematical duration calculation with pacing feedback
    const estimatedMinutes = set.customDurationMinutes || calculateEstimatedDurationMinutes({
      topicCount,
      weakCount: weakTopicsInSet,
      mistakeCount: activeMistakesInSet,
      revisionPassCount: revisionCount,
      isSystemLengthy,
      isBlockLengthy,
      paceMultiplier: combinedPace,
      adaptiveSkipMultiplier: adaptiveMultiplier
    });

    const isLengthy = estimatedMinutes > 25;
    const isQuickEligible = estimatedMinutes <= 25;
    
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
    
    const lastDate = set.lastRevisionDate ? new Date(set.lastRevisionDate) : (set.updatedAt ? new Date(set.updatedAt) : now);
    const stability = set.currentRevisionInterval && set.currentRevisionInterval > 0 ? set.currentRevisionInterval : getInitialInterval('Average');
    const baseDecayFactor = parentSystem && typeof parentSystem.decayFactor === 'number' && parentSystem.decayFactor > 0 ? parentSystem.decayFactor : 1.0;
    
    let daysSinceLastRev = Math.max(0, (now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    
    const topicMemoryLosses = (set.topicIds || []).map(tid => {
      const isWeak = weakTopicMap.has(tid);
      return getTopicMemoryLoss(lastDate, stability, isWeak, baseDecayFactor, now);
    });
    
    const baseMemoryLoss = calculateBlockMemoryLoss(topicMemoryLosses);
    
    const yieldModifier = yieldWeight >= 85 ? 1.2 : (yieldWeight <= 40 ? 0.8 : 1.0);
    
    let actionIndex = Math.min(100, Math.round(baseMemoryLoss * yieldModifier));
    
    // Add bonus priority for active mistakes needing remediation
    if (activeMistakesInSet > 0) {
      actionIndex += Math.min(25, activeMistakesInSet * 5);
    }
    
    // Recent exposure suppression (last 18 hours)
    if (daysSinceLastRev < 0.75) {
      actionIndex = 0;
    }
    
    let isPinned = false;
    let isAgingPin = false;
    let wasPinned = false;
    
    if (set.focus === 'primary') {
      const pinDate = set.focusUpdatedAt ? new Date(set.focusUpdatedAt) : now;
      const hoursSincePin = (now.getTime() - pinDate.getTime()) / (1000 * 3600);
      
      if (hoursSincePin > 168) {
        // > 7 days (168 hours): Auto-Downgrade
        wasPinned = true;
      } else {
        isPinned = true;
        actionIndex += 1000; // Force position #1
        
        if (hoursSincePin >= 48) {
          // 48-168 hours: Aging Pin
          isAgingPin = true;
        }
      }
    }
    
    // Triage Mode Filter
    if (isTriageMode && !isPinned && actionIndex <= 80) {
      continue; // Skip blocks that don't meet critical triage threshold
    }
    
    // Build Rationale Badges
    const badges: RationaleBadge[] = [];
    
    if (isTriageMode && actionIndex > 80 && !isPinned) {
      badges.push({ label: '🚨 Triage Priority', variant: 'destructive', iconType: 'alert' });
    } else if (isOverdue) {
      badges.push({ label: `⚡ Overdue (${daysOverdue}d)`, variant: 'amber', iconType: 'clock' });
    } else if (isDueToday) {
      badges.push({ label: '🕒 Due Today', variant: 'amber', iconType: 'clock' });
    }
    
    if (yieldWeight >= 85) {
      badges.push({ label: '🎯 High Yield', variant: 'primary', iconType: 'target' });
    }
    
    const isBlockWeak = weakTopicsInSet > 0 || (topicMemoryLosses.length > 0 && topicMemoryLosses.some(loss => loss > 80));
    if (isBlockWeak) {
      badges.push({ 
        label: weakTopicsInSet > 1 ? `⚠️ ${weakTopicsInSet} Weak Topics` : '⚠️ Weak Area', 
        variant: 'destructive', 
        iconType: 'alert' 
      });
    }

    if (activeMistakesInSet > 0) {
      badges.push({
        label: `⚠️ ${activeMistakesInSet} Mistake${activeMistakesInSet > 1 ? 's' : ''}`,
        variant: 'destructive',
        iconType: 'alert'
      });
    }
    
    let statusText = '';
    if (isOverdue) statusText = `${daysOverdue} days overdue (Pass #${revisionCount + 1})`;
    else if (isDueToday) statusText = `Due today (Pass #${revisionCount + 1})`;
    else statusText = `Completed • Pass #${revisionCount}`;
    
    rawCandidates.push({
      id: candidateId,
      type: 'curriculumSet',
      title: set.name,
      subjectName,
      systemName,
      subjectId: Number(set.subjectId),
      systemId: set.systemId,
      curriculumSetId: set.id,
      isLengthy,
      isQuickEligible,
      estimatedMinutes,
      priorityScore: actionIndex,
      rationaleBadges: badges,
      topicCount,
      weakCount: weakTopicsInSet,
      mistakeCount: activeMistakesInSet,
      inferredScore: 100 - baseMemoryLoss,
      daysOverdue: isOverdue ? daysOverdue : 0,
      revisionCount,
      statusText,
      isAgingPin,
      wasPinned
    });
  }

  const totalCandidatesEvaluated = rawCandidates.length;

  // Rank all raw candidates by priorityScore descending
  rawCandidates.sort((a, b) => b.priorityScore - a.priorityScore);

  let filteredCandidates: NextActionRecommendation[] = [];

  if (sessionBudget === 'quick') {
    // Quick budget: prioritize candidates with estimatedMinutes <= 25
    const naturalQuick = rawCandidates.filter(c => c.estimatedMinutes <= 25);
    
    if (naturalQuick.length > 0) {
      filteredCandidates = naturalQuick;
    } else if (rawCandidates.length > 0) {
      // Intelligent Micro-Slicing: Derive focused 15m Spot Drills from top deep blocks
      const topDeep = rawCandidates[0];
      const microSlicedPrimary: NextActionRecommendation = {
        ...topDeep,
        id: `${topDeep.id}:spot_drill`,
        type: 'spotDrill',
        title: `${topDeep.title} • Spot Drill`,
        estimatedMinutes: 15,
        isLengthy: false,
        isQuickEligible: true,
        isMicroSliced: true,
        statusText: `15m Focused Recall Drill • ${topDeep.statusText}`,
        rationaleBadges: [
          { label: '⚡ Spot Drill (15m)', variant: 'primary', iconType: 'zap' },
          ...topDeep.rationaleBadges.filter(b => b.iconType !== 'clock')
        ]
      };

      filteredCandidates = [microSlicedPrimary];

      if (rawCandidates.length > 1) {
        const secondDeep = rawCandidates[1];
        filteredCandidates.push({
          ...secondDeep,
          id: `${secondDeep.id}:spot_drill`,
          type: 'spotDrill',
          title: `${secondDeep.title} • Spot Drill`,
          estimatedMinutes: 15,
          isLengthy: false,
          isQuickEligible: true,
          isMicroSliced: true,
          statusText: `15m Focused Recall Drill • ${secondDeep.statusText}`,
          rationaleBadges: [
            { label: '⚡ Spot Drill (15m)', variant: 'primary', iconType: 'zap' },
            ...secondDeep.rationaleBadges.filter(b => b.iconType !== 'clock')
          ]
        });
      }
    }
  } else {
    // Deep session budget: Prioritize comprehensive deep blocks (>= 25 min), but keep all available
    filteredCandidates = [...rawCandidates].sort((a, b) => {
      const aDeep = a.estimatedMinutes >= 25 ? 1 : 0;
      const bDeep = b.estimatedMinutes >= 25 ? 1 : 0;
      if (aDeep !== bDeep) return bDeep - aDeep;
      return b.priorityScore - a.priorityScore;
    });
  }

  const quickEligibleCount = rawCandidates.filter(c => c.estimatedMinutes <= 25).length;
  
  const primary = filteredCandidates[0] || null;
  const fallback = filteredCandidates[1] || (filteredCandidates.length > 1 ? filteredCandidates.find(c => c.id !== primary?.id) : null) || null;

  const hasAnyCurriculumSets = curriculumSets.length > 0;
  const totalSyllabusSystemCount = ALL_SYSTEMS.length;
  const hasPendingSyllabus = systems.some(s => !s.contentCompleted) || systems.length < totalSyllabusSystemCount;

  return {
    hasAnyCurriculumSets,
    hasPendingSyllabus,
    primary,
    fallback,
    sessionBudget,
    totalCandidatesEvaluated,
    quickEligibleCount,
    isTriageMode
  };
}

