export interface OntologyTopic {
  id: string;
  subjectId: string;
  systemId: string;
  name: string;
  highYield: boolean;
  estimatedStudyMinutes: number;
  relatedTopics: string[];
  aliases: string[];
  pyqWeight: number;
  difficulty: 'low' | 'average' | 'high';
}

export interface OntologySystem {
  id: string;
  subjectId: string;
  name: string;
  topics: OntologyTopic[];
}

export interface OntologySubject {
  id: string;
  name: string;
  systems: OntologySystem[];
}

export const UNIVERSAL_ONTOLOGY: OntologySubject[] = [
  {
    "id": "SUB_01",
    "name": "Anatomy",
    "systems": [
      {
        "id": "SYS_01_01",
        "subjectId": "SUB_01",
        "name": "General Anatomy",
        "topics": [
          {
            "id": "TOPIC_01_01_001",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_01",
            "name": "Introduction to Anatomy",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_01_002",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_01",
            "name": "Anatomical Terminology",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_01_003",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_01",
            "name": "Bones",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_01_004",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_01",
            "name": "Joints",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_01_005",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_01",
            "name": "Muscles",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_01_006",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_01",
            "name": "Fascia",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_01_007",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_01",
            "name": "Skin",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_01_008",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_01",
            "name": "Blood Vessels",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_01_009",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_01",
            "name": "Lymphatic System",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_01_010",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_01",
            "name": "Nervous Tissue",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_01_02",
        "subjectId": "SUB_01",
        "name": "Upper Limb",
        "topics": [
          {
            "id": "TOPIC_01_02_001",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_02",
            "name": "Osteology",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_02_002",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_02",
            "name": "Shoulder Region",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_02_003",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_02",
            "name": "Arm",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_02_004",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_02",
            "name": "Cubital Fossa",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_02_005",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_02",
            "name": "Forearm",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_02_006",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_02",
            "name": "Hand",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_02_007",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_02",
            "name": "Brachial Plexus",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_02_008",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_02",
            "name": "Arteries",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_02_009",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_02",
            "name": "Veins",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_02_010",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_02",
            "name": "Lymphatic Drainage",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_02_011",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_02",
            "name": "Surface Anatomy",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_02_012",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_02",
            "name": "Clinical Anatomy",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_01_03",
        "subjectId": "SUB_01",
        "name": "Lower Limb",
        "topics": [
          {
            "id": "TOPIC_01_03_001",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_03",
            "name": "Osteology",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_03_002",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_03",
            "name": "Gluteal Region",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_03_003",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_03",
            "name": "Thigh",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_03_004",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_03",
            "name": "Popliteal Fossa",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_03_005",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_03",
            "name": "Leg",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_03_006",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_03",
            "name": "Foot",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_03_007",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_03",
            "name": "Hip Joint",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_03_008",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_03",
            "name": "Knee Joint",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_03_009",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_03",
            "name": "Blood Supply",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_03_010",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_03",
            "name": "Nerve Supply",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_03_011",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_03",
            "name": "Clinical Anatomy",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_01_04",
        "subjectId": "SUB_01",
        "name": "Thorax",
        "topics": [
          {
            "id": "TOPIC_01_04_001",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_04",
            "name": "Thoracic Wall",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_04_002",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_04",
            "name": "Pleura",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_04_003",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_04",
            "name": "Lungs",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_04_004",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_04",
            "name": "Mediastinum",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_04_005",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_04",
            "name": "Pericardium",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_04_006",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_04",
            "name": "Heart",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_04_007",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_04",
            "name": "Great Vessels",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_04_008",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_04",
            "name": "Thoracic Duct",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_04_009",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_04",
            "name": "Diaphragm",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_04_010",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_04",
            "name": "Clinical Anatomy",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_01_05",
        "subjectId": "SUB_01",
        "name": "Abdomen & Pelvis",
        "topics": [
          {
            "id": "TOPIC_01_05_001",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_05",
            "name": "Anterior Abdominal Wall",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_05_002",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_05",
            "name": "Peritoneum",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_05_003",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_05",
            "name": "Stomach",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_05_004",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_05",
            "name": "Small Intestine",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_05_005",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_05",
            "name": "Large Intestine",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_05_006",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_05",
            "name": "Liver",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_05_007",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_05",
            "name": "Gallbladder",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_05_008",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_05",
            "name": "Pancreas",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_05_009",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_05",
            "name": "Spleen",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_05_010",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_05",
            "name": "Kidneys",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_05_011",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_05",
            "name": "Ureter",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_05_012",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_05",
            "name": "Pelvis",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_05_013",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_05",
            "name": "Perineum",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_05_014",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_05",
            "name": "Clinical Anatomy",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_01_06",
        "subjectId": "SUB_01",
        "name": "Head & Neck",
        "topics": [
          {
            "id": "TOPIC_01_06_001",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_06",
            "name": "Skull",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_06_002",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_06",
            "name": "Face",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_06_003",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_06",
            "name": "Scalp",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_06_004",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_06",
            "name": "Neck",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_06_005",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_06",
            "name": "Cranial Nerves",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_06_006",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_06",
            "name": "Pharynx",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_06_007",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_06",
            "name": "Larynx",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_06_008",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_06",
            "name": "Salivary Glands",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_06_009",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_06",
            "name": "Thyroid",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_06_010",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_06",
            "name": "Orbit",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_06_011",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_06",
            "name": "Clinical Anatomy",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_01_07",
        "subjectId": "SUB_01",
        "name": "Neuroanatomy",
        "topics": [
          {
            "id": "TOPIC_01_07_001",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_07",
            "name": "Brain",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_07_002",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_07",
            "name": "Brainstem",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_07_003",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_07",
            "name": "Cerebellum",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_07_004",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_07",
            "name": "Spinal Cord",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_07_005",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_07",
            "name": "Ventricular System",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_07_006",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_07",
            "name": "Meninges",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_07_007",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_07",
            "name": "Cranial Nerve Nuclei",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_07_008",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_07",
            "name": "Ascending Tracts",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_07_009",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_07",
            "name": "Descending Tracts",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_07_010",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_07",
            "name": "Clinical Neuroanatomy",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_01_08",
        "subjectId": "SUB_01",
        "name": "Histology",
        "topics": [
          {
            "id": "TOPIC_01_08_001",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_08",
            "name": "Epithelium",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_08_002",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_08",
            "name": "Connective Tissue",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_08_003",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_08",
            "name": "Cartilage",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_08_004",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_08",
            "name": "Bone",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_08_005",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_08",
            "name": "Muscle",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_08_006",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_08",
            "name": "Nervous Tissue",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_08_007",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_08",
            "name": "Blood",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_08_008",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_08",
            "name": "Lymphoid Tissue",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_08_009",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_08",
            "name": "Organ Histology",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_01_09",
        "subjectId": "SUB_01",
        "name": "Embryology",
        "topics": [
          {
            "id": "TOPIC_01_09_001",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_09",
            "name": "Gametogenesis",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_09_002",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_09",
            "name": "Fertilization",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_09_003",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_09",
            "name": "First Week Development",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_09_004",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_09",
            "name": "Second Week Development",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_09_005",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_09",
            "name": "Third Week Development",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_09_006",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_09",
            "name": "Organogenesis",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_09_007",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_09",
            "name": "Placenta",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_09_008",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_09",
            "name": "Fetal Membranes",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_01_09_009",
            "subjectId": "SUB_01",
            "systemId": "SYS_01_09",
            "name": "Congenital Anomalies",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      }
    ]
  },
  {
    "id": "SUB_02",
    "name": "Physiology",
    "systems": [
      {
        "id": "SYS_02_01",
        "subjectId": "SUB_02",
        "name": "General Physiology",
        "topics": [
          {
            "id": "TOPIC_02_01_001",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_01",
            "name": "Cell",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_01_002",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_01",
            "name": "Homeostasis",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_01_003",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_01",
            "name": "Body Fluids",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_01_004",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_01",
            "name": "Membrane Transport",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_01_005",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_01",
            "name": "Resting Membrane Potential",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_01_006",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_01",
            "name": "Action Potential",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_02_02",
        "subjectId": "SUB_02",
        "name": "Nerve & Muscle",
        "topics": [
          {
            "id": "TOPIC_02_02_001",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_02",
            "name": "Skeletal Muscle",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_02_002",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_02",
            "name": "Smooth Muscle",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_02_003",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_02",
            "name": "Neuromuscular Junction",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_02_004",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_02",
            "name": "Reflexes",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_02_005",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_02",
            "name": "Motor Control",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_02_03",
        "subjectId": "SUB_02",
        "name": "Blood & Immunity",
        "topics": [
          {
            "id": "TOPIC_02_03_001",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_03",
            "name": "RBC",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_03_002",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_03",
            "name": "WBC",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_03_003",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_03",
            "name": "Platelets",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_03_004",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_03",
            "name": "Hemostasis",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_03_005",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_03",
            "name": "Blood Groups",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_03_006",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_03",
            "name": "Immunity",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_02_04",
        "subjectId": "SUB_02",
        "name": "Cardiovascular System",
        "topics": [
          {
            "id": "TOPIC_02_04_001",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_04",
            "name": "Cardiac Muscle",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_04_002",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_04",
            "name": "Cardiac Cycle",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_04_003",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_04",
            "name": "ECG",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_04_004",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_04",
            "name": "Blood Pressure",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_04_005",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_04",
            "name": "Cardiac Output",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_04_006",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_04",
            "name": "Regulation of Circulation",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_02_05",
        "subjectId": "SUB_02",
        "name": "Respiratory System",
        "topics": [
          {
            "id": "TOPIC_02_05_001",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_05",
            "name": "Mechanics of Respiration",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_05_002",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_05",
            "name": "Lung Volumes",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_05_003",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_05",
            "name": "Gas Exchange",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_05_004",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_05",
            "name": "Oxygen Transport",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_05_005",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_05",
            "name": "Carbon Dioxide Transport",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_05_006",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_05",
            "name": "Regulation of Respiration",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_02_06",
        "subjectId": "SUB_02",
        "name": "Gastrointestinal System",
        "topics": [
          {
            "id": "TOPIC_02_06_001",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_06",
            "name": "Salivary Secretion",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_06_002",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_06",
            "name": "Gastric Secretion",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_06_003",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_06",
            "name": "Pancreatic Secretion",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_06_004",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_06",
            "name": "Bile",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_06_005",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_06",
            "name": "Digestion",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_06_006",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_06",
            "name": "Absorption",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_06_007",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_06",
            "name": "GI Motility",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_02_07",
        "subjectId": "SUB_02",
        "name": "Renal System",
        "topics": [
          {
            "id": "TOPIC_02_07_001",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_07",
            "name": "GFR",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_07_002",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_07",
            "name": "Tubular Functions",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_07_003",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_07",
            "name": "Acid Base Balance",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_07_004",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_07",
            "name": "Water Balance",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_07_005",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_07",
            "name": "Electrolyte Balance",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_07_006",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_07",
            "name": "Micturition",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_02_08",
        "subjectId": "SUB_02",
        "name": "Endocrine System",
        "topics": [
          {
            "id": "TOPIC_02_08_001",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_08",
            "name": "Pituitary",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_08_002",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_08",
            "name": "Thyroid",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_08_003",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_08",
            "name": "Parathyroid",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_08_004",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_08",
            "name": "Adrenal",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_08_005",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_08",
            "name": "Pancreas",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_08_006",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_08",
            "name": "Calcium Homeostasis",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_02_09",
        "subjectId": "SUB_02",
        "name": "Central Nervous System",
        "topics": [
          {
            "id": "TOPIC_02_09_001",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_09",
            "name": "Sensory System",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_09_002",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_09",
            "name": "Motor System",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_09_003",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_09",
            "name": "Autonomic Nervous System",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_09_004",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_09",
            "name": "Sleep",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_09_005",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_09",
            "name": "Learning",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_09_006",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_09",
            "name": "Memory",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_02_10",
        "subjectId": "SUB_02",
        "name": "Special Senses",
        "topics": [
          {
            "id": "TOPIC_02_10_001",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_10",
            "name": "Vision",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_10_002",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_10",
            "name": "Hearing",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_10_003",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_10",
            "name": "Taste",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_10_004",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_10",
            "name": "Smell",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_02_10_005",
            "subjectId": "SUB_02",
            "systemId": "SYS_02_10",
            "name": "Vestibular System",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      }
    ]
  },
  {
    "id": "SUB_03",
    "name": "Biochemistry",
    "systems": [
      {
        "id": "SYS_03_01",
        "subjectId": "SUB_03",
        "name": "Cell & Organelles",
        "topics": [
          {
            "id": "TOPIC_03_01_001",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_01",
            "name": "Cell Structure",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_01_002",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_01",
            "name": "Organelles",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_01_003",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_01",
            "name": "Cell Membrane",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_03_02",
        "subjectId": "SUB_03",
        "name": "Enzymes",
        "topics": [
          {
            "id": "TOPIC_03_02_001",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_02",
            "name": "Classification",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_02_002",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_02",
            "name": "Kinetics",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_02_003",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_02",
            "name": "Regulation",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_02_004",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_02",
            "name": "Clinical Applications",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_03_03",
        "subjectId": "SUB_03",
        "name": "Carbohydrate Metabolism",
        "topics": [
          {
            "id": "TOPIC_03_03_001",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_03",
            "name": "Glycolysis",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_03_002",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_03",
            "name": "Gluconeogenesis",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_03_003",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_03",
            "name": "Glycogen Metabolism",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_03_004",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_03",
            "name": "TCA Cycle",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_03_005",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_03",
            "name": "HMP Shunt",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_03_04",
        "subjectId": "SUB_03",
        "name": "Lipid Metabolism",
        "topics": [
          {
            "id": "TOPIC_03_04_001",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_04",
            "name": "Fatty Acid Oxidation",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_04_002",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_04",
            "name": "Lipogenesis",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_04_003",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_04",
            "name": "Cholesterol Metabolism",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_04_004",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_04",
            "name": "Lipoproteins",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_04_005",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_04",
            "name": "Ketone Bodies",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_03_05",
        "subjectId": "SUB_03",
        "name": "Protein & Amino Acid Metabolism",
        "topics": [
          {
            "id": "TOPIC_03_05_001",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_05",
            "name": "Amino Acid Metabolism",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_05_002",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_05",
            "name": "Urea Cycle",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_05_003",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_05",
            "name": "Protein Synthesis",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_03_06",
        "subjectId": "SUB_03",
        "name": "Nucleotide Metabolism",
        "topics": [
          {
            "id": "TOPIC_03_06_001",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_06",
            "name": "Purines",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_06_002",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_06",
            "name": "Pyrimidines",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_06_003",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_06",
            "name": "DNA",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_06_004",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_06",
            "name": "RNA",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_03_07",
        "subjectId": "SUB_03",
        "name": "Molecular Biology & Genetics",
        "topics": [
          {
            "id": "TOPIC_03_07_001",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_07",
            "name": "DNA Replication",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_07_002",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_07",
            "name": "Transcription",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_07_003",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_07",
            "name": "Translation",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_07_004",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_07",
            "name": "Gene Regulation",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_07_005",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_07",
            "name": "Mutations",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_07_006",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_07",
            "name": "Recombinant DNA Technology",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_03_08",
        "subjectId": "SUB_03",
        "name": "Vitamins & Minerals",
        "topics": [
          {
            "id": "TOPIC_03_08_001",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_08",
            "name": "Fat Soluble Vitamins",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_08_002",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_08",
            "name": "Water Soluble Vitamins",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_08_003",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_08",
            "name": "Major Minerals",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_08_004",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_08",
            "name": "Trace Elements",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_03_09",
        "subjectId": "SUB_03",
        "name": "Clinical Biochemistry",
        "topics": [
          {
            "id": "TOPIC_03_09_001",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_09",
            "name": "Liver Function Tests",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_09_002",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_09",
            "name": "Kidney Function Tests",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_09_003",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_09",
            "name": "Cardiac Biomarkers",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_09_004",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_09",
            "name": "Acid Base Disorders",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_03_09_005",
            "subjectId": "SUB_03",
            "systemId": "SYS_03_09",
            "name": "Nutrition",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      }
    ]
  },
  {
    "id": "SUB_04",
    "name": "Pathology",
    "systems": [
      {
        "id": "SYS_04_01",
        "subjectId": "SUB_04",
        "name": "General Pathology",
        "topics": [
          {
            "id": "TOPIC_04_01_001",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_01",
            "name": "Cell Injury",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_01_002",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_01",
            "name": "Cell Adaptation",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_01_003",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_01",
            "name": "Necrosis",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_01_004",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_01",
            "name": "Apoptosis",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_04_02",
        "subjectId": "SUB_04",
        "name": "Inflammation & Repair",
        "topics": [
          {
            "id": "TOPIC_04_02_001",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_02",
            "name": "Acute Inflammation",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_02_002",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_02",
            "name": "Chronic Inflammation",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_02_003",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_02",
            "name": "Healing",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_02_004",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_02",
            "name": "Tissue Repair",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_04_03",
        "subjectId": "SUB_04",
        "name": "Hemodynamic Disorders & Shock",
        "topics": [
          {
            "id": "TOPIC_04_03_001",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_03",
            "name": "Edema",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_03_002",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_03",
            "name": "Hyperemia",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_03_003",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_03",
            "name": "Hemorrhage",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_03_004",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_03",
            "name": "Thrombosis",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_03_005",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_03",
            "name": "Embolism",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_03_006",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_03",
            "name": "Infarction",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_03_007",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_03",
            "name": "Shock",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_04_04",
        "subjectId": "SUB_04",
        "name": "Immunopathology",
        "topics": [
          {
            "id": "TOPIC_04_04_001",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_04",
            "name": "Hypersensitivity",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_04_002",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_04",
            "name": "Autoimmune Diseases",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_04_003",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_04",
            "name": "Immunodeficiency",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_04_004",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_04",
            "name": "Transplant Rejection",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_04_05",
        "subjectId": "SUB_04",
        "name": "Neoplasia",
        "topics": [
          {
            "id": "TOPIC_04_05_001",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_05",
            "name": "Benign Tumors",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_05_002",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_05",
            "name": "Malignant Tumors",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_05_003",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_05",
            "name": "Carcinogenesis",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_05_004",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_05",
            "name": "Tumor Markers",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_04_06",
        "subjectId": "SUB_04",
        "name": "Hematology",
        "topics": [
          {
            "id": "TOPIC_04_06_001",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_06",
            "name": "Anemia",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_06_002",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_06",
            "name": "Leukemia",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_06_003",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_06",
            "name": "Lymphoma",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_06_004",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_06",
            "name": "Bleeding Disorders",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_06_005",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_06",
            "name": "Transfusion Medicine",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_04_07",
        "subjectId": "SUB_04",
        "name": "Systemic Pathology",
        "topics": [
          {
            "id": "TOPIC_04_07_001",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_07",
            "name": "Cardiovascular",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_07_002",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_07",
            "name": "Respiratory",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_07_003",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_07",
            "name": "Gastrointestinal",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_07_004",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_07",
            "name": "Hepatobiliary",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_07_005",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_07",
            "name": "Renal",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_07_006",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_07",
            "name": "Endocrine",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_07_007",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_07",
            "name": "CNS",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_07_008",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_07",
            "name": "Musculoskeletal",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_04_07_009",
            "subjectId": "SUB_04",
            "systemId": "SYS_04_07",
            "name": "Skin",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      }
    ]
  },
  {
    "id": "SUB_05",
    "name": "Microbiology",
    "systems": [
      {
        "id": "SYS_05_01",
        "subjectId": "SUB_05",
        "name": "General Microbiology",
        "topics": [
          {
            "id": "TOPIC_05_01_001",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_01",
            "name": "History",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_01_002",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_01",
            "name": "Sterilization",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_01_003",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_01",
            "name": "Disinfection",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_01_004",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_01",
            "name": "Culture Media",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_01_005",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_01",
            "name": "Laboratory Diagnosis",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_05_02",
        "subjectId": "SUB_05",
        "name": "Immunology",
        "topics": [
          {
            "id": "TOPIC_05_02_001",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_02",
            "name": "Innate Immunity",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_02_002",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_02",
            "name": "Adaptive Immunity",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_02_003",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_02",
            "name": "Antibodies",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_02_004",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_02",
            "name": "Vaccines",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_02_005",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_02",
            "name": "Hypersensitivity",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_05_03",
        "subjectId": "SUB_05",
        "name": "Bacteriology",
        "topics": [
          {
            "id": "TOPIC_05_03_001",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_03",
            "name": "Gram Positive Bacteria",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_03_002",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_03",
            "name": "Gram Negative Bacteria",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_03_003",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_03",
            "name": "Anaerobes",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_03_004",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_03",
            "name": "Mycobacteria",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_03_005",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_03",
            "name": "Spirochetes",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_05_04",
        "subjectId": "SUB_05",
        "name": "Virology",
        "topics": [
          {
            "id": "TOPIC_05_04_001",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_04",
            "name": "DNA Viruses",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_04_002",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_04",
            "name": "RNA Viruses",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_04_003",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_04",
            "name": "Hepatitis Viruses",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_04_004",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_04",
            "name": "HIV",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_04_005",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_04",
            "name": "Emerging Viruses",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_05_05",
        "subjectId": "SUB_05",
        "name": "Mycology",
        "topics": [
          {
            "id": "TOPIC_05_05_001",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_05",
            "name": "Superficial Mycoses",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_05_002",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_05",
            "name": "Subcutaneous Mycoses",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_05_003",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_05",
            "name": "Systemic Mycoses",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_05_004",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_05",
            "name": "Opportunistic Fungi",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_05_06",
        "subjectId": "SUB_05",
        "name": "Parasitology",
        "topics": [
          {
            "id": "TOPIC_05_06_001",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_06",
            "name": "Protozoa",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_06_002",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_06",
            "name": "Helminths",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_06_003",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_06",
            "name": "Arthropods",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      },
      {
        "id": "SYS_05_07",
        "subjectId": "SUB_05",
        "name": "Applied Microbiology",
        "topics": [
          {
            "id": "TOPIC_05_07_001",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_07",
            "name": "Hospital Infection Control",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_07_002",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_07",
            "name": "Biomedical Waste",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_07_003",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_07",
            "name": "Antimicrobial Resistance",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_07_004",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_07",
            "name": "Vaccination",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          },
          {
            "id": "TOPIC_05_07_005",
            "subjectId": "SUB_05",
            "systemId": "SYS_05_07",
            "name": "Public Health Microbiology",
            "highYield": false,
            "estimatedStudyMinutes": 30,
            "relatedTopics": [],
            "aliases": [],
            "pyqWeight": 1,
            "difficulty": "average"
          }
        ]
      }
    ]
  },
  {
        "id": "SUB_06",
        "name": "Pharmacology",
        "systems": [
            {
                "id": "SYS_06_01",
                "subjectId": "SUB_06",
                "name": "General Pharmacology",
                "topics": [
                    {
                        "id": "TOPIC_06_01_001",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_01",
                        "name": "Pharmacokinetics",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_01_002",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_01",
                        "name": "Pharmacodynamics",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_01_003",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_01",
                        "name": "Drug Receptors",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_01_004",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_01",
                        "name": "Adverse Drug Reactions",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_01_005",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_01",
                        "name": "Drug Interactions",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_01_006",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_01",
                        "name": "Clinical Trials",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_01_007",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_01",
                        "name": "Pharmacovigilance",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_06_02",
                "subjectId": "SUB_06",
                "name": "Autonomic Nervous System",
                "topics": [
                    {
                        "id": "TOPIC_06_02_001",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_02",
                        "name": "Cholinergic Drugs",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_02_002",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_02",
                        "name": "Anticholinergic Drugs",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_02_003",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_02",
                        "name": "Adrenergic Drugs",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_02_004",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_02",
                        "name": "Adrenergic Blockers",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_02_005",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_02",
                        "name": "Neuromuscular Blocking Agents",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_06_03",
                "subjectId": "SUB_06",
                "name": "Cardiovascular Pharmacology",
                "topics": [
                    {
                        "id": "TOPIC_06_03_001",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_03",
                        "name": "Antihypertensives",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_03_002",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_03",
                        "name": "Antianginal Drugs",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_03_003",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_03",
                        "name": "Antiarrhythmic Drugs",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_03_004",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_03",
                        "name": "Heart Failure Drugs",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_03_005",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_03",
                        "name": "Diuretics",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_03_006",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_03",
                        "name": "Anticoagulants",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_03_007",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_03",
                        "name": "Antiplatelet Drugs",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_03_008",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_03",
                        "name": "Lipid-Lowering Drugs",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_06_04",
                "subjectId": "SUB_06",
                "name": "Central Nervous System",
                "topics": [
                    {
                        "id": "TOPIC_06_04_001",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_04",
                        "name": "General Anesthetics",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_04_002",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_04",
                        "name": "Local Anesthetics",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_04_003",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_04",
                        "name": "Sedative-Hypnotics",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_04_004",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_04",
                        "name": "Antiepileptics",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_04_005",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_04",
                        "name": "Antipsychotics",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_04_006",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_04",
                        "name": "Antidepressants",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_04_007",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_04",
                        "name": "Opioid Analgesics",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_04_008",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_04",
                        "name": "Drugs for Parkinsonism",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_06_05",
                "subjectId": "SUB_06",
                "name": "Autacoids & Anti-inflammatory Drugs",
                "topics": [
                    {
                        "id": "TOPIC_06_05_001",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_05",
                        "name": "Histamine",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_05_002",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_05",
                        "name": "Serotonin",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_05_003",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_05",
                        "name": "Prostaglandins",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_05_004",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_05",
                        "name": "NSAIDs",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_05_005",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_05",
                        "name": "Corticosteroids",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_05_006",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_05",
                        "name": "Antihistamines",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_06_06",
                "subjectId": "SUB_06",
                "name": "Endocrine Pharmacology",
                "topics": [
                    {
                        "id": "TOPIC_06_06_001",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_06",
                        "name": "Antidiabetic Drugs",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_06_002",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_06",
                        "name": "Insulin",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_06_003",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_06",
                        "name": "Thyroid Drugs",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_06_004",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_06",
                        "name": "Corticosteroids",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_06_005",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_06",
                        "name": "Sex Hormones",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_06_006",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_06",
                        "name": "Drugs for Osteoporosis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_06_07",
                "subjectId": "SUB_06",
                "name": "Antimicrobial Drugs",
                "topics": [
                    {
                        "id": "TOPIC_06_07_001",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_07",
                        "name": "Beta-Lactams",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_07_002",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_07",
                        "name": "Aminoglycosides",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_07_003",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_07",
                        "name": "Macrolides",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_07_004",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_07",
                        "name": "Tetracyclines",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_07_005",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_07",
                        "name": "Fluoroquinolones",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_07_006",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_07",
                        "name": "Antitubercular Drugs",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_07_007",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_07",
                        "name": "Antifungal Drugs",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_07_008",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_07",
                        "name": "Antiviral Drugs",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_07_009",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_07",
                        "name": "Antimalarial Drugs",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_06_08",
                "subjectId": "SUB_06",
                "name": "Anticancer & Immunosuppressant Drugs",
                "topics": [
                    {
                        "id": "TOPIC_06_08_001",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_08",
                        "name": "Anticancer Drugs",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_08_002",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_08",
                        "name": "Targeted Therapy",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_08_003",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_08",
                        "name": "Immunotherapy",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_06_08_004",
                        "subjectId": "SUB_06",
                        "systemId": "SYS_06_08",
                        "name": "Immunosuppressants",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            }
        ]
    },
    {
        "id": "SUB_07",
        "name": "Forensic Medicine & Toxicology",
        "systems": [
            {
                "id": "SYS_07_01",
                "subjectId": "SUB_07",
                "name": "Medical Jurisprudence",
                "topics": [
                    {
                        "id": "TOPIC_07_01_001",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_01",
                        "name": "Medical Ethics",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_01_002",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_01",
                        "name": "Consent",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_01_003",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_01",
                        "name": "Medical Negligence",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_01_004",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_01",
                        "name": "Identification",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_01_005",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_01",
                        "name": "Legal Procedures",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_07_02",
                "subjectId": "SUB_07",
                "name": "Forensic Pathology",
                "topics": [
                    {
                        "id": "TOPIC_07_02_001",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_02",
                        "name": "Death",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_02_002",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_02",
                        "name": "Postmortem Changes",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_02_003",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_02",
                        "name": "Estimation of Time Since Death",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_02_004",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_02",
                        "name": "Medico-Legal Autopsy",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_07_03",
                "subjectId": "SUB_07",
                "name": "Mechanical Injuries",
                "topics": [
                    {
                        "id": "TOPIC_07_03_001",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_03",
                        "name": "Abrasions",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_03_002",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_03",
                        "name": "Contusions",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_03_003",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_03",
                        "name": "Lacerations",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_03_004",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_03",
                        "name": "Incised Wounds",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_03_005",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_03",
                        "name": "Firearm Injuries",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_07_04",
                "subjectId": "SUB_07",
                "name": "Asphyxial Deaths",
                "topics": [
                    {
                        "id": "TOPIC_07_04_001",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_04",
                        "name": "Hanging",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_04_002",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_04",
                        "name": "Strangulation",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_04_003",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_04",
                        "name": "Drowning",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_04_004",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_04",
                        "name": "Suffocation",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_07_05",
                "subjectId": "SUB_07",
                "name": "Sexual Jurisprudence",
                "topics": [
                    {
                        "id": "TOPIC_07_05_001",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_05",
                        "name": "Sexual Offences",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_05_002",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_05",
                        "name": "Examination of Sexual Assault",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_05_003",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_05",
                        "name": "Virginity",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_05_004",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_05",
                        "name": "Pregnancy",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_05_005",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_05",
                        "name": "Infanticide",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_07_06",
                "subjectId": "SUB_07",
                "name": "Toxicology",
                "topics": [
                    {
                        "id": "TOPIC_07_06_001",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_06",
                        "name": "General Toxicology",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_06_002",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_06",
                        "name": "Corrosives",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_06_003",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_06",
                        "name": "Metallic Poisons",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_06_004",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_06",
                        "name": "Insecticides",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_06_005",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_06",
                        "name": "Alcohol",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_06_006",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_06",
                        "name": "Snake Bite",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_07_06_007",
                        "subjectId": "SUB_07",
                        "systemId": "SYS_07_06",
                        "name": "Food Poisoning",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            }
        ]
    },
    {
        "id": "SUB_08",
        "name": "Community Medicine (PSM)",
        "systems": [
            {
                "id": "SYS_08_01",
                "subjectId": "SUB_08",
                "name": "Health & Disease",
                "topics": [
                    {
                        "id": "TOPIC_08_01_001",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_01",
                        "name": "Concepts of Health",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_01_002",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_01",
                        "name": "Determinants of Health",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_01_003",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_01",
                        "name": "Natural History of Disease",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_01_004",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_01",
                        "name": "Levels of Prevention",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_08_02",
                "subjectId": "SUB_08",
                "name": "Epidemiology",
                "topics": [
                    {
                        "id": "TOPIC_08_02_001",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_02",
                        "name": "Epidemiological Methods",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_02_002",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_02",
                        "name": "Study Designs",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_02_003",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_02",
                        "name": "Measures of Disease Frequency",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_02_004",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_02",
                        "name": "Screening",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_02_005",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_02",
                        "name": "Outbreak Investigation",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_08_03",
                "subjectId": "SUB_08",
                "name": "Research Methodology",
                "topics": [
                    {
                        "id": "TOPIC_08_03_001",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_03",
                        "name": "Research Design",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_03_002",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_03",
                        "name": "Sampling",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_03_003",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_03",
                        "name": "Data Collection",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_03_004",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_03",
                        "name": "Critical Appraisal",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_08_04",
                "subjectId": "SUB_08",
                "name": "Biostatistics",
                "topics": [
                    {
                        "id": "TOPIC_08_04_001",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_04",
                        "name": "Data Presentation",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_04_002",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_04",
                        "name": "Measures of Central Tendency",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_04_003",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_04",
                        "name": "Measures of Dispersion",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_04_004",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_04",
                        "name": "Probability",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_04_005",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_04",
                        "name": "Statistical Tests",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_08_05",
                "subjectId": "SUB_08",
                "name": "Environmental Health",
                "topics": [
                    {
                        "id": "TOPIC_08_05_001",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_05",
                        "name": "Water",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_05_002",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_05",
                        "name": "Air Pollution",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_05_003",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_05",
                        "name": "Waste Disposal",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_05_004",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_05",
                        "name": "Housing",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_05_005",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_05",
                        "name": "Noise Pollution",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_08_06",
                "subjectId": "SUB_08",
                "name": "Nutrition",
                "topics": [
                    {
                        "id": "TOPIC_08_06_001",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_06",
                        "name": "Macronutrients",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_06_002",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_06",
                        "name": "Micronutrients",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_06_003",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_06",
                        "name": "Malnutrition",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_06_004",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_06",
                        "name": "Nutritional Assessment",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_06_005",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_06",
                        "name": "National Nutrition Programmes",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_08_07",
                "subjectId": "SUB_08",
                "name": "Demography",
                "topics": [
                    {
                        "id": "TOPIC_08_07_001",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_07",
                        "name": "Population Dynamics",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_07_002",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_07",
                        "name": "Fertility",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_07_003",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_07",
                        "name": "Mortality",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_07_004",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_07",
                        "name": "Population Indicators",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_08_08",
                "subjectId": "SUB_08",
                "name": "Family Planning",
                "topics": [
                    {
                        "id": "TOPIC_08_08_001",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_08",
                        "name": "Contraceptive Methods",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_08_002",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_08",
                        "name": "Family Welfare Programme",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_08_003",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_08",
                        "name": "Reproductive Health",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_08_09",
                "subjectId": "SUB_08",
                "name": "Communicable Diseases",
                "topics": [
                    {
                        "id": "TOPIC_08_09_001",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_09",
                        "name": "Tuberculosis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_09_002",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_09",
                        "name": "Malaria",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_09_003",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_09",
                        "name": "HIV/AIDS",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_09_004",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_09",
                        "name": "Leprosy",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_09_005",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_09",
                        "name": "Vaccine Preventable Diseases",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_08_10",
                "subjectId": "SUB_08",
                "name": "Non-Communicable Diseases",
                "topics": [
                    {
                        "id": "TOPIC_08_10_001",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_10",
                        "name": "Diabetes",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_10_002",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_10",
                        "name": "Hypertension",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_10_003",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_10",
                        "name": "Cancer",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_10_004",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_10",
                        "name": "Mental Health",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_10_005",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_10",
                        "name": "Lifestyle Diseases",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_08_11",
                "subjectId": "SUB_08",
                "name": "National Health Programmes",
                "topics": [
                    {
                        "id": "TOPIC_08_11_001",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_11",
                        "name": "NHM",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_11_002",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_11",
                        "name": "RCH",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_11_003",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_11",
                        "name": "UIP",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_11_004",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_11",
                        "name": "NTEP",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_11_005",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_11",
                        "name": "NPCDCS",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_08_11_006",
                        "subjectId": "SUB_08",
                        "systemId": "SYS_08_11",
                        "name": "Other National Programmes",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            }
        ]
    },
    {
        "id": "SUB_09",
        "name": "ENT (Otorhinolaryngology)",
        "systems": [
            {
                "id": "SYS_09_01",
                "subjectId": "SUB_09",
                "name": "Ear",
                "topics": [
                    {
                        "id": "TOPIC_09_01_001",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_01",
                        "name": "Anatomy",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_09_01_002",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_01",
                        "name": "Hearing",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_09_01_003",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_01",
                        "name": "Deafness",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_09_01_004",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_01",
                        "name": "Otitis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_09_01_005",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_01",
                        "name": "Vertigo",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_09_01_006",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_01",
                        "name": "Facial Nerve Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_09_02",
                "subjectId": "SUB_09",
                "name": "Nose",
                "topics": [
                    {
                        "id": "TOPIC_09_02_001",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_02",
                        "name": "Anatomy",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_09_02_002",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_02",
                        "name": "Epistaxis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_09_02_003",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_02",
                        "name": "Rhinitis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_09_02_004",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_02",
                        "name": "Nasal Polyps",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_09_02_005",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_02",
                        "name": "Deviated Nasal Septum",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_09_03",
                "subjectId": "SUB_09",
                "name": "Paranasal Sinuses",
                "topics": [
                    {
                        "id": "TOPIC_09_03_001",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_03",
                        "name": "Sinusitis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_09_03_002",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_03",
                        "name": "Tumours",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_09_03_003",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_03",
                        "name": "Complications",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_09_04",
                "subjectId": "SUB_09",
                "name": "Pharynx",
                "topics": [
                    {
                        "id": "TOPIC_09_04_001",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_04",
                        "name": "Tonsillitis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_09_04_002",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_04",
                        "name": "Adenoids",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_09_04_003",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_04",
                        "name": "Pharyngeal Tumours",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_09_04_004",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_04",
                        "name": "Dysphagia",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_09_05",
                "subjectId": "SUB_09",
                "name": "Larynx",
                "topics": [
                    {
                        "id": "TOPIC_09_05_001",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_05",
                        "name": "Hoarseness",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_09_05_002",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_05",
                        "name": "Vocal Cord Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_09_05_003",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_05",
                        "name": "Laryngeal Tumours",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_09_05_004",
                        "subjectId": "SUB_09",
                        "systemId": "SYS_09_05",
                        "name": "Airway Emergencies",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            }
        ]
    },
    {
        "id": "SUB_10",
        "name": "Ophthalmology",
        "systems": [
            {
                "id": "SYS_10_01",
                "subjectId": "SUB_10",
                "name": "Anatomy & Physiology of the Eye",
                "topics": [
                    {
                        "id": "TOPIC_10_01_001",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_01",
                        "name": "Eyeball",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_01_002",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_01",
                        "name": "Extraocular Muscles",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_01_003",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_01",
                        "name": "Lacrimal Apparatus",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_01_004",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_01",
                        "name": "Visual Pathway",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_10_02",
                "subjectId": "SUB_10",
                "name": "Optics & Refraction",
                "topics": [
                    {
                        "id": "TOPIC_10_02_001",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_02",
                        "name": "Refraction",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_02_002",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_02",
                        "name": "Refractive Errors",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_02_003",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_02",
                        "name": "Accommodation",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_02_004",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_02",
                        "name": "Optical Instruments",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_10_03",
                "subjectId": "SUB_10",
                "name": "Conjunctiva",
                "topics": [
                    {
                        "id": "TOPIC_10_03_001",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_03",
                        "name": "Conjunctivitis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_03_002",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_03",
                        "name": "Degenerative Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_03_003",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_03",
                        "name": "Tumours",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_10_04",
                "subjectId": "SUB_10",
                "name": "Cornea",
                "topics": [
                    {
                        "id": "TOPIC_10_04_001",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_04",
                        "name": "Corneal Ulcers",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_04_002",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_04",
                        "name": "Keratitis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_04_003",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_04",
                        "name": "Corneal Dystrophies",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_10_05",
                "subjectId": "SUB_10",
                "name": "Lens",
                "topics": [
                    {
                        "id": "TOPIC_10_05_001",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_05",
                        "name": "Cataract",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_05_002",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_05",
                        "name": "Lens Dislocation",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_10_06",
                "subjectId": "SUB_10",
                "name": "Glaucoma",
                "topics": [
                    {
                        "id": "TOPIC_10_06_001",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_06",
                        "name": "Primary Glaucoma",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_06_002",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_06",
                        "name": "Secondary Glaucoma",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_06_003",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_06",
                        "name": "Management",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_10_07",
                "subjectId": "SUB_10",
                "name": "Uvea",
                "topics": [
                    {
                        "id": "TOPIC_10_07_001",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_07",
                        "name": "Uveitis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_07_002",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_07",
                        "name": "Tumours",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_10_08",
                "subjectId": "SUB_10",
                "name": "Retina",
                "topics": [
                    {
                        "id": "TOPIC_10_08_001",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_08",
                        "name": "Diabetic Retinopathy",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_08_002",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_08",
                        "name": "Hypertensive Retinopathy",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_08_003",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_08",
                        "name": "Retinal Detachment",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_08_004",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_08",
                        "name": "Macular Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_10_09",
                "subjectId": "SUB_10",
                "name": "Neuro-ophthalmology",
                "topics": [
                    {
                        "id": "TOPIC_10_09_001",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_09",
                        "name": "Optic Neuritis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_09_002",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_09",
                        "name": "Papilledema",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_09_003",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_09",
                        "name": "Cranial Nerve Palsies",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_10_10",
                "subjectId": "SUB_10",
                "name": "Strabismus",
                "topics": [
                    {
                        "id": "TOPIC_10_10_001",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_10",
                        "name": "Types of Squint",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_10_002",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_10",
                        "name": "Amblyopia",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_10_10_003",
                        "subjectId": "SUB_10",
                        "systemId": "SYS_10_10",
                        "name": "Management",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            }
        ]
    },
  {
        "id": "SUB_11",
        "name": "General Medicine",
        "systems": [
            {
                "id": "SYS_11_01",
                "subjectId": "SUB_11",
                "name": "Cardiology",
                "topics": [
                    {
                        "id": "TOPIC_11_01_001",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_01",
                        "name": "Ischemic Heart Disease",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_01_002",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_01",
                        "name": "Heart Failure",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_01_003",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_01",
                        "name": "Hypertension",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_01_004",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_01",
                        "name": "Valvular Heart Disease",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_01_005",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_01",
                        "name": "Arrhythmias",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_01_006",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_01",
                        "name": "Cardiomyopathies",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_01_007",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_01",
                        "name": "Pericardial Diseases",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_01_008",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_01",
                        "name": "Congenital Heart Disease",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_11_02",
                "subjectId": "SUB_11",
                "name": "Respiratory Medicine",
                "topics": [
                    {
                        "id": "TOPIC_11_02_001",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_02",
                        "name": "Asthma",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_02_002",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_02",
                        "name": "COPD",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_02_003",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_02",
                        "name": "Pneumonia",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_02_004",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_02",
                        "name": "Tuberculosis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_02_005",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_02",
                        "name": "Pleural Diseases",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_02_006",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_02",
                        "name": "Interstitial Lung Disease",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_02_007",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_02",
                        "name": "Pulmonary Embolism",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_11_03",
                "subjectId": "SUB_11",
                "name": "Gastroenterology & Hepatology",
                "topics": [
                    {
                        "id": "TOPIC_11_03_001",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_03",
                        "name": "Esophageal Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_03_002",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_03",
                        "name": "Peptic Ulcer Disease",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_03_003",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_03",
                        "name": "Inflammatory Bowel Disease",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_03_004",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_03",
                        "name": "Liver Diseases",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_03_005",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_03",
                        "name": "Pancreatitis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_03_006",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_03",
                        "name": "Gastrointestinal Bleeding",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_11_04",
                "subjectId": "SUB_11",
                "name": "Nephrology",
                "topics": [
                    {
                        "id": "TOPIC_11_04_001",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_04",
                        "name": "Acute Kidney Injury",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_04_002",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_04",
                        "name": "Chronic Kidney Disease",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_04_003",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_04",
                        "name": "Glomerular Diseases",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_04_004",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_04",
                        "name": "Tubular Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_04_005",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_04",
                        "name": "Electrolyte Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_04_006",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_04",
                        "name": "Acid-Base Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_11_05",
                "subjectId": "SUB_11",
                "name": "Neurology",
                "topics": [
                    {
                        "id": "TOPIC_11_05_001",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_05",
                        "name": "Stroke",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_05_002",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_05",
                        "name": "Epilepsy",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_05_003",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_05",
                        "name": "Headache Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_05_004",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_05",
                        "name": "Movement Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_05_005",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_05",
                        "name": "Demyelinating Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_05_006",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_05",
                        "name": "Peripheral Neuropathy",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_11_06",
                "subjectId": "SUB_11",
                "name": "Endocrinology",
                "topics": [
                    {
                        "id": "TOPIC_11_06_001",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_06",
                        "name": "Diabetes Mellitus",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_06_002",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_06",
                        "name": "Thyroid Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_06_003",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_06",
                        "name": "Pituitary Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_06_004",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_06",
                        "name": "Adrenal Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_06_005",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_06",
                        "name": "Calcium Metabolism",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_11_07",
                "subjectId": "SUB_11",
                "name": "Hematology",
                "topics": [
                    {
                        "id": "TOPIC_11_07_001",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_07",
                        "name": "Anemias",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_07_002",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_07",
                        "name": "Hemolytic Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_07_003",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_07",
                        "name": "Leukemias",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_07_004",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_07",
                        "name": "Lymphomas",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_07_005",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_07",
                        "name": "Bleeding & Coagulation Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_11_08",
                "subjectId": "SUB_11",
                "name": "Rheumatology & Autoimmune Disorders",
                "topics": [
                    {
                        "id": "TOPIC_11_08_001",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_08",
                        "name": "Rheumatoid Arthritis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_08_002",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_08",
                        "name": "Systemic Lupus Erythematosus",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_08_003",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_08",
                        "name": "Vasculitis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_08_004",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_08",
                        "name": "Spondyloarthropathies",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_11_09",
                "subjectId": "SUB_11",
                "name": "Infectious Diseases",
                "topics": [
                    {
                        "id": "TOPIC_11_09_001",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_09",
                        "name": "Fever",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_09_002",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_09",
                        "name": "Sepsis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_09_003",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_09",
                        "name": "HIV",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_09_004",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_09",
                        "name": "Tropical Diseases",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_11_09_005",
                        "subjectId": "SUB_11",
                        "systemId": "SYS_11_09",
                        "name": "Opportunistic Infections",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            }
        ]
    },
    {
        "id": "SUB_12",
        "name": "General Surgery",
        "systems": [
            {
                "id": "SYS_12_01",
                "subjectId": "SUB_12",
                "name": "Principles of Surgery",
                "topics": [
                    {
                        "id": "TOPIC_12_01_001",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_01",
                        "name": "Wound Healing",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_01_002",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_01",
                        "name": "Surgical Infections",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_01_003",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_01",
                        "name": "Shock",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_01_004",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_01",
                        "name": "Fluid & Electrolyte Management",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_01_005",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_01",
                        "name": "Nutrition",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_01_006",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_01",
                        "name": "Preoperative Evaluation",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_01_007",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_01",
                        "name": "Postoperative Care",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_12_02",
                "subjectId": "SUB_12",
                "name": "Trauma",
                "topics": [
                    {
                        "id": "TOPIC_12_02_001",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_02",
                        "name": "Polytrauma",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_02_002",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_02",
                        "name": "Head Injury",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_02_003",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_02",
                        "name": "Chest Trauma",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_02_004",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_02",
                        "name": "Abdominal Trauma",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_02_005",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_02",
                        "name": "Burns",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_12_03",
                "subjectId": "SUB_12",
                "name": "Gastrointestinal Surgery",
                "topics": [
                    {
                        "id": "TOPIC_12_03_001",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_03",
                        "name": "Esophagus",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_03_002",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_03",
                        "name": "Stomach",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_03_003",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_03",
                        "name": "Small Intestine",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_03_004",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_03",
                        "name": "Colon",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_03_005",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_03",
                        "name": "Appendix",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_03_006",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_03",
                        "name": "Hernia",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_12_04",
                "subjectId": "SUB_12",
                "name": "Hepatopancreatobiliary Surgery",
                "topics": [
                    {
                        "id": "TOPIC_12_04_001",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_04",
                        "name": "Liver",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_04_002",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_04",
                        "name": "Gallbladder",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_04_003",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_04",
                        "name": "Biliary Tract",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_04_004",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_04",
                        "name": "Pancreas",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_12_05",
                "subjectId": "SUB_12",
                "name": "Breast & Endocrine Surgery",
                "topics": [
                    {
                        "id": "TOPIC_12_05_001",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_05",
                        "name": "Breast Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_05_002",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_05",
                        "name": "Thyroid",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_05_003",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_05",
                        "name": "Parathyroid",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_05_004",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_05",
                        "name": "Adrenal Glands",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_12_06",
                "subjectId": "SUB_12",
                "name": "Urology",
                "topics": [
                    {
                        "id": "TOPIC_12_06_001",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_06",
                        "name": "Urinary Stones",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_06_002",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_06",
                        "name": "Prostate Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_06_003",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_06",
                        "name": "Bladder Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_06_004",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_06",
                        "name": "Testicular Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_12_07",
                "subjectId": "SUB_12",
                "name": "Cardiothoracic & Vascular Surgery",
                "topics": [
                    {
                        "id": "TOPIC_12_07_001",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_07",
                        "name": "Peripheral Vascular Disease",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_07_002",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_07",
                        "name": "Aortic Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_12_07_003",
                        "subjectId": "SUB_12",
                        "systemId": "SYS_12_07",
                        "name": "Thoracic Surgery Basics",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            }
        ]
    },
    {
        "id": "SUB_13",
        "name": "Obstetrics & Gynaecology",
        "systems": [
            {
                "id": "SYS_13_01",
                "subjectId": "SUB_13",
                "name": "Pregnancy & Antenatal Care",
                "topics": [
                    {
                        "id": "TOPIC_13_01_001",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_01",
                        "name": "Physiological Changes",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_01_002",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_01",
                        "name": "Antenatal Visits",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_01_003",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_01",
                        "name": "Fetal Assessment",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_01_004",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_01",
                        "name": "High-Risk Pregnancy",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_13_02",
                "subjectId": "SUB_13",
                "name": "Complications of Pregnancy",
                "topics": [
                    {
                        "id": "TOPIC_13_02_001",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_02",
                        "name": "Hypertensive Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_02_002",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_02",
                        "name": "Gestational Diabetes",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_02_003",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_02",
                        "name": "Antepartum Hemorrhage",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_02_004",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_02",
                        "name": "Multiple Pregnancy",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_02_005",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_02",
                        "name": "Rh Incompatibility",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_13_03",
                "subjectId": "SUB_13",
                "name": "Labour",
                "topics": [
                    {
                        "id": "TOPIC_13_03_001",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_03",
                        "name": "Normal Labour",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_03_002",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_03",
                        "name": "Abnormal Labour",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_03_003",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_03",
                        "name": "Instrumental Delivery",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_03_004",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_03",
                        "name": "Caesarean Section",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_13_04",
                "subjectId": "SUB_13",
                "name": "Puerperium",
                "topics": [
                    {
                        "id": "TOPIC_13_04_001",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_04",
                        "name": "Postpartum Care",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_04_002",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_04",
                        "name": "Lactation",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_04_003",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_04",
                        "name": "Puerperal Infections",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_04_004",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_04",
                        "name": "Postpartum Hemorrhage",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_13_05",
                "subjectId": "SUB_13",
                "name": "Menstrual Disorders",
                "topics": [
                    {
                        "id": "TOPIC_13_05_001",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_05",
                        "name": "Amenorrhea",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_05_002",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_05",
                        "name": "Dysmenorrhea",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_05_003",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_05",
                        "name": "Abnormal Uterine Bleeding",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_13_06",
                "subjectId": "SUB_13",
                "name": "Genital Infections",
                "topics": [
                    {
                        "id": "TOPIC_13_06_001",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_06",
                        "name": "PID",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_06_002",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_06",
                        "name": "Sexually Transmitted Infections",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_06_003",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_06",
                        "name": "Vaginal Infections",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_13_07",
                "subjectId": "SUB_13",
                "name": "Endometriosis",
                "topics": [
                    {
                        "id": "TOPIC_13_07_001",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_07",
                        "name": "Diagnosis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_07_002",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_07",
                        "name": "Management",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_13_08",
                "subjectId": "SUB_13",
                "name": "Gynaecological Oncology",
                "topics": [
                    {
                        "id": "TOPIC_13_08_001",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_08",
                        "name": "Cervical Cancer",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_08_002",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_08",
                        "name": "Endometrial Cancer",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_08_003",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_08",
                        "name": "Ovarian Cancer",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_13_09",
                "subjectId": "SUB_13",
                "name": "Contraception",
                "topics": [
                    {
                        "id": "TOPIC_13_09_001",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_09",
                        "name": "Temporary Methods",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_09_002",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_09",
                        "name": "Permanent Methods",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_09_003",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_09",
                        "name": "Emergency Contraception",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_13_10",
                "subjectId": "SUB_13",
                "name": "Infertility",
                "topics": [
                    {
                        "id": "TOPIC_13_10_001",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_10",
                        "name": "Female Infertility",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_10_002",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_10",
                        "name": "Male Factor",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_13_10_003",
                        "subjectId": "SUB_13",
                        "systemId": "SYS_13_10",
                        "name": "Assisted Reproductive Techniques",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            }
        ]
    },
    {
        "id": "SUB_14",
        "name": "Pediatrics",
        "systems": [
            {
                "id": "SYS_14_01",
                "subjectId": "SUB_14",
                "name": "Neonatology",
                "topics": [
                    {
                        "id": "TOPIC_14_01_001",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_01",
                        "name": "Normal Newborn",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_14_01_002",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_01",
                        "name": "Neonatal Resuscitation",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_14_01_003",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_01",
                        "name": "Neonatal Jaundice",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_14_01_004",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_01",
                        "name": "Neonatal Sepsis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_14_01_005",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_01",
                        "name": "Low Birth Weight",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_14_02",
                "subjectId": "SUB_14",
                "name": "Growth & Development",
                "topics": [
                    {
                        "id": "TOPIC_14_02_001",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_02",
                        "name": "Growth Monitoring",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_14_02_002",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_02",
                        "name": "Developmental Milestones",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_14_02_003",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_02",
                        "name": "Developmental Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_14_03",
                "subjectId": "SUB_14",
                "name": "Nutrition",
                "topics": [
                    {
                        "id": "TOPIC_14_03_001",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_03",
                        "name": "Breastfeeding",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_14_03_002",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_03",
                        "name": "Complementary Feeding",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_14_03_003",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_03",
                        "name": "Protein-Energy Malnutrition",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_14_03_004",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_03",
                        "name": "Vitamin Deficiencies",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_14_04",
                "subjectId": "SUB_14",
                "name": "Systemic Pediatrics",
                "topics": [
                    {
                        "id": "TOPIC_14_04_001",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_04",
                        "name": "Respiratory Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_14_04_002",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_04",
                        "name": "Cardiology",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_14_04_003",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_04",
                        "name": "Gastroenterology",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_14_04_004",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_04",
                        "name": "Nephrology",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_14_04_005",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_04",
                        "name": "Neurology",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_14_04_006",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_04",
                        "name": "Endocrinology",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_14_05",
                "subjectId": "SUB_14",
                "name": "Genetics",
                "topics": [
                    {
                        "id": "TOPIC_14_05_001",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_05",
                        "name": "Chromosomal Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_14_05_002",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_05",
                        "name": "Inborn Errors of Metabolism",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_14_05_003",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_05",
                        "name": "Genetic Counseling",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_14_06",
                "subjectId": "SUB_14",
                "name": "Pediatric Oncology",
                "topics": [
                    {
                        "id": "TOPIC_14_06_001",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_06",
                        "name": "Leukemia",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_14_06_002",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_06",
                        "name": "Lymphoma",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_14_06_003",
                        "subjectId": "SUB_14",
                        "systemId": "SYS_14_06",
                        "name": "Solid Tumors",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            }
        ]
    },
    {
        "id": "SUB_15",
        "name": "Orthopedics",
        "systems": [
            {
                "id": "SYS_15_01",
                "subjectId": "SUB_15",
                "name": "Traumatology & Fractures",
                "topics": [
                    {
                        "id": "TOPIC_15_01_001",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_01",
                        "name": "Fracture Healing",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_15_01_002",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_01",
                        "name": "Upper Limb Fractures",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_15_01_003",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_01",
                        "name": "Lower Limb Fractures",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_15_01_004",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_01",
                        "name": "Pelvic Fractures",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_15_01_005",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_01",
                        "name": "Spine Trauma",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_15_02",
                "subjectId": "SUB_15",
                "name": "Bone & Joint Infections",
                "topics": [
                    {
                        "id": "TOPIC_15_02_001",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_02",
                        "name": "Osteomyelitis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_15_02_002",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_02",
                        "name": "Septic Arthritis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_15_02_003",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_02",
                        "name": "Tuberculosis of Bone",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_15_03",
                "subjectId": "SUB_15",
                "name": "Bone Tumours",
                "topics": [
                    {
                        "id": "TOPIC_15_03_001",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_03",
                        "name": "Benign Bone Tumours",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_15_03_002",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_03",
                        "name": "Malignant Bone Tumours",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_15_03_003",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_03",
                        "name": "Metastatic Bone Disease",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_15_04",
                "subjectId": "SUB_15",
                "name": "Congenital Deformities",
                "topics": [
                    {
                        "id": "TOPIC_15_04_001",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_04",
                        "name": "Developmental Dysplasia of Hip",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_15_04_002",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_04",
                        "name": "Clubfoot",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_15_04_003",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_04",
                        "name": "Limb Deformities",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_15_05",
                "subjectId": "SUB_15",
                "name": "Regional Orthopedics",
                "topics": [
                    {
                        "id": "TOPIC_15_05_001",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_05",
                        "name": "Shoulder",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_15_05_002",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_05",
                        "name": "Elbow",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_15_05_003",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_05",
                        "name": "Hand",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_15_05_004",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_05",
                        "name": "Hip",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_15_05_005",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_05",
                        "name": "Knee",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_15_05_006",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_05",
                        "name": "Foot & Ankle",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_15_05_007",
                        "subjectId": "SUB_15",
                        "systemId": "SYS_15_05",
                        "name": "Spine",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            }
        ]
    },
  {
        "id": "SUB_16",
        "name": "Psychiatry",
        "systems": [
            {
                "id": "SYS_16_01",
                "subjectId": "SUB_16",
                "name": "Basic Psychology",
                "topics": [
                    {
                        "id": "TOPIC_16_01_001",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_01",
                        "name": "Learning",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_01_002",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_01",
                        "name": "Memory",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_01_003",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_01",
                        "name": "Intelligence",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_01_004",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_01",
                        "name": "Personality",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_01_005",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_01",
                        "name": "Emotions",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_01_006",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_01",
                        "name": "Stress",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_16_02",
                "subjectId": "SUB_16",
                "name": "Psychopathology",
                "topics": [
                    {
                        "id": "TOPIC_16_02_001",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_02",
                        "name": "Disorders of Perception",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_02_002",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_02",
                        "name": "Disorders of Thought",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_02_003",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_02",
                        "name": "Disorders of Mood",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_02_004",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_02",
                        "name": "Disorders of Memory",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_02_005",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_02",
                        "name": "Disorders of Consciousness",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_16_03",
                "subjectId": "SUB_16",
                "name": "Major Psychiatric Disorders",
                "topics": [
                    {
                        "id": "TOPIC_16_03_001",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_03",
                        "name": "Schizophrenia",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_03_002",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_03",
                        "name": "Bipolar Disorder",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_03_003",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_03",
                        "name": "Depression",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_03_004",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_03",
                        "name": "Anxiety Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_03_005",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_03",
                        "name": "Obsessive Compulsive Disorder",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_03_006",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_03",
                        "name": "Somatoform Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_16_04",
                "subjectId": "SUB_16",
                "name": "Substance Use Disorders",
                "topics": [
                    {
                        "id": "TOPIC_16_04_001",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_04",
                        "name": "Alcohol Dependence",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_04_002",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_04",
                        "name": "Opioid Use Disorder",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_04_003",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_04",
                        "name": "Cannabis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_04_004",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_04",
                        "name": "Stimulants",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_04_005",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_04",
                        "name": "Tobacco Dependence",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_16_05",
                "subjectId": "SUB_16",
                "name": "Organic Psychiatry",
                "topics": [
                    {
                        "id": "TOPIC_16_05_001",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_05",
                        "name": "Delirium",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_05_002",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_05",
                        "name": "Dementia",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_05_003",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_05",
                        "name": "Neurocognitive Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_16_06",
                "subjectId": "SUB_16",
                "name": "Psychopharmacology",
                "topics": [
                    {
                        "id": "TOPIC_16_06_001",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_06",
                        "name": "Antipsychotics",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_06_002",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_06",
                        "name": "Antidepressants",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_06_003",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_06",
                        "name": "Mood Stabilizers",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_06_004",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_06",
                        "name": "Anxiolytics",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_16_06_005",
                        "subjectId": "SUB_16",
                        "systemId": "SYS_16_06",
                        "name": "Electroconvulsive Therapy (ECT)",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            }
        ]
    },
    {
        "id": "SUB_17",
        "name": "Dermatology",
        "systems": [
            {
                "id": "SYS_17_01",
                "subjectId": "SUB_17",
                "name": "Skin Lesions & Diagnosis",
                "topics": [
                    {
                        "id": "TOPIC_17_01_001",
                        "subjectId": "SUB_17",
                        "systemId": "SYS_17_01",
                        "name": "Primary Skin Lesions",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_17_01_002",
                        "subjectId": "SUB_17",
                        "systemId": "SYS_17_01",
                        "name": "Secondary Skin Lesions",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_17_01_003",
                        "subjectId": "SUB_17",
                        "systemId": "SYS_17_01",
                        "name": "Diagnostic Methods",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_17_01_004",
                        "subjectId": "SUB_17",
                        "systemId": "SYS_17_01",
                        "name": "Dermoscopy",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_17_02",
                "subjectId": "SUB_17",
                "name": "Infections & Infestations",
                "topics": [
                    {
                        "id": "TOPIC_17_02_001",
                        "subjectId": "SUB_17",
                        "systemId": "SYS_17_02",
                        "name": "Bacterial Infections",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_17_02_002",
                        "subjectId": "SUB_17",
                        "systemId": "SYS_17_02",
                        "name": "Viral Infections",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_17_02_003",
                        "subjectId": "SUB_17",
                        "systemId": "SYS_17_02",
                        "name": "Fungal Infections",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_17_02_004",
                        "subjectId": "SUB_17",
                        "systemId": "SYS_17_02",
                        "name": "Parasitic Infestations",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_17_03",
                "subjectId": "SUB_17",
                "name": "Papulosquamous Disorders",
                "topics": [
                    {
                        "id": "TOPIC_17_03_001",
                        "subjectId": "SUB_17",
                        "systemId": "SYS_17_03",
                        "name": "Psoriasis",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_17_03_002",
                        "subjectId": "SUB_17",
                        "systemId": "SYS_17_03",
                        "name": "Lichen Planus",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_17_03_003",
                        "subjectId": "SUB_17",
                        "systemId": "SYS_17_03",
                        "name": "Pityriasis Rosea",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_17_04",
                "subjectId": "SUB_17",
                "name": "Immunological Disorders",
                "topics": [
                    {
                        "id": "TOPIC_17_04_001",
                        "subjectId": "SUB_17",
                        "systemId": "SYS_17_04",
                        "name": "Urticaria",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_17_04_002",
                        "subjectId": "SUB_17",
                        "systemId": "SYS_17_04",
                        "name": "Pemphigus",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_17_04_003",
                        "subjectId": "SUB_17",
                        "systemId": "SYS_17_04",
                        "name": "Bullous Pemphigoid",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_17_04_004",
                        "subjectId": "SUB_17",
                        "systemId": "SYS_17_04",
                        "name": "Connective Tissue Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_17_05",
                "subjectId": "SUB_17",
                "name": "Hair & Nail Disorders",
                "topics": [
                    {
                        "id": "TOPIC_17_05_001",
                        "subjectId": "SUB_17",
                        "systemId": "SYS_17_05",
                        "name": "Alopecia",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_17_05_002",
                        "subjectId": "SUB_17",
                        "systemId": "SYS_17_05",
                        "name": "Nail Disorders",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_17_06",
                "subjectId": "SUB_17",
                "name": "Dermatology in Systemic Disease",
                "topics": [
                    {
                        "id": "TOPIC_17_06_001",
                        "subjectId": "SUB_17",
                        "systemId": "SYS_17_06",
                        "name": "Cutaneous Manifestations of Systemic Diseases",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_17_06_002",
                        "subjectId": "SUB_17",
                        "systemId": "SYS_17_06",
                        "name": "Genodermatoses",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            }
        ]
    },
    {
        "id": "SUB_18",
        "name": "Anaesthesiology",
        "systems": [
            {
                "id": "SYS_18_01",
                "subjectId": "SUB_18",
                "name": "Principles of Anaesthesia",
                "topics": [
                    {
                        "id": "TOPIC_18_01_001",
                        "subjectId": "SUB_18",
                        "systemId": "SYS_18_01",
                        "name": "Preoperative Assessment",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_18_01_002",
                        "subjectId": "SUB_18",
                        "systemId": "SYS_18_01",
                        "name": "Airway Evaluation",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_18_01_003",
                        "subjectId": "SUB_18",
                        "systemId": "SYS_18_01",
                        "name": "Patient Preparation",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_18_02",
                "subjectId": "SUB_18",
                "name": "Anaesthesia Equipment",
                "topics": [
                    {
                        "id": "TOPIC_18_02_001",
                        "subjectId": "SUB_18",
                        "systemId": "SYS_18_02",
                        "name": "Anaesthesia Machine",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_18_02_002",
                        "subjectId": "SUB_18",
                        "systemId": "SYS_18_02",
                        "name": "Breathing Circuits",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_18_02_003",
                        "subjectId": "SUB_18",
                        "systemId": "SYS_18_02",
                        "name": "Monitoring Devices",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_18_03",
                "subjectId": "SUB_18",
                "name": "General Anaesthesia",
                "topics": [
                    {
                        "id": "TOPIC_18_03_001",
                        "subjectId": "SUB_18",
                        "systemId": "SYS_18_03",
                        "name": "Induction",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_18_03_002",
                        "subjectId": "SUB_18",
                        "systemId": "SYS_18_03",
                        "name": "Maintenance",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_18_03_003",
                        "subjectId": "SUB_18",
                        "systemId": "SYS_18_03",
                        "name": "Recovery",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_18_03_004",
                        "subjectId": "SUB_18",
                        "systemId": "SYS_18_03",
                        "name": "Complications",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_18_04",
                "subjectId": "SUB_18",
                "name": "Regional Anaesthesia",
                "topics": [
                    {
                        "id": "TOPIC_18_04_001",
                        "subjectId": "SUB_18",
                        "systemId": "SYS_18_04",
                        "name": "Spinal Anaesthesia",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_18_04_002",
                        "subjectId": "SUB_18",
                        "systemId": "SYS_18_04",
                        "name": "Epidural Anaesthesia",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_18_04_003",
                        "subjectId": "SUB_18",
                        "systemId": "SYS_18_04",
                        "name": "Peripheral Nerve Blocks",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_18_05",
                "subjectId": "SUB_18",
                "name": "Intensive Care",
                "topics": [
                    {
                        "id": "TOPIC_18_05_001",
                        "subjectId": "SUB_18",
                        "systemId": "SYS_18_05",
                        "name": "Mechanical Ventilation",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_18_05_002",
                        "subjectId": "SUB_18",
                        "systemId": "SYS_18_05",
                        "name": "Hemodynamic Monitoring",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_18_05_003",
                        "subjectId": "SUB_18",
                        "systemId": "SYS_18_05",
                        "name": "Sepsis Management",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_18_06",
                "subjectId": "SUB_18",
                "name": "Resuscitation",
                "topics": [
                    {
                        "id": "TOPIC_18_06_001",
                        "subjectId": "SUB_18",
                        "systemId": "SYS_18_06",
                        "name": "Basic Life Support (BLS)",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_18_06_002",
                        "subjectId": "SUB_18",
                        "systemId": "SYS_18_06",
                        "name": "Advanced Cardiac Life Support (ACLS)",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_18_06_003",
                        "subjectId": "SUB_18",
                        "systemId": "SYS_18_06",
                        "name": "Trauma Resuscitation",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            }
        ]
    },
    {
        "id": "SUB_19",
        "name": "Radiology",
        "systems": [
            {
                "id": "SYS_19_01",
                "subjectId": "SUB_19",
                "name": "Imaging Physics",
                "topics": [
                    {
                        "id": "TOPIC_19_01_001",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_01",
                        "name": "X-ray Physics",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_19_01_002",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_01",
                        "name": "Ultrasound Physics",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_19_01_003",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_01",
                        "name": "CT Physics",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_19_01_004",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_01",
                        "name": "MRI Physics",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_19_01_005",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_01",
                        "name": "Nuclear Medicine Basics",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_19_02",
                "subjectId": "SUB_19",
                "name": "Principles of Radiology",
                "topics": [
                    {
                        "id": "TOPIC_19_02_001",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_02",
                        "name": "Contrast Media",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_19_02_002",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_02",
                        "name": "Radiation Safety",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_19_02_003",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_02",
                        "name": "Image Interpretation",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_19_03",
                "subjectId": "SUB_19",
                "name": "Diagnostic Imaging",
                "topics": [
                    {
                        "id": "TOPIC_19_03_001",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_03",
                        "name": "Chest Imaging",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_19_03_002",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_03",
                        "name": "Neuroimaging",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_19_03_003",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_03",
                        "name": "Musculoskeletal Imaging",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_19_03_004",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_03",
                        "name": "Abdominal Imaging",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_19_03_005",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_03",
                        "name": "Obstetric & Gynecological Imaging",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_19_04",
                "subjectId": "SUB_19",
                "name": "Interventional Radiology",
                "topics": [
                    {
                        "id": "TOPIC_19_04_001",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_04",
                        "name": "Vascular Procedures",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_19_04_002",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_04",
                        "name": "Non-Vascular Procedures",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_19_04_003",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_04",
                        "name": "Image-Guided Biopsy",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_19_04_004",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_04",
                        "name": "Drainage Procedures",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            },
            {
                "id": "SYS_19_05",
                "subjectId": "SUB_19",
                "name": "Radiotherapy",
                "topics": [
                    {
                        "id": "TOPIC_19_05_001",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_05",
                        "name": "Basic Principles",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_19_05_002",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_05",
                        "name": "External Beam Radiotherapy",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_19_05_003",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_05",
                        "name": "Brachytherapy",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    },
                    {
                        "id": "TOPIC_19_05_004",
                        "subjectId": "SUB_19",
                        "systemId": "SYS_19_05",
                        "name": "Radiation Complicatons",
                        "highYield": false,
                        "estimatedStudyMinutes": 30,
                        "relatedTopics": [],
                        "aliases": [],
                        "pyqWeight": 1,
                        "difficulty": "average"
                    }
                ]
            }
        ]
    }
];
export const ALL_TOPICS: OntologyTopic[] = UNIVERSAL_ONTOLOGY.flatMap(sub => sub.systems.flatMap(sys => sys.topics));
export const ALL_SYSTEMS: OntologySystem[] = UNIVERSAL_ONTOLOGY.flatMap(sub => sub.systems);
export const ALL_SUBJECTS: OntologySubject[] = UNIVERSAL_ONTOLOGY.map(sub => ({ id: sub.id, name: sub.name, systems: [] }));

export function getTopicById(id: string): OntologyTopic | undefined {
  return ALL_TOPICS.find(t => t.id === id);
}

export function getSystemById(id: string): OntologySystem | undefined {
  return ALL_SYSTEMS.find(s => s.id === id);
}

export function getSubjectById(id: string): OntologySubject | undefined {
  return UNIVERSAL_ONTOLOGY.find(s => s.id === id);
}
