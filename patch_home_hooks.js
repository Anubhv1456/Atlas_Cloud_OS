const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/dashboard/Home.hooks.tsx', 'utf8');

code = code.replace(
  "import { calculateSubjectProgress } from '@/lib/progress';",
  "import { calculateSubjectProgress } from '@/lib/progress';\nimport { calculateSystemProgressFromTopics } from '@/lib/topic-progress';"
);

const systemProgressMapLogic = `
  const topicProgresses = useLiveQuery(() => db.topicProgress.toArray()) || [];
  
  const systemProgressMap = useMemo(() => {
    const map = new Map<number, number>();
    systems.forEach(sys => {
      const sysTopics = ALL_SYSTEMS[sys.subjectId]?.find(s => s.id === sys.id)?.topics || [];
      const sysTopicIds = sysTopics.map(t => t.id);
      const sysTopicProgresses = topicProgresses.filter(tp => sysTopicIds.includes(tp.topicId));
      map.set(sys.id!, calculateSystemProgressFromTopics(sysTopicProgresses, sysTopics.length));
    });
    return map;
  }, [systems, topicProgresses]);

  const {
`;

code = code.replace(
  "  const {\n    customPrimarySubject,",
  systemProgressMapLogic + "    customPrimarySubject,"
);

code = code.replace(
  "  } = determineFocusSystems(subjects, systems, new Date());",
  "  } = determineFocusSystems(subjects, systems, new Date(), systemProgressMap);"
);

fs.writeFileSync('artifacts/study-tracker/src/features/dashboard/Home.hooks.tsx', code);
console.log('Home.hooks.tsx patched');
