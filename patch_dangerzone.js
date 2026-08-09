const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/hooks/useDangerZone.ts', 'utf8');

code = code.replace(/db\.uiPreferences(\]?\, async \(\) => \{)/, "db.uiPreferences, db.topicProgress$1");
code = code.replace(/(await db\.uiPreferences\.clear\(\);)/, "$1\n        await db.topicProgress.clear();");

fs.writeFileSync('artifacts/study-tracker/src/hooks/useDangerZone.ts', code);
console.log('useDangerZone updated');
