import { getLocalExamProfile } from './examProfile';

export interface Lexicon {
  mistakesJournal: string;
  practiceExams: string;
  practiceQuestions: string;
  mockExams: string;
  flashcards: string;
  coreReviewNotes: string;
  examContext: string;
  shortExamName: string;
}

export function getLexicon(targetExam?: string): Lexicon {
  const exam = targetExam || getLocalExamProfile().targetExam || 'USMLE Step 1';
  const isUsmle = exam.toLowerCase().includes('usmle');
  
  if (isUsmle) {
    return {
      mistakesJournal: "Mistakes Journal",
      practiceExams: "High Yield Review",
      practiceQuestions: "QBank Blocks",
      mockExams: "NBME / Mock",
      flashcards: "Flashcards",
      coreReviewNotes: "Master Summary",
      examContext: "USMLE (Board Exams)",
      shortExamName: "USMLE",
    };
  } else {
    // NEET PG / INI-CET / default
    return {
      mistakesJournal: "Mistakes Journal",
      practiceExams: "PYQ / Test",
      practiceQuestions: "QBank Modules",
      mockExams: "Grand Test (GT)",
      flashcards: "Flashcards",
      coreReviewNotes: "Core Review Notes",
      examContext: "NEET PG / INI-CET",
      shortExamName: exam, // E.g., NEET PG
    };
  }
}

export function useLexicon() {
  // Can be imported inside React components
  const profile = getLocalExamProfile();
  return getLexicon(profile.targetExam);
}
