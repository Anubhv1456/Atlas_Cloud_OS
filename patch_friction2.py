import sys

path = 'artifacts/study-tracker/src/lib/ai/frictionEngine.ts'
with open(path, 'r') as f:
    content = f.read()

target = """  const completedSets = subjectSets.filter((c) => c.contentCompleted || c.qbankCompleted).length;
  const completionRatio = subjectSets.length > 0 ? completedSets / subjectSets.length : 0.0;
  const isMastered = subjectSets.length > 0 && completionRatio === 1.0;
    
  const stabilityFactor = Math.max(0.7, Math.min(1.5, 0.8 + completionRatio * 0.7));"""

replacement = """  const completedSets = subjectSets.filter((c) => c.contentCompleted || c.qbankCompleted).length;
  const completionRatio = subjectSets.length > 0 ? completedSets / subjectSets.length : 0.0;
  const isMastered = subjectSets.length > 0 && completionRatio === 1.0;
    
  // Check true SDSR dates
  const overdueSets = subjectSets.filter(c => {
    const d = c.nextRevisionDate || c.qbankNextRevisionDate;
    if (!d) return false;
    const revTime = new Date(d).getTime();
    return !isNaN(revTime) && revTime < now;
  });
  const hasOverdueSets = overdueSets.length > 0;

  const stabilityFactor = Math.max(0.7, Math.min(1.5, 0.8 + completionRatio * 0.7));"""
if target in content:
    content = content.replace(target, replacement)

target2 = """  let decayUrgency: 'CRITICAL' | 'ELEVATED' | 'MODERATE' | 'STABLE' | 'FRESH' | 'MASTERED' = 'STABLE';
  if (!hasStarted) {
    decayUrgency = 'FRESH';
  } else if (isMastered && daysSinceReview < profile.halfLifeDays) {
    decayUrgency = 'MASTERED';
  } else if (frictionScore >= 45 || daysSinceReview > (profile.halfLifeDays * 2)) {
    decayUrgency = 'CRITICAL';
  } else if (frictionScore >= 25 || daysSinceReview > profile.halfLifeDays) {
    decayUrgency = 'ELEVATED';
  } else if (frictionScore >= 12) {
    decayUrgency = 'MODERATE';
  } else {
    decayUrgency = 'STABLE';
  }"""
replacement2 = """  let decayUrgency: 'CRITICAL' | 'ELEVATED' | 'MODERATE' | 'STABLE' | 'FRESH' | 'MASTERED' = 'STABLE';
  if (!hasStarted) {
    decayUrgency = 'FRESH';
  } else if (isMastered && daysSinceReview < profile.halfLifeDays && !hasOverdueSets) {
    decayUrgency = 'MASTERED';
  } else if (hasOverdueSets || frictionScore >= 45 || daysSinceReview > (profile.halfLifeDays * 2)) {
    decayUrgency = 'CRITICAL';
  } else if (frictionScore >= 25 || daysSinceReview > profile.halfLifeDays) {
    decayUrgency = 'ELEVATED';
  } else if (frictionScore >= 12) {
    decayUrgency = 'MODERATE';
  } else {
    decayUrgency = 'STABLE';
  }"""
if target2 in content:
    content = content.replace(target2, replacement2)

with open(path, 'w') as f:
    f.write(content)
print("done frictionEngine patch 2")
