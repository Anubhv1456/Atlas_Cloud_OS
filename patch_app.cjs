const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/app/ProtectedApp.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /let hasRun = false;[\s\S]*?dbEvents\.on\('change', handleInitialSync\);/;

const replacement = `let hasRun = false;

    const handleInitialSync = (table?: string) => {
      if (!hasRun && (table === 'subjects' || table === 'curriculumSets')) {
        hasRun = true;
        runFSRSMigration().catch(err => console.warn('Initial FSRS migration deferred:', err));
      }
    };
    dbEvents.on('change', handleInitialSync);`;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code);
console.log("Patched ProtectedApp.tsx");
