const fs = require('fs');

let content = fs.readFileSync('./artifacts/study-tracker/src/features/dashboard/AtlasSkyModal.tsx', 'utf8');

content = content.replace(
  'const northStarOpacity = completedStars.length / 19;',
  'const northStarOpacity = globalHealth / 100;'
);

fs.writeFileSync('./artifacts/study-tracker/src/features/dashboard/AtlasSkyModal.tsx', content);
