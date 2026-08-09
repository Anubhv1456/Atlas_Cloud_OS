const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/components/OnboardingModal.tsx', 'utf8');

const regex = /useEffect\(\(\) => \{[\s\S]*?\}\, \[profile\]\);/g;
code = code.replace(regex, `useEffect(() => {
    if (profile.targetExam) {
      setSelectedGoal(profile.targetExam);
    }
    if (profile.targetExamDate) {
      setExamDate(profile.targetExamDate);
    }
  }, [profile]);`);

// And I also need to remove '}' from the previous regex that got orphaned if it was there.
fs.writeFileSync('artifacts/study-tracker/src/components/OnboardingModal.tsx', code);
