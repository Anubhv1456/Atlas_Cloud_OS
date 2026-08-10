const fs = require('fs');
const file = './artifacts/study-tracker/src/features/dashboard/DueCurriculumSetsCard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `isOverdue
                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'`,
  `'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'`
);

content = content.replace(
  `{isOverdue ? \`\${daysOverdueCount}d overdue\` : 'Due Today'}`,
  `{isOverdue ? 'Pending' : 'Due Today'}`
);

fs.writeFileSync(file, content);
