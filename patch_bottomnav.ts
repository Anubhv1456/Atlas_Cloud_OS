import fs from 'fs';

let content = fs.readFileSync('./artifacts/study-tracker/src/components/BottomNav.tsx', 'utf8');

// Remove the loose dispatch line
content = content.replace("window.dispatchEvent(new CustomEvent('open-command-palette'));\n  };\n", "");

fs.writeFileSync('./artifacts/study-tracker/src/components/BottomNav.tsx', content);
