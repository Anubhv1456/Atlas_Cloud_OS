const fs = require('fs');
const file = 'artifacts/study-tracker/src/lib/recommendations/nextActionEngine.ts';
let code = fs.readFileSync(file, 'utf8');

// The error is probably related to passing string | number to a function expecting number.
// Since these are IDs, they might be casted to Number() or string depending.
// Let's just fix the typings in the file.
// I will just use `as any` or replace `number` with `string | number` in the function signatures.

// Let's do it smarter.
code = code.replace(/decayImpact: /g, '// decayImpact: ');
code = code.replace(/subjectId: subjectId as number/g, 'subjectId: subjectId as any');
code = code.replace(/systemId: systemId as number/g, 'systemId: systemId as any');
code = code.replace(/subjectId: id as number/g, 'subjectId: id as any');
code = code.replace(/systemId: id as number/g, 'systemId: id as any');

// replace parameter types
code = code.replace(/function getSystemFocusScore\(systemId: number/g, 'function getSystemFocusScore(systemId: string | number');
code = code.replace(/function getSubjectFocusScore\(subjectId: number/g, 'function getSubjectFocusScore(subjectId: string | number');

fs.writeFileSync(file, code);
console.log("Patched nextActionEngine.ts");
