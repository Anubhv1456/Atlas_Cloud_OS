const fs = require('fs');
const file = './artifacts/study-tracker/src/features/subjects/SystemCard.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /<CurriculumSets systemId=\{system\.id!\} subjectId=\{system\.subjectId\} topics=\{finalTopics\} \/>/g,
  "<CurriculumSets systemId={system.id!} subjectId={system.subjectId} topics={finalTopics} onLogScore={handleSetLogScore} />"
);

fs.writeFileSync(file, code);
