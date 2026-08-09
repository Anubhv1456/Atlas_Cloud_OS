const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/components/OnboardingModal.tsx', 'utf8');

code = code.replace(
  "const result = computeIntelligentRecommendation(allSubs, allSys, currentYear, selectedGoal);",
  "const topicProgresses = await db.topicProgress.toArray();\n    const result = computeIntelligentRecommendation(allSubs, allSys, currentYear, selectedGoal, topicProgresses);"
);

fs.writeFileSync('artifacts/study-tracker/src/components/OnboardingModal.tsx', code);
console.log('OnboardingModal updated');
