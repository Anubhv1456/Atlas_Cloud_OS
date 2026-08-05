const fs = require('fs');
const files = [
  '/app/applet/artifacts/study-tracker/src/pages/settings/PWASection.tsx',
  '/app/applet/artifacts/study-tracker/src/features/dashboard/Home.tsx',
  '/app/applet/artifacts/study-tracker/src/features/subjects/SubjectDetail.tsx',
  '/app/applet/artifacts/study-tracker/src/pages/Settings.tsx'
];

for (let file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/study logs/g, 'navigation logs');
  content = content.replace(/revision schedules/g, 'alignment schedules');
  content = content.replace(/past exam scores/g, 'past resonances');
  content = content.replace(/flashcard updates/g, 'waypoint updates');
  content = content.replace(/study tracker/gi, 'navigation tracker');
  content = content.replace(/study /gi, 'navigation ');
  
  fs.writeFileSync(file, content);
}
