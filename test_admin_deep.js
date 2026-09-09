const tsNode = require('ts-node');
tsNode.register({ transpileOnly: true });

try {
  const admin = require('./artifacts/study-tracker/src/features/admin/AdminDashboard.tsx');
  console.log('Admin imports:', Object.keys(admin));
  
  const analytics = require('./artifacts/study-tracker/src/features/admin/views/AnalyticsView.tsx');
  console.log('AnalyticsView exports:', Object.keys(analytics));
  
  const ops = require('./artifacts/study-tracker/src/features/admin/views/OpsQueueView.tsx');
  console.log('OpsQueueView exports:', Object.keys(ops));
  
  const dir = require('./artifacts/study-tracker/src/features/admin/views/DirectoryView.tsx');
  console.log('DirectoryView exports:', Object.keys(dir));
  
  const settings = require('./artifacts/study-tracker/src/features/admin/views/SettingsView.tsx');
  console.log('SettingsView exports:', Object.keys(settings));

} catch (e) {
  console.error("Failed to load:", e);
}
