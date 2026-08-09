const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/subjects/SystemCard.tsx', 'utf8');

code = code.replace(
  /\{flags\.communityMarkers && flags\.markerSubmission && \(\s*<Button[\s\S]*?<Compass className="w-4 h-4 mr-2" \/> Leave a Marker\s*<\/Button>\s*\)\}/g,
  ""
);

code = code.replace(
  /\{flags\.communityMarkers && \(\s*<div className="mt-3 mb-1 flex items-start sm:items-center justify-center gap-1\.5 text-\[11px\] text-muted-foreground font-medium px-2 text-center sm:text-left">[\s\S]*?<\/div>\s*\)\}/g,
  ""
);

fs.writeFileSync('artifacts/study-tracker/src/features/subjects/SystemCard.tsx', code);
console.log('System marker buttons removed');
