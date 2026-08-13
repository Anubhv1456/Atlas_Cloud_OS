const fs = require("fs");
let c = fs.readFileSync("./artifacts/study-tracker/src/features/subjects/CurriculumSets.tsx", "utf-8");
c = c.replace(/import \{ DropdownMenu \} from '..\/..\/components\/ui\/dropdown-menu';/g, "");
fs.writeFileSync("./artifacts/study-tracker/src/features/subjects/CurriculumSets.tsx", c);
