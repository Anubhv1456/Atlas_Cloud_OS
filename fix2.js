const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/subjects/SubjectDetail.hooks.ts', 'utf8');

code = code.replace(/const allTopicsStr = allTopicIds\.join\(','\);\n\s*const topicProgresses = useLiveQuery\(\(\) => db\.topicProgress\.where\('topicId'\)\.anyOf\(allTopicIds\)\.toArray\(\), \[allTopicsStr\]\) \|\| \[\];\n\n\s*const totalTasks     = allTopicIds\.length \* 2;\n\s*const completedTasks = topicProgresses\.reduce\(\(acc, tp\) => \{\n\s*let done = 0;\n\s*if \(tp\.contentStatus === 'completed'\) done\+\+;\n\s*if \(tp\.qbankStatus === 'completed'\) done\+\+;\n\s*return acc \+ done;\n\s*\}, 0\);/m, 
`const allTopicIds = systems.flatMap(sys => {
    const os = ALL_SYSTEMS.find(s => s.name === sys.name);
    return os ? os.topics.map(t => t.id) : [];
  });
  
  const allTopicsStr = allTopicIds.join(',');
  const topicProgresses = useLiveQuery(() => db.topicProgress.where('topicId').anyOf(allTopicIds).toArray(), [allTopicsStr]) || [];

  const totalTasks     = allTopicIds.length * 2;
  const completedTasks = topicProgresses.reduce((acc, tp) => {
    let done = 0;
    if (tp.contentStatus === 'completed') done++;
    if (tp.qbankStatus === 'completed') done++;
    return acc + done;
  }, 0);`);

fs.writeFileSync('artifacts/study-tracker/src/features/subjects/SubjectDetail.hooks.ts', code);
