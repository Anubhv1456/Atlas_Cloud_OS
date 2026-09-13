const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/settings/DataVaultSection.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/import \{\s*Database,/, 'import { Database, RefreshCw,');
fs.writeFileSync(file, code);
console.log("Patched DataVaultSection.tsx import");
