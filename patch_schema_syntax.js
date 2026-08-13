const fs = require("fs");
let c = fs.readFileSync("./artifacts/study-tracker/src/db/schema.ts", "utf-8");
c = c.replace(/  \} \}\n  \}\n\n  filter/g, "  }\n\n  filter");
fs.writeFileSync("./artifacts/study-tracker/src/db/schema.ts", c);
