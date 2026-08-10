const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/lib/recommendations/nextActionEngine.ts';

const content = `
import { db } from '@/db';
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
  type: 'curriculumSet' | 'system' | 'topicGap' | 'systemGap';
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
  isTriageMode: boolean;
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

  // Build ScoreLog lookup
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
  const systemsWithSets = new Set<number>();
  const systemsWithIncompleteSets = new Set<number>();

  // Helper for Study Block Health
  const calculateBlockHealth = (setId: string, topicIds: string[]) => {
    let isBlockWeak = false;
    let inferredScore = 70;
    let scoreSource: 'log' | 'status' = 'status';

    const scores = setScoreMap.get(setId) || [];
    if (scores.length > 0) {
      const recent = scores.slice(-3);
      inferredScore = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
      scoreSource = 'log';
      if (inferredScore < 50) isBlockWeak = true;
    }

    let weakTopicsInSet = 0;
    for (const tid of topicIds) {
      if (weakTopicMap.has(tid)) weakTopicsInSet++;
    }
    
    if (topicIds.length > 0 && (weakTopicsInSet / topicIds.length) > 0.3) {
      isBlockWeak = true;
    }

    return { isBlockWeak, inferredScore, scoreSource, weakTopicsInSet };
  };

  // 1. Process Study Blocks (Primary Scheduling Entity)
  for (const set of curriculumSets) {
    if (!set.id) continue;
    const candidateId = \`set:\${set.id}\`;
    
    const parentSystem = systemMap.get(set.systemId);
    if (parentSystem) {
      systemsWithSets.add(parentSystem.id!);
      if (!set.contentCompleted || !set.qbankCompleted) {
        systemsWithIncompleteSets.add(parentSystem.id!);
      }
    }

    if (localSkipIds.has(candidateId)) continue;

    const subjectName = subjectMap.get(set.subjectId) || 
      ALL_SUBJECTS.find(s => String(s.id) === String(set.subjectId))?.name || 'Medical Subject';
    const systemName = parentSystem?.name || 'System';
    
    const isLengthy = set.topicIds.length > 5;
    const topicCount = set.topicIds.length;
    
    const { isBlockWeak, inferredScore, scoreSource, weakTopicsInSet } = calculateBlockHealth(set.id, set.topicIds);

    const yieldInfo = getSubjectWeightageInfo(subjectName, targetExam);
    const yieldWeight = yieldInfo.weight || 70;

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

    let daysSinceLastRev = 0;
    if (set.lastRevisionDate) {
      const lastDate = new Date(set.lastRevisionDate);
      daysSinceLastRev = Math.max(0, Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)));
    }

    // SCORING MATH
    let score = 0;

    if (isOverdue) {
      score += Math.min(daysOverdue, 30) * (isTriageMode ? 15 : 12) + 30;
    } else if (isDueToday) {
      score += 25;
    } else if (daysSinceLastRev > 7) {
      score += Math.min(daysSinceLastRev, 30) * 1.5;
    } else if (!set.contentCompleted || !set.qbankCompleted) {
      score += 20; 
    }

    score += (yieldWeight / 100) * 50;

    if (isBlockWeak) {
      score += 30; // Strong multiplier for weak block
    } else {
      score += ((100 - inferredScore) / 100) * 40;
    }

    if (set.focus === 'primary') {
      score += 150; // Massive multiplier
    }
    
    if (daysSinceLastRev < 1) {
      score -= 100; // Heavy recent exposure penalty
    } else if (daysSinceLastRev < 2) {
      score -= 30;
    }

    // Build Rationale Badges
    const badges: RationaleBadge[] = [];
    
    if (isTriageMode && isOverdue) {
      badges.push({ label: '🚨 Triage Priority', variant: 'destructive', iconType: 'alert' });
    } else if (isOverdue) {
      badges.push({ label: \`⚡ Pending Review\`, variant: 'amber', iconType: 'clock' });
    } else if (isDueToday) {
      badges.push({ label: '🕒 Due Today', variant: 'amber', iconType: 'clock' });
    }

    if (yieldWeight >= 85) {
      badges.push({ label: \`🎯 High Yield (\${yieldInfo.tag.split('•')[0].trim()})\`, variant: 'primary', iconType: 'target' });
    }

    if (set.focus === 'primary') {
      badges.push({ label: '⭐ Primary Focus', variant: 'primary', iconType: 'target' });
    }

    if (isBlockWeak) {
      badges.push({ label: '⚠️ Weak Block', variant: 'destructive', iconType: 'alert' });
    }

    const estimatedMinutes = isLengthy ? 45 : 15;
    const revisionCount = set.revisionCount || 0;
    
    let statusText = '';
    if (isOverdue) statusText = \`\${daysOverdue} days overdue for revision (Pass #\${revisionCount + 1})\`;
    else if (isDueToday) statusText = \`Scheduled for recall pass #\${revisionCount + 1} today\`;
    else if (set.contentCompleted && set.qbankCompleted) statusText = \`Completed • Pass #\${revisionCount}\`;
    else statusText = \`In Progress • \${topicCount} topics\`;

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

  // 2. Topic Gaps & System Gaps
  for (const sys of systems) {
    if (!sys.id) continue;
    const candidateId = \`sys:\${sys.id}\`;
    if (localSkipIds.has(candidateId)) continue;
    
    const subjectName = subjectMap.get(sys.subjectId) || 
      ALL_SUBJECTS.find(s => String(s.id) === String(sys.subjectId))?.name || 'Medical Subject';
    const yieldInfo = getSubjectWeightageInfo(subjectName, targetExam);
    const yieldWeight = yieldInfo.weight || 70;

    const hasSets = systemsWithSets.has(sys.id);
    const hasIncompleteSets = systemsWithIncompleteSets.has(sys.id);
    
    // Calculate total topics for this system based on ontology
    let totalOntologyTopics = 0;
    const ontologySystem = ALL_SYSTEMS.find(s => s.name === sys.name && s.subject === subjectName);
    if (ontologySystem) {
      totalOntologyTopics = ontologySystem.topics.length;
    }
    const customTopics = sys.customTopics?.filter(t => !t.deleted) || [];
    const allSystemTopics = totalOntologyTopics + customTopics.length;

    // Calculate topics assigned to sets
    const systemSets = curriculumSets.filter(s => s.systemId === sys.id);
    const assignedTopicIds = new Set<string>();
    systemSets.forEach(s => s.topicIds.forEach(tid => assignedTopicIds.add(tid)));
    const assignedTopicCount = assignedTopicIds.size;
    
    const orphanedTopicsCount = allSystemTopics - assignedTopicCount;

    // Case A: Topic Gap
    // If all blocks are complete but there are orphaned topics
    if (hasSets && !hasIncompleteSets && orphanedTopicsCount > 0) {
      let gapScore = (yieldWeight / 100) * 45 + 10;
      if (sys.focus === 'primary') gapScore += 80;

      rawCandidates.push({
        id: candidateId,
        type: 'topicGap',
        title: \`\${orphanedTopicsCount} Topic\${orphanedTopicsCount > 1 ? 's' : ''} Not Assigned\`,
        subjectName,
        systemName: sys.name,
        subjectId: sys.subjectId,
        systemId: sys.id,
        isLengthy: false,
        estimatedMinutes: 5,
        priorityScore: Math.round(gapScore),
        rationaleBadges: [
          { label: '🧩 Coverage Gap', variant: 'primary', iconType: 'alert' }
        ],
        inferredScore: 0,
        daysOverdue: 0,
        revisionCount: 0,
        statusText: 'Add to a Study Block to enable intelligent scheduling'
      });
      continue;
    }
    
    // Case B: System Gap (No Sets, maybe topics, but totally unorganized)
    if (!hasSets) {
      let sysScore = (yieldWeight / 100) * 40;
      if (sys.focus === 'primary') sysScore += 100;
      
      // We only want this to surface naturally, so base score is moderate.
      rawCandidates.push({
        id: candidateId,
        type: 'systemGap',
        title: \`\${sys.name} Not Organized\`,
        subjectName,
        systemName: sys.name,
        subjectId: sys.subjectId,
        systemId: sys.id,
        isLengthy: false,
        estimatedMinutes: 10,
        priorityScore: Math.round(sysScore),
        rationaleBadges: [
          { label: '🏗️ Unorganized System', variant: 'muted', iconType: 'book' }
        ],
        inferredScore: 0,
        daysOverdue: 0,
        revisionCount: 0,
        statusText: 'Create study blocks to start scheduling revisions'
      });
    }
  }

  const totalCandidatesEvaluated = rawCandidates.length;

  // Filter candidates by session budget
  let filteredCandidates = rawCandidates;
  if (sessionBudget === 'quick') {
    filteredCandidates = rawCandidates.filter(c => !c.isLengthy);
  }

  const quickEligibleCount = rawCandidates.filter(c => !c.isLengthy).length;

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
    quickEligibleCount,
    isTriageMode
  };
}
`;

fs.writeFileSync(file, content);
