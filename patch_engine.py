import sys

path = 'artifacts/study-tracker/src/lib/ai/frictionEngine.ts'
with open(path, 'r') as f:
    content = f.read()

# 1. Update interfaces
content = content.replace(
    "decayUrgency: 'CRITICAL' | 'ELEVATED' | 'MODERATE' | 'STABLE';",
    "decayUrgency: 'CRITICAL' | 'ELEVATED' | 'MODERATE' | 'STABLE' | 'FRESH' | 'MASTERED';"
)

content = content.replace(
    "urgency: 'CRITICAL' | 'ELEVATED' | 'MODERATE';",
    "urgency: 'CRITICAL' | 'ELEVATED' | 'MODERATE' | 'FRESH' | 'MASTERED';\n  ctaText: string;"
)

with open(path, 'w') as f:
    f.write(content)
print("done interfaces")
