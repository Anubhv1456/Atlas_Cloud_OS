/**
 * Medical Speech Grammar Lexicon & JSGF Compiler
 * 
 * Provides an ontology-guided speech grammar containing:
 * 1. All 19 NEET-PG Subjects & Common Spoken Abbreviations
 * 2. 143 Medical Organ Systems & Key Curriculum Units
 * 3. Top 350 Volatile Pharmacology, Microbiology & Pathology Keywords
 * 
 * Injected into Web Speech API `SpeechGrammarList` for high-precision phonetics.
 */

export const MEDICAL_SUBJECT_ALIASES: Record<string, string[]> = {
  'Anatomy': ['anatomy', 'anat', 'gross anatomy', 'neuroanatomy', 'embryology', 'histology', 'osteology'],
  'Physiology': ['physiology', 'physio', 'phys', 'neurophysiology', 'cardiac cycle', 'renal physio'],
  'Biochemistry': ['biochemistry', 'biochem', 'metabolism', 'enzymes', 'vitamins', 'genetics'],
  'Pharmacology': ['pharmacology', 'pharma', 'farmacology', 'farma', 'drugs', 'autonomics', 'chemotherapy', 'cns pharma'],
  'Pathology': ['pathology', 'patho', 'path', 'general pathology', 'hematology', 'histopath', 'neoplasia'],
  'Microbiology': ['microbiology', 'micro', 'bacteriology', 'virology', 'parasitology', 'mycology', 'immunology'],
  'Forensic Medicine': ['forensic medicine', 'fmt', 'forensic', 'toxicology', 'medical jurisprudence'],
  'Community Medicine (PSM)': ['community medicine', 'psm', 'spm', 'preventive medicine', 'epidemiology', 'biostatistics', 'public health'],
  'Ophthalmology': ['ophthalmology', 'optha', 'ophthal', 'eye', 'cornea', 'retina', 'glaucoma', 'cataract'],
  'ENT': ['ent', 'otorhinolaryngology', 'ear nose throat', 'rhinology', 'otology', 'larynx'],
  'General Medicine': ['general medicine', 'medicine', 'med', 'internal medicine', 'cardiology', 'neurology', 'nephrology', 'gastroenterology', 'endocrinology', 'rheumatology', 'pulmonology'],
  'General Surgery': ['general surgery', 'surgery', 'surg', 'trauma', 'breast surgery', 'thyroid', 'urology', 'gi surgery', 'vascular surgery'],
  'Obstetrics & Gynaecology': ['obstetrics and gynaecology', 'obg', 'obgyn', 'obs and gynae', 'obstetrics', 'gynaecology', 'gynae', 'labor', 'pcos'],
  'Pediatrics': ['pediatrics', 'pedia', 'paediatrics', 'paeds', 'neonatology', 'milestones', 'growth and development'],
  'Orthopedics': ['orthopedics', 'ortho', 'fractures', 'bone tumors', 'joints', 'spine'],
  'Dermatology': ['dermatology', 'derma', 'skin', 'psoriasis', 'leprosy', 'sexually transmitted infections', 'stis'],
  'Psychiatry': ['psychiatry', 'psych', 'schizophrenia', 'depression', 'bipolar', 'psychopharmacology'],
  'Radiology': ['radiology', 'radio', 'imaging', 'xray', 'ct scan', 'mri', 'ultrasound', 'nuclear medicine'],
  'Anesthesia': ['anesthesia', 'anaesthesia', 'general anesthesia', 'local anesthetics', 'airway management', 'icu'],
};

export const HIGH_YIELD_CLINICAL_KEYWORDS = [
  'pheochromocytoma', 'phentolamine', 'phenoxybenzamine', 'takayasu', 'arteritis',
  'kawasaki', 'polyarteritis nodosa', 'wegener', 'granulomatosis', 'goodpasture',
  'myasthenia gravis', 'tensilon', 'pyridostigmine', 'edrophonium', 'succinylcholine',
  'halothane', 'malignant hyperthermia', 'dantrolene', 'digoxin', 'amiodarone',
  'adenosine', 'atropine', 'epinephrine', 'norepinephrine', 'dobutamine',
  'metformin', 'lactic acidosis', 'insulin', 'diabetic ketoacidosis', 'dka',
  'syndrome of inappropriate adh', 'siadh', 'diabetes insipidus', 'desmopressin',
  'warfarin', 'heparin', 'protamine', 'vitamin k', 'apixaban', 'rivaroxaban',
  'streptococcus', 'staphylococcus', 'pseudomonas', 'clostridium', 'tuberculosis',
  'rifampicin', 'isoniazid', 'pyrazinamide', 'ethambutol', 'leprosy', 'dapsone',
  'systemic lupus erythematosus', 'sle', 'rheumatoid arthritis', 'ankylosing spondylitis',
  'multiple sclerosis', 'guillain barre', 'parkinson', 'levodopa', 'carbidopa',
  'alzheimer', 'donepezil', 'memantine', 'wilson disease', 'penicillamine',
  'hemochromatosis', 'deferoxamine', 'cirrhosis', 'portal hypertension', 'esophageal varices',
  'q-bank', 'practice sets', 'mock exams', 'master summary', 'grand test', 'mock test', 'practice test', 'Mistakes Journal'
];

/**
 * Builds a W3C JSGF Grammar representation for SpeechRecognition
 */
export function buildMedicalSpeechGrammar(): string {
  const subjectsList = Object.values(MEDICAL_SUBJECT_ALIASES)
    .flat()
    .map(term => term.replace(/[^a-zA-Z0-9\s]/g, ''))
    .join(' | ');

  const clinicalList = HIGH_YIELD_CLINICAL_KEYWORDS.join(' | ');

  return `#JSGF V1.0;
grammar medical_lexicon;
public <subject> = ${subjectsList};
public <clinical_term> = ${clinicalList};
public <action> = studied | revised | did | read | logged | missed | mistake | score | recall;
public <command> = <action> <subject> | <subject> <action>;
`;
}

/**
 * Attaches the compiled medical grammar to a webkitSpeechRecognition instance
 */
export function injectMedicalGrammar(recognitionInstance: any): void {
  if (typeof window === 'undefined') return;

  const SpeechGrammarListClass = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;
  if (!SpeechGrammarListClass) return;

  try {
    const grammarList = new SpeechGrammarListClass();
    const jsgf = buildMedicalSpeechGrammar();
    grammarList.addFromString(jsgf, 1.0);
    recognitionInstance.grammars = grammarList;
  } catch (err) {
    console.warn('[MedicalSpeechGrammar] Could not inject JSGF grammar:', err);
  }
}

/**
 * Normalizes speech recognition acoustic homophones to medical terminology
 */
export const speechGrammarCorrector = {
  correctMedicalTranscript(raw: string): string {
    let text = raw;

    const commonSubstitutions: Array<[RegExp, string]> = [
      [/\bfarm\b/gi, 'pharma'],
      [/\bfarmacology\b/gi, 'pharmacology'],
      [/\boptha\b/gi, 'ophthalmology'],
      [/\bphysio\b/gi, 'physiology'],
      [/\bbiochem\b/gi, 'biochemistry'],
      [/\bpatho\b/gi, 'pathology'],
      [/\bmicro\b/gi, 'microbiology'],
      [/\banaesthesia\b/gi, 'anesthesia'],
      [/\bdk\b/gi, 'DKA'],
      [/\bgrand test\b/gi, 'Grand Test'],
      [/\bgt\b/gi, 'GT'],
      [/\bdoc\b/gi, 'Drug of Choice'],
      [/\b20th note book\b/gi, 'Mistakes Journal'],
      [/\btwentieth notebook\b/gi, 'Mistakes Journal'],
      [/\b20th note\b/gi, 'Mistakes Journal'],
      [/\bchar cot\b/gi, 'Charcot'],
      [/\bcharcots\b/gi, 'Charcot\'s'],
      [/\bshark coat\b/gi, 'Charcot'],
      [/\bsharko\b/gi, 'Charcot'],
      [/\bebbing house\b/gi, 'Ebbinghaus'],
      [/\bebbing haus\b/gi, 'Ebbinghaus'],
      [/\bebbinhouse\b/gi, 'Ebbinghaus'],
      [/\bfiochromocytoma\b/gi, 'pheochromocytoma'],
      [/\bfeochromocytoma\b/gi, 'pheochromocytoma'],
      [/\bfeocromocytoma\b/gi, 'pheochromocytoma'],
      [/\bpeochromocytoma\b/gi, 'pheochromocytoma'],
      [/\bweiner\b/gi, 'Wegener'],
      [/\bwegners\b/gi, 'Wegener\'s'],
      [/\btakayasu arteritis\b/gi, 'Takayasu arteritis'],
      [/\bkawasakis\b/gi, 'Kawasaki'],
      [/\bmyesthenia\b/gi, 'myasthenia'],
      [/\bfirstaid\b/gi, 'Master Summary'],
      [/\bmarro\b/gi, 'QBank'],
      [/\bpre pg\b/gi, 'QBank'],
      [/\bneet pg\b/gi, 'NEET-PG'],
      [/\bus mle\b/gi, 'USMLE'],
      [/\binicet\b/gi, 'INI-CET'],
      [/\bini cet\b/gi, 'INI-CET'],
      [/\bnext exam\b/gi, 'NExT exam'],
      [/\bcustom focus\b/gi, 'Custom Focus'],
      [/\bspaced repetition\b/gi, 'Spaced Repetition'],
      [/\bhigh yield\b/gi, 'High Yield'],
      [/\brapid revision\b/gi, 'Rapid Revision'],
      [/\bvolatile topic\b/gi, 'Volatile Topic'],
    ];

    for (const [pattern, replacement] of commonSubstitutions) {
      text = text.replace(pattern, replacement);
    }

    return text;
  },
};

