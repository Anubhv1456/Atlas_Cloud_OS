const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/db/timeline.ts', 'utf8');

code = code.replace(
  "  | 'revisionSubject';   // subject revision (future)",
  "  | 'revisionSubject'\n  | 'topicMastered'\n  | 'topicWeak';"
);

fs.writeFileSync('artifacts/study-tracker/src/db/timeline.ts', code);
console.log('timeline.ts patched');
