const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/dashboard/Home.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove OverviewStats component usage
content = content.replace(/<OverviewStats[\s\S]*?\/>/, '');
content = content.replace(/import \{ OverviewStats \} from '@\/features\/dashboard\/OverviewStats';\n?/, '');

fs.writeFileSync(file, content);
console.log("Patched successfully");
