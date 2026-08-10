const fs = require('fs');
const file = './artifacts/study-tracker/src/features/analytics/Analytics.tsx';
let content = fs.readFileSync(file, 'utf8');

const startMarker = `{/* KPI Cards: 3 High-Signal Real Performance Metrics (Condensed 3-Column Horizontal Grid) */}`;
const endMarker = `{/* Filter Bar */}`;

if (content.includes(startMarker) && content.includes(endMarker)) {
  const parts = content.split(startMarker);
  const afterEnd = parts[1].substring(parts[1].indexOf(endMarker));
  content = parts[0] + afterEnd;
  fs.writeFileSync(file, content);
}
