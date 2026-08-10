const fs = require('fs');
const file = './artifacts/study-tracker/src/features/dashboard/AtlasSkyModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// import calculateSubjectProgress and calculateOverallProgress
if (!content.includes('import { calculateSubjectProgress, calculateOverallProgress } from \'@/lib/progress\';') && !content.includes('import { calculateOverallProgress, calculateSubjectProgress } from \'@/lib/progress\';') && !content.includes('calculateSubjectProgress')) {
    content = content.replace(
        "import { Link } from 'wouter';",
        "import { Link } from 'wouter';\nimport { calculateSubjectProgress, calculateOverallProgress } from '@/lib/progress';"
    );
}

// replace inner subject progress calculation
content = content.replace(
    /const subSets = curriculumSets\.filter\(c => c\.subjectId === dbSubject!\.id\);\s*const totalTasks = subSets\.length \* 2;\s*let completedTasks = 0;\s*subSets\.forEach\(s => \{\s*if \(s\.contentCompleted\) completedTasks\+\+;\s*if \(s\.qbankCompleted\) completedTasks\+\+;\s*\}\);\s*progress = totalTasks > 0 \? \(completedTasks \/ totalTasks\) \* 100 : 0;\s*const isCompleted = progress === 100 && totalTasks > 0;/g,
    `const subSets = curriculumSets.filter(c => c.subjectId === dbSubject!.id);
        progress = calculateSubjectProgress(dbSubject, systems, subSets);
        const totalTasks = subSets.length * 2;
        const isCompleted = progress === 100 && totalTasks > 0;`
);

// replace global progress calculation
content = content.replace(
    /const totalSyllabusTasks = curriculumSets\.length \* 2;\s*let completedSyllabusTasks = 0;/g,
    `const syllabusProgress = calculateOverallProgress(subjects, systems, curriculumSets);`
);

content = content.replace(
    /curriculumSets\.forEach\(s => \{\s*if \(s\.contentCompleted\) completedSyllabusTasks\+\+;\s*if \(s\.qbankCompleted\) completedSyllabusTasks\+\+;/g,
    `curriculumSets.forEach(s => {`
);

content = content.replace(
    /const syllabusCompletion = totalSyllabusTasks > 0 \? Math\.round\(\(completedSyllabusTasks \/ totalSyllabusTasks\) \* 100\) : 0;/g,
    `const syllabusCompletion = syllabusProgress;`
);

fs.writeFileSync(file, content);
console.log('patched');
