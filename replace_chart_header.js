const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/features/analytics/Analytics.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("Score Progress Over Time", "The Forgetting Curve");
content = content.replace("Target Benchmark: 75%", "Clinical Threshold: 75%");

fs.writeFileSync(path, content);
