const fs = require('fs');
const file = 'artifacts/study-tracker/src/lib/firebaseSync.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const COLLECTIONS = \[\n\s+'subjects', 'systems', 'history', 'pyqYears', 'scoreLogs', 'uiPreferences', 'topicProgress'\n\];/,
  "const COLLECTIONS = [\n  'subjects', 'systems', 'history', 'pyqYears', 'scoreLogs', 'uiPreferences', 'topicProgress',\n  'curriculumSets', 'revisionSets'\n];"
);
// Also inline replace without assuming newlines in case it's one line
content = content.replace(
  /const COLLECTIONS = \[\s*'subjects', 'systems', 'history', 'pyqYears', 'scoreLogs', 'uiPreferences', 'topicProgress'\s*\];/,
  "const COLLECTIONS = ['subjects', 'systems', 'history', 'pyqYears', 'scoreLogs', 'uiPreferences', 'topicProgress', 'curriculumSets', 'revisionSets'];"
);

fs.writeFileSync(file, content);
