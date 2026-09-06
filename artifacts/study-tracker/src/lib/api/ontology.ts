import { auth } from '@/lib/firebase';
import { NEETPG_ONTOLOGY, USMLE_ONTOLOGY, GENERAL_ONTOLOGY, OntologySubject } from '@/data/ontology';

const FULL_ONTOLOGY: OntologySubject[] = [...NEETPG_ONTOLOGY, ...USMLE_ONTOLOGY, ...GENERAL_ONTOLOGY];

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

/**
 * Fetches sanitized subject ontology from Vercel serverless API with local fallback.
 */
export async function getSubjectOntologyWithFallback(
  subjectQuery: string,
  timeoutMs = 3000
): Promise<SanitizedSubject | null> {
  const isOnline = typeof window !== 'undefined' && navigator.onLine;

  if (isOnline && auth.currentUser && subjectQuery) {
    try {
      const token = await auth.currentUser.getIdToken(false).catch(() => null);
      if (token) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(`/api/ontology/subject?id=${encodeURIComponent(subjectQuery)}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.subject) {
            return data.subject as SanitizedSubject;
          }
        }
      }
    } catch (err) {
      console.warn('[Ontology API Layer] Serverless fetch failed/timed out, using local fallback:', err);
    }
  }

  // Fallback to local ontology data
  const normalized = subjectQuery.trim().toLowerCase();
  const found = FULL_ONTOLOGY.find(
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
      topics: (sys.topics || []).map((t) => ({
        id: t.id,
        subjectId: t.subjectId,
        systemId: t.systemId,
        name: t.name,
        highYield: Boolean(t.highYield),
        aliases: t.aliases || [],
        relatedTopics: t.relatedTopics || [],
      })),
    })),
  };
}
