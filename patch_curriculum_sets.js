const fs = require('fs');
const file = './artifacts/study-tracker/src/features/subjects/CurriculumSets.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add import for logCompletion
content = content.replace(
    /import \{ db \} from '@\/db';/g,
    `import { db } from '@/db';\nimport { logCompletion } from '@/db/mutations';`
);

// Replace togglePhase
const newTogglePhase = `  const togglePhase = async (setId: string, phase: 'content' | 'qbank', currentValue: boolean | undefined) => {
    const targetDbTable = db.curriculumSets || db.revisionSets;
    const isNowCompleted = !currentValue;
    const set = curriculumSets.find(s => s.id === setId);
    let subjectName = '';
    if (set) {
      const sub = await db.subjects.get(set.subjectId);
      if (sub) subjectName = sub.name;
    }

    if (phase === 'content') {
      await targetDbTable.update(setId, { contentCompleted: isNowCompleted, updatedAt: new Date() });
      if (isNowCompleted && set) {
        await logCompletion({
            subjectId: set.subjectId,
            subjectName,
            systemId: set.systemId,
            systemName: set.name,
            taskKey: 'contentDone',
            taskLabel: set.name + ' Content',
            completedAt: new Date()
        });
      }
    } else {
      await targetDbTable.update(setId, { qbankCompleted: isNowCompleted, updatedAt: new Date() });
      if (isNowCompleted && set) {
        await logCompletion({
            subjectId: set.subjectId,
            subjectName,
            systemId: set.systemId,
            systemName: set.name,
            taskKey: 'qbankDone',
            taskLabel: set.name + ' QBank',
            completedAt: new Date()
        });
      }
    }
  };`;

content = content.replace(
    /const togglePhase = async \([^\{]+\{[\s\S]+?  \};\n/g,
    newTogglePhase + '\n'
);

fs.writeFileSync(file, content);
console.log('patched curriculum sets');
