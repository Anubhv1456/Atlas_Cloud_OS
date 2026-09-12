const fs = require('fs');
const p = 'artifacts/study-tracker/api/_lib/auth.ts';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(
  "localId: string;\n        email?: string;\n        emailVerified?: boolean;\n      }>;",
  "localId: string;\n        email?: string;\n        emailVerified?: boolean;\n        customAttributes?: string;\n      }>;"
);
fs.writeFileSync(p, c);
