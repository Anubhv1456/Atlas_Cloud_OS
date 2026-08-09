const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/dashboard/homeUtils.ts', 'utf8');

code = code.replace(
  "  subjects: Subject[],\n  systems: StudySystem[],\n  now: Date\n)",
  "  subjects: Subject[],\n  systems: StudySystem[],\n  now: Date,\n  systemProgressMap: Map<number, number> = new Map()\n)"
);

code = code.replace(
  "  const incompleteSystems = sortedSystemsByPriority.filter(s => !(s.contentCompleted && s.qbankDone));",
  "  const incompleteSystems = sortedSystemsByPriority.filter(s => {\n    const progress = systemProgressMap.get(s.id!) ?? 0;\n    return progress < 100;\n  });"
);

code = code.replace(
  "    const subIncomplete = subSystems.filter(s => !(s.contentCompleted && s.qbankDone));",
  "    const subIncomplete = subSystems.filter(s => {\n      const progress = systemProgressMap.get(s.id!) ?? 0;\n      return progress < 100;\n    });"
);

code = code.replace(
  "    const subIncomplete = subSystems.filter(s => !(s.contentCompleted && s.qbankDone));",
  "    const subIncomplete = subSystems.filter(s => {\n      const progress = systemProgressMap.get(s.id!) ?? 0;\n      return progress < 100;\n    });"
);

fs.writeFileSync('artifacts/study-tracker/src/features/dashboard/homeUtils.ts', code);
console.log('homeUtils.ts patched');
