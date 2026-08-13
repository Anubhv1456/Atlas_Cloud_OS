
import { db } from '@/db';
import { calculateBlockMemoryLoss, getTopicMemoryLoss, getInitialInterval } from '@/db';
import { ALL_SUBJECTS, ALL_SYSTEMS } from '@/data/ontology';
import { getSubjectWeightageInfo } from '@/lib/recommendation-engine';
import { CurriculumSet, StudySystem, ScoreLog, TopicProgress } from '@/db/types';
import { getDaysSinceLastStudy } from '@/db/queries';

export interface RationaleBadge {
  label: string;
  variant: 'amber' | 'emerald' | 'destructive' | 'primary' | 'muted';
  iconType?: 'clock' | 'target' | 'alert' | 'zap' | 'book';
}

export interface NextActionRecommendation {
  id: string;
  type: 'curriculumSet' | 'system';
  title: string;
  subjectName: string;
  systemName: string;
  subjectId: number;
  systemId: number;
  curriculumSetId?: string;
  isLengthy: boolean;
  estimatedMinutes: number;
  priorityScore: number;
  rationaleBadges: RationaleBadge[];
  topicCount?: number;
  inferredScore?: number;
  daysOverdue?: number;
  isAgingPin?: boolean;
  wasPinned?: boolean;
  revisionCount?: number;
  statusText: string;
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

export async function getNextActionRecommendation(
  options: EngineOptions = {}
): Promise<NextActionEngineResult> {
  const sessionBudget = options.sessionBudget || 'quick';
  const localSkipIds = new Set(options.skipIds || []);
  const targetExam = options.targetExam || 'NEET PG';
  const now = new Date();

  // 1. Fetch persistent skips & add to skip list
  const persistentSkips = await db.recommendationSkips.filter(s => s.expiresAt > now).toArray();
  persistentSkips.forEach(s => localSkipIds.add(s.targetId));

  // 2. Triage Mode
  const daysSinceLastStudy = await getDaysSinceLastStudy();
  const isTriageMode = daysSinceLastStudy > 3;

  const subjects = await db.subjects.filter(s => !s.deletedAt).toArray();
  const systems = await db.systems.filter(s => !s.deletedAt).toArray();
  
  const setTable = db.curriculumSets || db.revisionSets;
  const curriculumSets: CurriculumSet[] = setTable 
    ? await setTable.filter(s => !s.deletedAt).toArray() 
    : [];
    
  const scoreLogs: ScoreLog[] = await db.scoreLogs.filter(sl => !sl.deletedAt).toArray();
  const topicProgresses: TopicProgress[] = await db.topicProgress.toArray();
  
  const weakTopicMap = new Set(
    topicProgresses.filter(tp => tp.isWeak).map(tp => tp.topicId)
  );

  const subjectMap = new Map<number, string>(subjects.map(s => [s.id!, s.name]));
  const systemMap = new Map<number, StudySystem>(systems.map(sys => [sys.id!, sys]));

  const rawCandidates: NextActionRecommendation[] = [];
  const systemsWithSets = new Set<number>();
  const systemsWithIncompleteSets = new Set<number>();

  // 1. Process Study Blocks (Primary Scheduling Entity)
  for (const set of curriculumSets) {
    if (!set.id) continue;
    const candidateId = `set:${set.id}`;
    
    const parentSystem = systemMap.get(set.systemId);
    if (parentSystem) {
      systemsWithSets.add(parentSystem.id!);
      if (false) {
        systemsWithIncompleteSets.add(parentSystem.id!);
      }
    }
    
    if (localSkipIds.has(candidateId)) continue;
    
    const subjectName = subjectMap.get(set.subjectId) || 
       ALL_SUBJECTS.find(s => String(s.id) === String(set.subjectId))?.name || 'Medical Subject';
    const systemName = parentSystem?.name || 'System';
    
    const topicCount = set.topicIds.length;
    
    const yieldInfo = getSubjectWeightageInfo(subjectName, targetExam);
    const yieldWeight = yieldInfo.weight || 70;
    
    const isLengthy = yieldWeight >= 85; // High Yield blocks default to Deep Work
    
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
    
    const topicMemoryLosses = set.topicIds.map(tid => {
      const isWeak = weakTopicMap.has(tid);
      return getTopicMemoryLoss(lastDate, stability, isWeak, baseDecayFactor, now);
    });
    
    const baseMemoryLoss = calculateBlockMemoryLoss(topicMemoryLosses);
    
    const yieldModifier = yieldWeight >= 85 ? 1.2 : (yieldWeight <= 40 ? 0.8 : 1.0);
    
    let actionIndex = Math.min(100, Math.round(baseMemoryLoss * yieldModifier));
    
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
      badges.push({ label: `⚡ Overdue`, variant: 'amber', iconType: 'clock' });
    } else if (isDueToday) {
      badges.push({ label: '🕒 Due Today', variant: 'amber', iconType: 'clock' });
    }
    
    if (yieldWeight >= 85) {
      badges.push({ label: '🎯 High Yield', variant: 'primary', iconType: 'target' });
    }
    
    
    const isBlockWeak = topicMemoryLosses.length > 0 && topicMemoryLosses.some(loss => loss > 80);
    if (isBlockWeak) {
      badges.push({ label: '⚠️ Weak Area', variant: 'destructive', iconType: 'alert' });
    }
    
    const estimatedMinutes = isLengthy ? 45 : 15;
    const revisionCount = set.revisionCount || 0;
    
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
      subjectId: set.subjectId,
      systemId: set.systemId,
      curriculumSetId: set.id,
      isLengthy,
      estimatedMinutes,
      priorityScore: actionIndex,
      rationaleBadges: badges,
      topicCount,
      inferredScore: 100 - baseMemoryLoss,
      daysOverdue: isOverdue ? daysOverdue : 0,
      revisionCount,
      statusText,
      isAgingPin,
      wasPinned
    });
  }

  const totalCandidatesEvaluated = rawCandidates.length;

  // Filter candidates by session budget
  let filteredCandidates = rawCandidates;
  if (sessionBudget === 'quick') {
    filteredCandidates = rawCandidates.filter(c => !c.isLengthy);
  }
  const quickEligibleCount = rawCandidates.filter(c => !c.isLengthy).length;

  // If Quick filter results in empty, DO NOT fall back to Deep. Be honest.
  // NextActionCard will handle the empty state.
  
  // Sort by Action Index descending
  filteredCandidates.sort((a, b) => b.priorityScore - a.priorityScore);
  
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
