const fs = require('fs');
const file = './artifacts/study-tracker/src/lib/recommendations/nextActionEngine.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/    if \(isPinned\) \{\n      if \(isAgingPin\) \{\n        badges.push\(\{ label: '⭐ Stale Pin', variant: 'amber', iconType: 'clock' \}\);\n      \} else \{\n        badges.push\(\{ label: '⭐ Pinned', variant: 'primary', iconType: 'target' \}\);\n      \}\n    \} else if \(wasPinned\) \{\n      badges.push\(\{ label: '⏳ Auto-Unpinned', variant: 'muted', iconType: 'clock' \}\);\n    \}\n/g, "");

fs.writeFileSync(file, code);
