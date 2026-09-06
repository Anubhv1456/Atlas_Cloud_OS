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
  legacyId?: string;
  legacyIds?: string[];
}

export interface OntologySubject {
  id: string;
  name: string;
  systems: OntologySystem[];
  category?: 'Organ Systems' | 'Foundational Disciplines' | 'Clerkship';
  legacyId?: string;
  legacyIds?: string[];
}
