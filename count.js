const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/data/ontology.ts', 'utf8');
const match = code.match(/export const UNIVERSAL_ONTOLOGY.*?=\s*(\[.*\]);/s);
if (match) {
  const ontology = eval(match[1]);
  ontology.forEach(sub => {
    let topics = 0;
    sub.systems.forEach(sys => topics += (sys.topics ? sys.topics.length : 0));
    console.log(`${sub.name}: ${sub.systems.length} systems, ${topics} topics`);
  });
}
