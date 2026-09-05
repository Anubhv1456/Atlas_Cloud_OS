import { loadUniversalOntology } from './artifacts/study-tracker/src/lib/exam-presets';
loadUniversalOntology({ targetExam: 'USMLE', force: true }).then(console.log).catch(console.error);
