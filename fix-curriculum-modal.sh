sed -i "s/\[setTopics\]/\[setTopics.map(t => t.id).join(',')\]/g" /app/applet/artifacts/study-tracker/src/features/subjects/CurriculumSetScoreModal.tsx
