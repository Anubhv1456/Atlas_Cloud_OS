import { StudySystem, SystemStatus, RevisionLog, CurriculumSet, OperationalModeRecord, HistoryEntry, ScoreLog, MistakeLog } from './types';
import { db } from './schema';
import { generateHLC } from '@/lib/hlc';
import { recordSessionCompletion } from '@/lib/telemetry';

// Constants
export const REVISION_CONFIG = {
  MIN_INTERVAL: 1,
  MAX_INTERVAL: 180,
  DEFAULT_DAILY_LIMIT: 5,
};

export function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const res = new Date(date);
  res.setDate(res.getDate() + days);
  return res;
}

export function getSystemDecayFactor(sys: StudySystem): number {
  return sys.decayFactor ?? 1.0;
}

/**
 * Computes memory loss percentage (0-100%) factoring in elapsed days, stability interval,
 * decay factor, and pending 20th notebook mistake traps (accelerates decay by 15% per active mistake, 30% if volatile).
 */
export function getSystemMemoryLoss(
  sys: StudySystem, 
  curriculumSets: CurriculumSet[] = [], 
  now: Date = today(),
  mistakes: MistakeLog[] = []
): number {
  const safeSets = Array.isArray(curriculumSets) ? curriculumSets : [];
  if (!hasRevisionScheduled(sys, safeSets)) return 0;

  // Calculate mistake penalty multiplier for this system/subject
  const relevantMistakes = (mistakes || []).filter(
    m => !m.resolved && !m.deletedAt && (
      (m.systemId && String(m.systemId) === String(sys.id)) ||
      (m.subjectId && String(m.subjectId) === String(sys.subjectId))
    )
  );
  const volatileMistakes = relevantMistakes.filter(m => m.isVolatile).length;
  const standardMistakes = relevantMistakes.length - volatileMistakes;
  // Each standard mistake increases decay rate by 15%, volatile by 30% (capped at 2.5x accelerator)
  const mistakePenaltyMultiplier = Math.min(2.5, 1.0 + (standardMistakes * 0.15) + (volatileMistakes * 0.30));
  
  const sets = safeSets.filter(s => s && s.systemId === sys.id && s.nextRevisionDate);
  if (sets.length === 0) {
    if (sys.nextRevisionDate) {
      const lastDate = sys.lastRevisionDate ? new Date(sys.lastRevisionDate) : new Date(sys.nextRevisionDate);
      const interval = sys.currentRevisionInterval || 1;
      const decay = getSystemDecayFactor(sys) * mistakePenaltyMultiplier;
      const diffTime = Math.max(0, now.getTime() - lastDate.getTime());
      const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const loss = (daysElapsed / interval) * 100 * decay;
      return Math.min(100, Math.max(0, Math.round(loss * 10) / 10));
    }
    return 0;
  }

  // Compute memory loss per set
  const losses = sets.map(set => {
    const lastDate = set.lastRevisionDate ? new Date(set.lastRevisionDate) : new Date(set.nextRevisionDate!);
    const interval = set.currentRevisionInterval || 1;
    
    // Check for set-specific mistakes
    const setMistakes = (mistakes || []).filter(
      m => !m.resolved && !m.deletedAt && m.curriculumSetId && String(m.curriculumSetId) === String(set.id)
    );
    const setPenalty = setMistakes.length > 0
      ? Math.min(2.5, 1.0 + (setMistakes.filter(m => !m.isVolatile).length * 0.15) + (setMistakes.filter(m => m.isVolatile).length * 0.30))
      : mistakePenaltyMultiplier;

    const decay = getSystemDecayFactor(sys) * setPenalty;
    
    // Memory Loss = (Days Elapsed / Interval) * Decay
    const diffTime = Math.max(0, now.getTime() - lastDate.getTime());
    const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const loss = (daysElapsed / interval) * 100 * decay;
    return loss;
  });

  const maxLoss = Math.max(...losses);
  const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;
  
  const blockLoss = (0.7 * maxLoss) + (0.3 * avgLoss);
  return Math.min(100, Math.max(0, Math.round(blockLoss * 10) / 10));
}

export function getRetrievability(
  sys: StudySystem, 
  curriculumSets: CurriculumSet[] = [], 
  now: Date = today(),
  mistakes: MistakeLog[] = []
): number {
  return 100 - getSystemMemoryLoss(sys, curriculumSets, now, mistakes);
}

export function getRetrievabilityHealth(retrievability: number): {
  label: string;
  status: 'optimal' | 'moderate' | 'risk' | 'critical';
  colorClass: string;
} {
  if (retrievability >= 90) {
    return { label: 'Optimal Recall', status: 'optimal', colorClass: 'text-emerald-600 dark:text-emerald-400' };
  } else if (retrievability >= 80) {
    return { label: 'Moderate Decay', status: 'moderate', colorClass: 'text-amber-600 dark:text-amber-400' };
  } else if (retrievability >= 70) {
    return { label: 'High Risk', status: 'risk', colorClass: 'text-orange-600 dark:text-orange-400' };
  } else {
    return { label: 'Memory Reset', status: 'critical', colorClass: 'text-destructive' };
  }
}

export function getActiveRevisionSystems(systems: StudySystem[] = []): StudySystem[] {
  const safeSystems = Array.isArray(systems) ? systems : [];
  return safeSystems.filter(sys => sys && sys.revisionState === 'in_progress');
}

export function hasActiveRevisionInProgress(systems: StudySystem[] = []): boolean {
  return getActiveRevisionSystems(systems).length > 0;
}

export function hasRevisionScheduled(sys: StudySystem, curriculumSets: CurriculumSet[] = []): boolean {
  const safeSets = Array.isArray(curriculumSets) ? curriculumSets : [];
  if (safeSets.some(s => s && s.systemId === sys.id && s.nextRevisionDate)) return true;
  return !!sys.nextRevisionDate;
}

export function isRevisionDue(sys: StudySystem, curriculumSetsOrNow?: CurriculumSet[] | Date, nowDate?: Date): boolean {
  const isSecondArgDate = curriculumSetsOrNow instanceof Date;
  const safeSets = Array.isArray(curriculumSetsOrNow) ? curriculumSetsOrNow : [];
  const now = isSecondArgDate ? (curriculumSetsOrNow as Date) : (nowDate || today());
  
  const sets = safeSets.filter(s => s && s.systemId === sys.id && s.nextRevisionDate);
  const n = new Date(now);
  n.setHours(0, 0, 0, 0);
  
  if (sets.length === 0 && sys.nextRevisionDate) {
    const due = new Date(sys.nextRevisionDate);
    due.setHours(0, 0, 0, 0);
    return due <= n;
  }
  
  return sets.some(set => {
    const due = new Date(set.nextRevisionDate!);
    due.setHours(0, 0, 0, 0);
    return due <= n;
  });
}

export function isRevisionOverdue(sys: StudySystem, curriculumSetsOrNow?: CurriculumSet[] | Date, nowDate?: Date): boolean {
  const isSecondArgDate = curriculumSetsOrNow instanceof Date;
  const safeSets = Array.isArray(curriculumSetsOrNow) ? curriculumSetsOrNow : [];
  const now = isSecondArgDate ? (curriculumSetsOrNow as Date) : (nowDate || today());

  const sets = safeSets.filter(s => s && s.systemId === sys.id && s.nextRevisionDate);
  const n = new Date(now);
  n.setHours(0, 0, 0, 0);
  
  if (sets.length === 0 && sys.nextRevisionDate) {
    const due = new Date(sys.nextRevisionDate);
    due.setHours(0, 0, 0, 0);
    return due < n;
  }
  
  return sets.some(set => {
    const due = new Date(set.nextRevisionDate!);
    due.setHours(0, 0, 0, 0);
    return due < n;
  });
}

export function isRevisionDueToday(sys: StudySystem, curriculumSetsOrNow?: CurriculumSet[] | Date, nowDate?: Date): boolean {
  return isRevisionDue(sys, curriculumSetsOrNow, nowDate) && !isRevisionOverdue(sys, curriculumSetsOrNow, nowDate);
}

export function daysOverdue(sys: StudySystem, curriculumSets: CurriculumSet[] = [], now: Date = today()): number {
  const safeSets = Array.isArray(curriculumSets) ? curriculumSets : [];
  const sets = safeSets.filter(s => s && s.systemId === sys.id && s.nextRevisionDate);
  const n = new Date(now);
  n.setHours(0, 0, 0, 0);
  
  let maxOverdue = 0;
  sets.forEach(set => {
    const due = new Date(set.nextRevisionDate!);
    due.setHours(0, 0, 0, 0);
    if (due < n) {
      const diff = Math.floor((n.getTime() - due.getTime()) / 86_400_000);
      if (diff > maxOverdue) maxOverdue = diff;
    }
  });
  return maxOverdue;
}

export function calculateDecayScore(
  sys: StudySystem, 
  curriculumSets: CurriculumSet[], 
  now: Date = today(),
  mistakes: MistakeLog[] = []
): number {
  if (!hasRevisionScheduled(sys, curriculumSets)) return 0;
  
  const memoryLoss = getSystemMemoryLoss(sys, curriculumSets, now, mistakes);
  
  if (isRevisionDue(sys, curriculumSets, now)) {
    return memoryLoss;
  } else {
    return Math.round((memoryLoss * 0.1) * 10) / 10;
  }
}

export function sortSystemsByRevisionPriority(
  systems: StudySystem[], 
  curriculumSets: CurriculumSet[], 
  now: Date = today(),
  mistakes: MistakeLog[] = []
): StudySystem[] {
  return [...systems].sort((a, b) => {
    const scoreA = calculateDecayScore(a, curriculumSets, now, mistakes);
    const scoreB = calculateDecayScore(b, curriculumSets, now, mistakes);
    if (scoreA !== scoreB) return scoreB - scoreA;
    
    // If scores are equal, sort by earliest due date across sets
    const getEarliestDate = (sys: StudySystem) => {
      const sets = curriculumSets.filter(s => s.systemId === sys.id && s.nextRevisionDate);
      if (sets.length === 0) return Infinity;
      return Math.min(...sets.map(s => new Date(s.nextRevisionDate!).getTime()));
    };
    
    return getEarliestDate(a) - getEarliestDate(b);
  });
}

export interface RevisionQueueResult {
  priorityQueue: StudySystem[];
  backlogBuffer: StudySystem[];
  totalDueCount: number;
  overflowCount: number;
  isQueuePaused: boolean;
  activeRevisionCount: number;
}

export function getDailyRevisionQueue(
  systems: StudySystem[],
  curriculumSets: CurriculumSet[],
  maxDailyLimit: number = REVISION_CONFIG.DEFAULT_DAILY_LIMIT,
  now: Date = today()
): RevisionQueueResult {
  const activeSystems = getActiveRevisionSystems(systems);
  const isQueuePaused = activeSystems.length > 0;
  const allDue = systems.filter(sys => isRevisionDue(sys, curriculumSets, now) || sys.revisionState === 'in_progress');
  const sorted = sortSystemsByRevisionPriority(allDue, curriculumSets, now);
  
  const prioritized = [
    ...activeSystems,
    ...sorted.filter(sys => sys.revisionState !== 'in_progress')
  ];
  
  const priorityQueue = prioritized.slice(0, maxDailyLimit);
  const backlogBuffer = prioritized.slice(maxDailyLimit);
  
  return {
    priorityQueue,
    backlogBuffer,
    totalDueCount: prioritized.length,
    overflowCount: backlogBuffer.length,
    isQueuePaused,
    activeRevisionCount: activeSystems.length,
  };
}

export function getInitialInterval(confidence: SystemStatus): number {
  switch (confidence) {
    case 'Strong': return 7;
    case 'Average': return 3;
    case 'Weak': return 1;
    default: return 3;
  }
}

export function calculateNextInterval(currentInterval: number, confidence: SystemStatus, decayFactor: number = 1.0): number {
  let multiplier = 1.0;
  switch (confidence) {
    case 'Strong': multiplier = 2.5; break;
    case 'Average': multiplier = 1.5; break;
    case 'Weak': multiplier = 0.5; break;
  }
  const adjustedMultiplier = Math.max(0.5, multiplier / decayFactor);
  return Math.round(currentInterval * adjustedMultiplier);
}

export function scheduleFirstRevision(
  confidence: SystemStatus,
  now: Date = today(),
  decayFactor: number = 1.0,
): {
  currentRevisionInterval: number;
  nextRevisionDate: Date;
} {
  const baseInterval = getInitialInterval(confidence);
  const interval = Math.max(REVISION_CONFIG.MIN_INTERVAL, Math.round(baseInterval * (1 / Math.sqrt(decayFactor))));
  
  const d = new Date(now);
  d.setDate(d.getDate() + interval);
  
  return {
    currentRevisionInterval: interval,
    nextRevisionDate: d,
  };
}

export function scheduleNextRevision(
  confidence: SystemStatus,
  currentInterval: number,
  now: Date = today(),
  decayFactor: number = 1.0,
  durationMultiplier: number = 1.0
): {
  currentRevisionInterval: number;
  nextRevisionDate: Date;
  durationMultiplier: number;
} {
  const baseInterval = calculateNextInterval(currentInterval, confidence, decayFactor);
  const calibratedInterval = Math.max(
    REVISION_CONFIG.MIN_INTERVAL,
    Math.min(REVISION_CONFIG.MAX_INTERVAL, Math.round(baseInterval * durationMultiplier))
  );
  
  const d = new Date(now);
  d.setDate(d.getDate() + calibratedInterval);
  
  return {
    currentRevisionInterval: calibratedInterval,
    nextRevisionDate: d,
    durationMultiplier,
  };
}

export function calculateDurationMultiplier(daysTaken: number): number {
  if (daysTaken <= 1) return 1.0;
  const mult = 1.0 + Math.min(1.0, Math.log2(daysTaken) * 0.25);
  return Math.round(mult * 100) / 100;
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

export function isRevisionUpcoming(sys: StudySystem, curriculumSets: CurriculumSet[], now: Date = today()): boolean {
  if (!hasRevisionScheduled(sys, curriculumSets)) return false;
  const sets = curriculumSets.filter(s => s.systemId === sys.id && true && s.nextRevisionDate);
  const n = new Date(now);
  n.setHours(0, 0, 0, 0);
  
  return sets.some(set => {
    const due = new Date(set.nextRevisionDate!);
    due.setHours(0, 0, 0, 0);
    return due > n;
  });
}

export const DECAY_CALIBRATION_PRESETS = [
  { label: '0.8x (Slower)', value: 0.8 },
  { label: '1.0x (Normal)', value: 1.0 },
  { label: '1.2x (Faster)', value: 1.2 },
  { label: '1.5x (Fastest)', value: 1.5 }
];

// ── Operational Mode & Knapsack Smoothing Mechanics ──────────────────────────

/**
 * Knapsack Priority Formula:
 * Priority = (SubjectWeight * YieldIndex * MemoryDecay) / EstimatedMinutes
 */
export function calculateKnapsackPriority(params: {
  subjectWeight: number; // e.g. 70-100
  yieldWeight?: number;  // e.g. 80-120
  memoryLoss: number;    // 0-100 (100 - Retrievability)
  estimatedMinutes: number; // e.g. 15-45
  mistakeBonus?: number; // e.g. active mistake count * 10
}): number {
  const { subjectWeight, yieldWeight = 100, memoryLoss, estimatedMinutes, mistakeBonus = 0 } = params;
  const safeTime = Math.max(8, estimatedMinutes);
  const normalizedYield = yieldWeight / 100;
  const normalizedSubject = subjectWeight / 100;
  const decayUrgency = Math.max(5, memoryLoss);

  // Score = (Weight * Yield * Decay + MistakeBonus) / sqrt(timeCost)
  const rawPriority = ((normalizedSubject * normalizedYield * decayUrgency) + mistakeBonus) / Math.sqrt(safeTime);
  return Math.round(rawPriority * 10) / 10;
}

/**
 * Filter systems by active operational mode:
 * - tactical_sprint: only systems belonging to targetSubjectIds
 * - clinical_duty / standard / final_lap: returns all systems (pacing applied during scheduling)
 */
export function filterSystemsByOperationalMode(
  systems: StudySystem[],
  opMode?: OperationalModeRecord | null
): StudySystem[] {
  if (!opMode || opMode.mode === 'standard') return systems;
  
  if (opMode.mode === 'tactical_sprint' && Array.isArray(opMode.targetSubjectIds) && opMode.targetSubjectIds.length > 0) {
    const targetSet = new Set(opMode.targetSubjectIds.map(String));
    return systems.filter(sys => targetSet.has(String(sys.subjectId)));
  }
  
  return systems;
}

/**
 * Filter curriculum sets by active operational mode:
 * - tactical_sprint: only sets belonging to targetSubjectIds
 */
export function filterCurriculumSetsByOperationalMode(
  sets: CurriculumSet[],
  opMode?: OperationalModeRecord | null
): CurriculumSet[] {
  if (!opMode || opMode.mode === 'standard') return sets;

  if (opMode.mode === 'tactical_sprint' && Array.isArray(opMode.targetSubjectIds) && opMode.targetSubjectIds.length > 0) {
    const targetSet = new Set(opMode.targetSubjectIds.map(String));
    return sets.filter(set => targetSet.has(String(set.subjectId)));
  }

  return sets;
}

/**
 * Checks if the user is in an active Soft Recalibration recovery phase.
 * A user is recalibrating if:
 * 1. Mode is 'standard'
 * 2. previousMode exists (e.g. was 'tactical_sprint' or 'clinical_duty')
 * 3. lastRecalibratedAt is within the recalibrationWindowDays
 */
export function isSoftRecalibrating(opMode?: OperationalModeRecord | null, now: Date = today()): {
  active: boolean;
  daysRemaining: number;
  progressRatio: number;
} {
  if (!opMode || opMode.mode !== 'standard' || !opMode.lastRecalibratedAt) {
    return { active: false, daysRemaining: 0, progressRatio: 1 };
  }

  const recalibratedTime = new Date(opMode.lastRecalibratedAt).getTime();
  const windowDays = opMode.recalibrationWindowDays || 10;
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const elapsedMs = Math.max(0, now.getTime() - recalibratedTime);

  if (elapsedMs < windowMs) {
    const daysRemaining = Math.max(1, Math.ceil((windowMs - elapsedMs) / (24 * 60 * 60 * 1000)));
    const progressRatio = Math.min(1, elapsedMs / windowMs);
    return { active: true, daysRemaining, progressRatio };
  }

  return { active: false, daysRemaining: 0, progressRatio: 1 };
}

export interface RecordStudyBlockRevisionParams {
  subjectId: number | string;
  subjectName: string;
  systemName: string;
  durationMinutes: number;
  confidenceLevel: 'LOW' | 'MED' | 'HIGH';
  topicsStudied?: string;
}

export async function recordStudyBlockRevision(params: RecordStudyBlockRevisionParams): Promise<{
  success: boolean;
  historyId?: number | string;
  scoreId?: number | string;
  nextRevisionDate?: Date;
  intervalDays?: number;
}> {
  const { subjectId, subjectName, systemName, durationMinutes, confidenceLevel, topicsStudied } = params;

  // Map confidence level to SystemStatus
  const status: SystemStatus = confidenceLevel === 'HIGH' ? 'Strong' : confidenceLevel === 'MED' ? 'Average' : 'Weak';
  const now = today();

  // Try to match system
  const allSystems = await db.systems.where('subjectId').equals(subjectId).toArray().then(res => res.filter(s => !s.deletedAt));
  const cleanSysName = (systemName || '').trim().toLowerCase();
  const matchedSys = allSystems.find(s => 
    s.name.toLowerCase() === cleanSysName || 
    (cleanSysName && s.name.toLowerCase().includes(cleanSysName)) || 
    (cleanSysName && cleanSysName.includes(s.name.toLowerCase()))
  );

  let targetSystemId: number | string = matchedSys?.id || 0;
  let nextRevisionDate: Date | null = null;
  let intervalDays: number = 7;

  if (matchedSys && matchedSys.id !== undefined) {
    const previousInterval = matchedSys.currentRevisionInterval ?? 12;
    const decayFactor = matchedSys.decayFactor ?? 1.0;
    const revSchedule = scheduleNextRevision(status, previousInterval, now, decayFactor, 1.0);
    nextRevisionDate = revSchedule.nextRevisionDate;
    intervalDays = revSchedule.currentRevisionInterval;

    await db.systems.update(matchedSys.id, {
      status,
      lastRevisionDate: new Date(),
      currentRevisionInterval: intervalDays,
      nextRevisionDate,
      revisionCount: (matchedSys.revisionCount || 0) + 1,
      contentCompleted: true,
      updatedAt: new Date(),
      hlc: generateHLC(),
    });
  } else {
    // If not found, compute first revision schedule
    const firstSchedule = scheduleFirstRevision(status, now, 1.0);
    nextRevisionDate = firstSchedule.nextRevisionDate;
    intervalDays = firstSchedule.currentRevisionInterval;
  }

  const scorePercent = confidenceLevel === 'HIGH' ? 90 : confidenceLevel === 'MED' ? 70 : 45;

  // 1. Log completion event to history
  const historyEntry: Omit<HistoryEntry, 'id'> = {
    subjectId,
    subjectName: subjectName || 'General Medicine',
    systemId: targetSystemId,
    systemName: systemName || matchedSys?.name || 'Study Block',
    taskKey: 'curriculum_set_revision',
    taskLabel: `Studied ${systemName || subjectName} (${durationMinutes}m • ${confidenceLevel} recall)`,
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    hlc: generateHLC(),
  };
  const historyId = await db.history.add(historyEntry);

  // 2. Log score
  const scoreId = await db.scoreLogs.add({
    title: `Study Log: ${systemName || subjectName}`,
    score: scorePercent,
    total: 100,
    percentage: scorePercent,
    type: 'study',
    subjectId,
    systemId: targetSystemId,
    timestamp: new Date(),
    notes: topicsStudied || undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    hlc: generateHLC(),
  });

  // 3. Record session telemetry
  recordSessionCompletion('study', Math.max(15, durationMinutes), true);

  return {
    success: true,
    historyId,
    scoreId,
    nextRevisionDate: nextRevisionDate || undefined,
    intervalDays,
  };
}

