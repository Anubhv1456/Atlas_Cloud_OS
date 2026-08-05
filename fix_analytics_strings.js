const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/features/analytics/Analytics.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/Active Subjects/g, 'Active Territories');
content = content.replace(/All Subjects/g, 'All Territories');
content = content.replace(/All Systems/g, 'All Waypoints');
content = content.replace(/System Average Comparison/g, 'Waypoint Average Comparison');
content = content.replace(/Average accuracy per system/g, 'Average accuracy per waypoint');
content = content.replace(/No system test data available/g, 'No waypoint resonance data available');
content = content.replace(/system mastery performance/g, 'waypoint mastery performance');
content = content.replace(/system test data/g, 'waypoint resonance data');
content = content.replace(/Subject Filter/g, 'Territory Filter');
content = content.replace(/System Filter/g, 'Waypoint Filter');

fs.writeFileSync(file, content);
