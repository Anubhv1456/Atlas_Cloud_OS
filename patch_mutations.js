const fs = require('fs');
const file = './artifacts/study-tracker/src/db/mutations.ts';
let content = fs.readFileSync(file, 'utf8');

// replace the transaction tables to include curriculumSets
content = content.replace(
    /return await db\.transaction\('rw', db\.history, db\.systems, db\.pyqYears, async \(\) => \{/g,
    `return await db.transaction('rw', db.history, db.systems, db.pyqYears, db.curriculumSets, async () => {`
);

const newRollbackLogic = `    if (entry.taskKey === 'curriculum_set_content') {
      const sets = await db.curriculumSets.where('subjectId').equals(entry.subjectId).toArray();
      const matchedSet = sets.find(s => entry.taskLabel.startsWith(s.name));
      if (matchedSet && matchedSet.id) {
        await db.curriculumSets.update(matchedSet.id, { contentCompleted: false, updatedAt: new Date(), hlc: generateHLC() });
      }
    } else if (entry.taskKey === 'curriculum_set_qbank') {
      const sets = await db.curriculumSets.where('subjectId').equals(entry.subjectId).toArray();
      const matchedSet = sets.find(s => entry.taskLabel.startsWith(s.name));
      if (matchedSet && matchedSet.id) {
        await db.curriculumSets.update(matchedSet.id, { qbankCompleted: false, updatedAt: new Date(), hlc: generateHLC() });
      }
    } else if (entry.taskKey === 'curriculum_set_revision') {
      const sets = await db.curriculumSets.where('subjectId').equals(entry.subjectId).toArray();
      const matchedSet = sets.find(s => entry.taskLabel.includes(s.name));
      if (matchedSet && matchedSet.id) {
        // very basic rollback for curriculum set revision: just decrement revision count
        const newRevCount = Math.max(0, (matchedSet.revisionCount ?? 1) - 1);
        await db.curriculumSets.update(matchedSet.id, { revisionCount: newRevCount, updatedAt: new Date(), hlc: generateHLC() });
      }
    } else if (entry.taskKey === 'qbankDone' && entry.systemId) {`;

content = content.replace(
    /if \(entry\.taskKey === 'qbankDone' && entry\.systemId\) \{/g,
    newRollbackLogic
);

fs.writeFileSync(file, content);
console.log('patched mutations');
