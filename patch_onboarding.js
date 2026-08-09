const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/components/OnboardingModal.tsx', 'utf8');

// replace EXAM_PRESETS import
code = code.replace(/import \{ EXAM_PRESETS, loadPreset, ExamPreset \} from '@\/lib\/exam-presets';/, 
  "import { loadUniversalOntology } from '@/lib/exam-presets';");

// find selectedPresetId state and replace it with isImporting
code = code.replace(/const \[selectedPresetId, setSelectedPresetId\] = useState<string>\('mbbs'\);/, '');
code = code.replace(/const \[importingPreset, setImportingPreset\] = useState\(false\);/, 'const [importingPreset, setImportingPreset] = useState(false);');

// replace handleNextFromGoal
const handleNextFromGoalRegex = /const handleNextFromGoal = \(\) => \{[\s\S]*?setStep\(3\);\n  \};/;
code = code.replace(handleNextFromGoalRegex, `const handleNextFromGoal = async () => {
    setImportingPreset(true);
    setStep(3); // reusing step 3 for loading state if needed, or jumping to 4
    try {
      await loadUniversalOntology();
    } catch (err) {
      console.error(err);
    } finally {
      setImportingPreset(false);
      setStep(4);
    }
  };`);

// replace handleNextFromCurriculum
const handleNextFromCurriculumRegex = /const handleNextFromCurriculum = async \(\) => \{[\s\S]*?setStep\(4\);\n    \}\n  \};/;
code = code.replace(handleNextFromCurriculumRegex, '');

// replace handleNextFromPersonalization
const handleNextFromPersRegex = /const handleNextFromPersonalization = \(\) => \{[\s\S]*?setStep\(5\);\n  \};/;
code = code.replace(handleNextFromPersRegex, `const handleNextFromPersonalization = () => {
    updateProfile({
      targetExam: selectedGoal,
      targetExamDate: examDate,
      curriculum: 'Universal Ontology',
      currentYear: currentYear
    });
    setStep(5);
  };`);

// remove step 3 JSX
const step3Regex = /\{\/\* ── STEP 3: IMPORT A CURRICULUM ─────────────────────────────────── \*\/\}.*?(?=\{\/\* ── STEP 4)/s;
code = code.replace(step3Regex, `
          {/* ── STEP 3: LOADING ONTOLOGY ─────────────────────────────────── */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col items-center justify-center space-y-4 z-10"
            >
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground">Importing Universal Curriculum...</p>
            </motion.div>
          )}
`);

fs.writeFileSync('artifacts/study-tracker/src/components/OnboardingModal.tsx', code);
console.log("Patched OnboardingModal.tsx");
