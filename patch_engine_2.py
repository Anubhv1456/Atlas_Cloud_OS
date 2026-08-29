import sys

path = 'artifacts/study-tracker/src/lib/ai/frictionEngine.ts'
with open(path, 'r') as f:
    content = f.read()

target = """  const daysSinceReview = lastActivityDate > 0 
    ? Math.max(1, Math.round((now - lastActivityDate) / (1000 * 60 * 60 * 24)))
    : 30; // Default to 30 days if unreviewed"""

replacement = """  const hasStarted = relevantHistory.length > 0 || subjectMistakes.length > 0 || subjectSets.length > 0;
  
  const daysSinceReview = lastActivityDate > 0 
    ? Math.max(1, Math.round((now - lastActivityDate) / (1000 * 60 * 60 * 24)))
    : 0;"""

if target in content:
    content = content.replace(target, replacement)
    print("replaced daysSinceReview")

target2 = """  const hasStarted = relevantHistory.length > 0 || subjectMistakes.length > 0 || subjectSets.length > 0;"""
# Remove the old hasStarted since we moved it up. 
# Wait, it's safer to just replace from daysSinceReview down to hasStarted.

with open(path, 'w') as f:
    f.write(content)
