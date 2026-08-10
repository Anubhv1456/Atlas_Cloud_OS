import fs from 'fs';

let content = fs.readFileSync('./artifacts/study-tracker/src/features/dashboard/AtlasSkyModal.tsx', 'utf8');

// Replace standard stars with glowing SVG points
content = content.replace(
  'The Competent Physician',
  'Mastery is a journey of a thousand steps'
);

content = content.replace(
  'bg-[radial-gradient(circle_at_50%_40%,_rgba(20,184,166,0.06)_0%,_transparent_50%)]',
  'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/20 via-[#050816] to-[#050816]'
);

fs.writeFileSync('./artifacts/study-tracker/src/features/dashboard/AtlasSkyModal.tsx', content);
