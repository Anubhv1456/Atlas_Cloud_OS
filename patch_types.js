const fs = require('fs');
const file = './artifacts/study-tracker/src/db/types.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /export interface StudySystem \{\n  id\?: string;\n  subjectId: number;\n  name: string;\n  order\?: number;/g,
  "export interface StudySystem {\n  id?: string;\n  subjectId: number;\n  name: string;\n  order?: number;\n  isHighYield?: boolean;"
);

fs.writeFileSync(file, code);
