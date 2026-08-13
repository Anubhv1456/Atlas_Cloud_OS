sed -i "s/\[topics\]/\[topics.map(t => t.id).join(',')\]/g" /app/applet/artifacts/study-tracker/src/features/subjects/CurriculumSets.tsx
