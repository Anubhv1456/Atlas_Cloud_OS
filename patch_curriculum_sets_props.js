const fs = require('fs');
const file = './artifacts/study-tracker/src/features/subjects/CurriculumSets.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /subjectName=\{ALL_SUBJECTS\.find\(\(s\) => s\.id === subjectId\)\?\.name \|\| 'Subject'\}/g,
  "allTopics={topics}"
);

fs.writeFileSync(file, code);
