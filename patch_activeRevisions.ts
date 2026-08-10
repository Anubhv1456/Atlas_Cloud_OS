import fs from 'fs';

let content = fs.readFileSync('./artifacts/study-tracker/src/features/dashboard/ActiveRevisions.tsx', 'utf8');

content = content.replace(
  'isPrimaryOverriddenByRevision: boolean;',
  `isPrimaryOverriddenByRevision: boolean;
  isPrimaryIntentStale?: boolean;
  isSecondaryIntentStale?: boolean;`
);

content = content.replace(
  'isPrimaryOverriddenByRevision,',
  `isPrimaryOverriddenByRevision,
  isPrimaryIntentStale,
  isSecondaryIntentStale,`
);

content = content.replace(
  '{/* Primary Focus */}',
  `{/* Primary Focus */}
          {isPrimaryIntentStale && (customPrimarySubject || customPrimarySystem) && (
            <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm flex items-center justify-between">
              <span className="text-amber-500 font-medium">Are you still focusing on this? (Set >72h ago)</span>
              <button onClick={(e) => {
                e.stopPropagation();
                if (customPrimarySubject?.id) setSubjectFocus(customPrimarySubject.id, null);
                if (customPrimarySystem?.id) setFocus(customPrimarySystem.id, null);
              }} className="text-xs px-2 py-1 bg-amber-500/20 text-amber-500 rounded hover:bg-amber-500/30">Clear</button>
            </div>
          )}`
);

fs.writeFileSync('./artifacts/study-tracker/src/features/dashboard/ActiveRevisions.tsx', content);
