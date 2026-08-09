const fs = require('fs');
const file = 'artifacts/study-tracker/src/lib/firebaseSync.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const records = snap\.docs\.map\(d => d\.data\(\)\);/,
  `const records = snap.docs.map(d => {
          const data = d.data();
          // Convert Firestore Timestamps to Dates
          for (const key in data) {
            if (data[key] && typeof data[key] === 'object' && 'toDate' in data[key]) {
              data[key] = data[key].toDate();
            }
          }
          return data;
        });`
);

fs.writeFileSync(file, content);
