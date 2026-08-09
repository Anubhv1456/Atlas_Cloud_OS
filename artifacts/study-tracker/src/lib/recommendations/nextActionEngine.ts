import { db } from '@/db';
import { ALL_SUBJECTS } from '@/data/ontology';
import { getSubjectWeightageInfo } from '@/lib/recommendation-engine';
import { CurriculumSet, StudySystem, ScoreLog, TopicProgress } from '@/db/types';

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
  revisionCount?: number;
  statusText: string;
}

export interface NextActionEngineResult {
  primary: NextActionRecommendation | null;
  fallback: NextActionRecommendation | null;
  sessionBudget: 'quick' | 'deep';
  totalCandidatesEvaluated: number;
  quickEligibleCount: number;
}

export interface EngineOptions {
  sessionBudget?: 'quick' | 'deep';
  skipIds?: string[];
  targetExam?: string;
}

/**
 * Calculates the Next Best Action for the student based on:
 * 1. Time Budget (Quick 10-20m vs Deep 45m+) via isLengthy & topic count
 * 2. Overdue Status & Spaced Repetition Days
 * 3. High Yield Exam Weightage
 * 4. Inferred Performance (Score Logs & System Status)
 * 5. Topic Weakness Flags
 * 6. Exposure Penalty (prevents immediate repetitive recommendations)
 */
export async function getNextActionRecommendation(
  options: EngineOptions = {}
): Promise<NextActionEngineResult> {
  const sessionBudget = options.sessionBudget || 'quick';
  const skipIds = new Set(options.skipIds || []);
  const targetExam = options.targetExam || 'NEET PG';

  const now = new Date();

  // Load Dexie collections
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

  // Build ScoreLog lookup for sets and systems
  const setScoreMap = new Map<string, number[]>();
  const systemScoreMap = new Map<number, number[]>();

  for (const log of scoreLogs) {
    if (log.percentage !== undefined && log.percentage !== null) {
      if (log.curriculumSetId) {
        const existing = setScoreMap.get(log.curriculumSetId) || [];
        existing.push(log.percentage);
        setScoreMap.set(log.curriculumSetId, existing);
      }
      if (log.systemId) {
        const existing = systemScoreMap.get(log.systemId) || [];
        existing.push(log.percentage);
        systemScoreMap.set(log.systemId, existing);
      }
    }
  }

  const rawCandidates: NextActionRecommendation[] = [];

  // Track systems that already have Curriculum Sets so we don't duplicate recommendations
  const systemsWithSets = new Set<number>();

  // 1. Process Curriculum Sets
  for (const set of curriculumSets) {
    if (!set.id) continue;
    const candidateId = `set:${set.id}`;
    if (skipIds.has(candidateId)) continue;

    const parentSystem = systemMap.get(set.systemId);
    if (parentSystem) {
      systemsWithSets.add(parentSystem.id!);
    }

    const subjectName = subjectMap.get(set.subjectId) || 
      ALL_SUBJECTS.find(s => s.id === set.subjectId)?.name || 'Medical Subject';
    const systemName = parentSystem?.name || 'System';

    const isLengthy = Boolean(parentSystem?.isLengthy) || (set.topicIds && set.topicIds.length > 8);
    const topicCount = set.topicIds?.length || 0;

    let weakTopicsInSet = 0;
    if (set.topicIds) {
      for (const tid of set.topicIds) {
        if (weakTopicMap.has(tid)) weakTopicsInSet++;
      }
    }

    // Determine Inferred Score
    const setScores = setScoreMap.get(set.id) || [];
    let inferredScore: number;
    let scoreSource: 'log' | 'status' = 'status';

    if (setScores.length > 0) {
      // Average of recent scores
      const recent = setScores.slice(-3);
      inferredScore = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
      scoreSource = 'log';
    } else if (set.averageScore !== undefined && set.averageScore !== null) {
      inferredScore = Math.round(set.averageScore);
      scoreSource = 'log';
    } else {
      const status = parentSystem?.status || 'Average';
      inferredScore = status === 'Strong' ? 85 : status === 'Average' ? 65 : 45;
    }

    // High Yield Weightage
    const yieldInfo = getSubjectWeightageInfo(subjectName, targetExam);
    const yieldWeight = yieldInfo.weight || 70;

    // Days Overdue
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

    // Days since last revision
    let daysSinceLastRev = 0;
    if (set.lastRevisionDate) {
      const lastDate = new Date(set.lastRevisionDate);
      daysSinceLastRev = Math.max(0, Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)));
    }

    // Priority Score Additive Logic:
    // PriorityScore = OverdueWeight * DaysOverdue + YieldWeight * HighYield + LowScoreWeight * (100 - InferredScore) - RecentExposurePenalty
    let score = 0;

    // Overdue component
    if (isOverdue) {
      score += Math.min(daysOverdue, 30) * 12 + 30;
    } else if (isDueToday) {
      score += 25;
    } else if (daysSinceLastRev > 7) {
      score += Math.min(daysSinceLastRev, 30) * 1.5;
    } else if (!set.contentCompleted || !set.qbankCompleted) {
      score += 20; // boost incomplete items
    }

    // High Yield component (scaled to 0 - 50)
    score += (yieldWeight / 100) * 50;

    // Low Score / Weakness component
    score += ((100 - inferredScore) / 100) * 40;

    // Topic Weakness Bonus
    if (weakTopicsInSet > 0) {
      score += Math.min(weakTopicsInSet * 8, 25);
    }

    // Exposure penalty (if revised within last 12-24 hrs)
    if (daysSinceLastRev < 1) {
      score -= 80;
    } else if (daysSinceLastRev < 2) {
      score -= 30;
    }

    // Build Rationale Badges
    const badges: RationaleBadge[] = [];

    if (isOverdue) {
      badges.push({
        label: `⚡ Overdue ${daysOverdue}d`,
        variant: 'destructive',
        iconType: 'clock'
      });
    } else if (isDueToday) {
      badges.push({
        label: '🕒 Due Today',
        variant: 'amber',
        iconType: 'clock'
      });
    }

    if (yieldWeight >= 85) {
      badges.push({
        label: `🎯 High Yield (${yieldInfo.tag.split('•')[0].trim()})`,
        variant: 'primary',
        iconType: 'target'
      });
    }

    if (scoreSource === 'log' && inferredScore < 60) {
      badges.push({
        label: `⚠️ Low Score (${inferredScore}%)`,
        variant: 'destructive',
        iconType: 'alert'
      });
    } else if (parentSystem?.status === 'Weak') {
      badges.push({
        label: '⚠️ Weak System',
        variant: 'destructive',
        iconType: 'alert'
      });
    }

    if (weakTopicsInSet > 0) {
      badges.push({
        label: `🔥 ${weakTopicsInSet} Weak Topic${weakTopicsInSet > 1 ? 's' : ''}`,
        variant: 'amber',
        iconType: 'zap'
      });
    }

    if (!isLengthy) {
      badges.push({
        label: '⚡ 15m Quick Session',
        variant: 'emerald',
        iconType: 'zap'
      });
    } else {
      badges.push({
        label: '📚 Deep Work Block',
        variant: 'muted',
        iconType: 'book'
      });
    }

    const estimatedMinutes = isLengthy ? 45 : 15;
    const revisionCount = set.revisionCount || 0;
    const statusText = isOverdue
      ? `${daysOverdue} days overdue for revision (Pass #${revisionCount + 1})`
      : isDueToday
      ? `Scheduled for recall pass #${revisionCount + 1} today`
      : set.contentCompleted && set.qbankCompleted
      ? `Completed • Pass #${revisionCount}`
      : `In Progress • ${topicCount} topics`;

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
      priorityScore: Math.round(score),
      rationaleBadges: badges,
      topicCount,
      inferredScore,
      daysOverdue: isOverdue ? daysOverdue : 0,
      revisionCount,
      statusText
    });
  }

  // 2. Process Study Systems without Curriculum Sets
  for (const sys of systems) {
    if (!sys.id || systemsWithSets.has(sys.id)) continue;
    const candidateId = `sys:${sys.id}`;
    if (skipIds.has(candidateId)) continue;

    const subjectName = subjectMap.get(sys.subjectId) || 
      ALL_SUBJECTS.find(s => s.id === sys.subjectId)?.name || 'Medical Subject';
    const isLengthy = Boolean(sys.isLengthy);

    const sysScores = systemScoreMap.get(sys.id) || [];
    let inferredScore: number;
    let scoreSource: 'log' | 'status' = 'status';

    if (sysScores.length > 0) {
      const recent = sysScores.slice(-3);
      inferredScore = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
      scoreSource = 'log';
    } else {
      inferredScore = sys.status === 'Strong' ? 85 : sys.status === 'Average' ? 65 : 45;
    }

    const yieldInfo = getSubjectWeightageInfo(subjectName, targetExam);
    const yieldWeight = yieldInfo.weight || 70;

    let daysOverdue = 0;
    let isOverdue = false;
    let isDueToday = false;

    if (sys.nextRevisionDate) {
      const revDate = new Date(sys.nextRevisionDate);
      const diffMs = now.getTime() - revDate.getTime();
      const diffDays = diffMs / (1000 * 3600 * 24);
      if (diffDays >= 1) {
        isOverdue = true;
        daysOverdue = Math.floor(diffDays);
      } else if (diffDays >= -0.5) {
        isDueToday = true;
      }
    }

    let daysSinceLastRev = 0;
    if (sys.lastRevisionDate) {
      const lastDate = new Date(sys.lastRevisionDate);
      daysSinceLastRev = Math.max(0, Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)));
    }

    let score = 0;
    if (isOverdue) {
      score += Math.min(daysOverdue, 30) * 12 + 30;
    } else if (isDueToday) {
      score += 25;
    } else if (daysSinceLastRev > 7) {
      score += Math.min(daysSinceLastRev, 30) * 1.5;
    } else if (!sys.contentCompleted || !sys.qbankDone) {
      score += 20;
    }

    score += (yieldWeight / 100) * 50;
    score += ((100 - inferredScore) / 100) * 40;

    if (sys.status === 'Weak') score += 20;

    if (daysSinceLastRev < 1) {
      score -= 80;
    } else if (daysSinceLastRev < 2) {
      score -= 30;
    }

    const badges: RationaleBadge[] = [];

    if (isOverdue) {
      badges.push({
        label: `⚡ Overdue ${daysOverdue}d`,
        variant: 'destructive',
        iconType: 'clock'
      });
    } else if (isDueToday) {
      badges.push({
        label: '🕒 Due Today',
        variant: 'amber',
        iconType: 'clock'
      });
    }

    if (yieldWeight >= 85) {
      badges.push({
        label: `🎯 High Yield (${yieldInfo.tag.split('•')[0].trim()})`,
        variant: 'primary',
        iconType: 'target'
      });
    }

    if (sys.status === 'Weak') {
      badges.push({
        label: '⚠️ Weak System',
        variant: 'destructive',
        iconType: 'alert'
      });
    } else if (scoreSource === 'log' && inferredScore < 60) {
      badges.push({
        label: `⚠️ Low Score (${inferredScore}%)`,
        variant: 'destructive',
        iconType: 'alert'
      });
    }

    if (!isLengthy) {
      badges.push({
        label: '⚡ 15m Quick Session',
        variant: 'emerald',
        iconType: 'zap'
      });
    } else {
      badges.push({
        label: '📚 Deep Work Block',
        variant: 'muted',
        iconType: 'book'
      });
    }

    const estimatedMinutes = isLengthy ? 45 : 15;
    const revisionCount = sys.revisionCount || 0;
    const statusText = isOverdue
      ? `${daysOverdue} days overdue for system revision`
      : isDueToday
      ? 'Scheduled for system recall today'
      : `System Status: ${sys.status}`;

    rawCandidates.push({
      id: candidateId,
      type: 'system',
      title: sys.name,
      subjectName,
      systemName: sys.name,
      subjectId: sys.subjectId,
      systemId: sys.id,
      isLengthy,
      estimatedMinutes,
      priorityScore: Math.round(score),
      rationaleBadges: badges,
      inferredScore,
      daysOverdue: isOverdue ? daysOverdue : 0,
      revisionCount,
      statusText
    });
  }

  const totalCandidatesEvaluated = rawCandidates.length;

  // Filter candidates by session budget
  let filteredCandidates = rawCandidates;
  if (sessionBudget === 'quick') {
    // Exclude lengthy items in quick mode
    filteredCandidates = rawCandidates.filter(c => !c.isLengthy);
  }

  const quickEligibleCount = rawCandidates.filter(c => !c.isLengthy).length;

  // If quick mode yielded no candidates (e.g. all available systems are marked lengthy), fall back to all candidates
  if (filteredCandidates.length === 0 && rawCandidates.length > 0) {
    filteredCandidates = rawCandidates;
  }

  // Sort by priorityScore descending
  filteredCandidates.sort((a, b) => b.priorityScore - a.priorityScore);

  const primary = filteredCandidates[0] || null;
  const fallback = filteredCandidates[1] || (rawCandidates.length > 1 ? rawCandidates.find(c => c.id !== primary?.id) : null) || null;

  return {
    primary,
    fallback,
    sessionBudget,
    totalCandidatesEvaluated,
    quickEligibleCount
  };
}
