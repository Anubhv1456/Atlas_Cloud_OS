const fs = require('fs');
const file = './artifacts/study-tracker/src/db/revisionEngine.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace getRetrievability
code = code.replace(
  /export function getRetrievability\(sys: StudySystem, now: Date = today\(\)\): number \{[\s\S]*?return Math\.min\(100, Math\.max\(0, Math\.round\(retrievability \* 10\) \/ 10\)\);\n\}/,
  `export function getMemoryLoss(
  lastDate: Date,
  stabilityInterval: number,
  isWeak: boolean,
  baseDecayFactor: number = 1.0,
  now: Date = today()
): number {
  const n = new Date(now);
  n.setHours(0, 0, 0, 0);
  const l = new Date(lastDate);
  l.setHours(0, 0, 0, 0);

  const daysElapsed = Math.max(0, Math.floor((n.getTime() - l.getTime()) / 86_400_000));
  
  const decayFactor = baseDecayFactor * (isWeak ? 1.5 : 1.0);
  
  const retrievability = 100 * Math.pow(REVISION_CONFIG.TARGET_RETENTION_DUE, (daysElapsed * decayFactor) / stabilityInterval);
  const memoryLoss = 100 - retrievability;
  
  return Math.min(100, Math.max(0, Math.round(memoryLoss * 10) / 10));
}

export function getSystemMemoryLoss(sys: StudySystem, now: Date = today()): number {
  if (!hasRevisionScheduled(sys)) return 0;

  const lastDate = sys.lastRevisionDate
    ? new Date(sys.lastRevisionDate)
    : sys.completionDate
    ? new Date(sys.completionDate)
    : sys.updatedAt
    ? new Date(sys.updatedAt)
    : now;

  const stability = sys.currentRevisionInterval && sys.currentRevisionInterval > 0
    ? sys.currentRevisionInterval
    : getInitialInterval(sys.status);

  const isWeak = sys.status === 'Weak';
  const baseDecayFactor = getSystemDecayFactor(sys);

  return getMemoryLoss(lastDate, stability, isWeak, baseDecayFactor, now);
}

export function calculateBlockMemoryLoss(topicMemoryLosses: number[]): number {
  if (topicMemoryLosses.length === 0) return 0;
  const maxLoss = Math.max(...topicMemoryLosses);
  const avgLoss = topicMemoryLosses.reduce((sum, val) => sum + val, 0) / topicMemoryLosses.length;
  const blockLoss = (0.7 * maxLoss) + (0.3 * avgLoss);
  return Math.min(100, Math.max(0, Math.round(blockLoss * 10) / 10));
}

// Legacy wrapper to avoid breaking UI (temporary until UI is updated)
export function getRetrievability(sys: StudySystem, now: Date = today()): number {
  return 100 - getSystemMemoryLoss(sys, now);
}`
);

// Strip behavioral logic from calculateDecayScore
code = code.replace(
  /export function calculateDecayScore\(sys: StudySystem, now: Date = today\(\)\): number \{[\s\S]*?return Math\.round\(\(memoryLoss \* 0\.1 \* weight \* decayFactor \* yieldMultiplier\) \* 10\) \/ 10;\n  \}\n\}/,
  `export function calculateDecayScore(sys: StudySystem, now: Date = today()): number {
  if (!hasRevisionScheduled(sys)) return 0;
  
  const memoryLoss = getSystemMemoryLoss(sys, now);
  
  if (isRevisionDue(sys, now)) {
    return memoryLoss;
  } else {
    // Small background decay score for upcoming
    return Math.round((memoryLoss * 0.1) * 10) / 10;
  }
}`
);

fs.writeFileSync(file, code);
