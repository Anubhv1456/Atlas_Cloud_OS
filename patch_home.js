const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/features/dashboard/Home.tsx';
let data = fs.readFileSync(file, 'utf8');

// Find the start of Knowledge Insights and remove it until SubjectsGrid
const startIndex = data.indexOf('{/* ── Knowledge Insights');
const endIndex = data.indexOf('<SubjectsGrid');

if (startIndex !== -1 && endIndex !== -1) {
  data = data.substring(0, startIndex) + data.substring(endIndex);
}

fs.writeFileSync(file, data);
