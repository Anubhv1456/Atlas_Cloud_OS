const fs = require('fs');
let prefPath = './artifacts/study-tracker/src/features/settings/SystemPreferencesCard.tsx';
let pref = fs.readFileSync(prefPath, 'utf8');

// Fix syntax error in JSX
pref = pref.replace(/<>[\s\n]*\}\s*\/>/m, '<>');

fs.writeFileSync(prefPath, pref);
