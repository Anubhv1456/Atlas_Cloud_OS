import { OntologySubject } from './ontology.neetpg';

export const USMLE_ONTOLOGY: OntologySubject[] = [
  {
    id: 'USMLE_1',
    name: 'Cardiovascular System',
    systems: [
      {
        id: 'USMLE_1_1', name: 'Anatomy & Embryology', subjectId: 'USMLE_1', topics: [
          { id: 'USMLE_1_1_001', subjectId: 'USMLE_1', systemId: 'USMLE_1_1', name: 'Heart Embryology & Development', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Cardiac looping', 'Septation'], pyqWeight: 4, difficulty: 'high' },
          { id: 'USMLE_1_1_002', subjectId: 'USMLE_1', systemId: 'USMLE_1_1', name: 'Congenital Heart Diseases (Right-to-Left Shunts)', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['Tetralogy of Fallot', 'Transposition of Great Vessels', 'Truncus arteriosus'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_1_1_003', subjectId: 'USMLE_1', systemId: 'USMLE_1_1', name: 'Congenital Heart Diseases (Left-to-Right Shunts)', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['VSD', 'ASD', 'PDA'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_1_1_004', subjectId: 'USMLE_1', systemId: 'USMLE_1_1', name: 'Coarctation of the Aorta & Other Anomalies', highYield: false, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Ebstein anomaly'], pyqWeight: 3, difficulty: 'average' },
          { id: 'USMLE_1_1_005', subjectId: 'USMLE_1', systemId: 'USMLE_1_1', name: 'Cardiac Anatomy, Chambers & Valves', highYield: false, estimatedStudyMinutes: 45, relatedTopics: [], aliases: [], pyqWeight: 2, difficulty: 'low' },
          { id: 'USMLE_1_1_006', subjectId: 'USMLE_1', systemId: 'USMLE_1_1', name: 'Coronary Blood Supply', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['LAD', 'PDA', 'Coronary dominance'], pyqWeight: 5, difficulty: 'average' }
        ]
      },
      {
        id: 'USMLE_1_2', name: 'Physiology', subjectId: 'USMLE_1', topics: [
          { id: 'USMLE_1_2_001', subjectId: 'USMLE_1', systemId: 'USMLE_1_2', name: 'Cardiac Output & Venous Return Curves', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['Vascular function curves'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_1_2_002', subjectId: 'USMLE_1', systemId: 'USMLE_1_2', name: 'Cardiac Mechanics (Preload, Afterload, Contractility)', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['Starling curve', 'Ejection fraction'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_1_2_003', subjectId: 'USMLE_1', systemId: 'USMLE_1_2', name: 'Cardiac Cycle & Wiggers Diagram', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['Heart sounds', 'S3', 'S4'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_1_2_004', subjectId: 'USMLE_1', systemId: 'USMLE_1_2', name: 'Cardiac Action Potentials (Pacemaker & Myocardial)', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['SA node', 'AV node'], pyqWeight: 4, difficulty: 'high' },
          { id: 'USMLE_1_2_005', subjectId: 'USMLE_1', systemId: 'USMLE_1_2', name: 'Electrocardiogram (ECG) Basics', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['QT interval', 'QRS complex'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_1_2_006', subjectId: 'USMLE_1', systemId: 'USMLE_1_2', name: 'Baroreceptors and Blood Pressure Regulation', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Carotid sinus', 'Aortic arch'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_1_2_007', subjectId: 'USMLE_1', systemId: 'USMLE_1_2', name: 'Autoregulation of Blood Flow', highYield: false, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Hypoxia', 'Adenosine', 'Nitric oxide'], pyqWeight: 3, difficulty: 'average' },
          { id: 'USMLE_1_2_008', subjectId: 'USMLE_1', systemId: 'USMLE_1_2', name: 'Capillary Fluid Exchange (Starling Forces)', highYield: false, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Edema', 'Hydrostatic pressure', 'Oncotic pressure'], pyqWeight: 3, difficulty: 'average' }
        ]
      },
      {
        id: 'USMLE_1_3', name: 'Pathology', subjectId: 'USMLE_1', topics: [
          { id: 'USMLE_1_3_001', subjectId: 'USMLE_1', systemId: 'USMLE_1_3', name: 'Ischemic Heart Disease (Angina & MI)', highYield: true, estimatedStudyMinutes: 120, relatedTopics: [], aliases: ['STEMI', 'NSTEMI', 'Stable angina'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_1_3_002', subjectId: 'USMLE_1', systemId: 'USMLE_1_3', name: 'Complications of Myocardial Infarction', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Papillary muscle rupture', 'Ventricular pseudoaneurysm', 'Dressler syndrome'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_1_3_003', subjectId: 'USMLE_1', systemId: 'USMLE_1_3', name: 'Heart Failure & Cor Pulmonale', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['Left heart failure', 'Right heart failure', 'HFrEF', 'HFpEF'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_1_3_004', subjectId: 'USMLE_1', systemId: 'USMLE_1_3', name: 'Cardiomyopathies', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Dilated', 'Hypertrophic', 'Restrictive'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_1_3_005', subjectId: 'USMLE_1', systemId: 'USMLE_1_3', name: 'Valvular Heart Diseases', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['Aortic stenosis', 'Mitral regurgitation', 'Mitral stenosis', 'Aortic regurgitation'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_1_3_006', subjectId: 'USMLE_1', systemId: 'USMLE_1_3', name: 'Rheumatic Fever & Rheumatic Heart Disease', highYield: false, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Aschoff bodies', 'Anitschkow cells'], pyqWeight: 3, difficulty: 'average' },
          { id: 'USMLE_1_3_007', subjectId: 'USMLE_1', systemId: 'USMLE_1_3', name: 'Infective Endocarditis', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['S. aureus', 'Viridans streptococci', 'Janeway lesions'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_1_3_008', subjectId: 'USMLE_1', systemId: 'USMLE_1_3', name: 'Pericardial Diseases', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Pericarditis', 'Cardiac tamponade', 'Constrictive pericarditis'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_1_3_009', subjectId: 'USMLE_1', systemId: 'USMLE_1_3', name: 'Aortic Aneurysms and Dissections', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['AAA', 'Thoracic aortic aneurysm', 'Aortic dissection'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_1_3_010', subjectId: 'USMLE_1', systemId: 'USMLE_1_3', name: 'Vasculitides', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['Giant cell arteritis', 'Takayasu', 'Kawasaki', 'Polyarteritis nodosa', 'Wegener', 'Churg-Strauss'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_1_3_011', subjectId: 'USMLE_1', systemId: 'USMLE_1_3', name: 'Vascular Tumors & Cardiac Tumors', highYield: false, estimatedStudyMinutes: 30, relatedTopics: [], aliases: ['Myxoma', 'Rhabdomyoma', 'Kaposi sarcoma', 'Angiosarcoma'], pyqWeight: 2, difficulty: 'low' },
          { id: 'USMLE_1_3_012', subjectId: 'USMLE_1', systemId: 'USMLE_1_3', name: 'Hypertension & Arteriosclerosis', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Atherosclerosis', 'Monckeberg', 'Arteriolosclerosis'], pyqWeight: 4, difficulty: 'average' }
        ]
      },
      {
        id: 'USMLE_1_4', name: 'Pharmacology', subjectId: 'USMLE_1', topics: [
          { id: 'USMLE_1_4_001', subjectId: 'USMLE_1', systemId: 'USMLE_1_4', name: 'Antiarrhythmics (Class I-IV)', highYield: true, estimatedStudyMinutes: 120, relatedTopics: [], aliases: ['Sodium channel blockers', 'Beta blockers', 'Potassium channel blockers', 'Calcium channel blockers'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_1_4_002', subjectId: 'USMLE_1', systemId: 'USMLE_1_4', name: 'Other Antiarrhythmics', highYield: false, estimatedStudyMinutes: 30, relatedTopics: [], aliases: ['Adenosine', 'Magnesium'], pyqWeight: 3, difficulty: 'low' },
          { id: 'USMLE_1_4_003', subjectId: 'USMLE_1', systemId: 'USMLE_1_4', name: 'Heart Failure Medications', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Digoxin', 'Sacubitril-Valsartan', 'Milrinone'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_1_4_004', subjectId: 'USMLE_1', systemId: 'USMLE_1_4', name: 'Antianginals', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Nitrates', 'Ranolazine'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_1_4_005', subjectId: 'USMLE_1', systemId: 'USMLE_1_4', name: 'Antihypertensives', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Hydralazine', 'Minoxidil', 'Nitroprusside', 'Clonidine', 'Alpha blockers'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_1_4_006', subjectId: 'USMLE_1', systemId: 'USMLE_1_4', name: 'Lipid-lowering Agents', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Statins', 'Fibrates', 'Ezetimibe', 'PCSK9 inhibitors', 'Niacin'], pyqWeight: 5, difficulty: 'average' }
        ]
      }
    ]
  },

  {
    id: 'USMLE_2',
    name: 'Respiratory System',
    systems: [
      {
        id: 'USMLE_2_1', name: 'Anatomy & Embryology', subjectId: 'USMLE_2', topics: [
          { id: 'USMLE_2_1_001', subjectId: 'USMLE_2', systemId: 'USMLE_2_1', name: 'Respiratory Tract Development', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Embryonic', 'Pseudoglandular', 'Canalicular', 'Saccular', 'Alveolar stages'], pyqWeight: 4, difficulty: 'high' },
          { id: 'USMLE_2_1_002', subjectId: 'USMLE_2', systemId: 'USMLE_2_1', name: 'Pulmonary Surfactant & NRDS', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Neonatal respiratory distress syndrome', 'L/S ratio', 'Type II pneumocytes'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_2_1_003', subjectId: 'USMLE_2', systemId: 'USMLE_2_1', name: 'Anatomy of the Respiratory Tract', highYield: false, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Trachea', 'Bronchi', 'Bronchioles', 'Alveoli', 'Club cells'], pyqWeight: 3, difficulty: 'low' },
          { id: 'USMLE_2_1_004', subjectId: 'USMLE_2', systemId: 'USMLE_2_1', name: 'Diaphragm Anatomy & Hernias', highYield: true, estimatedStudyMinutes: 30, relatedTopics: [], aliases: ['Bochdalek', 'Morgagni', 'Sliding hiatal hernia'], pyqWeight: 4, difficulty: 'average' }
        ]
      },
      {
        id: 'USMLE_2_2', name: 'Physiology', subjectId: 'USMLE_2', topics: [
          { id: 'USMLE_2_2_001', subjectId: 'USMLE_2', systemId: 'USMLE_2_2', name: 'Lung Volumes & Capacities', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['TLC', 'FRC', 'RV', 'VC', 'Spirometry'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_2_2_002', subjectId: 'USMLE_2', systemId: 'USMLE_2_2', name: 'Pulmonary Mechanics', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['Compliance', 'Elasticity', 'Resistance', 'Hysteresis'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_2_2_003', subjectId: 'USMLE_2', systemId: 'USMLE_2_2', name: 'Gas Exchange & Alveolar Gas Equation', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['Diffusion-limited', 'Perfusion-limited', 'PAO2'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_2_2_004', subjectId: 'USMLE_2', systemId: 'USMLE_2_2', name: 'Ventilation-Perfusion (V/Q) Mismatch', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['Dead space', 'Shunt', 'A-a gradient'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_2_2_005', subjectId: 'USMLE_2', systemId: 'USMLE_2_2', name: 'O2 & CO2 Transport', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['Hemoglobin', 'Bohr effect', 'Haldane effect', 'O2 dissociation curve'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_2_2_006', subjectId: 'USMLE_2', systemId: 'USMLE_2_2', name: 'Response to High Altitude & Exercise', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Hypoxia', 'Acclimatization'], pyqWeight: 4, difficulty: 'average' }
        ]
      },
      {
        id: 'USMLE_2_3', name: 'Pathology', subjectId: 'USMLE_2', topics: [
          { id: 'USMLE_2_3_001', subjectId: 'USMLE_2', systemId: 'USMLE_2_3', name: 'Obstructive Lung Diseases', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['COPD', 'Chronic bronchitis', 'Emphysema', 'Asthma', 'Bronchiectasis'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_2_3_002', subjectId: 'USMLE_2', systemId: 'USMLE_2_3', name: 'Restrictive Lung Diseases', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['Idiopathic pulmonary fibrosis', 'Sarcoidosis', 'Pneumoconioses', 'ARDS'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_2_3_003', subjectId: 'USMLE_2', systemId: 'USMLE_2_3', name: 'Pulmonary Vascular Diseases', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Pulmonary hypertension', 'Pulmonary embolism', 'DVT'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_2_3_004', subjectId: 'USMLE_2', systemId: 'USMLE_2_3', name: 'Sleep Apnea', highYield: false, estimatedStudyMinutes: 30, relatedTopics: [], aliases: ['OSA', 'Central sleep apnea', 'Obesity hypoventilation'], pyqWeight: 3, difficulty: 'low' },
          { id: 'USMLE_2_3_005', subjectId: 'USMLE_2', systemId: 'USMLE_2_3', name: 'Lung Cancer & Neoplasms', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['Small cell carcinoma', 'Squamous cell carcinoma', 'Adenocarcinoma', 'Mesothelioma', 'Carcinoid'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_2_3_006', subjectId: 'USMLE_2', systemId: 'USMLE_2_3', name: 'Pneumonia & Pulmonary Infections', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['Lobar pneumonia', 'Bronchopneumonia', 'Atypical pneumonia', 'Tuberculosis'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_2_3_007', subjectId: 'USMLE_2', systemId: 'USMLE_2_3', name: 'Pleural Diseases', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Pneumothorax', 'Pleural effusion', 'Exudate vs Transudate'], pyqWeight: 4, difficulty: 'average' }
        ]
      },
      {
        id: 'USMLE_2_4', name: 'Pharmacology', subjectId: 'USMLE_2', topics: [
          { id: 'USMLE_2_4_001', subjectId: 'USMLE_2', systemId: 'USMLE_2_4', name: 'Asthma & COPD Medications', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['SABA', 'LABA', 'Muscarinic antagonists', 'Inhaled corticosteroids', 'Leukotriene modifiers', 'Theophylline', 'Omalizumab'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_2_4_002', subjectId: 'USMLE_2', systemId: 'USMLE_2_4', name: 'Antihistamines', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['First generation', 'Second generation', 'H1 blockers'], pyqWeight: 4, difficulty: 'low' },
          { id: 'USMLE_2_4_003', subjectId: 'USMLE_2', systemId: 'USMLE_2_4', name: 'Expectorants & Antitussives', highYield: false, estimatedStudyMinutes: 30, relatedTopics: [], aliases: ['Guaifenesin', 'N-acetylcysteine', 'Dextromethorphan'], pyqWeight: 2, difficulty: 'low' },
          { id: 'USMLE_2_4_004', subjectId: 'USMLE_2', systemId: 'USMLE_2_4', name: 'Pulmonary Hypertension Drugs', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Bosentan', 'Sildenafil', 'Epoprostenol', 'Iloprost'], pyqWeight: 4, difficulty: 'high' }
        ]
      }
    ]
  },

  {
    id: 'USMLE_3',
    name: 'Renal System',
    systems: [
      {
        id: 'USMLE_3_1', name: 'Anatomy & Embryology', subjectId: 'USMLE_3', topics: [
          { id: 'USMLE_3_1_001', subjectId: 'USMLE_3', systemId: 'USMLE_3_1', name: 'Kidney Embryology', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Pronephros', 'Mesonephros', 'Metanephros', 'Ureteric bud', 'Metanephric mesenchyme'], pyqWeight: 4, difficulty: 'high' },
          { id: 'USMLE_3_1_002', subjectId: 'USMLE_3', systemId: 'USMLE_3_1', name: 'Congenital Renal Anomalies', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Potter sequence', 'Horseshoe kidney', 'Multicystic dysplastic kidney', 'Duplex collecting system'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_3_1_003', subjectId: 'USMLE_3', systemId: 'USMLE_3_1', name: 'Renal & Glomerular Anatomy', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Podocytes', 'Glomerular basement membrane', 'Juxtaglomerular apparatus', 'Ureters'], pyqWeight: 4, difficulty: 'average' }
        ]
      },
      {
        id: 'USMLE_3_2', name: 'Physiology', subjectId: 'USMLE_3', topics: [
          { id: 'USMLE_3_2_001', subjectId: 'USMLE_3', systemId: 'USMLE_3_2', name: 'Fluid Compartments & Clearance', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Total body water', 'Inulin clearance', 'PAH clearance'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_3_2_002', subjectId: 'USMLE_3', systemId: 'USMLE_3_2', name: 'GFR, RPF, & Filtration Fraction', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Glomerular filtration rate', 'Renal plasma flow', 'Net filtration pressure'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_3_2_003', subjectId: 'USMLE_3', systemId: 'USMLE_3_2', name: 'Autoregulation of GFR', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Myogenic mechanism', 'Tubuloglomerular feedback'], pyqWeight: 4, difficulty: 'high' },
          { id: 'USMLE_3_2_004', subjectId: 'USMLE_3', systemId: 'USMLE_3_2', name: 'Nephron Transport Physiology', highYield: true, estimatedStudyMinutes: 120, relatedTopics: [], aliases: ['PCT', 'Loop of Henle', 'DCT', 'Collecting duct', 'Countercurrent multiplier'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_3_2_005', subjectId: 'USMLE_3', systemId: 'USMLE_3_2', name: 'Renin-Angiotensin-Aldosterone System (RAAS)', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Renin', 'Angiotensin II', 'Aldosterone', 'ANP'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_3_2_006', subjectId: 'USMLE_3', systemId: 'USMLE_3_2', name: 'Acid-Base Physiology & Disorders', highYield: true, estimatedStudyMinutes: 120, relatedTopics: [], aliases: ['Metabolic acidosis', 'Metabolic alkalosis', 'Respiratory acidosis', 'Respiratory alkalosis', 'Anion gap', 'Winters formula'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_3_2_007', subjectId: 'USMLE_3', systemId: 'USMLE_3_2', name: 'Endocrine Functions of the Kidney', highYield: false, estimatedStudyMinutes: 30, relatedTopics: [], aliases: ['Erythropoietin', 'Vitamin D', 'Prostaglandins', 'Dopamine'], pyqWeight: 3, difficulty: 'low' },
          { id: 'USMLE_3_2_008', subjectId: 'USMLE_3', systemId: 'USMLE_3_2', name: 'Electrolyte Disorders', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['Hyponatremia', 'Hyperkalemia', 'Hypocalcemia', 'Hypomagnesemia'], pyqWeight: 5, difficulty: 'high' }
        ]
      },
      {
        id: 'USMLE_3_3', name: 'Pathology', subjectId: 'USMLE_3', topics: [
          { id: 'USMLE_3_3_001', subjectId: 'USMLE_3', systemId: 'USMLE_3_3', name: 'Nephrotic Syndromes', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['Minimal change disease', 'FSGS', 'Membranous nephropathy', 'Amyloidosis', 'Diabetic glomerulonephropathy'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_3_3_002', subjectId: 'USMLE_3', systemId: 'USMLE_3_3', name: 'Nephritic Syndromes', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['PSGN', 'IgA nephropathy', 'Alport syndrome', 'RPGN', 'Goodpasture', 'MPGN'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_3_3_003', subjectId: 'USMLE_3', systemId: 'USMLE_3_3', name: 'Acute Kidney Injury (AKI)', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['Prerenal azotemia', 'Intrinsic renal failure', 'Postrenal', 'Acute tubular necrosis', 'Acute interstitial nephritis', 'Renal papillary necrosis'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_3_3_004', subjectId: 'USMLE_3', systemId: 'USMLE_3_3', name: 'Chronic Kidney Disease (CKD)', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Renal osteodystrophy', 'Uremia'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_3_3_005', subjectId: 'USMLE_3', systemId: 'USMLE_3_3', name: 'Renal Cystic Diseases', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['ADPKD', 'ARPKD', 'Medullary cystic disease'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_3_3_006', subjectId: 'USMLE_3', systemId: 'USMLE_3_3', name: 'Kidney Stones (Nephrolithiasis)', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Calcium oxalate', 'Struvite', 'Uric acid', 'Cystine'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_3_3_007', subjectId: 'USMLE_3', systemId: 'USMLE_3_3', name: 'Renal Neoplasms', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Renal cell carcinoma', 'Wilms tumor', 'Transitional cell carcinoma', 'Squamous cell carcinoma of bladder'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_3_3_008', subjectId: 'USMLE_3', systemId: 'USMLE_3_3', name: 'Urinary Tract Infections & Pyelonephritis', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Cystitis', 'Acute pyelonephritis', 'Chronic pyelonephritis'], pyqWeight: 4, difficulty: 'low' }
        ]
      },
      {
        id: 'USMLE_3_4', name: 'Pharmacology', subjectId: 'USMLE_3', topics: [
          { id: 'USMLE_3_4_001', subjectId: 'USMLE_3', systemId: 'USMLE_3_4', name: 'Diuretics', highYield: true, estimatedStudyMinutes: 120, relatedTopics: [], aliases: ['Acetazolamide', 'Loop diuretics', 'Furosemide', 'Thiazides', 'Potassium-sparing diuretics', 'Spironolactone', 'Osmotic diuretics', 'Mannitol'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_3_4_002', subjectId: 'USMLE_3', systemId: 'USMLE_3_4', name: 'ACE Inhibitors & ARBs', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Lisinopril', 'Losartan', 'Aliskiren'], pyqWeight: 5, difficulty: 'average' }
        ]
      }
    ]
  },

  {
    id: 'USMLE_4',
    name: 'Gastrointestinal System',
    systems: [
      {
        id: 'USMLE_4_1', name: 'Anatomy & Embryology', subjectId: 'USMLE_4', topics: [
          { id: 'USMLE_4_1_001', subjectId: 'USMLE_4', systemId: 'USMLE_4_1', name: 'GI Embryology', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Foregut', 'Midgut', 'Hindgut', 'Ventral wall defects', 'Gastroschisis', 'Omphalocele'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_4_1_002', subjectId: 'USMLE_4', systemId: 'USMLE_4_1', name: 'Congenital GI Anomalies', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['Tracheoesophageal fistula', 'Pyloric stenosis', 'Hirschsprung disease', 'Meckel diverticulum', 'Malrotation', 'Intussusception', 'Necrotizing enterocolitis'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_4_1_003', subjectId: 'USMLE_4', systemId: 'USMLE_4_1', name: 'GI Anatomy & Blood Supply', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Celiac artery', 'SMA', 'IMA', 'Portocaval anastomoses', 'Pectinate line', 'Liver anatomy'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_4_1_004', subjectId: 'USMLE_4', systemId: 'USMLE_4_1', name: 'GI Histology', highYield: false, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Brunner glands', 'Peyer patches', 'Enteric nervous system', 'Auerbach', 'Meissner'], pyqWeight: 3, difficulty: 'average' }
        ]
      },
      {
        id: 'USMLE_4_2', name: 'Physiology', subjectId: 'USMLE_4', topics: [
          { id: 'USMLE_4_2_001', subjectId: 'USMLE_4', systemId: 'USMLE_4_2', name: 'GI Regulatory Substances', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['Gastrin', 'CCK', 'Secretin', 'GIP', 'Somatostatin', 'VIP', 'Motilin'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_4_2_002', subjectId: 'USMLE_4', systemId: 'USMLE_4_2', name: 'Gastric & Pancreatic Secretions', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Parietal cells', 'Chief cells', 'Pancreatic enzymes', 'Gastric acid secretion'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_4_2_003', subjectId: 'USMLE_4', systemId: 'USMLE_4_2', name: 'Bile Secretion & Bilirubin Metabolism', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Bile acids', 'Enterohepatic circulation', 'Direct bilirubin', 'Indirect bilirubin'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_4_2_004', subjectId: 'USMLE_4', systemId: 'USMLE_4_2', name: 'Digestion & Absorption', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Carbohydrates', 'Proteins', 'Lipids', 'Iron', 'B12', 'Folate'], pyqWeight: 4, difficulty: 'average' }
        ]
      },
      {
        id: 'USMLE_4_3', name: 'Pathology', subjectId: 'USMLE_4', topics: [
          { id: 'USMLE_4_3_001', subjectId: 'USMLE_4', systemId: 'USMLE_4_3', name: 'Esophageal Disorders', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Achalasia', 'GERD', 'Barrett esophagus', 'Esophageal cancer', 'Mallory-Weiss', 'Boerhaave'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_4_3_002', subjectId: 'USMLE_4', systemId: 'USMLE_4_3', name: 'Stomach Disorders', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Gastritis', 'Peptic ulcer disease', 'Gastric cancer', 'Menetrier disease', 'Zollinger-Ellison'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_4_3_003', subjectId: 'USMLE_4', systemId: 'USMLE_4_3', name: 'Malabsorption Syndromes', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Celiac disease', 'Whipple disease', 'Lactose intolerance'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_4_3_004', subjectId: 'USMLE_4', systemId: 'USMLE_4_3', name: 'Inflammatory Bowel Disease (IBD)', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Crohn disease', 'Ulcerative colitis'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_4_3_005', subjectId: 'USMLE_4', systemId: 'USMLE_4_3', name: 'Intestinal Disorders', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['Appendicitis', 'Diverticular disease', 'Irritable bowel syndrome', 'Bowel obstruction', 'Volvulus', 'Ischemic bowel disease'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_4_3_006', subjectId: 'USMLE_4', systemId: 'USMLE_4_3', name: 'Colorectal Polyps & Cancer', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['FAP', 'Lynch syndrome', 'Adenomatous polyps', 'Colorectal carcinoma'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_4_3_007', subjectId: 'USMLE_4', systemId: 'USMLE_4_3', name: 'Liver Pathology (Cirrhosis & Hepatitis)', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['Jaundice', 'Cirrhosis', 'Portal hypertension', 'Viral hepatitis', 'Alcoholic liver disease', 'NAFLD'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_4_3_008', subjectId: 'USMLE_4', systemId: 'USMLE_4_3', name: 'Metabolic Liver Diseases', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Hemochromatosis', 'Wilson disease', 'Alpha-1 antitrypsin deficiency'], pyqWeight: 4, difficulty: 'high' },
          { id: 'USMLE_4_3_009', subjectId: 'USMLE_4', systemId: 'USMLE_4_3', name: 'Biliary Tract Diseases', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Cholelithiasis', 'Cholecystitis', 'Primary biliary cholangitis', 'Primary sclerosing cholangitis'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_4_3_010', subjectId: 'USMLE_4', systemId: 'USMLE_4_3', name: 'Pancreatic Disorders', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Acute pancreatitis', 'Chronic pancreatitis', 'Pancreatic adenocarcinoma'], pyqWeight: 5, difficulty: 'average' }
        ]
      },
      {
        id: 'USMLE_4_4', name: 'Pharmacology', subjectId: 'USMLE_4', topics: [
          { id: 'USMLE_4_4_001', subjectId: 'USMLE_4', systemId: 'USMLE_4_4', name: 'Antacids & Acid-reducing Drugs', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['PPIs', 'Omeprazole', 'H2 blockers', 'Famotidine', 'Antacids', 'Bismuth'], pyqWeight: 4, difficulty: 'low' },
          { id: 'USMLE_4_4_002', subjectId: 'USMLE_4', systemId: 'USMLE_4_4', name: 'Laxatives & Antidiarrheals', highYield: false, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Loperamide', 'Octreotide', 'Osmotic laxatives', 'Macrogol', 'Senna'], pyqWeight: 3, difficulty: 'low' },
          { id: 'USMLE_4_4_003', subjectId: 'USMLE_4', systemId: 'USMLE_4_4', name: 'Antiemetics', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Ondansetron', 'Metoclopramide', 'Prochlorperazine', 'Aprepitant'], pyqWeight: 4, difficulty: 'average' }
        ]
      }
    ]
  },

  {
    id: 'USMLE_5',
    name: 'Endocrine System',
    systems: [
      {
        id: 'USMLE_5_1', name: 'Anatomy & Embryology', subjectId: 'USMLE_5', topics: [
          { id: 'USMLE_5_1_001', subjectId: 'USMLE_5', systemId: 'USMLE_5_1', name: 'Thyroid & Parathyroid Embryology', highYield: true, estimatedStudyMinutes: 30, relatedTopics: [], aliases: ['Thyroglossal duct cyst', 'Pharyngeal pouches'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_5_1_002', subjectId: 'USMLE_5', systemId: 'USMLE_5_1', name: 'Pituitary Embryology & Anatomy', highYield: true, estimatedStudyMinutes: 30, relatedTopics: [], aliases: ['Rathke pouch', 'Anterior pituitary', 'Posterior pituitary'], pyqWeight: 4, difficulty: 'low' },
          { id: 'USMLE_5_1_003', subjectId: 'USMLE_5', systemId: 'USMLE_5_1', name: 'Adrenal Gland Anatomy', highYield: true, estimatedStudyMinutes: 30, relatedTopics: [], aliases: ['Adrenal cortex', 'Adrenal medulla', 'GFR zones'], pyqWeight: 4, difficulty: 'low' },
          { id: 'USMLE_5_1_004', subjectId: 'USMLE_5', systemId: 'USMLE_5_1', name: 'Endocrine Pancreas Histology', highYield: false, estimatedStudyMinutes: 30, relatedTopics: [], aliases: ['Islets of Langerhans', 'Alpha cells', 'Beta cells'], pyqWeight: 3, difficulty: 'low' }
        ]
      },
      {
        id: 'USMLE_5_2', name: 'Physiology', subjectId: 'USMLE_5', topics: [
          { id: 'USMLE_5_2_001', subjectId: 'USMLE_5', systemId: 'USMLE_5_2', name: 'Hypothalamic-Pituitary Axis', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Releasing hormones', 'Feedback loops', 'Prolactin', 'Growth hormone'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_5_2_002', subjectId: 'USMLE_5', systemId: 'USMLE_5_2', name: 'Thyroid Hormones', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['T3', 'T4', 'TSH', 'TBG'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_5_2_003', subjectId: 'USMLE_5', systemId: 'USMLE_5_2', name: 'Calcium Homeostasis', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['PTH', 'Calcitonin', 'Vitamin D'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_5_2_004', subjectId: 'USMLE_5', systemId: 'USMLE_5_2', name: 'Adrenal Hormones', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['Cortisol', 'Aldosterone', 'Androgens', 'Catecholamines'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_5_2_005', subjectId: 'USMLE_5', systemId: 'USMLE_5_2', name: 'Endocrine Pancreas (Insulin & Glucagon)', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Insulin resistance', 'GLUT transporters'], pyqWeight: 5, difficulty: 'average' }
        ]
      },
      {
        id: 'USMLE_5_3', name: 'Pathology', subjectId: 'USMLE_5', topics: [
          { id: 'USMLE_5_3_001', subjectId: 'USMLE_5', systemId: 'USMLE_5_3', name: 'Pituitary Disorders', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Prolactinoma', 'Acromegaly', 'Hypopituitarism', 'Diabetes insipidus', 'SIADH'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_5_3_002', subjectId: 'USMLE_5', systemId: 'USMLE_5_3', name: 'Thyroid Disorders (Hyper & Hypo)', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['Graves disease', 'Hashimoto thyroiditis', 'Myxedema coma', 'Thyroid storm'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_5_3_003', subjectId: 'USMLE_5', systemId: 'USMLE_5_3', name: 'Thyroid Neoplasms', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Papillary carcinoma', 'Follicular carcinoma', 'Medullary carcinoma', 'Anaplastic carcinoma'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_5_3_004', subjectId: 'USMLE_5', systemId: 'USMLE_5_3', name: 'Parathyroid Disorders', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Primary hyperparathyroidism', 'Secondary hyperparathyroidism', 'Hypoparathyroidism', 'Pseudohypoparathyroidism'], pyqWeight: 4, difficulty: 'high' },
          { id: 'USMLE_5_3_005', subjectId: 'USMLE_5', systemId: 'USMLE_5_3', name: 'Adrenal Cortical Disorders', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['Cushing syndrome', 'Addison disease', 'Hyperaldosteronism', 'Conn syndrome'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_5_3_006', subjectId: 'USMLE_5', systemId: 'USMLE_5_3', name: 'Congenital Adrenal Hyperplasia (CAH)', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['21-hydroxylase deficiency', '11beta-hydroxylase deficiency', '17alpha-hydroxylase deficiency'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_5_3_007', subjectId: 'USMLE_5', systemId: 'USMLE_5_3', name: 'Adrenal Medulla Disorders', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Pheochromocytoma', 'Neuroblastoma'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_5_3_008', subjectId: 'USMLE_5', systemId: 'USMLE_5_3', name: 'Diabetes Mellitus', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['Type 1 DM', 'Type 2 DM', 'DKA', 'HHS'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_5_3_009', subjectId: 'USMLE_5', systemId: 'USMLE_5_3', name: 'Multiple Endocrine Neoplasias (MEN)', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['MEN 1', 'MEN 2A', 'MEN 2B'], pyqWeight: 5, difficulty: 'high' }
        ]
      },
      {
        id: 'USMLE_5_4', name: 'Pharmacology', subjectId: 'USMLE_5', topics: [
          { id: 'USMLE_5_4_001', subjectId: 'USMLE_5', systemId: 'USMLE_5_4', name: 'Antidiabetic Agents', highYield: true, estimatedStudyMinutes: 90, relatedTopics: [], aliases: ['Insulin', 'Metformin', 'Sulfonylureas', 'TZDs', 'GLP-1 agonists', 'DPP-4 inhibitors', 'SGLT2 inhibitors'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_5_4_002', subjectId: 'USMLE_5', systemId: 'USMLE_5_4', name: 'Thyroid & Antithyroid Drugs', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Levothyroxine', 'Propylthiouracil (PTU)', 'Methimazole'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_5_4_003', subjectId: 'USMLE_5', systemId: 'USMLE_5_4', name: 'Glucocorticoids', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Prednisone', 'Dexamethasone', 'Steroid side effects'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_5_4_004', subjectId: 'USMLE_5', systemId: 'USMLE_5_4', name: 'Bone & Mineral Drugs', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Bisphosphonates', 'Teriparatide', 'Cinacalcet', 'Sevelamer'], pyqWeight: 4, difficulty: 'high' }
        ]
      }
    ]
  },

  {
    id: 'USMLE_6',
    name: 'Reproductive System',
    systems: [
      {
        id: 'USMLE_6_1', name: 'Anatomy & Embryology', subjectId: 'USMLE_6', topics: [
          { id: 'USMLE_6_1_001', subjectId: 'USMLE_6', systemId: 'USMLE_6_1', name: 'Genital Embryology', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['SRY gene', 'Mullerian duct', 'Wolffian duct', 'Bicornuate uterus'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_6_1_002', subjectId: 'USMLE_6', systemId: 'USMLE_6_1', name: 'Congenital Penile Anomalies', highYield: false, estimatedStudyMinutes: 30, relatedTopics: [], aliases: ['Hypospadias', 'Epispadias'], pyqWeight: 3, difficulty: 'low' },
          { id: 'USMLE_6_1_003', subjectId: 'USMLE_6', systemId: 'USMLE_6_1', name: 'Disorders of Sex Development (DSD)', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Klinefelter syndrome', 'Turner syndrome', 'Androgen insensitivity syndrome', '5alpha-reductase deficiency'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_6_1_004', subjectId: 'USMLE_6', systemId: 'USMLE_6_1', name: 'Female Reproductive Anatomy', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Suspensory ligament of ovary', 'Cardinal ligament', 'Broad ligament'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_6_1_005', subjectId: 'USMLE_6', systemId: 'USMLE_6_1', name: 'Male Reproductive Anatomy', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Seminiferous tubules', 'Epididymis', 'Prostate', 'Spermatic cord'], pyqWeight: 4, difficulty: 'average' }
        ]
      },
      {
        id: 'USMLE_6_2', name: 'Physiology', subjectId: 'USMLE_6', topics: [
          { id: 'USMLE_6_2_001', subjectId: 'USMLE_6', systemId: 'USMLE_6_2', name: 'Menstrual Cycle & Oogenesis', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Follicular phase', 'Luteal phase', 'Ovulation', 'Estrogen', 'Progesterone'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_6_2_002', subjectId: 'USMLE_6', systemId: 'USMLE_6_2', name: 'Pregnancy Physiology', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['hCG', 'hPL', 'Physiologic changes in pregnancy'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_6_2_003', subjectId: 'USMLE_6', systemId: 'USMLE_6_2', name: 'Spermatogenesis & Androgens', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Testosterone', 'DHT', 'Leydig cells', 'Sertoli cells'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_6_2_004', subjectId: 'USMLE_6', systemId: 'USMLE_6_2', name: 'Menopause', highYield: true, estimatedStudyMinutes: 30, relatedTopics: [], aliases: ['FSH elevation', 'Vasomotor symptoms'], pyqWeight: 4, difficulty: 'low' }
        ]
      },
      {
        id: 'USMLE_6_3', name: 'Pathology', subjectId: 'USMLE_6', topics: [
          { id: 'USMLE_6_3_001', subjectId: 'USMLE_6', systemId: 'USMLE_6_3', name: 'Pregnancy Complications', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Ectopic pregnancy', 'Spontaneous abortion', 'Placenta previa', 'Placental abruption', 'Vasa previa'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_6_3_002', subjectId: 'USMLE_6', systemId: 'USMLE_6_3', name: 'Hypertension in Pregnancy', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Preeclampsia', 'Eclampsia', 'HELLP syndrome'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_6_3_003', subjectId: 'USMLE_6', systemId: 'USMLE_6_3', name: 'Gestational Trophoblastic Disease', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Hydatidiform mole', 'Choriocarcinoma'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_6_3_004', subjectId: 'USMLE_6', systemId: 'USMLE_6_3', name: 'Ovarian & Uterine Non-neoplastic Disorders', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['PCOS', 'Endometriosis', 'Adenomyosis'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_6_3_005', subjectId: 'USMLE_6', systemId: 'USMLE_6_3', name: 'Ovarian Neoplasms', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['Serous cystadenoma', 'Teratoma', 'Dysgerminoma', 'Granulosa cell tumor', 'Krukenberg tumor'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_6_3_006', subjectId: 'USMLE_6', systemId: 'USMLE_6_3', name: 'Uterine & Cervical Neoplasms', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Leiomyoma', 'Fibroids', 'Endometrial hyperplasia', 'Endometrial carcinoma', 'Cervical cancer', 'HPV'], pyqWeight: 5, difficulty: 'average' },
          { id: 'USMLE_6_3_007', subjectId: 'USMLE_6', systemId: 'USMLE_6_3', name: 'Breast Pathology', highYield: true, estimatedStudyMinutes: 75, relatedTopics: [], aliases: ['Fibroadenoma', 'Fibrocystic changes', 'DCIS', 'Invasive ductal carcinoma', 'Paget disease of breast'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_6_3_008', subjectId: 'USMLE_6', systemId: 'USMLE_6_3', name: 'Testicular Disorders', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Cryptorchidism', 'Testicular torsion', 'Varicocele', 'Hydrocele'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_6_3_009', subjectId: 'USMLE_6', systemId: 'USMLE_6_3', name: 'Testicular Tumors', highYield: true, estimatedStudyMinutes: 60, relatedTopics: [], aliases: ['Seminoma', 'Yolk sac tumor', 'Choriocarcinoma', 'Teratoma'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_6_3_010', subjectId: 'USMLE_6', systemId: 'USMLE_6_3', name: 'Prostate Pathology', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['BPH', 'Prostate adenocarcinoma', 'Prostatitis'], pyqWeight: 5, difficulty: 'average' }
        ]
      },
      {
        id: 'USMLE_6_4', name: 'Pharmacology', subjectId: 'USMLE_6', topics: [
          { id: 'USMLE_6_4_001', subjectId: 'USMLE_6', systemId: 'USMLE_6_4', name: 'Contraceptives & Hormone Replacement Therapy', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['OCPs', 'Progestins', 'Copper IUD'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_6_4_002', subjectId: 'USMLE_6', systemId: 'USMLE_6_4', name: 'SERMs & Antiestrogens', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Tamoxifen', 'Raloxifene', 'Clomiphene', 'Aromatase inhibitors'], pyqWeight: 5, difficulty: 'high' },
          { id: 'USMLE_6_4_003', subjectId: 'USMLE_6', systemId: 'USMLE_6_4', name: 'Antiandrogens', highYield: true, estimatedStudyMinutes: 45, relatedTopics: [], aliases: ['Finasteride', 'Flutamide', 'Spironolactone'], pyqWeight: 4, difficulty: 'average' },
          { id: 'USMLE_6_4_004', subjectId: 'USMLE_6', systemId: 'USMLE_6_4', name: 'Phosphodiesterase-5 Inhibitors', highYield: false, estimatedStudyMinutes: 30, relatedTopics: [], aliases: ['Sildenafil', 'Vardenafil', 'Tadalafil'], pyqWeight: 3, difficulty: 'low' }
        ]
      }
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
