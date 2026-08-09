const fs = require('fs');
const file = 'artifacts/study-tracker/src/db/types.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /export interface CurriculumSet {([\s\S]*?)}/,
  "export interface CurriculumSet {$1  nextRevisionDate?: string;\n  lastRevisionDate?: string;\n  currentRevisionInterval?: number;\n  revisionCount?: number;\n  averageScore?: number;\n}"
);

fs.writeFileSync(file, content);
console.log('Fixed CurriculumSet in types.ts');
