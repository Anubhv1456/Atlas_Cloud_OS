const fs = require('fs');

const file = './artifacts/study-tracker/src/pages/Migration.tsx';
let content = fs.readFileSync(file, 'utf8');

// Account Setup -> Data Synchronization
content = content.replace('Account Setup', 'Data Synchronization');
content = content.replace(
  'We found existing offline data. Since you just logged in, would you like to move this data to the cloud?',
  'Offline progress detected. Would you like to sync this data securely to your cloud account?'
);
content = content.replace('Move data to cloud', 'Sync to Cloud');
content = content.replace('Discard local data', 'Discard Offline Progress');

content = content.replace(
  'We found both local offline data and existing cloud data for this account. How would you like to proceed?',
  'Conflict detected between offline progress and cloud storage.'
);
content = content.replace('Overwrite cloud with local data', 'Keep Offline Progress');
content = content.replace('Overwrite local with cloud data', 'Restore from Cloud');

fs.writeFileSync(file, content);
