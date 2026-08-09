const fs = require('fs');
const file = 'artifacts/study-tracker/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "localStorage.getItem('ontology_medicine_fix')",
  "localStorage.getItem('ontology_psychiatry_fix')"
);
content = content.replace(
  "localStorage.setItem('ontology_medicine_fix', 'true');",
  "localStorage.setItem('ontology_psychiatry_fix', 'true');"
);

fs.writeFileSync(file, content);
