const fs = require('fs');
const file = './artifacts/study-tracker/src/features/timeline/Timeline.tsx';
let content = fs.readFileSync(file, 'utf8');

const startMarker = `{/* ── KPI Overview Grid ────────────────────────────────────────────── */}`;
const endMarker = `{/* ── Activity Heatmap ─────────────────────────────────────────────── */}`;

if (content.includes(startMarker) && content.includes(endMarker)) {
  const parts = content.split(startMarker);
  const afterEnd = parts[1].substring(parts[1].indexOf(endMarker));
  content = parts[0] + afterEnd;
  fs.writeFileSync(file, content);
}
