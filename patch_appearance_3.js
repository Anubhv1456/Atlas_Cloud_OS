const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/settings/AppearanceSection.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('onClick={() => toggleTheme()}', 'onClick={() => toggleTheme(!isDark)}');
fs.writeFileSync(file, content);
