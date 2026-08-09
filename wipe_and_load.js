const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/lib/exam-presets.ts', 'utf8');

const regex = /export async function loadUniversalOntology\(\) \{[\s\S]*?await db\.transaction\('rw', db\.subjects, db\.systems, db\.uiPreferences, async \(\) => \{/;

const replacement = `export async function loadUniversalOntology() {
  await db.transaction('rw', db.subjects, db.systems, db.uiPreferences, db.topicProgress, db.history, db.pyqYears, db.scoreLogs, async () => {
    // Purge the local database to force implement the Atlas ontology template
    await db.subjects.clear();
    await db.systems.clear();
    await db.uiPreferences.clear();
    await db.topicProgress.clear();
    await db.history.clear();
    await db.pyqYears.clear();
    await db.scoreLogs.clear();
`;

code = code.replace(regex, replacement);
fs.writeFileSync('artifacts/study-tracker/src/lib/exam-presets.ts', code);
