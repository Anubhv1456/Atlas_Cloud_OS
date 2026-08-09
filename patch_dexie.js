const fs = require('fs');
const file = 'artifacts/study-tracker/src/lib/exam-presets.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
/await db\.transaction\('rw', db\.subjects, db\.systems, db\.uiPreferences, db\.topicProgress, db\.history, db\.pyqYears, db\.scoreLogs, async \(\) => \{/,
"await db.transaction('rw', [db.subjects, db.systems, db.uiPreferences, db.topicProgress, db.history, db.pyqYears, db.scoreLogs], async () => {"
);

fs.writeFileSync(file, content);
