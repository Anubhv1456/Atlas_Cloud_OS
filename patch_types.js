const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/db/types.ts';
let data = fs.readFileSync(file, 'utf8');

// Replace focus field definition multiple occurrences 
const lines = data.split('\n');
const res = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes("focus?: 'primary' | 'secondary' | null;")) {
     // Check if we just added it recently (within 5 lines)
     let found = false;
     for (let j = 1; j <= 4; j++) {
       if (res[res.length - j] && res[res.length - j].includes("focus?: 'primary' | 'secondary' | null;")) {
         found = true;
         break;
       }
     }
     if (!found) {
       res.push(line);
     }
  } else {
    res.push(line);
  }
}

fs.writeFileSync(file, res.join('\n'));
