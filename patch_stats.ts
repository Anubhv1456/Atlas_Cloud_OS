import fs from 'fs';

let content = fs.readFileSync('./artifacts/study-tracker/src/features/dashboard/useHomeStats.ts', 'utf8');

content = content.replace(
  "db.on('changes', dbListener as any);",
  "// @ts-ignore\n    db.on('changes', dbListener as any);"
);

content = content.replace(
  "db.on('changes').unsubscribe(dbListener as any);",
  "// @ts-ignore\n      db.on('changes').unsubscribe(dbListener as any);"
);

fs.writeFileSync('./artifacts/study-tracker/src/features/dashboard/useHomeStats.ts', content);
