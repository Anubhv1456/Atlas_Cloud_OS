const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/subjects/CurriculumSets.tsx';
let code = fs.readFileSync(file, 'utf8');

// Remove import
code = code.replace(/import \{ repairAndRehydrateRevisionDates \} from '@\/lib\/vaultSync';\n/g, '');

// Remove handleRehydrateDates
const funcRegex = /const handleRehydrateDates = async \(e: React\.MouseEvent\) => \{[\s\S]*?finally \{\s*setIsRehydrating\(false\);\s*\}\s*\};\s*/g;
code = code.replace(funcRegex, '');

// Remove Rehydrate Dates menu item
const menuRegex = /<DropdownMenuItem onClick=\{handleRehydrateDates\} disabled=\{isRehydrating\}>[\s\S]*?Rehydrate Dates\s*<\/DropdownMenuItem>\s*/g;
code = code.replace(menuRegex, '');

// Remove isRehydrating state
code = code.replace(/const \[isRehydrating, setIsRehydrating\] = useState\(false\);\n/g, '');

fs.writeFileSync(file, code);
console.log("Patched CurriculumSets.tsx");
