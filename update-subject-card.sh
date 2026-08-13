sed -i "s/return await table.where('systemId').anyOf(systemIds).toArray();/return await table.where('subjectId').equals(subject.id!).toArray().then(arr => arr.filter(s => \!s.deletedAt));/g" /app/applet/artifacts/study-tracker/src/features/subjects/SubjectCard.tsx
sed -i "s/\[systemIds.join(',')\]/\[subject.id\]/g" /app/applet/artifacts/study-tracker/src/features/subjects/SubjectCard.tsx
