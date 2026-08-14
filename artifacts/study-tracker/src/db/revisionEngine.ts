import { StudySystem, SystemStatus, RevisionLog, CurriculumSet } from './types';

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

export function getSystemMemoryLoss(sys: StudySystem, curriculumSets: CurriculumSet[] = [], now: Date = today()): number {
  const safeSets = Array.isArray(curriculumSets) ? curriculumSets : [];
  if (!hasRevisionScheduled(sys, safeSets)) return 0;
  
  const sets = safeSets.filter(s => s && s.systemId === sys.id && s.nextRevisionDate);
  if (sets.length === 0) {
    if (sys.nextRevisionDate) {
      const lastDate = sys.lastRevisionDate ? new Date(sys.lastRevisionDate) : new Date(sys.nextRevisionDate);
      const interval = sys.currentRevisionInterval || 1;
      const decay = getSystemDecayFactor(sys);
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
    const decay = getSystemDecayFactor(sys);
    
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

export function getRetrievability(sys: StudySystem, curriculumSets: CurriculumSet[] = [], now: Date = today()): number {
  return 100 - getSystemMemoryLoss(sys, curriculumSets, now);
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

export function calculateDecayScore(sys: StudySystem, curriculumSets: CurriculumSet[], now: Date = today()): number {
  if (!hasRevisionScheduled(sys, curriculumSets)) return 0;
  
  const memoryLoss = getSystemMemoryLoss(sys, curriculumSets, now);
  
  if (isRevisionDue(sys, curriculumSets, now)) {
    return memoryLoss;
  } else {
    return Math.round((memoryLoss * 0.1) * 10) / 10;
  }
}

export function sortSystemsByRevisionPriority(systems: StudySystem[], curriculumSets: CurriculumSet[], now: Date = today()): StudySystem[] {
  return [...systems].sort((a, b) => {
    const scoreA = calculateDecayScore(a, curriculumSets, now);
    const scoreB = calculateDecayScore(b, curriculumSets, now);
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
