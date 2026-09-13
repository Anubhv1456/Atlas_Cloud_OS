const fs = require('fs');
const file = 'artifacts/study-tracker/src/lib/admin.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/export interface PaymentConfig \{/g, 'export interface PaymentConfig { strikePriceCents?: number; priceCents?: number;');
fs.writeFileSync(file, code);
console.log("Patched admin.ts");
