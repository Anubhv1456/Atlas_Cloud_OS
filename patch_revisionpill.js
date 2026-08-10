const fs = require('fs');
const file = './artifacts/study-tracker/src/features/dashboard/Home.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  if (isRevisionOverdue(sys)) return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-destructive shrink-0 bg-destructive/10 px-2.5 py-0.5 rounded-full border border-destructive/20">
      <div className="w-1.5 h-1.5 rounded-full bg-destructive" />Overdue
    </span>
  );`;

const replacement = `  if (isRevisionOverdue(sys)) return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-500 shrink-0 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />Pending Review
    </span>
  );`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
}
