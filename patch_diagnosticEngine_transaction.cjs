const fs = require('fs');
const file = 'artifacts/study-tracker/src/lib/diagnostics/DiagnosticEngine.ts';
let code = fs.readFileSync(file, 'utf8');

// Remove db.sync_meta, and localDb.mutation_queue from the transaction arguments
code = code.replace(/db\.sync_meta,\s*localDb\.mutation_queue/g, '');
code = code.replace(/db\.sync_meta,\s*/g, '');
code = code.replace(/localDb\.mutation_queue\s*/g, '');

fs.writeFileSync(file, code);
console.log("Patched DiagnosticEngine.ts transaction");
