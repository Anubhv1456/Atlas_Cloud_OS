const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/dashboard/DueCurriculumSetsCard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /ALL_SUBJECTS\.find\(\(s\) => s\.id === set\.subjectId\)/g,
  "ALL_SUBJECTS.find((s) => Number(s.id) === Number(set.subjectId))"
);

fs.writeFileSync(file, content);
console.log('Fixed DueCurriculumSetsCard TS error');
