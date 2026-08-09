const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/subjects/SystemCard.tsx', 'utf8');

code = code.replace(
  "import { useSystemCardLogic } from './SystemCard.hooks';",
  "import { useSystemCardLogic } from './SystemCard.hooks';\nimport { TopicList } from './TopicList';\nimport { ALL_SYSTEMS } from '@/data/ontology';"
);

// We need to inject the topic progress logic into SystemCard
code = code.replace(
  "const { system, subjectName, dragHandleProps, highlighted } = props;",
  "const { system, subjectName, dragHandleProps, highlighted } = props;\n  const ontologySystem = ALL_SYSTEMS.find(s => s.name === system.name);\n  const topics = ontologySystem?.topics || [];"
);

// We'll replace the Content row, QBank row, and Confidence Level selector with <TopicList topics={topics} />
// From: {/* Content row */}
// To: {/* ── System Memory Decay Calibration (Collapsible) ───────────────────── */}
const startIndex = code.indexOf('{/* Content row */}');
const endIndex = code.indexOf('{/* ── System Memory Decay Calibration (Collapsible) ───────────────────── */}');

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `{/* Topics Checklist */}
                <TopicList topics={topics} />
              </div>

              <div className="space-y-6 pt-2">
                `;
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
}

fs.writeFileSync('artifacts/study-tracker/src/features/subjects/SystemCard.tsx', code);
console.log('SystemCard updated');
