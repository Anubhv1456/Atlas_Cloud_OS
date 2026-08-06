import { db } from '@/db';

export interface PresetSubject {
  subject: string;
  topics: string[];
}

export interface ExamPreset {
  id: string;
  name: string;
  targetExam: string;
  badge: string;
  description: string;
  hierarchy: PresetSubject[];
}

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/labour/g, 'labor')
    .replace(/gynaecolog/g, 'gynecolog')
    .replace(/orthopaedics/g, 'orthopedics')
    .replace(/paediatrics/g, 'pediatrics')
    .replace(/tumour/g, 'tumor')
    .replace(/obstetrics/g, 'obstetric')
    .replace(/haematolog/g, 'hematolog')
    .replace(/anaesthesia/g, 'anesthesia')
    .replace(/foetus/g, 'fetus')
    .replace(/foetal/g, 'fetal')
    .replace(/oesophagus/g, 'esophagus')
    .replace(/diarrhoea/g, 'diarrhea')
    .replace(/programme/g, 'program')
    .replace(/complicationsinpregnancy/g, 'complications')
    .replace(/medicalandsurgical/g, '');
}

export const mbbsHierarchy: PresetSubject[] = [
  {
    subject: "Anatomy",
    topics: [
      "Embryology", "Histology", "Neuroanatomy", "Head and Neck", "Upper Limb", "Thorax", "Abdomen", "Lower Limb", "General Anatomy"
    ]
  },
  {
    subject: "Biochemistry",
    topics: [
      "General Topics", "Enzymology", "Carbohydrates", "Lipids", "Proteins", "Bioenergetics", "Molecular Biology", "Vitamins"
    ]
  },
  {
    subject: "Physiology",
    topics: [
      "General Physiology", "Nerve Muscle Physiology", "Central Nervous System", "Respiratory System", "Cardiovascular System", "Gastrointestinal System", "Renal Physiology", "Endocrine Physiology", "Reproductive Physiology", "Exercise Physiology"
    ]
  },
  {
    subject: "Microbiology",
    topics: [
      "General Microbiology", "Bacteriology", "Immunology", "Virology", "Protozoology", "Helminthology", "Mycology", "Clinical Microbiology"
    ]
  },
  {
    subject: "Pharmacology",
    topics: [
      "General Pharmacology", "Autonomic Nervous System", "Cardiovascular System", "Renal System", "Nervous System", "Antimicrobials", "Endocrine System", "Autacoids", "Hematology", "Respiratory System", "Gastrointestinal Drugs", "Immunomodulators", "Anti-Neoplastic Agents"
    ]
  },
  {
    subject: "Pathology",
    topics: [
      "General Pathology", "Hematology", "Cardiovascular System", "Genito-urinary System", "Gastrointestinal System", "Respiratory System", "Endocrine System", "Skin and Musculoskeletal System", "Nervous System", "Miscellaneous"
    ]
  },
  {
    subject: "Community Medicine",
    topics: [
      "Demography and Family Planning", "Maternal and Child Health", "Vaccine and Immunization", "Epidemiology", "Screening of Diseases", "Biostatistics", "National Health Programmes", "Healthcare Planning", "Infectious Diseases Epidemiology", "Communicable Disease", "Non-communicable disease", "Nutrition", "Environment", "Biomedical Waste Management", "Occupation Health", "Concept of Health and Diseases", "Disaster Management", "Health Communication", "International Health Organisations", "Social Medicine", "Miscellaneous"
    ]
  },
  {
    subject: "Forensic Medicine",
    topics: [
      "Forensic Traumatology", "Medical Jurisprudence", "Forensic Pathology", "Sexual Jurisprudence", "Toxicology", "Forensic Psychiatry"
    ]
  },
  {
    subject: "Medicine",
    topics: [
      "Gastroenterology", "Hematology", "Pulmonology", "Cardiology", "ECG", "Rheumatology", "Neurology", "Nephrology", "Acid-Base Regulation", "Endocrinology", "Hepatology", "Infectious Diseases"
    ]
  },
  {
    subject: "Surgery",
    topics: [
      "General Surgery", "Breast", "Endocrine System", "Gastrointestinal and Abdominal Surgery", "Urology", "Speciality Surgery", "Trauma", "Hernia", "Vascular Surgery", "Faciomaxillary Surgery", "Miscellaneous"
    ]
  },
  {
    subject: "Obstetrics and Gynaecology",
    topics: [
      "General Gynaecology", "Gynaecological Infections", "Infertility and Contraception", "Gynaecological Oncology", "Fundamentals of Reproduction", "Normal Pregnancy and Antenatal Care", "Complications in Surgery", "Obstetrics complications", "Labor and Puerperium"
    ]
  },
  {
    subject: "Paediatrics",
    topics: [
      "Neonatology", "Growth and Development", "Nutrition", "Genetic Disorders", "Childhood Infections", "Gastrointestinal System", "Respiratory System", "Cardiovascular System", "Genito-urinary System", "Nervous System", "Endocrine System", "Childhood Malignancies", "Paediatric Rheumatology", "Hematology", "Miscellaneous"
    ]
  },
  {
    subject: "Orthopedics (Minor)",
    topics: []
  },
  {
    subject: "Anaesthesia (Minor)",
    topics: []
  },
  {
    subject: "Radiology (Minor)",
    topics: []
  },
  {
    subject: "Psychiatry (Minor)",
    topics: []
  },
  {
    subject: "Dermatology (Minor)",
    topics: []
  },
  {
    subject: "Ophthalmology",
    topics: [
      "Basic Anatomy of Eye", "Neuro-Ophthalmology", "Squint", "Lens", "Glaucoma", "Optics", "Retina", "Cornea", "Uvea", "Conjunctiva adnexa", "Miscellaneous"
    ]
  },
  {
    subject: "ENT",
    topics: [
      "Ear", "Nose", "Pharynx", "Larynx"
    ]
  }
];

export const usmleStep1Hierarchy: PresetSubject[] = [
  {
    subject: "Behavioral Health & Ethics",
    topics: [
      "Psychiatric Disorders", "Epidemiology & Biostatistics", "Medical Ethics & Law", "Communication Skills", "Sleep Physiology & Disorders"
    ]
  },
  {
    subject: "Biochemistry & Medical Genetics",
    topics: [
      "Molecular Biology & DNA Replication", "Metabolic Pathways", "Enzymology & Kinetics", "Genetics & Inherited Disorders", "Nutrition & Vitamins", "Cell Biology & Signal Transduction"
    ]
  },
  {
    subject: "Microbiology & Immunology",
    topics: [
      "Innate & Adaptive Immunity", "Immunodeficiencies & Autoimmunity", "Bacteriology", "Virology", "Mycology", "Parasitology & Helminths", "Antimicrobial Agents"
    ]
  },
  {
    subject: "General Pathology & Pharmacology",
    topics: [
      "Cellular Injury, Inflammation & Repair", "Neoplasia & Tumor Biology", "Pharmacokinetics & Pharmacodynamics", "Autonomic Pharmacology", "Toxicology & Antidotes"
    ]
  },
  {
    subject: "Cardiovascular System",
    topics: [
      "Cardiovascular Anatomy & Embryology", "Cardiac Physiology & Hemodynamics", "Cardiovascular Pathology & Ischemia", "Arrhythmias & ECG", "Cardiovascular Pharmacology"
    ]
  },
  {
    subject: "Endocrine System",
    topics: [
      "Hypothalamus & Pituitary", "Thyroid & Parathyroid", "Adrenal Gland Pathology", "Pancreas & Diabetes Mellitus", "Endocrine Neoplasia & MEN Syndromes"
    ]
  },
  {
    subject: "Gastrointestinal System",
    topics: [
      "GI Anatomy & Embryology", "GI Physiology & Digestion", "Esophagus, Stomach & Intestines", "Hepatobiliary & Pancreatic Pathology", "GI Pharmacology"
    ]
  },
  {
    subject: "Hematology & Oncology",
    topics: [
      "Red Blood Cell Disorders & Anemias", "White Blood Cell & Lymphoid Malignancies", "Hemostasis, Bleeding & Thrombosis", "Transfusion Medicine", "Chemotherapeutic Agents"
    ]
  },
  {
    subject: "Musculoskeletal, Skin & Connective Tissue",
    topics: [
      "Bone & Joint Pathology", "Rheumatology & Autoimmune Joint Disease", "Dermatology & Skin Lesions", "Musculoskeletal Physiology & Anatomy", "Pharmacology of Inflammatory Conditions"
    ]
  },
  {
    subject: "Neurology & Special Senses",
    topics: [
      "Neuroanatomy & Spinal Cord Tracts", "Cerebrovascular Disease & Stroke", "Neurodegenerative & Demyelinating Diseases", "Seizures & Movement Disorders", "Ophthalmology & Otology Essentials"
    ]
  },
  {
    subject: "Renal & Urinary System",
    topics: [
      "Renal Anatomy & Embryology", "Renal Physiology & Fluid/Electrolyte Balance", "Glomerular & Tubulointerstitial Diseases", "Renal Failure & Dialysis", "Diuretics & Renal Pharmacology"
    ]
  },
  {
    subject: "Reproductive System",
    topics: [
      "Male & Female Reproductive Anatomy/Embryology", "Reproductive Endocrinology & Menstrual Cycle", "Pregnancy & Placental Pathology", "Reproductive Tract Malignancies", "Reproductive Pharmacology"
    ]
  },
  {
    subject: "Respiratory System",
    topics: [
      "Respiratory Anatomy & Mechanics", "Pulmonary Gas Exchange & Ventilation", "Obstructive & Restrictive Lung Diseases", "Pulmonary Infections & Vascular Pathology", "Respiratory Pharmacology"
    ]
  }
];

export const usmleStep2CKHierarchy: PresetSubject[] = [
  {
    subject: "Internal Medicine",
    topics: [
      "Cardiology & Vascular Medicine", "Pulmonology & Critical Care", "Gastroenterology & Hepatology", "Nephrology & Hypertension", "Endocrinology & Metabolism", "Hematology & Oncology", "Infectious Diseases", "Rheumatology & Allergy"
    ]
  },
  {
    subject: "Surgery",
    topics: [
      "General & Abdominal Surgery", "Trauma & Acute Care Surgery", "Vascular Surgery", "Orthopedic Surgery", "Urology", "Thoracic & Cardiac Surgery", "Neurosurgery", "ENT & Head/Neck Surgery"
    ]
  },
  {
    subject: "Pediatrics",
    topics: [
      "Neonatology & Perinatal Care", "Growth, Development & Immunizations", "Pediatric Infectious Diseases", "Pediatric Cardiology & Pulmonology", "Pediatric Gastroenterology & Nephrology", "Genetics & Metabolic Disorders"
    ]
  },
  {
    subject: "Obstetrics & Gynecology",
    topics: [
      "Routine Antenatal & Intrapartum Care", "Obstetric Complications & High-Risk Pregnancy", "General Gynecology & Infections", "Gynecologic Oncology", "Reproductive Endocrinology & Infertility"
    ]
  },
  {
    subject: "Psychiatry & Behavioral Health",
    topics: [
      "Mood Disorders & Depression", "Psychotic Disorders & Schizophrenia", "Anxiety, OCD & Trauma-Related Disorders", "Substance Use & Addictions", "Child & Adolescent Psychiatry", "Geriatric Psychiatry & Dementia"
    ]
  },
  {
    subject: "Emergency Medicine & Preventive Care",
    topics: [
      "Resuscitation & Shock Management", "Acute Toxicology & Envenomation", "Screening & Preventive Medicine", "Medical Ethics, Safety & Quality Improvement"
    ]
  }
];

export const neetPgHierarchy: PresetSubject[] = [
  {
    subject: "General Medicine",
    topics: ["Cardiology", "Neurology", "Gastroenterology", "Pulmonology", "Nephrology", "Endocrinology", "Rheumatology", "Infectious Diseases", "Hematology"]
  },
  {
    subject: "General Surgery",
    topics: ["Trauma & Shock", "GI Surgery", "Urology", "Breast & Endocrine", "Vascular Surgery", "General Surgery Principles"]
  },
  {
    subject: "Obstetrics & Gynecology",
    topics: ["Obstetrics & Antenatal Care", "Gynecology & Infertility", "Gynecologic Oncology", "Labor & Puerperium Complications"]
  },
  {
    subject: "Pathology",
    topics: ["General Pathology", "Hematology", "Systemic Pathology", "Cytopathology & Histopathology"]
  },
  {
    subject: "Pharmacology",
    topics: ["General Pharmacology", "ANS & CNS", "CVS & Renal", "Antimicrobials", "Chemotherapy & Immunomodulators"]
  },
  {
    subject: "Community Medicine (PSM)",
    topics: ["Epidemiology", "Biostatistics", "National Health Programs", "Communicable Diseases", "Nutrition & Environment", "Screening & Demography"]
  },
  {
    subject: "Pediatrics",
    topics: ["Neonatology", "Development & Nutrition", "Pediatric Systemic Diseases", "Pediatric Infections & Malignancies"]
  },
  {
    subject: "Microbiology",
    topics: ["Bacteriology", "Virology", "Mycology", "Parasitology", "Immunology & Serology"]
  },
  {
    subject: "Biochemistry",
    topics: ["Metabolism & Bioenergetics", "Enzymes & Kinetics", "Molecular Biology", "Vitamins & Minerals", "Clinical Biochemistry"]
  },
  {
    subject: "Anatomy",
    topics: ["Neuroanatomy", "Gross Anatomy", "Embryology", "Histology", "Head & Neck"]
  },
  {
    subject: "Physiology",
    topics: ["General Physiology", "Nerve Muscle", "CNS & Neurophysiology", "CVS & Hemodynamics", "Respiratory System", "Renal & Electrolytes", "Endocrine & GIT"]
  },
  {
    subject: "ENT",
    topics: ["Otology & Hearing", "Rhinology & Sinuses", "Laryngology & Head/Neck"]
  },
  {
    subject: "Ophthalmology",
    topics: ["Cornea & Lens", "Retina & Glaucoma", "Optics & Neuro-ophthalmology", "Squint & Uvea"]
  },
  {
    subject: "Forensic Medicine (FMT)",
    topics: ["Traumatology & Injuries", "Toxicology", "Medical Jurisprudence & Ethics", "Autopsy & Thanatology"]
  },
  {
    subject: "Orthopedics",
    topics: ["Trauma & Fractures", "Bone Tumors & Infections", "Joint Disorders & Sports Medicine"]
  },
  {
    subject: "Dermatology",
    topics: ["Papulosquamous Disorders", "Infections & STDs", "Blistering Disorders"]
  },
  {
    subject: "Psychiatry",
    topics: ["Mood Disorders", "Schizophrenia & Psychosis", "Neurotic & Anxiety Disorders", "Substance Abuse"]
  },
  {
    subject: "Radiology",
    topics: ["X-Rays & Contrast Studies", "CT & MRI Physics", "Ultrasound & Nuclear Medicine", "Interventional Radiology"]
  },
  {
    subject: "Anaesthesia",
    topics: ["General & Regional Anaesthesia", "Airway Management", "Critical Care & Resuscitation", "Local Anesthetics & Monitoring"]
  }
];

export const plabHierarchy: PresetSubject[] = [
  {
    subject: "General Internal Medicine",
    topics: ["Cardiovascular Medicine", "Respiratory Medicine", "Gastroenterology & Hepatology", "Endocrinology & Diabetes", "Renal Medicine", "Neurology", "Rheumatology"]
  },
  {
    subject: "General Surgery & Emergency",
    topics: ["Acute Abdomen & Hernias", "Trauma & Musculoskeletal Emergency", "Urology & Male Genital", "Vascular Emergencies", "Surgical Infections & Wound Care"]
  },
  {
    subject: "Paediatrics & Child Health",
    topics: ["Child Safeguarding & Growth", "Neonatal Care", "Paediatric Acute Illness", "Childhood Immunisations & Exanthems"]
  },
  {
    subject: "Obstetrics & Gynaecology",
    topics: ["Antenatal & Intrapartum Care", "Gynaecological Conditions", "Contraception & Sexual Health", "Obstetric Emergencies"]
  },
  {
    subject: "Psychiatry & Mental Health",
    topics: ["Depression & Psychosis", "Risk Assessment & Capacity", "Substance Misuse", "Dementia & Delirium"]
  },
  {
    subject: "General Practice & Primary Care",
    topics: ["Chronic Disease Management", "Dermatology in Primary Care", "ENT & Ophthalmology Conditions", "Palliative Care & Pain Management"]
  },
  {
    subject: "Ethics, Law & Prescribing",
    topics: ["GMC Good Medical Practice", "UK Prescribing Safety & Posology", "Consent & Confidentiality", "Infection Control & Public Health"]
  }
];

export const dentalHierarchy: PresetSubject[] = [
  {
    subject: "Basic Medical & Dental Sciences",
    topics: ["Dental Anatomy & Histology", "General Anatomy & Neuroanatomy", "General Physiology & Biochemistry", "General Pathology & Microbiology", "General & Dental Pharmacology"]
  },
  {
    subject: "Clinical Dental Sciences",
    topics: ["Oral Pathology & Oral Microbiology", "Oral Medicine & Radiology", "Periodontics & Implantology", "Pediatric & Preventive Dentistry"]
  },
  {
    subject: "Surgical & Restorative Dentistry",
    topics: ["Oral & Maxillofacial Surgery", "Prosthodontics & Crown/Bridge", "Conservative Dentistry & Endodontics", "Orthodontics & Dentofacial Orthopedics", "Public Health Dentistry"]
  }
];

export const EXAM_PRESETS: ExamPreset[] = [
  {
    id: 'mbbs',
    name: 'MBBS Professional Curriculum',
    targetExam: 'MBBS Professional Exams',
    badge: 'Standard 19 Subjects',
    description: 'Complete 19-subject hierarchy spanning Pre-clinical, Para-clinical, and Clinical phases.',
    hierarchy: mbbsHierarchy
  },
  {
    id: 'usmle-step1',
    name: 'USMLE Step 1 Systems & Foundations',
    targetExam: 'USMLE Step 1',
    badge: 'System-Based',
    description: 'Organ-system and foundational basic science hierarchy tailored for USMLE Step 1 preparation.',
    hierarchy: usmleStep1Hierarchy
  },
  {
    id: 'usmle-step2ck',
    name: 'USMLE Step 2 CK Clinical Core',
    targetExam: 'USMLE Step 2 CK',
    badge: 'Clinical Disciplines',
    description: 'High-yield clinical rotations and core shelf topics for Step 2 CK.',
    hierarchy: usmleStep2CKHierarchy
  },
  {
    id: 'neet-pg',
    name: 'NEET PG & INI-CET High-Yield',
    targetExam: 'NEET PG',
    badge: 'Indian Boards',
    description: 'Systematic 19-subject breakdown focused on Indian PG medical entrance exams.',
    hierarchy: neetPgHierarchy
  },
  {
    id: 'plab',
    name: 'PLAB 1 / UK MLA Licensing',
    targetExam: 'PLAB 1 / PLAB 2',
    badge: 'UK Licensing',
    description: 'UK GMC blueprint subjects including clinical management, ethics, and prescribing.',
    hierarchy: plabHierarchy
  },
  {
    id: 'dental-bds',
    name: 'Dental / BDS Curriculum',
    targetExam: 'Dental Boards (INBDE / NEET BDS)',
    badge: 'Dental Boards',
    description: 'Core basic and clinical dental sciences for BDS students and dental licensing boards.',
    hierarchy: dentalHierarchy
  }
];

export async function loadPreset(hierarchy: PresetSubject[]) {
  await db.transaction('rw', db.subjects, db.systems, db.uiPreferences, async () => {
    const existingSubjects = await db.subjects.toArray();
    const existingSystems = await db.systems.toArray();
    const existingPrefs = await db.uiPreferences.toArray();

    let maxSubjectOrder = -1;
    for (const pref of existingPrefs) {
      if (pref.type === 'subject' && pref.order !== undefined && pref.order > maxSubjectOrder) {
        maxSubjectOrder = pref.order;
      }
    }

    let subjectOrder = maxSubjectOrder + 1;

    for (const item of hierarchy) {
      let subject = existingSubjects.find(s => normalizeName(s.name) === normalizeName(item.subject));
      let subjectId = subject?.id;

      if (!subjectId) {
        subjectId = await db.subjects.add({ name: item.subject });
        await db.uiPreferences.add({
          id: `subject:${subjectId}`,
          type: 'subject',
          entityId: subjectId,
          order: subjectOrder++,
          focus: null,
          updatedAt: new Date()
        });
      }

      let maxSystemOrder = -1;
      const systemsInSubject = existingSystems.filter(sys => sys.subjectId === subjectId);
      for (const sys of systemsInSubject) {
        const pref = existingPrefs.find(p => p.id === `system:${sys.id}`);
        if (pref && pref.order !== undefined && pref.order > maxSystemOrder) {
          maxSystemOrder = pref.order;
        }
      }

      let systemOrder = maxSystemOrder + 1;

      for (const topic of item.topics) {
        const topicExists = existingSystems.find(sys =>
          sys.subjectId === subjectId &&
          normalizeName(sys.name) === normalizeName(topic)
        );

        if (!topicExists) {
          const sysId = await db.systems.add({
            subjectId,
            name: topic,
            updatedAt: new Date(),
            nextRevisionDate: null,
            revisionState: 'idle' as const,
            contentInitialized: false,
            contentUnitsTotal: 0,
            contentUnitsCompleted: 0,
            contentCompleted: false,
            completionDate: null,
            revisionCount: 0,
            lastRevisionDate: null,
            currentRevisionInterval: null,
            decayFactor: 1.0,
            isLengthy: false,
            revisionStartedAt: null,
            revisionLastCheckInDate: null,
            revisionDaysLogged: 0,
            revisionProgressPercent: 0,
            qbankDone: false,
            weakAreas: '',
            status: 'Average'
          } as any);

          await db.uiPreferences.add({
            id: `system:${sysId}`,
            type: 'system',
            entityId: sysId,
            order: systemOrder++,
            focus: null,
            updatedAt: new Date()
          });
        }
      }
    }
  });
}
