const fs = require('fs');
const file = './artifacts/study-tracker/src/features/dashboard/AtlasSkyPreview.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `export function AtlasSkyPreview() {
  const [modalOpen, setModalOpen] = useState(false);
  // Get completed topics/systems (e.g. anything with 100% progress or mastered)
  const curriculumSets = useLiveQuery(() => (db.curriculumSets || db.revisionSets)?.toArray()) || [];
  const masteredCount = curriculumSets.filter(s => s.contentCompleted && s.qbankCompleted).length;`,
  `export function AtlasSkyPreview() {
  const [modalOpen, setModalOpen] = useState(false);
  
  const subjects = useLiveQuery(() => db.subjects.toArray()) || [];
  const systems = useLiveQuery(() => db.systems.toArray()) || [];
  const curriculumSets = useLiveQuery(() => (db.curriculumSets || db.revisionSets)?.toArray()) || [];
  
  const masteredCount = curriculumSets.filter(s => s.contentCompleted && s.qbankCompleted).length;`
);

content = content.replace(
  `<AtlasSkyModal open={modalOpen} onOpenChange={setModalOpen} masteredCount={masteredCount} />`,
  `<AtlasSkyModal open={modalOpen} onOpenChange={setModalOpen} subjects={subjects} systems={systems} curriculumSets={curriculumSets} />`
);

fs.writeFileSync(file, content);
