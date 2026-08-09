const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/dashboard/Home.hooks.tsx', 'utf8');

code = code.replace(/const topicProgresses = useLiveQuery\(\(\) => db\.topicProgress\.toArray\(\)\) \|\| \[\];\n/g, '');

fs.writeFileSync('artifacts/study-tracker/src/features/dashboard/Home.hooks.tsx', code);
