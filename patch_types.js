const fs = require('fs');
const p = 'artifacts/study-tracker/src/db/types.ts';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(
  "  recalibrationCount?: number; // Total consumed recalibration resets",
  "  recalibrationCount?: number; // Total consumed recalibration resets\n  recalibrationStartedAt?: string;\n  isAutoTriggered?: boolean;\n  dormancyDaysDetected?: number;"
);
fs.writeFileSync(p, c);
