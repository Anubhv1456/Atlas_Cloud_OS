const tsNode = require('ts-node');
tsNode.register({ transpileOnly: true });
const settings = require('./artifacts/study-tracker/src/features/settings/index.ts');
const required = ['AccountSection', 'ExamProfileSection', 'SystemPreferencesCard', 'AIAssistantSection', 'PermissionsDiagnosticsSection', 'DataVaultSection', 'PWASection', 'FaqSection', 'FeedbackSection', 'ContactSection', 'ReferralSection', 'AboutSection', 'DangerZoneSection'];

let hasError = false;
for (const r of required) {
  if (settings[r] === undefined) {
    console.log('MISSING:', r);
    hasError = true;
  }
}
if (!hasError) console.log('ALL PRESENT');
