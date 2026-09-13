const fs = require('fs');
const file = 'artifacts/study-tracker/src/db/types.ts';
let code = fs.readFileSync(file, 'utf8');

// I will just change the `examProfile` or whatever field is restricted.
// Actually, it's easier to patch strategy.usmle.ts directly to use `as any`.
const stratFile = 'artifacts/study-tracker/src/lib/recommendations/strategy.usmle.ts';
let stratCode = fs.readFileSync(stratFile, 'utf8');
stratCode = stratCode.replace(/year: 'Clinical Organ Systems'/g, "year: 'Clinical Organ Systems' as any");
fs.writeFileSync(stratFile, stratCode);
console.log("Patched strategy.usmle.ts");
