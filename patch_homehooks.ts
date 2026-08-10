import fs from 'fs';

let content = fs.readFileSync('./artifacts/study-tracker/src/features/dashboard/Home.hooks.tsx', 'utf8');

content = content.replace(
  'isSecondaryDaysOverdue',
  'isSecondaryDaysOverdue'
);

content = content.replace(
  'isPrimaryOverriddenByRevision,',
  `isPrimaryOverriddenByRevision,
    isPrimaryIntentStale,
    isSecondaryIntentStale,`
);

content = content.replace(
  'primaryFocus, primaryFocusSubject, customPrimarySubject, customPrimarySystem, isAutoPrimary, isPrimaryOverriddenByRevision,',
  `primaryFocus, primaryFocusSubject, customPrimarySubject, customPrimarySystem, isAutoPrimary, isPrimaryOverriddenByRevision, isPrimaryIntentStale,`
);

content = content.replace(
  'secondaryFocus, secondaryFocusSubject, customSecondarySubject, customSecondarySystem, isAutoSecondary, isSecondaryOverriddenByRevision,',
  `secondaryFocus, secondaryFocusSubject, customSecondarySubject, customSecondarySystem, isAutoSecondary, isSecondaryOverriddenByRevision, isSecondaryIntentStale,`
);

fs.writeFileSync('./artifacts/study-tracker/src/features/dashboard/Home.hooks.tsx', content);
