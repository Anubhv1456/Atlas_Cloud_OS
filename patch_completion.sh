sed -i 's/(rs.revisionCount || 0) > 0/(rs.contentCompleted \&\& rs.qbankCompleted)/g' /app/applet/artifacts/study-tracker/src/features/subjects/SubjectDetail.hooks.ts
sed -i 's/(rs.revisionCount || 0) > 0/(rs.contentCompleted \&\& rs.qbankCompleted)/g' /app/applet/artifacts/study-tracker/src/features/subjects/TopicList.tsx
sed -i 's/(set.revisionCount || 0) > 0/(set.contentCompleted \&\& set.qbankCompleted)/g' /app/applet/artifacts/study-tracker/src/features/dashboard/useHomeStats.ts
sed -i 's/(set.revisionCount || 0) > 0/(set.contentCompleted \&\& set.qbankCompleted)/g' /app/applet/artifacts/study-tracker/src/features/dashboard/Home.tsx
sed -i 's/(s.revisionCount || 0) > 0/(s.contentCompleted \&\& s.qbankCompleted)/g' /app/applet/artifacts/study-tracker/src/features/dashboard/AtlasSkyPreview.tsx
