const fs = require('fs');
const file = './artifacts/study-tracker/src/db/revisionEngine.ts';
let content = fs.readFileSync(file, 'utf8');

const correctFunc = `export function calculateDecayScore(sys: StudySystem, now: Date = today()): number {
  if (!hasRevisionScheduled(sys)) return 0;
  
  const retrievability = getRetrievability(sys, now);
  const memoryLoss = 100 - retrievability;
  const weight = REVISION_CONFIG.CONFIDENCE_WEIGHTS[sys.status] ?? 1.0;
  const decayFactor = getSystemDecayFactor(sys);
  const overdue = daysOverdue(sys, now);
  const yieldMultiplier = sys.isHighYield ? 1.5 : 1.0;

  if (isRevisionDue(sys, now)) {
    return Math.round((memoryLoss * weight * decayFactor * yieldMultiplier + overdue * 2) * 10) / 10;
  } else {
    // Small background decay score for upcoming
    return Math.round((memoryLoss * 0.1 * weight * decayFactor * yieldMultiplier) * 10) / 10;
  }
}`;

content = content.replace(
    /export function calculateDecayScore[\s\S]+?\}\s*\} else \{\s*\/\/ Small background decay score for upcoming\s*return Math\.round\(\(memoryLoss \* 0\.1 \* weight \* decayFactor\) \* 10\) \/ 10;\s*\}/,
    correctFunc
);

// Fallback if the regex above didn't work perfectly:
content = content.replace(
    /export function calculateDecayScore[\s\S]+?Math\.round\(\(memoryLoss \* 0\.1 \* weight \* decayFactor\) \* 10\) \/ 10;\s*\}\s*\}/,
    correctFunc
);

fs.writeFileSync(file, content);
console.log('patched revision engine 2');
