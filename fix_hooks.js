const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/features/analytics/Analytics.hooks.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /  \}, \[systems, curriculumSets, subjectMap\]\);\n  \};\n/g;
content = content.replace(regex, '  }, [systems, curriculumSets, subjectMap]);\n');

fs.writeFileSync(path, content);
