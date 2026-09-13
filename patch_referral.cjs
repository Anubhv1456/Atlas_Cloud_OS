const fs = require('fs');
const file = 'artifacts/study-tracker/src/lib/referral.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('interface GrowthSourceParam')) {
  code = `export interface GrowthSourceParam { source: string; campaign?: string; }\n` + code;
  fs.writeFileSync(file, code);
  console.log("Patched referral.ts");
}
