import { OntologySubject, OntologySystem, OntologyTopic } from './types';
import { UNIVERSAL_ONTOLOGY as NEETPG_ONTOLOGY } from './ontology.neetpg';
import { USMLE_ONTOLOGY, USMLE_STEP1_ONTOLOGY, USMLE_STEP2_ONTOLOGY } from './ontology.usmle';
import { GENERAL_ONTOLOGY } from './ontology.general';

// Helper function to dynamically load ontology based on exam string
export function getOntologyForExam(targetExam: string): OntologySubject[] {
  const examLower = targetExam.toLowerCase();
  if (examLower.includes('step 1')) {
    return USMLE_STEP1_ONTOLOGY;
  }
  if (examLower.includes('step 2')) {
    return USMLE_STEP2_ONTOLOGY;
  }
  if (examLower.includes('usmle')) {
    return USMLE_ONTOLOGY;
  }
  if (examLower.includes('custom') || examLower.includes('general')) {
    return GENERAL_ONTOLOGY;
  }
  return NEETPG_ONTOLOGY;
}

export function getTopicsForOntology(ontology: OntologySubject[]): OntologyTopic[] {
  return ontology.flatMap(sub => sub.systems.flatMap(sys => sys.topics || []));
}

export function getSystemsForOntology(ontology: OntologySubject[]): OntologySystem[] {
  return ontology.flatMap(sub => sub.systems);
}

export const ALL_SUBJECTS = [...NEETPG_ONTOLOGY, ...USMLE_ONTOLOGY, ...GENERAL_ONTOLOGY].map(sub => ({ id: sub.id, name: sub.name, systems: [] }));
export const ALL_SYSTEMS = [...NEETPG_ONTOLOGY, ...USMLE_ONTOLOGY, ...GENERAL_ONTOLOGY].flatMap(sub => sub.systems);
export const ALL_TOPICS = [...NEETPG_ONTOLOGY, ...USMLE_ONTOLOGY, ...GENERAL_ONTOLOGY].flatMap(sub => sub.systems.flatMap(sys => sys.topics || []));

export function getTopicById(id: string): OntologyTopic | undefined {
  return ALL_TOPICS.find(t => t.id === id);
}

// Ensure these are exported for other files to import them directly
export { NEETPG_ONTOLOGY, USMLE_ONTOLOGY, GENERAL_ONTOLOGY };
