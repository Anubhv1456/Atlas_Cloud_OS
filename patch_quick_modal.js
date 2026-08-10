const fs = require('fs');
const modalFile = './artifacts/study-tracker/src/features/mistakes/QuickMistakeModal.tsx';
let modalContent = fs.readFileSync(modalFile, 'utf8');

modalContent = modalContent.replace(
  /const errorTypePills = \[[\s\S]*?\];/,
  `const errorTypePills = [
    {
      id: 'concept' as const,
      label: 'Knowledge Gap',
      icon: Brain,
      color: 'border-rose-500/40 text-rose-600 bg-rose-500/10 dark:text-rose-400',
      description: 'Missing concept'
    },
    {
      id: 'misread' as const,
      label: 'Silly Mistake',
      icon: Eye,
      color: 'border-amber-500/40 text-amber-600 bg-amber-500/10 dark:text-amber-400',
      description: 'Read the question wrong'
    }
  ];`
);

fs.writeFileSync(modalFile, modalContent);
