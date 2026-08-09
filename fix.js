const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/subjects/SubjectDetail.hooks.ts', 'utf8');

const regex = /const totalTasks\s+=\s+allTopicIds\.length \* 2;[\s\S]*?const allTopicsStr = allTopicIds\.join\(','\);\n\s*const topicProgresses = [^\n]*;/m;

const replacement = `const allTopicIds = systems.flatMap(sys => {
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
  }, 0);`;

code = code.replace(regex, replacement);
// also we need to remove the original allTopicIds definition which is lower down
code = code.replace(/const allTopicIds = systems\.flatMap\([\s\S]*?\n\s*\}\);/, '');

fs.writeFileSync('artifacts/study-tracker/src/features/subjects/SubjectDetail.hooks.ts', code);
