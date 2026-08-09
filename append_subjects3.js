const fs = require('fs');
let ontology = fs.readFileSync('artifacts/study-tracker/src/data/ontology.ts', 'utf8');
const newSubjects = JSON.parse(fs.readFileSync('new_subjects3.json', 'utf8'));

// Convert the objects to string, remove the outer array brackets
let newSubjectsStr = JSON.stringify(newSubjects, null, 4);
newSubjectsStr = newSubjectsStr.slice(1, -1).trim();

// Add a comma at the beginning to append to the array
if (newSubjectsStr.length > 0) {
  newSubjectsStr = ",\n  " + newSubjectsStr;
}

// Find the end of the UNIVERSAL_ONTOLOGY array
const endOfArrayRegex = /\n\];[\s\n]*export const ALL_TOPICS/;
if (ontology.match(endOfArrayRegex)) {
  ontology = ontology.replace(endOfArrayRegex, newSubjectsStr + "\n];\nexport const ALL_TOPICS");
  fs.writeFileSync('artifacts/study-tracker/src/data/ontology.ts', ontology);
  console.log("Appended successfully");
} else {
  console.log("Could not find the end of the array");
}
