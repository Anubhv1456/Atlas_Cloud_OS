const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/dashboard/Home.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ runSearch \} from '@\/lib\/searchUtils';\n?/, '');
content = content.replace(/Search as SearchIcon,\s*/, '');

fs.writeFileSync(file, content);
console.log("Patched successfully");
