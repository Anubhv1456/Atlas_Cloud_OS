import fs from 'fs';

let content = fs.readFileSync('./artifacts/study-tracker/src/db/mutations.ts', 'utf8');

content = content.replace(
  'async function updateUIPref(type: \'subject\' | \'system\', entityId: number, updates: Partial<UIPreference>) {',
  `async function updateUIPref(type: 'subject' | 'system', entityId: number, updates: Partial<UIPreference>) {
  if ('focus' in updates) {
    updates.focusUpdatedAt = new Date();
  }`
);

fs.writeFileSync('./artifacts/study-tracker/src/db/mutations.ts', content);
