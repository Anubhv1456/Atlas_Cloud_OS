const fs = require('fs');
const file = './artifacts/study-tracker/src/features/subjects/CurriculumSets.tsx';
let code = fs.readFileSync(file, 'utf8');

const importStatement = "import { CurriculumSetScoreModal } from './CurriculumSetScoreModal';\nimport { ALL_SUBJECTS } from '@/data/ontology';\n";
code = code.replace("import { CurriculumSetForm } from './CurriculumSetForm';", importStatement + "import { CurriculumSetForm } from './CurriculumSetForm';");

const stateDeclarations = "  const [formOpen, setFormOpen] = useState(false);\n  const [editSet, setEditSet] = useState<CurriculumSet | undefined>();\n  const [scoreModalOpen, setScoreModalOpen] = useState(false);\n  const [scoreModalSet, setScoreModalSet] = useState<CurriculumSet | undefined>();\n";
code = code.replace(/const \[formOpen, setFormOpen\] = useState\(false\);\n  const \[editSet, setEditSet\] = useState<CurriculumSet \| undefined>\(\);\n/g, stateDeclarations);

const clickHandler = `onClick={() => {
                              setScoreModalSet(rs);
                              setScoreModalOpen(true);
                            }}`;
code = code.replace(/onClick=\{.*?onLogScore.*?\}\s*className=/g, clickHandler + "\nclassName=");

const modalRender = `
      {scoreModalOpen && scoreModalSet && (
        <CurriculumSetScoreModal
          isOpen={scoreModalOpen}
          onClose={() => setScoreModalOpen(false)}
          curriculumSet={scoreModalSet}
          subjectName={ALL_SUBJECTS.find((s) => s.id === subjectId)?.name || 'Subject'}
        />
      )}
    </div>
  );
}
`;
code = code.replace(/<\/div>\n  \);\n\}\n/g, modalRender);

fs.writeFileSync(file, code);
