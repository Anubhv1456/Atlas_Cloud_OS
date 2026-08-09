const fs = require('fs');
const content = `
1. Anatomy
• General Anatomy
Introduction to Anatomy
Anatomical Terminology
Bones
Joints
Muscles
Fascia
Skin
Blood Vessels
Lymphatic System
Nervous Tissue

• Upper Limb
Osteology
Shoulder Region
Arm
Cubital Fossa
Forearm
Hand
Brachial Plexus
Arteries
Veins
Lymphatic Drainage
Surface Anatomy
Clinical Anatomy

• Lower Limb
Osteology
Gluteal Region
Thigh
Popliteal Fossa
Leg
Foot
Hip Joint
Knee Joint
Blood Supply
Nerve Supply
Clinical Anatomy

• Thorax
Thoracic Wall
Pleura
Lungs
Mediastinum
Pericardium
Heart
Great Vessels
Thoracic Duct
Diaphragm
Clinical Anatomy

• Abdomen & Pelvis
Anterior Abdominal Wall
Peritoneum
Stomach
Small Intestine
Large Intestine
Liver
Gallbladder
Pancreas
Spleen
Kidneys
Ureter
Pelvis
Perineum
Clinical Anatomy

• Head & Neck
Skull
Face
Scalp
Neck
Cranial Nerves
Pharynx
Larynx
Salivary Glands
Thyroid
Orbit
Clinical Anatomy

• Neuroanatomy
Brain
Brainstem
Cerebellum
Spinal Cord
Ventricular System
Meninges
Cranial Nerve Nuclei
Ascending Tracts
Descending Tracts
Clinical Neuroanatomy

• Histology
Epithelium
Connective Tissue
Cartilage
Bone
Muscle
Nervous Tissue
Blood
Lymphoid Tissue
Organ Histology

• Embryology
Gametogenesis
Fertilization
First Week Development
Second Week Development
Third Week Development
Organogenesis
Placenta
Fetal Membranes
Congenital Anomalies


2. Physiology
• General Physiology
Cell
Homeostasis
Body Fluids
Membrane Transport
Resting Membrane Potential
Action Potential

• Nerve & Muscle
Skeletal Muscle
Smooth Muscle
Neuromuscular Junction
Reflexes
Motor Control

• Blood & Immunity
RBC
WBC
Platelets
Hemostasis
Blood Groups
Immunity

• Cardiovascular System
Cardiac Muscle
Cardiac Cycle
ECG
Blood Pressure
Cardiac Output
Regulation of Circulation

• Respiratory System
Mechanics of Respiration
Lung Volumes
Gas Exchange
Oxygen Transport
Carbon Dioxide Transport
Regulation of Respiration

• Gastrointestinal System
Salivary Secretion
Gastric Secretion
Pancreatic Secretion
Bile
Digestion
Absorption
GI Motility

• Renal System
GFR
Tubular Functions
Acid Base Balance
Water Balance
Electrolyte Balance
Micturition

• Endocrine System
Pituitary
Thyroid
Parathyroid
Adrenal
Pancreas
Calcium Homeostasis

• Central Nervous System
Sensory System
Motor System
Autonomic Nervous System
Sleep
Learning
Memory

• Special Senses
Vision
Hearing
Taste
Smell
Vestibular System


3. Biochemistry
• Cell & Organelles
Cell Structure
Organelles
Cell Membrane

• Enzymes
Classification
Kinetics
Regulation
Clinical Applications

• Carbohydrate Metabolism
Glycolysis
Gluconeogenesis
Glycogen Metabolism
TCA Cycle
HMP Shunt

• Lipid Metabolism
Fatty Acid Oxidation
Lipogenesis
Cholesterol Metabolism
Lipoproteins
Ketone Bodies

• Protein & Amino Acid Metabolism
Amino Acid Metabolism
Urea Cycle
Protein Synthesis

• Nucleotide Metabolism
Purines
Pyrimidines
DNA
RNA

• Molecular Biology & Genetics
DNA Replication
Transcription
Translation
Gene Regulation
Mutations
Recombinant DNA Technology

• Vitamins & Minerals
Fat Soluble Vitamins
Water Soluble Vitamins
Major Minerals
Trace Elements

• Clinical Biochemistry
Liver Function Tests
Kidney Function Tests
Cardiac Biomarkers
Acid Base Disorders
Nutrition


4. Pathology
• General Pathology
Cell Injury
Cell Adaptation
Necrosis
Apoptosis

• Inflammation & Repair
Acute Inflammation
Chronic Inflammation
Healing
Tissue Repair

• Hemodynamic Disorders & Shock
Edema
Hyperemia
Hemorrhage
Thrombosis
Embolism
Infarction
Shock

• Immunopathology
Hypersensitivity
Autoimmune Diseases
Immunodeficiency
Transplant Rejection

• Neoplasia
Benign Tumors
Malignant Tumors
Carcinogenesis
Tumor Markers

• Hematology
Anemia
Leukemia
Lymphoma
Bleeding Disorders
Transfusion Medicine

• Systemic Pathology
Cardiovascular
Respiratory
Gastrointestinal
Hepatobiliary
Renal
Endocrine
CNS
Musculoskeletal
Skin


5. Microbiology
• General Microbiology
History
Sterilization
Disinfection
Culture Media
Laboratory Diagnosis

• Immunology
Innate Immunity
Adaptive Immunity
Antibodies
Vaccines
Hypersensitivity

• Bacteriology
Gram Positive Bacteria
Gram Negative Bacteria
Anaerobes
Mycobacteria
Spirochetes

• Virology
DNA Viruses
RNA Viruses
Hepatitis Viruses
HIV
Emerging Viruses

• Mycology
Superficial Mycoses
Subcutaneous Mycoses
Systemic Mycoses
Opportunistic Fungi

• Parasitology
Protozoa
Helminths
Arthropods

• Applied Microbiology
Hospital Infection Control
Biomedical Waste
Antimicrobial Resistance
Vaccination
Public Health Microbiology
`;

const lines = content.split('\n');

const ontology = [];
let currentSubject = null;
let currentSystem = null;

let subIdx = 1;
let sysIdx = 1;
let topIdx = 1;

for (let line of lines) {
  line = line.trim();
  if (!line) continue;

  if (line.match(/^\d+\./)) {
    // Subject
    const name = line.replace(/^\d+\.\s*/, '').trim();
    currentSubject = {
      id: "SUB_" + String(subIdx).padStart(2, '0'),
      name: name,
      systems: []
    };
    ontology.push(currentSubject);
    subIdx++;
    sysIdx = 1;
  } else if (line.startsWith('•')) {
    // System
    const name = line.replace(/^•\s*/, '').trim();
    currentSystem = {
      id: "SYS_" + String(subIdx - 1).padStart(2, '0') + "_" + String(sysIdx).padStart(2, '0'),
      subjectId: currentSubject.id,
      name: name,
      topics: []
    };
    currentSubject.systems.push(currentSystem);
    sysIdx++;
    topIdx = 1;
  } else {
    // Topic
    currentSystem.topics.push({
      id: "TOPIC_" + String(subIdx - 1).padStart(2, '0') + "_" + String(sysIdx - 1).padStart(2, '0') + "_" + String(topIdx).padStart(3, '0'),
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
    topIdx++;
  }
}

const fileHeader = "export interface OntologyTopic {\n" +
"  id: string;\n" +
"  subjectId: string;\n" +
"  systemId: string;\n" +
"  name: string;\n" +
"  highYield: boolean;\n" +
"  estimatedStudyMinutes: number;\n" +
"  relatedTopics: string[];\n" +
"  aliases: string[];\n" +
"  pyqWeight: number;\n" +
"  difficulty: 'low' | 'average' | 'high';\n" +
"}\n\n" +
"export interface OntologySystem {\n" +
"  id: string;\n" +
"  subjectId: string;\n" +
"  name: string;\n" +
"  topics: OntologyTopic[];\n" +
"}\n\n" +
"export interface OntologySubject {\n" +
"  id: string;\n" +
"  name: string;\n" +
"  systems: OntologySystem[];\n" +
"}\n\n" +
"export const UNIVERSAL_ONTOLOGY: OntologySubject[] = ";

const fileFooter = ";\n\n" +
"export const ALL_TOPICS: OntologyTopic[] = UNIVERSAL_ONTOLOGY.flatMap(sub => sub.systems.flatMap(sys => sys.topics));\n" +
"export const ALL_SYSTEMS: OntologySystem[] = UNIVERSAL_ONTOLOGY.flatMap(sub => sub.systems);\n" +
"export const ALL_SUBJECTS: OntologySubject[] = UNIVERSAL_ONTOLOGY.map(sub => ({ id: sub.id, name: sub.name, systems: [] }));\n\n" +
"export function getTopicById(id: string): OntologyTopic | undefined {\n" +
"  return ALL_TOPICS.find(t => t.id === id);\n" +
"}\n\n" +
"export function getSystemById(id: string): OntologySystem | undefined {\n" +
"  return ALL_SYSTEMS.find(s => s.id === id);\n" +
"}\n\n" +
"export function getSubjectById(id: string): OntologySubject | undefined {\n" +
"  return UNIVERSAL_ONTOLOGY.find(s => s.id === id);\n" +
"}\n";

fs.writeFileSync('artifacts/study-tracker/src/data/ontology.ts', fileHeader + JSON.stringify(ontology, null, 2) + fileFooter);
console.log("Successfully generated ontology.ts");
