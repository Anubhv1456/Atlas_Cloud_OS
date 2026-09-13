const fs = require('fs');
const file = 'artifacts/study-tracker/src/lib/diagnostics/DiagnosticEngine.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/import \{ db \} from '@\/db\/schema';/, "import { db } from '@/db/schema';\nimport { localDb } from '@/db/localDb';");

code = code.replace(/await db\.sync_meta\.get/g, 'await localDb.sync_meta.get');
code = code.replace(/await db\.mutation_queue\.toArray/g, 'await localDb.mutation_queue.toArray');
code = code.replace(/await db\.mutation_queue\.clear/g, 'await localDb.mutation_queue.clear');
code = code.replace(/await db\.sync_meta\.put/g, 'await localDb.sync_meta.put');

fs.writeFileSync(file, code);
console.log("Patched DiagnosticEngine.ts");
