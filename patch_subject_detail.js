const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/subjects/SubjectDetail.tsx', 'utf8');

// Remove ProgressBar import if it's there
code = code.replace(/import { ProgressBar } from '@\/components\/ProgressBar';\n/, '');

// Remove the Subject Progress bar rendered around line 695
//             <ProgressBar progress={progress} className="h-2.5" />
code = code.replace(/<ProgressBar progress={progress}[^>]*\/>/g, '');

fs.writeFileSync('artifacts/study-tracker/src/features/subjects/SubjectDetail.tsx', code);
console.log('SubjectDetail updated');
