const fs = require('fs');
const content = fs.readFileSync('artifacts/study-tracker/src/data/ontology.ts', 'utf8');

// Match all subjects by ID
const matches = [...content.matchAll(/"id": "(SUB_\d+)",\s*"name": "([^"]+)"/g)];
matches.forEach(m => console.log(m[1] + " : " + m[2]));
