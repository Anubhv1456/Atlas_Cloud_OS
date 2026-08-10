const fs = require('fs');
const file = './artifacts/study-tracker/src/lib/recommendations/nextActionEngine.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/badges.push\(\{ label: \\\`🎯 High Yield \\\(\\\$\\{yieldInfo\.tag\.split\\\('•'\\\)\\\[0\\\]\.trim\\\(\)\\}\\\)\\\`, variant: 'primary', iconType: 'target' \}\);/g, 
  "badges.push({ label: '🎯 High Yield', variant: 'primary', iconType: 'target' });");

fs.writeFileSync(file, code);
