const fs = require('fs');
const file = 'artifacts/study-tracker/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('loadUniversalOntology')) {
  content = content.replace(
    "import { FeatureFlagsProvider } from '@/hooks/useFeatureFlags';",
    "import { FeatureFlagsProvider } from '@/hooks/useFeatureFlags';\nimport { loadUniversalOntology } from '@/lib/exam-presets';"
  );

  content = content.replace(
    "function App() {",
    "function App() {\n  useEffect(() => {\n    const checkOntology = async () => {\n      if (!localStorage.getItem('ontology_biochem_fix')) {\n        await loadUniversalOntology();\n        localStorage.setItem('ontology_biochem_fix', 'true');\n        window.location.reload();\n      }\n    };\n    checkOntology();\n  }, []);\n"
  );

  fs.writeFileSync(file, content);
  console.log("Patched App.tsx");
}
