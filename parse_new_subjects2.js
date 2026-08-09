const fs = require('fs');

const raw = `11. General Medicine

• Cardiology

Ischemic Heart Disease

Heart Failure

Hypertension

Valvular Heart Disease

Arrhythmias

Cardiomyopathies

Pericardial Diseases

Congenital Heart Disease


• Respiratory Medicine

Asthma

COPD

Pneumonia

Tuberculosis

Pleural Diseases

Interstitial Lung Disease

Pulmonary Embolism


• Gastroenterology & Hepatology

Esophageal Disorders

Peptic Ulcer Disease

Inflammatory Bowel Disease

Liver Diseases

Pancreatitis

Gastrointestinal Bleeding


• Nephrology

Acute Kidney Injury

Chronic Kidney Disease

Glomerular Diseases

Tubular Disorders

Electrolyte Disorders

Acid-Base Disorders


• Neurology

Stroke

Epilepsy

Headache Disorders

Movement Disorders

Demyelinating Disorders

Peripheral Neuropathy


• Endocrinology

Diabetes Mellitus

Thyroid Disorders

Pituitary Disorders

Adrenal Disorders

Calcium Metabolism


• Hematology

Anemias

Hemolytic Disorders

Leukemias

Lymphomas

Bleeding & Coagulation Disorders


• Rheumatology & Autoimmune Disorders

Rheumatoid Arthritis

Systemic Lupus Erythematosus

Vasculitis

Spondyloarthropathies


• Infectious Diseases

Fever

Sepsis

HIV

Tropical Diseases

Opportunistic Infections





---

12. General Surgery

• Principles of Surgery

Wound Healing

Surgical Infections

Shock

Fluid & Electrolyte Management

Nutrition

Preoperative Evaluation

Postoperative Care


• Trauma

Polytrauma

Head Injury

Chest Trauma

Abdominal Trauma

Burns


• Gastrointestinal Surgery

Esophagus

Stomach

Small Intestine

Colon

Appendix

Hernia


• Hepatopancreatobiliary Surgery

Liver

Gallbladder

Biliary Tract

Pancreas


• Breast & Endocrine Surgery

Breast Disorders

Thyroid

Parathyroid

Adrenal Glands


• Urology

Urinary Stones

Prostate Disorders

Bladder Disorders

Testicular Disorders


• Cardiothoracic & Vascular Surgery

Peripheral Vascular Disease

Aortic Disorders

Thoracic Surgery Basics





---

13. Obstetrics & Gynaecology

• Pregnancy & Antenatal Care

Physiological Changes

Antenatal Visits

Fetal Assessment

High-Risk Pregnancy


• Complications of Pregnancy

Hypertensive Disorders

Gestational Diabetes

Antepartum Hemorrhage

Multiple Pregnancy

Rh Incompatibility


• Labour

Normal Labour

Abnormal Labour

Instrumental Delivery

Caesarean Section


• Puerperium

Postpartum Care

Lactation

Puerperal Infections

Postpartum Hemorrhage


• Menstrual Disorders

Amenorrhea

Dysmenorrhea

Abnormal Uterine Bleeding


• Genital Infections

PID

Sexually Transmitted Infections

Vaginal Infections


• Endometriosis

Diagnosis

Management


• Gynaecological Oncology

Cervical Cancer

Endometrial Cancer

Ovarian Cancer


• Contraception

Temporary Methods

Permanent Methods

Emergency Contraception


• Infertility

Female Infertility

Male Factor

Assisted Reproductive Techniques





---

14. Pediatrics

• Neonatology

Normal Newborn

Neonatal Resuscitation

Neonatal Jaundice

Neonatal Sepsis

Low Birth Weight


• Growth & Development

Growth Monitoring

Developmental Milestones

Developmental Disorders


• Nutrition

Breastfeeding

Complementary Feeding

Protein-Energy Malnutrition

Vitamin Deficiencies


• Systemic Pediatrics

Respiratory Disorders

Cardiology

Gastroenterology

Nephrology

Neurology

Endocrinology


• Genetics

Chromosomal Disorders

Inborn Errors of Metabolism

Genetic Counseling


• Pediatric Oncology

Leukemia

Lymphoma

Solid Tumors





---

15. Orthopedics

• Traumatology & Fractures

Fracture Healing

Upper Limb Fractures

Lower Limb Fractures

Pelvic Fractures

Spine Trauma


• Bone & Joint Infections

Osteomyelitis

Septic Arthritis

Tuberculosis of Bone


• Bone Tumours

Benign Bone Tumours

Malignant Bone Tumours

Metastatic Bone Disease


• Congenital Deformities

Developmental Dysplasia of Hip

Clubfoot

Limb Deformities


• Regional Orthopedics

Shoulder

Elbow

Hand

Hip

Knee

Foot & Ankle

Spine`;

const lines = raw.split('\n').map(l => l.trim()).filter(l => l && l !== '---');

const subjects = [];
let currentSubject = null;
let currentSystem = null;

let subIdx = 10;

for (let line of lines) {
  if (line.match(/^\d+\.\s.*/)) {
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

fs.writeFileSync('new_subjects2.json', JSON.stringify(subjects, null, 2));
