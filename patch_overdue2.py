import sys
import re

path = 'artifacts/study-tracker/src/lib/ai/frictionEngine.ts'
with open(path, 'r') as f:
    content = f.read()

pattern = r"(const isMastered = subjectSets\.length > 0 && completionRatio === 1\.0;)\s+(const stabilityFactor = Math\.max\(0\.7, Math\.min\(1\.5, 0\.8 \+ completionRatio \* 0\.7\)\);)"
replacement = r"""\1
  
  const overdueSets = subjectSets.filter(c => {
    const d = c.nextRevisionDate || c.qbankNextRevisionDate;
    if (!d) return false;
    const revTime = new Date(d).getTime();
    return !isNaN(revTime) && revTime < now;
  });
  const hasOverdueSets = overdueSets.length > 0;

  \2"""

new_content = re.sub(pattern, replacement, content)

if new_content != content:
    with open(path, 'w') as f:
        f.write(new_content)
    print("Fixed hasOverdueSets using regex")
else:
    print("Regex still didn't match")
