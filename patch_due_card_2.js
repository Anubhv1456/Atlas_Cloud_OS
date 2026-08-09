const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/dashboard/DueCurriculumSetsCard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /ALL_SUBJECTS\.find\(\(s\) => Number\(s\.id\) === Number\(set\.subjectId\)\)/g,
  "ALL_SUBJECTS.find((s) => s.id == (set.subjectId as any))"
);

fs.writeFileSync(file, content);

const file2 = 'artifacts/study-tracker/src/features/subjects/CurriculumSetScoreModal.tsx';
let content2 = fs.readFileSync(file2, 'utf8');

content2 = content2.replace(
  /ALL_SUBJECTS\.find\(\(s\) => s\.id === curriculumSet\.subjectId\)/g,
  "ALL_SUBJECTS.find((s) => s.id == (curriculumSet.subjectId as any))"
);

fs.writeFileSync(file2, content2);
