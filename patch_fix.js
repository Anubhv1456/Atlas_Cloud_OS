const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/components/dashboard/NextActionCard.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
  "setLocation(`/subjects/${rec.subjectId}?systemId=${rec.systemId}${rec.curriculumSetId ? `&setId=\\${rec.curriculumSetId}` : ''}`);",
  "setLocation(`/subjects/${rec.subjectId}?systemId=${rec.systemId}${rec.curriculumSetId ? `&setId=${rec.curriculumSetId}` : ''}`);"
);

fs.writeFileSync(file, data);
