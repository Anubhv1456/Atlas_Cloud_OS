const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/dashboard/Home.tsx', 'utf8');

// 1. Remove Import
code = code.replace(/import \{ BaselineTriageModal \} from '@\/components\/BaselineTriageModal';\n/, '');

// 2. Remove state
code = code.replace(/  const \[triageOpen, setTriageOpen\] = useState\(false\);\n/, '');

// 3. Remove useEffect for triage
const useEffectRegex = /  useEffect\(\(\) => \{\n    \/\/ Pillar 4: Onboarding is strictly governed[\s\S]*?\}, \[hasOnboarded, onboardingLoading, isConfigured, profile\.hasCompletedTriage, hasAccess, isTrialActive\]\);\n/g;
code = code.replace(useEffectRegex, '');

// 4. Remove component
code = code.replace(/      <BaselineTriageModal open=\{triageOpen\} onOpenChange=\{setTriageOpen\} \/>\n/, '');

fs.writeFileSync('artifacts/study-tracker/src/features/dashboard/Home.tsx', code);
