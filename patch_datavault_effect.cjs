const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/settings/DataVaultSection.tsx';
let code = fs.readFileSync(file, 'utf8');

const effectRegex = /useEffect\(\(\) => \{\s*let isMounted = true;\s*findDuplicateSubjectGroups\(\)\.then\(groups => \{\s*if \(isMounted\) setDuplicateGroups\(groups\);\s*\}\)\.catch\(console\.error\);\s*return \(\) => \{ isMounted = false; \};\s*\}, \[subjects, systems, curriculumSets, history\]\);/g;

code = code.replace(effectRegex, '');

fs.writeFileSync(file, code);
console.log("Patched DataVaultSection.tsx effect");
