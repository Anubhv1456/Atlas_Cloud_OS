const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/db/schema.ts';
let data = fs.readFileSync(file, 'utf8');
data = data.replace(/    \}\);\n  \}\n\}/, `    });

    this.version(18).stores({
      subjects: '++id, name',
      systems: '++id, subjectId, name, updatedAt, nextRevisionDate, revisionState',
      history: '++id, subjectId, systemId, completedAt',
      pyqYears: '++id, subjectId',
      scoreLogs: '++id, type, subjectId, systemId, pyqYearId, timestamp',
      uiPreferences: 'id, type, entityId',
      topicProgress: 'topicId, contentStatus, qbankStatus, nextRevisionDate, updatedAt',
      curriculumSets: 'id, subjectId, systemId, name, createdAt, updatedAt',
      revisionSets: 'id, subjectId, systemId, name, createdAt, updatedAt',
      mistakeLogs: '++id, subjectId, systemId, curriculumSetId, topicId, errorType, resolved, createdAt',
      recommendationSkips: '++id, targetId, expiresAt'
    });
  }
}`);
fs.writeFileSync(file, data);
