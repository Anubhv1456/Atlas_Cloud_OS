const fs = require('fs');

const raw = `16. Psychiatry

• Basic Psychology

Learning

Memory

Intelligence

Personality

Emotions

Stress


• Psychopathology

Disorders of Perception

Disorders of Thought

Disorders of Mood

Disorders of Memory

Disorders of Consciousness


• Major Psychiatric Disorders

Schizophrenia

Bipolar Disorder

Depression

Anxiety Disorders

Obsessive Compulsive Disorder

Somatoform Disorders


• Substance Use Disorders

Alcohol Dependence

Opioid Use Disorder

Cannabis

Stimulants

Tobacco Dependence


• Organic Psychiatry

Delirium

Dementia

Neurocognitive Disorders


• Psychopharmacology

Antipsychotics

Antidepressants

Mood Stabilizers

Anxiolytics

Electroconvulsive Therapy (ECT)





---

17. Dermatology

• Skin Lesions & Diagnosis

Primary Skin Lesions

Secondary Skin Lesions

Diagnostic Methods

Dermoscopy


• Infections & Infestations

Bacterial Infections

Viral Infections

Fungal Infections

Parasitic Infestations


• Papulosquamous Disorders

Psoriasis

Lichen Planus

Pityriasis Rosea


• Immunological Disorders

Urticaria

Pemphigus

Bullous Pemphigoid

Connective Tissue Disorders


• Hair & Nail Disorders

Alopecia

Nail Disorders


• Dermatology in Systemic Disease

Cutaneous Manifestations of Systemic Diseases

Genodermatoses





---

18. Anaesthesiology

• Principles of Anaesthesia

Preoperative Assessment

Airway Evaluation

Patient Preparation


• Anaesthesia Equipment

Anaesthesia Machine

Breathing Circuits

Monitoring Devices


• General Anaesthesia

Induction

Maintenance

Recovery

Complications


• Regional Anaesthesia

Spinal Anaesthesia

Epidural Anaesthesia

Peripheral Nerve Blocks


• Intensive Care

Mechanical Ventilation

Hemodynamic Monitoring

Sepsis Management


• Resuscitation

Basic Life Support (BLS)

Advanced Cardiac Life Support (ACLS)

Trauma Resuscitation





---

19. Radiology

• Imaging Physics

X-ray Physics

Ultrasound Physics

CT Physics

MRI Physics

Nuclear Medicine Basics


• Principles of Radiology

Contrast Media

Radiation Safety

Image Interpretation


• Diagnostic Imaging

Chest Imaging

Neuroimaging

Musculoskeletal Imaging

Abdominal Imaging

Obstetric & Gynecological Imaging


• Interventional Radiology

Vascular Procedures

Non-Vascular Procedures

Image-Guided Biopsy

Drainage Procedures


• Radiotherapy

Basic Principles

External Beam Radiotherapy

Brachytherapy

Radiation Complicatons`;

const lines = raw.split('\n').map(l => l.trim()).filter(l => l && l !== '---');

const subjects = [];
let currentSubject = null;
let currentSystem = null;

let subIdx = 15;

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

fs.writeFileSync('new_subjects3.json', JSON.stringify(subjects, null, 2));
