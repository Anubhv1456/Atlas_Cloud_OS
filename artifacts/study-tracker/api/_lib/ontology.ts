import { UNIVERSAL_ONTOLOGY, type OntologySubject, type OntologyTopic } from '../../src/data/ontology.js';

export interface SanitizedTopic {
  id: string;
  subjectId: string;
  systemId: string;
  name: string;
  highYield: boolean;
  aliases?: string[];
  relatedTopics?: string[];
}

export interface SanitizedSystem {
  id: string;
  subjectId: string;
  name: string;
  topics: SanitizedTopic[];
}

export interface SanitizedSubject {
  id: string;
  name: string;
  systems: SanitizedSystem[];
}

export interface SubjectSummary {
  id: string;
  name: string;
  systemCount: number;
  topicCount: number;
}

/**
 * Strips secret fields (pyqWeight, difficulty, internal weighting factors)
 * from an ontology topic before returning to client.
 */
export function sanitizeTopic(topic: OntologyTopic): SanitizedTopic {
  return {
    id: topic.id,
    subjectId: topic.subjectId,
    systemId: topic.systemId,
    name: topic.name,
    highYield: Boolean(topic.highYield),
    aliases: topic.aliases || [],
    relatedTopics: topic.relatedTopics || [],
  };
}

/**
 * Returns a list of all subjects with summary stats.
 */
export function getSubjectSummaries(): SubjectSummary[] {
  return UNIVERSAL_ONTOLOGY.map((sub: OntologySubject) => {
    const systemCount = sub.systems.length;
    const topicCount = sub.systems.reduce((acc, sys) => acc + (sys.topics ? sys.topics.length : 0), 0);
    return {
      id: sub.id,
      name: sub.name,
      systemCount,
      topicCount,
    };
  });
}

/**
 * Returns a single subject by ID or Name with sanitized topics.
 */
export function getSanitizedSubject(subjectQuery: string): SanitizedSubject | null {
  if (!subjectQuery) return null;
  const normalized = subjectQuery.trim().toLowerCase();

  const found = UNIVERSAL_ONTOLOGY.find(
    (sub: OntologySubject) =>
      sub.id.toLowerCase() === normalized ||
      sub.name.toLowerCase() === normalized ||
      sub.name.toLowerCase().includes(normalized) ||
      normalized.includes(sub.name.toLowerCase())
  );

  if (!found) return null;

  return {
    id: found.id,
    name: found.name,
    systems: found.systems.map((sys) => ({
      id: sys.id,
      subjectId: sys.subjectId,
      name: sys.name,
      topics: (sys.topics || []).map(sanitizeTopic),
    })),
  };
}

/**
 * Search ontology topics across all subjects, returning sanitized matches.
 */
export function searchSanitizedTopics(query: string, limit = 50): SanitizedTopic[] {
  if (!query || query.trim().length < 2) return [];
  const normalized = query.trim().toLowerCase();
  const matches: SanitizedTopic[] = [];

  for (const subject of UNIVERSAL_ONTOLOGY) {
    for (const system of subject.systems) {
      for (const topic of system.topics || []) {
        if (
          topic.name.toLowerCase().includes(normalized) ||
          topic.aliases?.some((a) => a.toLowerCase().includes(normalized))
        ) {
          matches.push(sanitizeTopic(topic));
          if (matches.length >= limit) return matches;
        }
      }
    }
  }

  return matches;
}
