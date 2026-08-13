const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/lib/pwaAndNotifications.ts';
let code = fs.readFileSync(file, 'utf8');

const replacement = `
  // 2. Check Due System Revisions
  const now = new Date();
  let dueSystems = [];
  try {
    const table = db.curriculumSets || db.revisionSets;
    const sets = await table.filter(s => !s.deletedAt).toArray();
    dueSystems = sets.filter(sys => {
      if (!sys.nextRevisionDate) return false;
      const nextDate = new Date(sys.nextRevisionDate);
      return nextDate <= now;
    });
  } catch (e) {
    console.error(e);
  }
`;

code = code.replace(/\/\/ 2\. Check Due System Revisions[\s\S]*?\}\);/m, replacement.trim());
fs.writeFileSync(file, code);
