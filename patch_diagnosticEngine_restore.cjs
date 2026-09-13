const fs = require('fs');
const file = 'artifacts/study-tracker/src/lib/diagnostics/DiagnosticEngine.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/await \.toArray\(\)/g, 'await localDb.mutation_queue.toArray()');
code = code.replace(/await \.delete/g, 'await localDb.mutation_queue.delete');
code = code.replace(/await \.clear\(\)/g, 'await localDb.mutation_queue.clear()');

fs.writeFileSync(file, code);
console.log("Restored mutation_queue");
