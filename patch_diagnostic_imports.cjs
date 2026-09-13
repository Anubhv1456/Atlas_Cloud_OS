const fs = require('fs');
const file = 'artifacts/study-tracker/src/lib/diagnostics/DiagnosticEngine.ts';
let code = fs.readFileSync(file, 'utf8');

const targetImports = `import { getOntologyForExam, getLocalExamProfile } from '@/lib/exam-presets';`;
const replaceImports = `import { getOntologyForExam } from '@/data/ontology';
import { getLocalExamProfile } from '@/lib/examProfile';`;

if (code.includes(targetImports)) {
  fs.writeFileSync(file, code.replace(targetImports, replaceImports));
  console.log("Patched imports");
}
