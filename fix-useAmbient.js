const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/lib/ai/useAmbientVoiceSession.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/    \/\/ Proactively request mic stream on user gesture to force native PWA \/ browser permission dialog[\s\S]*?    bargeInController\.triggerBargeIn\(\);/, '    bargeInController.triggerBargeIn();');
fs.writeFileSync(file, content);
console.log("Done");
