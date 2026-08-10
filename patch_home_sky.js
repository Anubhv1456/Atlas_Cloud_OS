const fs = require('fs');
const file = './artifacts/study-tracker/src/features/dashboard/Home.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("AtlasSkyPreview")) {
  content = content.replace(
    "import { NextActionCard }",
    "import { AtlasSkyPreview } from './AtlasSkyPreview';\nimport { NextActionCard }"
  );
  
  content = content.replace(
    "        </header>",
    "        </header>\n            \n            <AtlasSkyPreview />"
  );
  
  fs.writeFileSync(file, content);
}
