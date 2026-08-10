import fs from 'fs';

let content = fs.readFileSync('./artifacts/study-tracker/src/features/dashboard/homeUtils.ts', 'utf8');

// Add checks for focusUpdatedAt
content = content.replace(
  'const customPrimarySubject = subjects.find(s => s.focus === \'primary\');',
  `const customPrimarySubject = subjects.find(s => s.focus === 'primary');
  const primarySubjectStale = customPrimarySubject?.focusUpdatedAt && (now.getTime() - new Date(customPrimarySubject.focusUpdatedAt).getTime() > 72 * 60 * 60 * 1000);`
);

content = content.replace(
  'const customPrimarySystem = systems.find(s => s.focus === \'primary\');',
  `const customPrimarySystem = systems.find(s => s.focus === 'primary');
  const primarySystemStale = customPrimarySystem?.focusUpdatedAt && (now.getTime() - new Date(customPrimarySystem.focusUpdatedAt).getTime() > 72 * 60 * 60 * 1000);`
);

content = content.replace(
  'const customSecondarySubject = subjects.find(s => s.focus === \'secondary\');',
  `const customSecondarySubject = subjects.find(s => s.focus === 'secondary');
  const secondarySubjectStale = customSecondarySubject?.focusUpdatedAt && (now.getTime() - new Date(customSecondarySubject.focusUpdatedAt).getTime() > 72 * 60 * 60 * 1000);`
);

content = content.replace(
  'const customSecondarySystem = systems.find(s => s.focus === \'secondary\');',
  `const customSecondarySystem = systems.find(s => s.focus === 'secondary');
  const secondarySystemStale = customSecondarySystem?.focusUpdatedAt && (now.getTime() - new Date(customSecondarySystem.focusUpdatedAt).getTime() > 72 * 60 * 60 * 1000);`
);

content = content.replace(
  'let isPrimaryOverriddenByRevision = false;',
  `let isPrimaryOverriddenByRevision = false;
  let isPrimaryIntentStale = !!(primarySubjectStale || primarySystemStale);`
);

content = content.replace(
  'let isAutoSecondary = false;',
  `let isAutoSecondary = false;
  let isSecondaryIntentStale = !!(secondarySubjectStale || secondarySystemStale);`
);

content = content.replace(
  'return {',
  `return {
    isPrimaryIntentStale,
    isSecondaryIntentStale,`
);

fs.writeFileSync('./artifacts/study-tracker/src/features/dashboard/homeUtils.ts', content);
