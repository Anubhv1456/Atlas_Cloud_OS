const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/features/analytics/Analytics.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/useAtlas AnalysisLogic/g, 'useAnalyticsLogic');
content = content.replace(/Atlas Analysis/g, 'Analytics'); // Revert
content = content.replace(/<h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics<\/h1>/g, '<h1 className="text-2xl font-bold tracking-tight text-foreground">Atlas Analysis</h1>');
fs.writeFileSync(file, content);
