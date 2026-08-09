const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/subjects/SystemCard.hooks.tsx', 'utf8');

// First, remove the block where finalTopics is currently defined.
const finalTopicsBlock = `  // Merge ontology topics with custom topics
  let mergedTopics = ontologySystem ? [...ontologySystem.topics] : [];
  if (system.customTopics) {
    system.customTopics.forEach(ct => {
      const idx = mergedTopics.findIndex(t => t.id === ct.id);
      if (idx >= 0) {
        if (ct.deleted) {
           mergedTopics[idx] = { ...mergedTopics[idx], deleted: true } as any;
        } else {
           mergedTopics[idx] = { ...mergedTopics[idx], name: ct.name };
        }
      } else if (!ct.deleted) {
        mergedTopics.push({
           id: ct.id,
           subjectId: ontologySubject?.id || '',
           systemId: ontologySystem?.id || '',
           name: ct.name,
           highYield: false,
           estimatedStudyMinutes: 0,
           relatedTopics: [],
           aliases: [],
           pyqWeight: 0,
           difficulty: 'average'
        });
      }
    });
  }
  const finalTopics = mergedTopics.filter(t => !(t as any).deleted);`;

code = code.replace(finalTopicsBlock, '');

// Then insert it just before the useLiveQuery
const insertionPoint = `  // topics logic replaced below`;
code = code.replace(insertionPoint, finalTopicsBlock);

// Replace the !topics with !finalTopics
code = code.replace(/if \(!topics \|\| topics\.length === 0\) return \[\];/, `if (!finalTopics || finalTopics.length === 0) return [];`);

fs.writeFileSync('artifacts/study-tracker/src/features/subjects/SystemCard.hooks.tsx', code);
