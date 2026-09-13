const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/pages/Onboarding.tsx', 'utf8');

code = code.replace(/size="lg"/, '');
code = code.replace(/import \{ \n  Sparkles, Brain, Check, Zap, Target, BookOpen\n\} from 'lucide-react';/, `import { \n  Sparkles, Brain, Check, Zap, Target, BookOpen, ArrowRight\n} from 'lucide-react';`);
code = code.replace(/const updates = \[\];/, 'const updates: any[] = [];');
code = code.replace(/const status = syllabusStatus\[sub.id\];/, 'const status = syllabusStatus[sub.id as string];');

fs.writeFileSync('artifacts/study-tracker/src/pages/Onboarding.tsx', code);
