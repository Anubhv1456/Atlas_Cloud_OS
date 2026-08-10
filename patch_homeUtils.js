const fs = require('fs');
const file = './artifacts/study-tracker/src/features/dashboard/homeUtils.ts';
let content = fs.readFileSync(file, 'utf8');

const sortSystemsByPriority = `  const sortSystemsByPriority = (a: StudySystem, b: StudySystem) => {
    if (a.isHighYield && !b.isHighYield) return -1;
    if (!a.isHighYield && b.isHighYield) return 1;

    const subIdxA = subjectIndexMap.get(a.subjectId) ?? Number.MAX_VALUE;
    const subIdxB = subjectIndexMap.get(b.subjectId) ?? Number.MAX_VALUE;
    if (subIdxA !== subIdxB) return subIdxA - subIdxB;
    return (a.order ?? Number.MAX_VALUE) - (b.order ?? Number.MAX_VALUE);
  };`;

content = content.replace(
    /const sortSystemsByPriority = \(a: StudySystem, b: StudySystem\) => \{[\s\S]+?return \(a\.order \?\? Number\.MAX_VALUE\) - \(b\.order \?\? Number\.MAX_VALUE\);\s*\};/,
    sortSystemsByPriority
);

fs.writeFileSync(file, content);
console.log('patched homeUtils');
