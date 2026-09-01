import { OntologySubject } from './ontology.neetpg';

export const USMLE_ONTOLOGY: OntologySubject[] = [
  {
    id: 'USMLE_1',
    name: 'Cardiovascular System',
    systems: [
      {
        id: 'USMLE_1_1', name: 'Anatomy & Embryology', subjectId: 'USMLE_1', topics: [
          { id: 'USMLE_1_1_001', subjectId: 'USMLE_1', systemId: 'USMLE_1_1', name: 'Cardiac Anatomy', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: [], pyqWeight: 3, difficulty: 'average' },
          { id: 'USMLE_1_1_002', subjectId: 'USMLE_1', systemId: 'USMLE_1_1', name: 'Cardiac Embryology', highYield: false, estimatedStudyMinutes: 45, relatedTopics: [], aliases: [], pyqWeight: 2, difficulty: 'high' }
        ]
      },
      {
        id: 'USMLE_1_2', name: 'Physiology', subjectId: 'USMLE_1', topics: [
          { id: 'USMLE_1_2_001', subjectId: 'USMLE_1', systemId: 'USMLE_1_2', name: 'Cardiac Cycle & Wiggers Diagram', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: [], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_1_2_002', subjectId: 'USMLE_1', systemId: 'USMLE_1_2', name: 'Electrophysiology & EKG', highYield: true, estimatedStudyMinutes: 120, relatedTopics: [], aliases: [], pyqWeight: 5, difficulty: 'high' }
        ]
      },
      {
        id: 'USMLE_1_3', name: 'Pathology', subjectId: 'USMLE_1', topics: [
          { id: 'USMLE_1_3_001', subjectId: 'USMLE_1', systemId: 'USMLE_1_3', name: 'Ischemic Heart Disease', highYield: true, estimatedStudyMinutes: 120, relatedTopics: [], aliases: ['IHD', 'STEMI', 'NSTEMI', 'Angina'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_1_3_002', subjectId: 'USMLE_1', systemId: 'USMLE_1_3', name: 'Heart Failure & Cor Pulmonale', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['CHF', 'Systolic dysfunction'], pyqWeight: 4, difficulty: 'high' },
          { id: 'USMLE_1_3_003', subjectId: 'USMLE_1', systemId: 'USMLE_1_3', name: 'Valvular Heart Disease', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['Aortic stenosis', 'Mitral regurgitation'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_1_3_004', subjectId: 'USMLE_1', systemId: 'USMLE_1_3', name: 'Cardiomyopathies', highYield: false, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['HCM', 'Dilated cardiomyopathy'], pyqWeight: 2, difficulty: 'average' },
          { id: 'USMLE_1_3_005', subjectId: 'USMLE_1', systemId: 'USMLE_1_3', name: 'Vasculitides', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Giant cell arteritis', 'Kawasaki'], pyqWeight: 3, difficulty: 'high' }
        ]
      },
      {
        id: 'USMLE_1_4', name: 'Pharmacology', subjectId: 'USMLE_1', topics: [
          { id: 'USMLE_1_4_001', subjectId: 'USMLE_1', systemId: 'USMLE_1_4', name: 'Antiarrhythmics', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: [], pyqWeight: 4, difficulty: 'high' },
          { id: 'USMLE_1_4_002', subjectId: 'USMLE_1', systemId: 'USMLE_1_4', name: 'Antihypertensives', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: [], pyqWeight: 3, difficulty: 'average' }
        ]
      }
    ]
  },
  {
    id: 'USMLE_2',
    name: 'Respiratory System',
    systems: [
      { id: 'USMLE_2_1', name: 'Physiology', subjectId: 'USMLE_2', topics: [
          { id: 'USMLE_2_1_001', subjectId: 'USMLE_2', systemId: 'USMLE_2_1', name: 'Pulmonary Mechanics & V/Q Matching', highYield: true, estimatedStudyMinutes: 120, relatedTopics: [], aliases: [], pyqWeight: 5, difficulty: 'high' }
      ] },
      { id: 'USMLE_2_2', name: 'Pathology', subjectId: 'USMLE_2', topics: [
          { id: 'USMLE_2_2_001', subjectId: 'USMLE_2', systemId: 'USMLE_2_2', name: 'Obstructive Lung Diseases', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['COPD', 'Asthma'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_2_2_002', subjectId: 'USMLE_2', systemId: 'USMLE_2_2', name: 'Restrictive Lung Diseases', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Pulmonary Fibrosis'], pyqWeight: 4, difficulty: 'high' },
          { id: 'USMLE_2_2_003', subjectId: 'USMLE_2', systemId: 'USMLE_2_2', name: 'Lung Cancer', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['SCLC', 'NSCLC'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_2_2_004', subjectId: 'USMLE_2', systemId: 'USMLE_2_2', name: 'Pulmonary Infections', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['Pneumonia', 'TB'], pyqWeight: 4, difficulty: 'average' }
      ] }
    ]
  },
  {
    id: 'USMLE_3',
    name: 'Renal System',
    systems: [
      { id: 'USMLE_3_1', name: 'Physiology', subjectId: 'USMLE_3', topics: [
          { id: 'USMLE_3_1_001', subjectId: 'USMLE_3', systemId: 'USMLE_3_1', name: 'Acid-Base Balance', highYield: true, estimatedStudyMinutes: 120, relatedTopics: [], aliases: ['Metabolic acidosis', 'Alkalosis'], pyqWeight: 5, difficulty: 'high' }
      ] },
      { id: 'USMLE_3_2', name: 'Pathology', subjectId: 'USMLE_3', topics: [
          { id: 'USMLE_3_2_001', subjectId: 'USMLE_3', systemId: 'USMLE_3_2', name: 'Nephrotic Syndromes', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: [], pyqWeight: 4, difficulty: 'high' },
          { id: 'USMLE_3_2_002', subjectId: 'USMLE_3', systemId: 'USMLE_3_2', name: 'Nephritic Syndromes', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: [], pyqWeight: 4, difficulty: 'high' },
          { id: 'USMLE_3_2_003', subjectId: 'USMLE_3', systemId: 'USMLE_3_2', name: 'Acute Kidney Injury (AKI)', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: [], pyqWeight: 4, difficulty: 'average' }
      ] },
      { id: 'USMLE_3_3', name: 'Pharmacology', subjectId: 'USMLE_3', topics: [
          { id: 'USMLE_3_3_001', subjectId: 'USMLE_3', systemId: 'USMLE_3_3', name: 'Diuretics', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: [], pyqWeight: 5, difficulty: 'average' }
      ] }
    ]
  },
  {
    id: 'USMLE_4',
    name: 'Gastrointestinal System',
    systems: [
      { id: 'USMLE_4_1', name: 'Pathology', subjectId: 'USMLE_4', topics: [
          { id: 'USMLE_4_1_001', subjectId: 'USMLE_4', systemId: 'USMLE_4_1', name: 'Hepatitis & Cirrhosis', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: [], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_4_1_002', subjectId: 'USMLE_4', systemId: 'USMLE_4_1', name: 'Inflammatory Bowel Disease (IBD)', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Crohns', 'Ulcerative Colitis'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_4_1_003', subjectId: 'USMLE_4', systemId: 'USMLE_4_1', name: 'Malabsorption Syndromes', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Celiac disease'], pyqWeight: 3, difficulty: 'average' }
      ] }
    ]
  },
  {
    id: 'USMLE_5',
    name: 'Endocrine System',
    systems: [
      { id: 'USMLE_5_1', name: 'Pathology', subjectId: 'USMLE_5', topics: [
          { id: 'USMLE_5_1_001', subjectId: 'USMLE_5', systemId: 'USMLE_5_1', name: 'Diabetes Mellitus', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['Type 1 DM', 'Type 2 DM'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_5_1_002', subjectId: 'USMLE_5', systemId: 'USMLE_5_1', name: 'Thyroid Disorders', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['Hypothyroidism', 'Hyperthyroidism'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_5_1_003', subjectId: 'USMLE_5', systemId: 'USMLE_5_1', name: 'Adrenal Disorders', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['Cushings', 'Addisons'], pyqWeight: 4, difficulty: 'high' }
      ] },
      { id: 'USMLE_5_2', name: 'Pharmacology', subjectId: 'USMLE_5', topics: [
          { id: 'USMLE_5_2_001', subjectId: 'USMLE_5', systemId: 'USMLE_5_2', name: 'Antidiabetic Agents', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: [], pyqWeight: 4, difficulty: 'average' }
      ] }
    ]
  },
  {
    id: 'USMLE_6',
    name: 'Reproductive System',
    systems: [
      { id: 'USMLE_6_1', name: 'Pathology', subjectId: 'USMLE_6', topics: [
          { id: 'USMLE_6_1_001', subjectId: 'USMLE_6', systemId: 'USMLE_6_1', name: 'Breast Disorders', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Breast Cancer'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_6_1_002', subjectId: 'USMLE_6', systemId: 'USMLE_6_1', name: 'Ovarian & Uterine Disorders', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['PCOS', 'Endometriosis'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_6_1_003', subjectId: 'USMLE_6', systemId: 'USMLE_6_1', name: 'Pregnancy Complications', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Preeclampsia', 'Ectopic pregnancy'], pyqWeight: 3, difficulty: 'high' }
      ] }
    ]
  },
  {
    id: 'USMLE_7',
    name: 'Nervous System & Special Senses',
    systems: [
      { id: 'USMLE_7_1', name: 'Pathology', subjectId: 'USMLE_7', topics: [
          { id: 'USMLE_7_1_001', subjectId: 'USMLE_7', systemId: 'USMLE_7_1', name: 'Cerebrovascular Disease', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['Stroke', 'TIA', 'Hemorrhage'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_7_1_002', subjectId: 'USMLE_7', systemId: 'USMLE_7_1', name: 'Neurodegenerative Diseases', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Alzheimers', 'Parkinsons'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_7_1_003', subjectId: 'USMLE_7', systemId: 'USMLE_7_1', name: 'Demyelinating Disorders', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Multiple Sclerosis'], pyqWeight: 3, difficulty: 'average' }
      ] },
      { id: 'USMLE_7_2', name: 'Psychiatry', subjectId: 'USMLE_7', topics: [
          { id: 'USMLE_7_2_001', subjectId: 'USMLE_7', systemId: 'USMLE_7_2', name: 'Schizophrenia & Psychotic Disorders', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: [], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_7_2_002', subjectId: 'USMLE_7', systemId: 'USMLE_7_2', name: 'Mood Disorders', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Depression', 'Bipolar'], pyqWeight: 4, difficulty: 'average' }
      ] },
      { id: 'USMLE_7_3', name: 'Pharmacology', subjectId: 'USMLE_7', topics: [
          { id: 'USMLE_7_3_001', subjectId: 'USMLE_7', systemId: 'USMLE_7_3', name: 'Antipsychotics & Antidepressants', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: [], pyqWeight: 4, difficulty: 'high' }
      ] }
    ]
  },
  {
    id: 'USMLE_8',
    name: 'Musculoskeletal, Skin & Connective Tissue',
    systems: [
      { id: 'USMLE_8_1', name: 'Pathology', subjectId: 'USMLE_8', topics: [
          { id: 'USMLE_8_1_001', subjectId: 'USMLE_8', systemId: 'USMLE_8_1', name: 'Arthritis', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Osteoarthritis', 'Rheumatoid Arthritis', 'Gout'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_8_1_002', subjectId: 'USMLE_8', systemId: 'USMLE_8_1', name: 'Skin Cancers', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Melanoma', 'BCC', 'SCC'], pyqWeight: 3, difficulty: 'average' },
          { id: 'USMLE_8_1_003', subjectId: 'USMLE_8', systemId: 'USMLE_8_1', name: 'Autoimmune & Connective Tissue Diseases', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['SLE', 'Sjogrens'], pyqWeight: 4, difficulty: 'high' }
      ] }
    ]
  },
  {
    id: 'USMLE_9',
    name: 'Hematology & Oncology',
    systems: [
      { id: 'USMLE_9_1', name: 'Pathology', subjectId: 'USMLE_9', topics: [
          { id: 'USMLE_9_1_001', subjectId: 'USMLE_9', systemId: 'USMLE_9_1', name: 'Anemias', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['Microcytic', 'Macrocytic', 'Normocytic'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_9_1_002', subjectId: 'USMLE_9', systemId: 'USMLE_9_1', name: 'Leukemias & Lymphomas', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['ALL', 'AML', 'CML', 'CLL', 'Hodgkins'], pyqWeight: 4, difficulty: 'high' },
          { id: 'USMLE_9_1_003', subjectId: 'USMLE_9', systemId: 'USMLE_9_1', name: 'Coagulation Disorders', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Hemophilia', 'vWD'], pyqWeight: 3, difficulty: 'average' }
      ] }
    ]
  },
  {
    id: 'USMLE_10',
    name: 'Immune System',
    systems: [
      { id: 'USMLE_10_1', name: 'Immunology', subjectId: 'USMLE_10', topics: [
          { id: 'USMLE_10_1_001', subjectId: 'USMLE_10', systemId: 'USMLE_10_1', name: 'Hypersensitivity Reactions', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Type I-IV'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_10_1_002', subjectId: 'USMLE_10', systemId: 'USMLE_10_1', name: 'Primary Immunodeficiencies', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['SCID', 'CVID', 'X-linked Agammaglobulinemia'], pyqWeight: 4, difficulty: 'high' }
      ] }
    ]
  },
  {
    id: 'USMLE_11',
    name: 'General Principles',
    systems: [
      { id: 'USMLE_11_1', name: 'Biochemistry', subjectId: 'USMLE_11', topics: [
          { id: 'USMLE_11_1_001', subjectId: 'USMLE_11', systemId: 'USMLE_11_1', name: 'Cellular Metabolism', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['Glycolysis', 'TCA Cycle'], pyqWeight: 4, difficulty: 'high' },
          { id: 'USMLE_11_1_002', subjectId: 'USMLE_11', systemId: 'USMLE_11_1', name: 'Genetics', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Inheritance patterns'], pyqWeight: 4, difficulty: 'average' }
      ] },
      { id: 'USMLE_11_2', name: 'Public Health & Social Sciences', subjectId: 'USMLE_11', topics: [
          { id: 'USMLE_11_2_001', subjectId: 'USMLE_11', systemId: 'USMLE_11_2', name: 'Biostatistics', highYield: true, estimatedStudyMinutes: 120, relatedTopics: [], aliases: ['Sensitivity', 'Specificity', 'PPV', 'NPV'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_11_2_002', subjectId: 'USMLE_11', systemId: 'USMLE_11_2', name: 'Medical Ethics & Law', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Autonomy', 'Informed Consent'], pyqWeight: 4, difficulty: 'average' }
      ] }
    ]
  }
];
