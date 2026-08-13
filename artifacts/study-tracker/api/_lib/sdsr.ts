// ATLAS Server-Side Score-Driven Spaced Repetition (SDSR) Engine & Recommendation Server Logic

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

// Subject Volatility Indices
const VOLATILITY_MAP: Record<string, number> = {
  Pharmacology: 0.85,
  Microbiology: 0.85,
  Biochemistry: 0.85,
  Anatomy: 0.85,
  Physiology: 1.15,
  Pathology: 1.15,
};

export function getVolatilityIndex(subjectName: string): number {
  return VOLATILITY_MAP[subjectName] || 1.0;
}

// ── Medical Exam Subject Weightage Dictionary ───────────────────────────
export const EXAM_WEIGHTAGES: Record<string, Record<string, { weight: number; tag: string; phase: string }>> = {
  'NEET PG': {
    'Medicine': { weight: 100, tag: '35-40 Qs • High Yield Core', phase: 'Final MBBS' },
    'General Medicine': { weight: 100, tag: '35-40 Qs • High Yield Core', phase: 'Final MBBS' },
    'Surgery': { weight: 98, tag: '35-40 Qs • High Yield Core', phase: 'Final MBBS' },
    'General Surgery': { weight: 98, tag: '35-40 Qs • High Yield Core', phase: 'Final MBBS' },
    'Obstetrics & Gynecology': { weight: 95, tag: '30 Qs • High Yield Core', phase: 'Final MBBS' },
    'Obstetrics and Gynaecology': { weight: 95, tag: '30 Qs • High Yield Core', phase: 'Final MBBS' },
    'Community Medicine (PSM)': { weight: 90, tag: '25 Qs • High Yield', phase: '3rd Year' },
    'Community Medicine': { weight: 90, tag: '25 Qs • High Yield', phase: '3rd Year' },
    'Pathology': { weight: 92, tag: '25 Qs • Para-Clinical Foundation', phase: '2nd Year' },
    'Pharmacology': { weight: 88, tag: '20 Qs • Para-Clinical High Yield', phase: '2nd Year' },
    'Pediatrics': { weight: 82, tag: '15 Qs • High Yield Clinical', phase: 'Final MBBS' },
    'Paediatrics': { weight: 82, tag: '15 Qs • High Yield Clinical', phase: 'Final MBBS' },
    'Microbiology': { weight: 78, tag: '15 Qs • Para-Clinical', phase: '2nd Year' },
    'Biochemistry': { weight: 72, tag: '12 Qs • Pre-Clinical Core', phase: '1st Year' },
    'Anatomy': { weight: 70, tag: '12 Qs • Pre-Clinical Core', phase: '1st Year' },
    'Physiology': { weight: 70, tag: '12 Qs • Pre-Clinical Core', phase: '1st Year' },
    'ENT': { weight: 68, tag: '10 Qs • Clinical Phase 1', phase: '3rd Year' },
    'Ophthalmology': { weight: 68, tag: '10 Qs • Clinical Phase 1', phase: '3rd Year' },
    'Forensic Medicine (FMT)': { weight: 62, tag: '10 Qs • Para-Clinical', phase: '2nd Year' },
    'Forensic Medicine': { weight: 62, tag: '10 Qs • Para-Clinical', phase: '2nd Year' },
    'Orthopedics': { weight: 58, tag: '8 Qs • Minor Clinical', phase: 'Final MBBS' },
    'Dermatology': { weight: 55, tag: '6 Qs • Minor Clinical', phase: 'Final MBBS' },
    'Psychiatry': { weight: 55, tag: '6 Qs • Minor Clinical', phase: 'Final MBBS' },
    'Radiology': { weight: 55, tag: '6 Qs • Minor Clinical', phase: 'Final MBBS' },
    'Anaesthesia': { weight: 55, tag: '6 Qs • Minor Clinical', phase: 'Final MBBS' },
  },
  'USMLE Step 1': {
    'General Pathology & Pharmacology': { weight: 100, tag: 'High Yield ~45% Integration', phase: '2nd Year' },
    'Cardiovascular System': { weight: 95, tag: 'High Yield Organ System', phase: 'General' },
    'Gastrointestinal System': { weight: 92, tag: 'High Yield Organ System', phase: 'General' },
    'Microbiology & Immunology': { weight: 90, tag: 'Core Microbiology ~15%', phase: '2nd Year' },
    'Biochemistry & Medical Genetics': { weight: 88, tag: 'Molecular & Metabolic Core', phase: '1st Year' },
    'Renal & Urinary System': { weight: 85, tag: 'Organ System High Yield', phase: 'General' },
    'Neurology & Special Senses': { weight: 85, tag: 'Neuroscience Core', phase: 'General' },
    'Endocrine System': { weight: 82, tag: 'Endocrine Pathology & Pharma', phase: 'General' },
    'Respiratory System': { weight: 82, tag: 'Pulmonary Mechanics & Path', phase: 'General' },
    'Reproductive System': { weight: 80, tag: 'Reproductive Endocrinology', phase: 'General' },
    'Behavioral Health & Ethics': { weight: 75, tag: 'Biostatistics & Ethics ~10%', phase: 'General' },
  },
  'USMLE Step 2 CK': {
    'Internal Medicine': { weight: 100, tag: '~35-40% Step 2 Weightage', phase: 'Final MBBS' },
    'Surgery': { weight: 95, tag: '~25-30% Step 2 Weightage', phase: 'Final MBBS' },
    'Pediatrics': { weight: 88, tag: '~15-20% Step 2 Weightage', phase: 'Final MBBS' },
    'Obstetrics & Gynecology': { weight: 85, tag: '~10-15% Step 2 Weightage', phase: 'Final MBBS' },
    'Psychiatry & Behavioral Health': { weight: 80, tag: '~10-15% Step 2 Weightage', phase: 'Final MBBS' },
    'Emergency Medicine & Preventive Care': { weight: 75, tag: 'Acute Resuscitation & Safety', phase: 'Final MBBS' },
  },
};

export function getSubjectWeightageInfo(subjectName: string, targetExam: string) {
  const normalizedExam = Object.keys(EXAM_WEIGHTAGES).find(key =>
    targetExam.toLowerCase().includes(key.toLowerCase())
  ) || 'NEET PG';

  const dict = EXAM_WEIGHTAGES[normalizedExam] || EXAM_WEIGHTAGES['NEET PG'];

  const key = Object.keys(dict).find(
    k =>
      k.toLowerCase() === subjectName.toLowerCase() ||
      subjectName.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(subjectName.toLowerCase())
  );

  if (key && dict[key]) {
    return dict[key];
  }

  return { weight: 70, tag: 'Core Curriculum Topic', phase: 'General' };
}

export function getInitialInterval(status: string): number {
  switch (status) {
    case 'Strong': return 7;
    case 'Average': return 3;
    case 'Weak': return 1;
    default: return 3;
  }
}

export function getTopicMemoryLoss(lastDate: Date, stability: number, isWeak: boolean, baseDecayFactor: number, now: Date): number {
  const diffTime = Math.max(0, now.getTime() - lastDate.getTime());
  const daysElapsed = diffTime / (1000 * 60 * 60 * 24);
  const decay = baseDecayFactor * (isWeak ? 1.5 : 1.0);
  const loss = (daysElapsed / stability) * 100 * decay;
  return Math.min(100, Math.max(0, loss));
}

export function calculateBlockMemoryLoss(topicLosses: number[]): number {
  if (topicLosses.length === 0) return 0;
  const maxLoss = Math.max(...topicLosses);
  const avgLoss = topicLosses.reduce((a, b) => a + b, 0) / topicLosses.length;
  const blockLoss = (0.7 * maxLoss) + (0.3 * avgLoss);
  return Math.round(blockLoss);
}

export function calibrateCurriculumSetSDSR(
  curriculumSet: any,
  score: number,
  subjectName: string = 'General',
  globalRetentionScore: number = 0.70
) {
  const normalizedScore = score > 1 ? score / 100 : score;
  const now = new Date();
  let baseInterval = curriculumSet.currentRevisionInterval;

  if (!baseInterval) {
    if (normalizedScore < 0.50) baseInterval = 3;
    else if (normalizedScore <= 0.70) baseInterval = 7;
    else if (normalizedScore <= 0.85) baseInterval = 14;
    else baseInterval = 21;
  } else {
    if (curriculumSet.lastRevisionDate) {
      const actualIntervalDays = (now.getTime() - new Date(curriculumSet.lastRevisionDate).getTime()) / (1000 * 60 * 60 * 24);
      if (normalizedScore >= 0.70 && actualIntervalDays > baseInterval) {
        baseInterval = actualIntervalDays;
      }
    }
  }

  let Pm = 1.0;
  if (normalizedScore < 0.50) {
    Pm = Math.max(0.2, 2 * normalizedScore);
  } else {
    Pm = 1.0 + ((normalizedScore - 0.50) * 3.6);
  }

  const Dm = getVolatilityIndex(subjectName);
  const alpha = 0.85 + (globalRetentionScore * 0.3);
  let newInterval = baseInterval * Pm * Dm * alpha;
  newInterval = Math.max(3, Math.min(150, newInterval));

  const nextRevisionDate = new Date(now.getTime() + (newInterval * 24 * 60 * 60 * 1000));
  const count = curriculumSet.revisionCount || 0;
  const oldAvg = curriculumSet.averageScore ?? normalizedScore;
  const newAverageScore = (oldAvg * count + normalizedScore) / (count + 1);

  return {
    newInterval: Math.round(newInterval),
    nextRevisionDate,
    updatedSet: {
      currentRevisionInterval: Math.round(newInterval),
      nextRevisionDate,
      lastRevisionDate: now,
      revisionCount: count + 1,
      averageScore: newAverageScore,
      updatedAt: now,
    },
  };
}

export interface ServerComputeNextActionParams {
  curriculumSets: any[];
  systems: any[];
  subjects: any[];
  topicProgresses?: any[];
  daysSinceLastStudy?: number;
  skipIds?: string[];
  sessionBudget?: 'quick' | 'deep';
  targetExam?: string;
  subjectFilterId?: number;
}

export function computeNextActionsServerSide(params: ServerComputeNextActionParams): NextActionEngineResult {
  const {
    curriculumSets = [],
    systems = [],
    subjects = [],
    topicProgresses = [],
    daysSinceLastStudy = 0,
    skipIds = [],
    sessionBudget = 'quick',
    targetExam = 'NEET PG',
    subjectFilterId,
  } = params;

  const localSkipIds = new Set(skipIds);
  const now = new Date();
  const isTriageMode = daysSinceLastStudy > 3;

  const weakTopicMap = new Set(
    topicProgresses.filter((tp: any) => tp.isWeak).map((tp: any) => tp.topicId)
  );

  const subjectMap = new Map<number, string>(subjects.map((s: any) => [s.id, s.name]));
  const systemMap = new Map<number, any>(systems.map((sys: any) => [sys.id, sys]));

  const rawCandidates: NextActionRecommendation[] = [];

  for (const set of curriculumSets) {
    if (!set.id) continue;
    const candidateId = `set:${set.id}`;

    if (subjectFilterId && set.subjectId !== subjectFilterId) continue;
    if (localSkipIds.has(candidateId)) continue;

    const parentSystem = systemMap.get(set.systemId);
    const subjectName = subjectMap.get(set.subjectId) || 'Medical Subject';
    const systemName = parentSystem?.name || 'System';

    const topicCount = Array.isArray(set.topicIds) ? set.topicIds.length : 0;
    const yieldInfo = getSubjectWeightageInfo(subjectName, targetExam);
    const yieldWeight = yieldInfo.weight || 70;
    const isLengthy = yieldWeight >= 85;

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

    const lastDate = set.lastRevisionDate
      ? new Date(set.lastRevisionDate)
      : set.updatedAt
      ? new Date(set.updatedAt)
      : now;

    const stability =
      set.currentRevisionInterval && set.currentRevisionInterval > 0
        ? set.currentRevisionInterval
        : getInitialInterval('Average');

    const baseDecayFactor =
      parentSystem && typeof parentSystem.decayFactor === 'number' && parentSystem.decayFactor > 0
        ? parentSystem.decayFactor
        : 1.0;

    const daysSinceLastRev = Math.max(0, (now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

    const topicMemoryLosses = (Array.isArray(set.topicIds) ? set.topicIds : []).map((tid: string) => {
      const isWeak = weakTopicMap.has(tid);
      return getTopicMemoryLoss(lastDate, stability, isWeak, baseDecayFactor, now);
    });

    const baseMemoryLoss = calculateBlockMemoryLoss(topicMemoryLosses);
    const yieldModifier = yieldWeight >= 85 ? 1.2 : yieldWeight <= 40 ? 0.8 : 1.0;

    let actionIndex = Math.min(100, Math.round(baseMemoryLoss * yieldModifier));

    // Recent exposure suppression (< 18 hrs)
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
        wasPinned = true;
      } else {
        isPinned = true;
        actionIndex += 1000;

        if (hoursSincePin >= 48) {
          isAgingPin = true;
        }
      }
    }

    // Triage Mode Filter
    if (isTriageMode && !isPinned && actionIndex <= 80) {
      continue;
    }

    const badges: RationaleBadge[] = [];

    if (isTriageMode && actionIndex > 80 && !isPinned) {
      badges.push({ label: '🚨 Triage Priority', variant: 'destructive', iconType: 'alert' });
    } else if (isOverdue) {
      badges.push({ label: '⚡ Overdue', variant: 'amber', iconType: 'clock' });
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
      wasPinned,
    });
  }

  const totalCandidatesEvaluated = rawCandidates.length;

  let filteredCandidates = rawCandidates;
  if (sessionBudget === 'quick') {
    filteredCandidates = rawCandidates.filter(c => !c.isLengthy);
  }
  const quickEligibleCount = rawCandidates.filter(c => !c.isLengthy).length;

  filteredCandidates.sort((a, b) => b.priorityScore - a.priorityScore);

  const primary = filteredCandidates[0] || null;
  const fallback =
    filteredCandidates[1] ||
    (filteredCandidates.length > 1 ? filteredCandidates.find(c => c.id !== primary?.id) : null) ||
    null;

  const hasAnyCurriculumSets = curriculumSets.length > 0;
  const hasPendingSyllabus = systems.some((s: any) => !s.contentCompleted);

  return {
    hasAnyCurriculumSets,
    hasPendingSyllabus,
    primary,
    fallback,
    sessionBudget,
    totalCandidatesEvaluated,
    quickEligibleCount,
    isTriageMode,
  };
}
