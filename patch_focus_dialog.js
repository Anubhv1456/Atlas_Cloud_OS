const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/components/FocusDialog.tsx', 'utf8');

code = code.replace(
  "import { useSubjects, useAllSystems, setSubjectFocus, setFocus, Subject, StudySystem } from '@/db';",
  "import { useSubjects, useAllSystems, setSubjectFocus, setFocus, Subject, StudySystem } from '@/db';\nimport { calculateSystemProgressFromTopics } from '@/lib/topic-progress';\nimport { useLiveQuery } from 'dexie-react-hooks';\nimport { db } from '@/db';\nimport { ALL_SYSTEMS } from '@/data/ontology';"
);

// We need to calculate system progress properly for each system
code = code.replace(
  "  const [search, setSearch] = useState('');",
  "  const [search, setSearch] = useState('');\n  const topicProgresses = useLiveQuery(() => db.topicProgress.toArray()) || [];\n  \n  const getSystemProgress = (sys: StudySystem) => {\n    const sysTopics = ALL_SYSTEMS[sys.subjectId]?.find(s => s.id === sys.id)?.topics || [];\n    if (sysTopics.length === 0) return 0;\n    const sysTopicIds = sysTopics.map(t => t.id);\n    const sysTopicProgresses = topicProgresses.filter(tp => sysTopicIds.includes(tp.topicId));\n    return calculateSystemProgressFromTopics(sysTopicProgresses, sysTopics.length);\n  };"
);

code = code.replace(
  "                  const completedSys = subSystems.filter(s => s.contentCompleted && s.qbankDone).length;",
  "                  const completedSys = subSystems.filter(s => getSystemProgress(s) === 100).length;"
);

code = code.replace(
  "                  const isDone = sys.contentCompleted && sys.qbankDone;",
  "                  const isDone = getSystemProgress(sys) === 100;"
);

fs.writeFileSync('artifacts/study-tracker/src/components/FocusDialog.tsx', code);
console.log('FocusDialog patched');
