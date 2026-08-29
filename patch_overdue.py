import sys

path = 'artifacts/study-tracker/src/lib/ai/frictionEngine.ts'
with open(path, 'r') as f:
    content = f.read()

target = """  const isMastered = subjectSets.length > 0 && completionRatio === 1.0;
    
  const stabilityFactor = Math.max(0.7, Math.min(1.5, 0.8 + completionRatio * 0.7));"""

replacement = """  const isMastered = subjectSets.length > 0 && completionRatio === 1.0;
    
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
    with open(path, 'w') as f:
        f.write(content)
    print("Fixed hasOverdueSets")
else:
    print("Target not found - let's find the exact lines.")
