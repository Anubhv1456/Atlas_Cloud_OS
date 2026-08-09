const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/subjects/SystemCard.hooks.tsx', 'utf8');

// Add imports
code = code.replace(
  "import { toast } from 'sonner';",
  "import { toast } from 'sonner';\nimport { useLiveQuery } from 'dexie-react-hooks';\nimport { ALL_SYSTEMS } from '@/data/ontology';\nimport { calculateSystemProgressFromTopics } from '@/lib/topic-progress';"
);

// Replace progress calculation
code = code.replace(
  "  // Progress\n  const progress       = calculateSystemProgress(system);",
  `  const ontologySystem = ALL_SYSTEMS.find(s => s.name === system.name);
  const topics = ontologySystem?.topics || [];
  const topicProgresses = useLiveQuery(
    () => db.topicProgress.where('topicId').anyOf(topics.map(t => t.id)).toArray(),
    [topics]
  ) || [];
  
  // Progress
  const progress       = calculateSystemProgressFromTopics(topicProgresses, topics.length);`
);

fs.writeFileSync('artifacts/study-tracker/src/features/subjects/SystemCard.hooks.tsx', code);
console.log('SystemCard.hooks updated');
