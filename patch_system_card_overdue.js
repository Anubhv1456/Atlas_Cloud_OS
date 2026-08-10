const fs = require('fs');
const file = './artifacts/study-tracker/src/features/subjects/SystemCard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `revisionOverdue && 'border-destructive/50'`,
  `revisionOverdue && 'border-amber-500/50'`
);

content = content.replace(
  `revisionOverdue
              ? 'bg-destructive/10 text-destructive'
              : 'bg-amber-500/10 text-amber-500'`,
  `'bg-amber-500/10 text-amber-600 dark:text-amber-500'`
);

content = content.replace(
  `{revisionOverdue
              ? \`Revision overdue — \${overdueDays} day\${overdueDays !== 1 ? 's' : ''}\`
              : 'Revision due today'}`,
  `{revisionOverdue
              ? 'Pending Review'
              : 'Revision Due Today'}`
);

content = content.replace(
  `className={revisionOverdue ? 'text-destructive font-semibold' : revisionDue ? 'text-amber-500 dark:text-amber-400 font-semibold' : 'text-emerald-500 dark:text-emerald-400 font-semibold'}`,
  `className={revisionDue ? 'text-amber-600 dark:text-amber-500 font-semibold' : 'text-emerald-500 dark:text-emerald-400 font-semibold'}`
);

fs.writeFileSync(file, content);
