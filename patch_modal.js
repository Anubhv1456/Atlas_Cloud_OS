const fs = require('fs');
const file = './artifacts/study-tracker/src/features/dashboard/AtlasSkyModal.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /\} else \{\n      setTimeout\(\(\) => setMounted\(false\), 500\);\n    \}/g,
  "} else {\n      const timer = setTimeout(() => setMounted(false), 500);\n      return () => clearTimeout(timer);\n    }"
);

fs.writeFileSync(file, code);
