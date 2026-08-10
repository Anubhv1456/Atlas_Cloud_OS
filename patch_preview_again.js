const fs = require('fs');
const file = './artifacts/study-tracker/src/features/dashboard/AtlasSkyPreview.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `  const curriculumSets = useLiveQuery(() => (db.curriculumSets || db.revisionSets)?.toArray()) || [];`,
  `  const subjects = useLiveQuery(() => db.subjects.toArray()) || [];
  const systems = useLiveQuery(() => db.systems.toArray()) || [];
  const curriculumSets = useLiveQuery(() => (db.curriculumSets || db.revisionSets)?.toArray()) || [];`
);

fs.writeFileSync(file, content);
