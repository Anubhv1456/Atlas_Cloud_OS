const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/dashboard/Home.tsx', 'utf8');

const insertionPoint = "const { hasOnboarded, loading: onboardingLoading } = useOnboardingStatus();";
if (code.includes(insertionPoint)) {
  const replacement = insertionPoint + `

  const allTopicIds = systems.flatMap(sys => {
    const os = ALL_SYSTEMS.find(s => s.name === sys.name);
    return os ? os.topics.map(t => t.id) : [];
  });
  const allTopicsStr = allTopicIds.join(',');
  const topicProgresses = useLiveQuery(() => db.topicProgress.where('topicId').anyOf(allTopicIds).toArray(), [allTopicsStr]) || [];
  
  let topicOverallProgress = 0;
  if (allTopicIds.length > 0) {
    let sum = 0;
    for (const tp of topicProgresses) sum += calculateTopicProgressValue(tp);
    topicOverallProgress = Math.round((sum / allTopicIds.length) * 100);
  }`;
  
  code = code.replace(insertionPoint, replacement);
  fs.writeFileSync('artifacts/study-tracker/src/features/dashboard/Home.tsx', code);
  console.log('Home.tsx patched successfully.');
} else {
  console.log('Insertion point not found.');
}
