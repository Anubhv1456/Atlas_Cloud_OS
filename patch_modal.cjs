const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/components/TargetExamModal.tsx', 'utf8');

code = code.replace(/  const \[dailyQuestionGoal, setDailyQuestionGoal\] = useState<number>\(profile\.dailyQuestionGoal \|\| 40\);\n/, '');
code = code.replace(/      setDailyQuestionGoal\(profile\.dailyQuestionGoal \|\| 40\);\n/, '');
code = code.replace(/    \/\/ Smart default for Daily Question Target based on days remaining[\s\S]*?setDailyQuestionGoal\(defaultDaily > 300 \? 300 : defaultDaily\);\n    }\n/, '');
code = code.replace(/        dailyQuestionGoal: Number\(dailyQuestionGoal\) \|\| 40,\n/, '');
code = code.replace(/Calibrate your clinical curriculum, timeline, and daily question targets/, 'Calibrate your clinical curriculum and timeline');

// Remove the Daily Target input block
code = code.replace(/<div className="space-y-1\.5">\s*<div className="flex items-center justify-between">\s*<Label htmlFor="dailyGoal".*?<\/div>\s*<Input\s*id="dailyGoal"[\s\S]*?<\/div>/, '');

// The grid had 2 columns: <div className="grid grid-cols-1 sm:grid-cols-2 gap-3
// Change it to 1 column: <div className="grid grid-cols-1 gap-3
code = code.replace(/className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted\/25 dark:bg-muted\/15 p-3\.5 rounded-xl border border-border\/50"/, 'className="grid grid-cols-1 gap-3 bg-muted/25 dark:bg-muted/15 p-3.5 rounded-xl border border-border/50"');

fs.writeFileSync('artifacts/study-tracker/src/components/TargetExamModal.tsx', code);
