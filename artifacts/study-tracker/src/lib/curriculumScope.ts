/**
 * Official Medical Curriculum & Professional Year Partitioning
 * Aligned with NMC CBME Guidelines for Indian Medical Colleges & International Standards.
 */

export interface ProfPhaseDefinition {
  phaseId: string;
  name: string;
  shortName: string;
  description: string;
  canonicalSubjects: string[];
}

export const NMC_MBBS_PROFESSIONAL_YEARS: Record<string, ProfPhaseDefinition> = {
  '1st Year MBBS': {
    phaseId: 'phase_1',
    name: '1st Professional (Phase I)',
    shortName: '1st Prof',
    description: 'Pre-Clinical Foundation (12 Months)',
    canonicalSubjects: ['Anatomy', 'Physiology', 'Biochemistry']
  },
  '2nd Year MBBS': {
    phaseId: 'phase_2',
    name: '2nd Professional (Phase II)',
    shortName: '2nd Prof',
    description: 'Para-Clinical Core (12 Months)',
    canonicalSubjects: ['Pathology', 'Microbiology', 'Pharmacology']
  },
  '3rd Year MBBS': {
    phaseId: 'phase_3_part_1',
    name: '3rd Professional Part I (Phase III Part 1)',
    shortName: '3rd Prof Part 1',
    description: 'Clinical Specialties & Preventive Medicine (12 Months)',
    canonicalSubjects: [
      'Forensic Medicine & Toxicology',
      'Forensic Medicine',
      'Community Medicine (PSM)',
      'Community Medicine',
      'Ophthalmology',
      'ENT (Otorhinolaryngology)',
      'ENT'
    ]
  },
  'Final MBBS': {
    phaseId: 'phase_3_part_2',
    name: 'Final Professional Part II (Phase III Part 2)',
    shortName: 'Final Prof',
    description: 'Major Clinical Medicine & Surgery (18 Months)',
    canonicalSubjects: [
      'General Medicine',
      'Medicine',
      'General Surgery',
      'Surgery',
      'Obstetrics & Gynaecology',
      'Obstetrics and Gynaecology',
      'OBGY',
      'Pediatrics',
      'Paediatrics',
      'Orthopedics',
      'Dermatology',
      'Psychiatry',
      'Radiology',
      'Anaesthesia',
      'Anaesthesiology'
    ]
  }
};

/**
 * Checks if a subject belongs to the user's active academic year when MBBS Professional Exam mode is selected.
 */
export function isSubjectInProfScope(
  subjectName: string,
  targetExam?: string,
  currentYear?: string
): boolean {
  if (!targetExam || !currentYear) return true;
  
  const isMBBSProf = targetExam.toLowerCase().includes('mbbs') || targetExam.toLowerCase().includes('professional exam');
  if (!isMBBSProf) {
    // Non-MBBS exams (NEET PG, INICET, USMLE) include all subjects
    return true;
  }

  // Normalize year key
  const normalizedYear = Object.keys(NMC_MBBS_PROFESSIONAL_YEARS).find(
    k => k.toLowerCase() === currentYear.toLowerCase() || currentYear.toLowerCase().includes(k.toLowerCase().split(' ')[0])
  );

  if (!normalizedYear) {
    // If year is unknown (e.g. Intern/Other), allow all subjects
    return true;
  }

  const phase = NMC_MBBS_PROFESSIONAL_YEARS[normalizedYear];
  if (!phase) return true;

  const cleanSubjectName = subjectName.trim().toLowerCase();
  return phase.canonicalSubjects.some(s => s.toLowerCase() === cleanSubjectName || cleanSubjectName.includes(s.toLowerCase()) || s.toLowerCase().includes(cleanSubjectName));
}

/**
 * Returns the list of canonical subject names for an exam profile.
 */
export function getAllowedSubjectsForProfile(
  targetExam?: string,
  currentYear?: string
): string[] | null {
  if (!targetExam || !currentYear) return null;

  const isMBBSProf = targetExam.toLowerCase().includes('mbbs') || targetExam.toLowerCase().includes('professional exam');
  if (!isMBBSProf) return null;

  const normalizedYear = Object.keys(NMC_MBBS_PROFESSIONAL_YEARS).find(
    k => k.toLowerCase() === currentYear.toLowerCase() || currentYear.toLowerCase().includes(k.toLowerCase().split(' ')[0])
  );

  if (!normalizedYear) return null;

  return NMC_MBBS_PROFESSIONAL_YEARS[normalizedYear].canonicalSubjects;
}
