const fs = require("fs");
let c = fs.readFileSync("./artifacts/study-tracker/src/lib/exam-presets.ts", "utf-8");
c = c.replace(/let subjectId: number \| string \| undefined = subject\?\.id;/g, "let subjectId = subject?.id as number;");
c = c.replace(/let systemId = system\?\.id;/g, "let systemId = system?.id as number;");
fs.writeFileSync("./artifacts/study-tracker/src/lib/exam-presets.ts", c);
