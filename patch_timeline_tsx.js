const fs = require("fs");
let c = fs.readFileSync("./artifacts/study-tracker/src/features/timeline/Timeline.tsx", "utf-8");
c = c.replace(/revisionSystem: \{ bg: 'bg-indigo-500\/10', text: 'text-indigo-500', Icon: BookOpen \},/g, "revisionSystem: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', Icon: BookOpen }, contentCompleted: { bg: 'bg-blue-500/10', text: 'text-blue-500', Icon: CheckCircle2 },");
fs.writeFileSync("./artifacts/study-tracker/src/features/timeline/Timeline.tsx", c);
