const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/subjects/SubjectCard.tsx';
let code = fs.readFileSync(file, 'utf8');

// Remove import
code = code.replace(/import \{ evaluateSubjectProgress, SubjectProgressScore, mergeAndDeduplicateAllSubjects \} from "@\/lib\/subjectDeduplication";/g, 'import { evaluateSubjectProgress, SubjectProgressScore } from "@/lib/subjectDeduplication";');

// Remove handleMergeDuplicates
const funcRegex = /const handleMergeDuplicates = async \(\) => \{[\s\S]*?finally \{\s*setIsDeleting\(false\);\s*\}\s*\};\s*/g;
code = code.replace(funcRegex, '');

// Remove siblingDuplicateSubject from DropdownMenu
const menuRegex = /\{\s*siblingDuplicateSubject && \([\s\S]*?Merge Duplicates[\s\S]*?<\/DropdownMenuItem>\s*\)\s*\}/g;
code = code.replace(menuRegex, '');

fs.writeFileSync(file, code);
console.log("Patched SubjectCard.tsx");
