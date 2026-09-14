import { getLocalExamProfile } from './examProfile';

export interface Lexicon {
  // Backward compatibility fields
  mistakesJournal: string;
  practiceExams: string;
  practiceQuestions: string;
  mockExams: string;
  flashcards: string;
  coreReviewNotes: string;
  examContext: string;
  shortExamName: string;

  // Enterprise domain fields
  appName: string;
  shortBrand: string;
  syllabusTitle: string;
  curriculumUnitName: string;
  curriculumUnitPlural: string;
  revisionModuleUnit: string;
  revisionModulePlural: string;
  pastPaperUnit: string;
  mockExamLabel: string;
  mockExamAbbreviation: string;
  preExamSpotlight: string;
  mistakesJournalTitle: string;
  mistakeEntryType: string;
  aiAssistantGreeting: string;
  algorithmYieldLabel: string;
}

export const FALLBACK_LEXICON: Lexicon = {
  appName: "Atlas Medical OS",
  shortBrand: "Atlas",
  mistakesJournal: "Mistakes Journal",
  mistakesJournalTitle: "Mistakes Journal",
  mistakeEntryType: "High-Yield Clinical Rule",
  practiceExams: "Practice Assessments",
  practiceQuestions: "Question Bank Modules",
  mockExams: "Mock Examination",
  mockExamLabel: "Mock Examination",
  mockExamAbbreviation: "Mock",
  flashcards: "Active Recall Cards",
  coreReviewNotes: "Core Review Notes",
  examContext: "Medical Licensing Exam",
  shortExamName: "Medical Exam",
  syllabusTitle: "Curriculum Blueprint",
  curriculumUnitName: "Subject Unit",
  curriculumUnitPlural: "Subject Units",
  revisionModuleUnit: "Revision Module",
  revisionModulePlural: "Revision Modules",
  pastPaperUnit: "Past Papers / Official Forms",
  preExamSpotlight: "High-Yield Spotlight",
  aiAssistantGreeting: "👋 Hello Doctor! I'm your **Atlas Medical Co-Pilot**.",
  algorithmYieldLabel: "Curriculum Weight",
};

export function getLexicon(targetExam?: string): Lexicon {
  let examStr = 'USMLE Step 1';
  try {
    const localProfile = getLocalExamProfile();
    examStr = (targetExam || localProfile?.targetExam || 'USMLE Step 1').toString();
  } catch {
    examStr = (targetExam || 'USMLE Step 1').toString();
  }
  const lowerExam = (examStr || '').toLowerCase();
  const isUsmleStep1 = lowerExam.includes('step 1');
  const isUsmleStep2 = lowerExam.includes('step 2');
  const isUsmle = lowerExam.includes('usmle') || lowerExam.includes('step');

  let activeLexicon: Partial<Lexicon> = {};

  if (isUsmleStep2) {
    activeLexicon = {
      appName: "Atlas Medical OS",
      shortBrand: "Atlas",
      mistakesJournal: "Mistakes Journal",
      mistakesJournalTitle: "Clinical Diagnostic Mistakes Journal",
      mistakeEntryType: "Clinical Management Rule",
      practiceExams: "Shelf Assessments",
      practiceQuestions: "Clinical Case Blocks",
      mockExams: "Clinical Shelf / Comprehensive Mock",
      mockExamLabel: "Clinical Shelf / Comprehensive Mock",
      mockExamAbbreviation: "Shelf/Mock",
      flashcards: "Active Recall Cards",
      coreReviewNotes: "Clinical Management Summary",
      examContext: "USMLE Step 2 CK (Clinical Management)",
      shortExamName: "Step 2 CK",
      syllabusTitle: "Clinical Clerkships & Patient Management",
      curriculumUnitName: "Clerkship Discipline",
      curriculumUnitPlural: "Clerkship Disciplines",
      revisionModuleUnit: "Clinical Case Block",
      revisionModulePlural: "Clinical Case Blocks",
      pastPaperUnit: "Official Assessment Forms",
      preExamSpotlight: "Pre-Exam High-Yield Spotlight",
      aiAssistantGreeting: "👋 Hello Doctor! I'm your **Atlas Step 2 CK Co-Pilot**. Dictate clinical revisions, log comprehensive mock scores, or review diagnostic algorithms across your clerkships.",
      algorithmYieldLabel: "USMLE Step 2 CK Clinical Weight",
    };
  } else if (isUsmle || isUsmleStep1) {
    activeLexicon = {
      appName: "Atlas Medical OS",
      shortBrand: "Atlas",
      mistakesJournal: "Mistakes Journal",
      mistakesJournalTitle: "High-Yield Mistakes Journal",
      mistakeEntryType: "High-Yield Takeaway Objective",
      practiceExams: "High Yield Review",
      practiceQuestions: "Question Bank Blocks",
      mockExams: "Comprehensive Mock Exam",
      mockExamLabel: "Comprehensive Mock Exam",
      mockExamAbbreviation: "Mock",
      flashcards: "Active Recall Cards",
      coreReviewNotes: "Master Summary",
      examContext: "USMLE Step 1 (Basic Sciences)",
      shortExamName: "Step 1",
      syllabusTitle: "Organ Systems & Basic Sciences Blueprint",
      curriculumUnitName: "Organ System",
      curriculumUnitPlural: "Organ Systems",
      revisionModuleUnit: "Question Bank Block",
      revisionModulePlural: "Question Bank Blocks",
      pastPaperUnit: "Official Assessment Forms",
      preExamSpotlight: "Pre-Exam High-Yield Spotlight",
      aiAssistantGreeting: "👋 Hello Doctor! I'm your **Atlas Step 1 Co-Pilot**. Dictate your study sessions, log comprehensive mock scores, or review high-yield objectives across your organ systems.",
      algorithmYieldLabel: "USMLE Step 1 Exam Weight",
    };
  } else {
    // NEET PG / INI-CET / FMGE / default
    activeLexicon = {
      appName: "Atlas Medical OS",
      shortBrand: "Atlas",
      mistakesJournal: "20th Notebook",
      mistakesJournalTitle: "20th Notebook (High-Yield Pearls)",
      mistakeEntryType: "High-Yield Clinical Rule",
      practiceExams: "PYQ / Past Papers",
      practiceQuestions: "Question Bank Modules",
      mockExams: "Grand Test (GT)",
      mockExamLabel: "Grand Test (GT)",
      mockExamAbbreviation: "GT",
      flashcards: "Active Recall Cards",
      coreReviewNotes: "Core Review Notes",
      examContext: "NEET PG / INI-CET (19 Subjects)",
      shortExamName: examStr || "NEET PG",
      syllabusTitle: "19-Subject Medical Blueprint",
      curriculumUnitName: "Subject Unit",
      curriculumUnitPlural: "Subject Units",
      revisionModuleUnit: "Question Bank Module",
      revisionModulePlural: "Question Bank Modules",
      pastPaperUnit: "Past Exam Papers (PYQs)",
      preExamSpotlight: "Pre-GT Volatile Spotlight",
      aiAssistantGreeting: "👋 Hello Doctor! I'm your **Atlas NEET PG Co-Pilot**. Dictate study sessions, 20th notebook pearls, or Grand Test (GT) mock scores across your 19 subjects.",
      algorithmYieldLabel: "Exam Blueprint Weight",
    };
  }

  return {
    ...FALLBACK_LEXICON,
    ...activeLexicon,
  };
}

export function useLexicon(): Lexicon {
  // Can be imported inside React components
  try {
    const profile = getLocalExamProfile();
    return getLexicon(profile?.targetExam);
  } catch {
    return FALLBACK_LEXICON;
  }
}
