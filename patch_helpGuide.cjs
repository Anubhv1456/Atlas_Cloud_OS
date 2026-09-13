const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/components/HelpGuideModal.tsx', 'utf8');

code = code.replace(/The dashboard automatically calculates your daily question pace and revision velocity\./, 'The dashboard automatically calculates your required study velocity.');

fs.writeFileSync('artifacts/study-tracker/src/components/HelpGuideModal.tsx', code);
