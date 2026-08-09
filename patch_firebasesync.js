const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/lib/firebaseSync.ts', 'utf8');

code = code.replace(/dexieDb\.uiPreferences(, async \(\) => \{)/g, "dexieDb.uiPreferences, dexieDb.topicProgress$1");
code = code.replace(/(data\.uiPreferences = await dexieDb\.uiPreferences\.toArray\(\);)/, "$1\n    data.topicProgress = await dexieDb.topicProgress.toArray();");
code = code.replace(/(if \(data\.uiPreferences\) await dexieDb\.uiPreferences\.bulkPut\(data\.uiPreferences\);)/, "$1\n    if (data.topicProgress) await dexieDb.topicProgress.bulkPut(data.topicProgress);");

fs.writeFileSync('artifacts/study-tracker/src/lib/firebaseSync.ts', code);
console.log('firebaseSync updated');
