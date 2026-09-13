const fs = require('fs');
const file = 'artifacts/study-tracker/src/lib/diagnostics/DiagnosticEngine.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/db\.mutation_queue/g, 'localDb.mutation_queue');

fs.writeFileSync(file, code);
console.log("Patched DiagnosticEngine.ts again");
