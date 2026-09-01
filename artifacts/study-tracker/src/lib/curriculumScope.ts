export interface ProfPhaseDefinition {
  phaseId: string;
  name: string;
  shortName: string;
  description: string;
  canonicalSubjects: string[];
}

export const ACADEMIC_PHASES: Record<string, Record<string, ProfPhaseDefinition>> = {
  'NEET PG': {
    '1st Year MBBS': { phaseId: 'phase_1', name: '1st Professional', shortName: '1st Prof', description: 'Pre-Clinical Foundation', canonicalSubjects: ['Anatomy', 'Physiology', 'Biochemistry'] },
    '2nd Year MBBS': { phaseId: 'phase_2', name: '2nd Professional', shortName: '2nd Prof', description: 'Para-Clinical Core', canonicalSubjects: ['Pathology', 'Microbiology', 'Pharmacology'] },
    '3rd Year MBBS': { phaseId: 'phase_3_part_1', name: '3rd Professional Part I', shortName: '3rd Prof Part 1', description: 'Clinical Specialties', canonicalSubjects: ['Forensic Medicine & Toxicology', 'Forensic Medicine', 'Community Medicine (PSM)', 'Community Medicine', 'Ophthalmology', 'ENT (Otorhinolaryngology)', 'ENT'] },
    'Final MBBS': { phaseId: 'phase_3_part_2', name: 'Final Professional Part II', shortName: 'Final Prof', description: 'Major Clinicals', canonicalSubjects: ['General Medicine', 'Medicine', 'General Surgery', 'Surgery', 'Obstetrics & Gynaecology', 'OBGY', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Psychiatry', 'Radiology', 'Anaesthesiology'] }
  },
  'USMLE': {
    'MS1': { phaseId: 'usmle_ms1', name: 'Medical School Year 1', shortName: 'MS1', description: 'Basic Sciences', canonicalSubjects: ['Biochemistry & Medical Genetics', 'General Principles', 'Cardiovascular System', 'Respiratory System'] },
    'MS2': { phaseId: 'usmle_ms2', name: 'Medical School Year 2', shortName: 'MS2', description: 'Pathology & Pharmacology Integration', canonicalSubjects: ['General Pathology & Pharmacology', 'Microbiology & Immunology', 'Renal System', 'Gastrointestinal System', 'Endocrine System', 'Reproductive System', 'Nervous System & Special Senses', 'Musculoskeletal, Skin & Connective Tissue', 'Hematology & Oncology', 'Immune System'] },
    'MS3 (Clinical)': { phaseId: 'usmle_ms3', name: 'Medical School Year 3', shortName: 'MS3', description: 'Core Clinical Rotations', canonicalSubjects: [] },
    'MS4 (Advanced)': { phaseId: 'usmle_ms4', name: 'Medical School Year 4', shortName: 'MS4', description: 'Advanced Clinicals / Sub-I', canonicalSubjects: [] }
  }
};

export const NMC_MBBS_PROFESSIONAL_YEARS = ACADEMIC_PHASES['NEET PG'];

export function getExamMaxScore(targetExam?: string): number {
  if (!targetExam) return 200;
  const lower = targetExam.toLowerCase();
  if (lower.includes('usmle step 2')) return 300; 
  if (lower.includes('usmle step 1')) return 280; 
  if (lower.includes('usmle')) return 280;
  if (lower.includes('neet')) return 200;
  if (lower.includes('inicet') || lower.includes('ini-cet')) return 200;
  if (lower.includes('fmge')) return 300;
  return 100;
}

export function isSubjectInProfScope(
  subjectName: string,
  targetExam?: string,
  currentYear?: string
): boolean {
  if (!targetExam || !currentYear) return true;
  
  const isUSMLE = targetExam.toLowerCase().includes('usmle');
  const examKey = isUSMLE ? 'USMLE' : 'NEET PG';
  const phaseDict = ACADEMIC_PHASES[examKey];

  if (!phaseDict) return true;

  const normalizedYear = Object.keys(phaseDict).find(
    k => k.toLowerCase() === currentYear.toLowerCase() || currentYear.toLowerCase().includes(k.toLowerCase().split(' ')[0])
  );

  if (!normalizedYear) return true;

  const phase = phaseDict[normalizedYear];
  if (!phase || !phase.canonicalSubjects || phase.canonicalSubjects.length === 0) return true;

  const cleanSubjectName = subjectName.trim().toLowerCase();
  return phase.canonicalSubjects.some(s => s.toLowerCase() === cleanSubjectName || cleanSubjectName.includes(s.toLowerCase()) || s.toLowerCase().includes(cleanSubjectName));
}

export function getAllowedSubjectsForProfile(
  targetExam?: string,
  currentYear?: string
): string[] | null {
  if (!targetExam || !currentYear) return null;
  const isUSMLE = targetExam.toLowerCase().includes('usmle');
  const examKey = isUSMLE ? 'USMLE' : 'NEET PG';
  const phaseDict = ACADEMIC_PHASES[examKey];

  if (!phaseDict) return null;

  const normalizedYear = Object.keys(phaseDict).find(
    k => k.toLowerCase() === currentYear.toLowerCase() || currentYear.toLowerCase().includes(k.toLowerCase().split(' ')[0])
  );
  if (!normalizedYear) return null;
  return phaseDict[normalizedYear].canonicalSubjects;
}

export function getPhaseNameForProfile(targetExam?: string, currentYear?: string): string {
  if (!targetExam || !currentYear) return currentYear || 'Syllabus';
  const isUSMLE = targetExam.toLowerCase().includes('usmle');
  const examKey = isUSMLE ? 'USMLE' : 'NEET PG';
  const phaseDict = ACADEMIC_PHASES[examKey];
  if (!phaseDict) return currentYear;
  
  const normalizedYear = Object.keys(phaseDict).find(
    k => k.toLowerCase() === currentYear.toLowerCase() || currentYear.toLowerCase().includes(k.toLowerCase().split(' ')[0])
  );
  if (!normalizedYear) return currentYear;
  return phaseDict[normalizedYear].name || currentYear;
}
