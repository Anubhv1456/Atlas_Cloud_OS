const fs = require('fs');
const file = './artifacts/study-tracker/src/features/subjects/SubjectCard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `Overall Progress`,
  `Mastery`
);

content = content.replace(
  `h-2 sm:h-2.5`,
  `h-3 sm:h-4` // Make it thicker as requested ("single, thicker 'Mastery' bar")
);

fs.writeFileSync(file, content);
