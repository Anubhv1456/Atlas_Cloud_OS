import { OntologySubject, OntologySystem, OntologyTopic } from './types';
import { UNIVERSAL_ONTOLOGY as NEETPG_ONTOLOGY } from './ontology.neetpg';
import {
  USMLE_ONTOLOGY,
  USMLE_STEP1_ONTOLOGY,
  USMLE_STEP2_ONTOLOGY,
  USMLE_LEGACY_ID_MAP,
  USMLE_REVERSE_LEGACY_MAP,
  USMLE_SYSTEM_ID_MAP,
  normalizeUsmleSubjectId,
  normalizeUsmleSystemId,
  normalizeUsmleTopicId,
  isSubjectIdMatch
} from './ontology.usmle';
import { GENERAL_ONTOLOGY } from './ontology.general';

// Helper function to dynamically load ontology based on exam string
export function getOntologyForExam(targetExam: string): OntologySubject[] {
  const examLower = targetExam.toLowerCase();
  if (examLower.includes('step 2')) {
    return USMLE_STEP2_ONTOLOGY;
  }
  if (examLower.includes('step 1') || examLower === 'usmle') {
    return USMLE_STEP1_ONTOLOGY;
  }
  if (examLower.includes('neet')) {
    return NEETPG_ONTOLOGY;
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

// Backward-compatible legacy bridges ensuring Dexie entries with legacy IDs (e.g. USMLE_1) resolve seamlessly
const LEGACY_USMLE_BRIDGES: OntologySubject[] = Object.entries(USMLE_LEGACY_ID_MAP).map(([legacyId, canonicalId]) => {
  const canonicalSub = USMLE_STEP1_ONTOLOGY.find(s => s.id === canonicalId);
  return {
    id: legacyId,
    name: canonicalSub ? canonicalSub.name : legacyId,
    systems: [] as OntologySystem[],
    legacyId,
    category: canonicalSub?.category
  };
});

export const ALL_SUBJECTS = [
  ...NEETPG_ONTOLOGY,
  ...USMLE_ONTOLOGY,
  ...GENERAL_ONTOLOGY,
  ...LEGACY_USMLE_BRIDGES
].map(sub => ({ id: sub.id, name: sub.name, systems: sub.systems || [], category: sub.category }));

export const ALL_SYSTEMS = [...NEETPG_ONTOLOGY, ...USMLE_ONTOLOGY, ...GENERAL_ONTOLOGY].flatMap(sub => sub.systems);
export const ALL_TOPICS = [...NEETPG_ONTOLOGY, ...USMLE_ONTOLOGY, ...GENERAL_ONTOLOGY].flatMap(sub => sub.systems.flatMap(sys => sys.topics || []));

export function getTopicById(id: string): OntologyTopic | undefined {
  if (!id) return undefined;
  const directMatch = ALL_TOPICS.find(t => t.id === id);
  if (directMatch) return directMatch;
  const aliasMatch = ALL_TOPICS.find(t => t.aliases && t.aliases.includes(id));
  if (aliasMatch) return aliasMatch;
  const normalizedId = normalizeUsmleTopicId(id);
  return ALL_TOPICS.find(t => t.id === normalizedId);
}

export function getSubjectById(id: string): { id: string; name: string } | undefined {
  if (!id) return undefined;
  const direct = ALL_SUBJECTS.find(s => s.id === id);
  if (direct) return direct;
  const normalizedId = normalizeUsmleSubjectId(id);
  return ALL_SUBJECTS.find(s => s.id === normalizedId);
}

// Re-export ontologies and alias utilities
export {
  NEETPG_ONTOLOGY,
  USMLE_ONTOLOGY,
  USMLE_STEP1_ONTOLOGY,
  USMLE_STEP2_ONTOLOGY,
  GENERAL_ONTOLOGY,
  USMLE_LEGACY_ID_MAP,
  USMLE_REVERSE_LEGACY_MAP,
  USMLE_SYSTEM_ID_MAP,
  normalizeUsmleSubjectId,
  normalizeUsmleSystemId,
  normalizeUsmleTopicId,
  isSubjectIdMatch
};
export type { OntologySubject, OntologySystem, OntologyTopic };
