import { OntologySubject } from './types';

export const GENERAL_ONTOLOGY: OntologySubject[] = [
  {
    id: 'GEN_1',
    name: 'Internal Medicine',
    systems: [
      { id: 'GEN_1_1', subjectId: 'GEN_1', name: 'Cardiology', topics: [] },
      { id: 'GEN_1_2', subjectId: 'GEN_1', name: 'Pulmonology', topics: [] },
      { id: 'GEN_1_3', subjectId: 'GEN_1', name: 'Gastroenterology', topics: [] },
      { id: 'GEN_1_4', subjectId: 'GEN_1', name: 'Nephrology', topics: [] },
      { id: 'GEN_1_5', subjectId: 'GEN_1', name: 'Endocrinology', topics: [] },
      { id: 'GEN_1_6', subjectId: 'GEN_1', name: 'Neurology', topics: [] },
      { id: 'GEN_1_7', subjectId: 'GEN_1', name: 'Rheumatology', topics: [] },
      { id: 'GEN_1_8', subjectId: 'GEN_1', name: 'Infectious Diseases', topics: [] }
    ]
  },
  {
    id: 'GEN_2',
    name: 'Surgery',
    systems: [
      { id: 'GEN_2_1', subjectId: 'GEN_2', name: 'General Surgery', topics: [] },
      { id: 'GEN_2_2', subjectId: 'GEN_2', name: 'Trauma & Critical Care', topics: [] },
      { id: 'GEN_2_3', subjectId: 'GEN_2', name: 'Orthopedics', topics: [] }
    ]
  },
  {
    id: 'GEN_3',
    name: 'Pediatrics',
    systems: [
      { id: 'GEN_3_1', subjectId: 'GEN_3', name: 'Neonatology', topics: [] },
      { id: 'GEN_3_2', subjectId: 'GEN_3', name: 'General Pediatrics', topics: [] }
    ]
  },
  {
    id: 'GEN_4',
    name: 'Obstetrics & Gynecology',
    systems: [
      { id: 'GEN_4_1', subjectId: 'GEN_4', name: 'Obstetrics', topics: [] },
      { id: 'GEN_4_2', subjectId: 'GEN_4', name: 'Gynecology', topics: [] }
    ]
  },
  {
    id: 'GEN_5',
    name: 'Basic Sciences',
    systems: [
      { id: 'GEN_5_1', subjectId: 'GEN_5', name: 'Anatomy', topics: [] },
      { id: 'GEN_5_2', subjectId: 'GEN_5', name: 'Physiology', topics: [] },
      { id: 'GEN_5_3', subjectId: 'GEN_5', name: 'Pathology', topics: [] },
      { id: 'GEN_5_4', subjectId: 'GEN_5', name: 'Pharmacology', topics: [] },
      { id: 'GEN_5_5', subjectId: 'GEN_5', name: 'Microbiology', topics: [] }
    ]
  },
  {
    id: 'GEN_6',
    name: 'Other Specialties',
    systems: [
      { id: 'GEN_6_1', subjectId: 'GEN_6', name: 'Psychiatry', topics: [] },
      { id: 'GEN_6_2', subjectId: 'GEN_6', name: 'Dermatology', topics: [] },
      { id: 'GEN_6_3', subjectId: 'GEN_6', name: 'Radiology', topics: [] }
    ]
  }
];
