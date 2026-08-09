const fs = require('fs');

const raw = `Pharmacology
• General Pharmacology
Pharmacokinetics
Pharmacodynamics
Drug Receptors
Adverse Drug Reactions
Drug Interactions
Clinical Trials
Pharmacovigilance
• Autonomic Nervous System
Cholinergic Drugs
Anticholinergic Drugs
Adrenergic Drugs
Adrenergic Blockers
Neuromuscular Blocking Agents
• Cardiovascular Pharmacology
Antihypertensives
Antianginal Drugs
Antiarrhythmic Drugs
Heart Failure Drugs
Diuretics
Anticoagulants
Antiplatelet Drugs
Lipid-Lowering Drugs
• Central Nervous System
General Anesthetics
Local Anesthetics
Sedative-Hypnotics
Antiepileptics
Antipsychotics
Antidepressants
Opioid Analgesics
Drugs for Parkinsonism
• Autacoids & Anti-inflammatory Drugs
Histamine
Serotonin
Prostaglandins
NSAIDs
Corticosteroids
Antihistamines
• Endocrine Pharmacology
Antidiabetic Drugs
Insulin
Thyroid Drugs
Corticosteroids
Sex Hormones
Drugs for Osteoporosis
• Antimicrobial Drugs
Beta-Lactams
Aminoglycosides
Macrolides
Tetracyclines
Fluoroquinolones
Antitubercular Drugs
Antifungal Drugs
Antiviral Drugs
Antimalarial Drugs
• Anticancer & Immunosuppressant Drugs
Anticancer Drugs
Targeted Therapy
Immunotherapy
Immunosuppressants
7. Forensic Medicine & Toxicology
• Medical Jurisprudence
Medical Ethics
Consent
Medical Negligence
Identification
Legal Procedures
• Forensic Pathology
Death
Postmortem Changes
Estimation of Time Since Death
Medico-Legal Autopsy
• Mechanical Injuries
Abrasions
Contusions
Lacerations
Incised Wounds
Firearm Injuries
• Asphyxial Deaths
Hanging
Strangulation
Drowning
Suffocation
• Sexual Jurisprudence
Sexual Offences
Examination of Sexual Assault
Virginity
Pregnancy
Infanticide
• Toxicology
General Toxicology
Corrosives
Metallic Poisons
Insecticides
Alcohol
Snake Bite
Food Poisoning
8. Community Medicine (PSM)
• Health & Disease
Concepts of Health
Determinants of Health
Natural History of Disease
Levels of Prevention
• Epidemiology
Epidemiological Methods
Study Designs
Measures of Disease Frequency
Screening
Outbreak Investigation
• Research Methodology
Research Design
Sampling
Data Collection
Critical Appraisal
• Biostatistics
Data Presentation
Measures of Central Tendency
Measures of Dispersion
Probability
Statistical Tests
• Environmental Health
Water
Air Pollution
Waste Disposal
Housing
Noise Pollution
• Nutrition
Macronutrients
Micronutrients
Malnutrition
Nutritional Assessment
National Nutrition Programmes
• Demography
Population Dynamics
Fertility
Mortality
Population Indicators
• Family Planning
Contraceptive Methods
Family Welfare Programme
Reproductive Health
• Communicable Diseases
Tuberculosis
Malaria
HIV/AIDS
Leprosy
Vaccine Preventable Diseases
• Non-Communicable Diseases
Diabetes
Hypertension
Cancer
Mental Health
Lifestyle Diseases
• National Health Programmes
NHM
RCH
UIP
NTEP
NPCDCS
Other National Programmes
9. ENT (Otorhinolaryngology)
• Ear
Anatomy
Hearing
Deafness
Otitis
Vertigo
Facial Nerve Disorders
• Nose
Anatomy
Epistaxis
Rhinitis
Nasal Polyps
Deviated Nasal Septum
• Paranasal Sinuses
Sinusitis
Tumours
Complications
• Pharynx
Tonsillitis
Adenoids
Pharyngeal Tumours
Dysphagia
• Larynx
Hoarseness
Vocal Cord Disorders
Laryngeal Tumours
Airway Emergencies
10. Ophthalmology
• Anatomy & Physiology of the Eye
Eyeball
Extraocular Muscles
Lacrimal Apparatus
Visual Pathway
• Optics & Refraction
Refraction
Refractive Errors
Accommodation
Optical Instruments
• Conjunctiva
Conjunctivitis
Degenerative Disorders
Tumours
• Cornea
Corneal Ulcers
Keratitis
Corneal Dystrophies
• Lens
Cataract
Lens Dislocation
• Glaucoma
Primary Glaucoma
Secondary Glaucoma
Management
• Uvea
Uveitis
Tumours
• Retina
Diabetic Retinopathy
Hypertensive Retinopathy
Retinal Detachment
Macular Disorders
• Neuro-ophthalmology
Optic Neuritis
Papilledema
Cranial Nerve Palsies
• Strabismus
Types of Squint
Amblyopia
Management`;

const lines = raw.split('\n').map(l => l.trim()).filter(l => l);

const subjects = [];
let currentSubject = null;
let currentSystem = null;

let subIdx = 5;

for (let line of lines) {
  if (line.match(/^(Pharmacology|\d+\.\s.*)$/)) {
    subIdx++;
    let name = line.replace(/^\d+\.\s*/, '').trim();
    currentSubject = {
      id: `SUB_${subIdx.toString().padStart(2, '0')}`,
      name: name,
      systems: []
    };
    subjects.push(currentSubject);
    currentSystem = null;
  } else if (line.startsWith('•')) {
    let name = line.replace(/^•\s*/, '').trim();
    currentSystem = {
      id: `SYS_${subIdx.toString().padStart(2, '0')}_${(currentSubject.systems.length + 1).toString().padStart(2, '0')}`,
      subjectId: currentSubject.id,
      name: name,
      topics: []
    };
    currentSubject.systems.push(currentSystem);
  } else {
    if (currentSystem) {
      let tIdx = currentSystem.topics.length + 1;
      currentSystem.topics.push({
        id: `TOPIC_${subIdx.toString().padStart(2, '0')}_${(currentSubject.systems.length).toString().padStart(2, '0')}_${tIdx.toString().padStart(3, '0')}`,
        subjectId: currentSubject.id,
        systemId: currentSystem.id,
        name: line,
        highYield: false,
        estimatedStudyMinutes: 30,
        relatedTopics: [],
        aliases: [],
        pyqWeight: 1,
        difficulty: "average"
      });
    }
  }
}

fs.writeFileSync('new_subjects.json', JSON.stringify(subjects, null, 2));
