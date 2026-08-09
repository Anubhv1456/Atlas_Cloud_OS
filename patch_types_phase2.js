const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/db/types.ts', 'utf8');

const newTypes = `
export interface RevisionLog {
  date: string;
  score: number;
}

export interface TopicProgress {
  topicId: string;
  contentStatus: 'not_started' | 'in_progress' | 'completed';
  contentUnitsTotal: number;
  contentUnitsCompleted: number;
  qbankStatus: 'not_started' | 'in_progress' | 'completed';
  weakAreas: string;
  confidence: 'low' | 'average' | 'high';
  
  completionDate: Date | null;
  revisionCount: number;
  lastRevisionDate: Date | null;
  currentRevisionInterval: number | null;
  nextRevisionDate: Date | null;
  decayFactor: number;
  
  revisionHistory: RevisionLog[];
  
  updatedAt: Date;
  hlc?: string;
}

export type TopicLivingState = 'not_started' | 'learning' | 'practicing' | 'revision_due' | 'mastered';
`;

code += "\n" + newTypes;
fs.writeFileSync('artifacts/study-tracker/src/db/types.ts', code);
console.log('types updated');
