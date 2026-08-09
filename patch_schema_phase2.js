const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/db/schema.ts', 'utf8');

// We need to add topicProgress table to Dexie
code = code.replace(/uiPreferences!: Table<T.UIPreference, string>;/, "uiPreferences!: Table<T.UIPreference, string>;\n  topicProgress!: Table<T.TopicProgress, string>;");

// Let's add a version 14 for the new topic progress table
const v14 = `
    this.version(14).stores({
      subjects: '++id, name',
      systems: '++id, subjectId, name, updatedAt, nextRevisionDate, revisionState',
      history: '++id, subjectId, systemId, completedAt',
      pyqYears: '++id, subjectId',
      scoreLogs: '++id, type, subjectId, systemId, pyqYearId, timestamp',
      uiPreferences: 'id, type, entityId',
      topicProgress: 'topicId, contentStatus, qbankStatus, nextRevisionDate, updatedAt'
    });
`;

code = code.replace(/(\}\s*\n\}?\s*export const db = new AtlasDB\(\);)/, v14 + "$1");
fs.writeFileSync('artifacts/study-tracker/src/db/schema.ts', code);
console.log('schema updated');
