const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/pages/settings/LegacyDataSection.tsx', 'utf8');

code = code.replace(/db\.uiPreferences(, async \(\) => \{)/g, "db.uiPreferences, db.topicProgress$1");
code = code.replace(/(data\.uiPreferences = await db\.uiPreferences\.toArray\(\);)/, "$1\n      data.topicProgress = await db.topicProgress.toArray();");
code = code.replace(/(if \(data\.uiPreferences\) await db\.uiPreferences\.bulkPut\(data\.uiPreferences\);)/, "$1\n          if (data.topicProgress) await db.topicProgress.bulkPut(data.topicProgress);");

fs.writeFileSync('artifacts/study-tracker/src/pages/settings/LegacyDataSection.tsx', code);
console.log('LegacyDataSection updated');
