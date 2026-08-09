const fs = require('fs');
const file = 'artifacts/study-tracker/src/lib/sdsr-engine.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const updatedSet: Partial<CurriculumSet> = \{/g,
  "const updatedSet: any = {"
);

fs.writeFileSync(file, content);
console.log('Fixed sdsr-engine.ts again');
