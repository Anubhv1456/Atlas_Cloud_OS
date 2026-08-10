const fs = require('fs');
const file = './artifacts/study-tracker/src/lib/recommendations/nextActionEngine.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `        label: \`⚡ Overdue \${daysOverdue}d\`,
        variant: 'destructive',`,
  `        label: \`⚡ Pending Review\`,
        variant: 'default',`
);

content = content.replace(
  `        label: \`⚡ Overdue \${daysOverdue}d\`,
        variant: 'destructive',`,
  `        label: \`⚡ Pending Review\`,
        variant: 'default',`
);

fs.writeFileSync(file, content);
