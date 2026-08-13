const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/features/analytics/ScoreLogModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `      const logData: Omit<ScoreLog, 'id'> = {
        type,
        subjectId,
        systemId: systemId || undefined,
        topicId: topicId || undefined,
        pyqYearId: pyqYearId || undefined,
        title: logTitle,
        score: scoreNum,
        total: totalNum,
        percentage,
        timestamp: new Date(dateStr),
        notes: notes.trim() || undefined,
      };`;

const replacement = `      const logData: any = {
        type,
        subjectId: subjectId || 'gt',
        systemId: systemId || null,
        topicId: topicId || null,
        pyqYearId: pyqYearId || null,
        title: logTitle,
        score: scoreNum,
        total: totalNum,
        percentage,
        timestamp: new Date(dateStr),
        notes: notes.trim() || null,
      };
      
      // Clean undefined and nulls to prevent Firestore errors
      Object.keys(logData).forEach(key => {
        if (logData[key] === undefined || logData[key] === null) {
          delete logData[key];
        }
      });`;

content = content.replace(target, replacement);

fs.writeFileSync(path, content);
