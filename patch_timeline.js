const fs = require("fs");
let c = fs.readFileSync("./artifacts/study-tracker/src/features/timeline/Timeline.hooks.tsx", "utf-8");
c = c.replace(/systemToRevisionEvent\(sys, sub\?\.name \?\? '', 'upcoming'\)/g, "systemToRevisionEvent(sys, sub?.name ?? '', 'upcoming', curriculumSets)");
c = c.replace(/systemToRevisionEvent\(sys, sub\?\.name \?\? '', 'overdue'\)/g, "systemToRevisionEvent(sys, sub?.name ?? '', 'overdue', curriculumSets)");
c = c.replace(/systemToRevisionEvent\(sys, sub\?\.name \?\? '', 'upcoming', curriculumSets\)/g, "systemToRevisionEvent(sys, sub?.name ?? '', 'upcoming', curriculumSets)");
c = c.replace(/systemToRevisionEvent\(sys, sub\?\.name \?\? '', 'overdue', curriculumSets\)/g, "systemToRevisionEvent(sys, sub?.name ?? '', 'overdue', curriculumSets)");
fs.writeFileSync("./artifacts/study-tracker/src/features/timeline/Timeline.hooks.tsx", c);
