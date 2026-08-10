import fs from 'fs';

let content = fs.readFileSync('./artifacts/study-tracker/src/features/settings/Settings.tsx', 'utf8');

content = content.replace(
  'LegacyDataSection,',
  'LegacyDataSection,\n  DataExportSection,'
);

content = content.replace(
  '<LegacyDataSection />',
  '<LegacyDataSection />\n          <DataExportSection />'
);

fs.writeFileSync('./artifacts/study-tracker/src/features/settings/Settings.tsx', content);
