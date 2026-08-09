const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/dashboard/Home.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { ALL_SYSTEMS, ALL_SUBJECTS } from '@/data/ontology';", "import { ALL_SYSTEMS } from '@/data/ontology';");

fs.writeFileSync(file, content);
