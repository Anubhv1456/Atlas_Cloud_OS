const fs = require('fs');
let index = fs.readFileSync('./artifacts/study-tracker/src/features/settings/index.ts', 'utf8');
index = index.replace("export * from './AppearanceSection';\\n", "");
fs.writeFileSync('./artifacts/study-tracker/src/features/settings/index.ts', index);
