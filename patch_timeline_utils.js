const fs = require("fs");
let c = fs.readFileSync("./artifacts/study-tracker/src/features/timeline/timelineUtils.ts", "utf-8");
c = c.replace(/'revision'/g, "'revisionSystem'");
fs.writeFileSync("./artifacts/study-tracker/src/features/timeline/timelineUtils.ts", c);
