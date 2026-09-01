import { toast } from "sonner";
import { db, dbEvents } from '@/db';
import { getOntologyForExam } from '@/data/ontology';
import { generateHLC } from '@/lib/hlc';
import * as T from '@/db/types';

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Creates a clean, deterministic slug for primary keys
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export interface LoadOntologyOptions {
  force?: boolean;
  showToast?: boolean;
  onProgress?: (percent: number, stepLabel: string) => void;
  targetExam?: string;
}

export async function loadUniversalOntology(options: LoadOntologyOptions = {}) {
  const { force = false, showToast = false, onProgress, targetExam = 'NEET PG' } = options;
  const activeOntology = getOntologyForExam(targetExam);

  try {
    // Check existing active subjects
    const existingSubjects = await db.subjects.toArray().then(arr => arr.filter(s => s && !s.deletedAt));
    
    // Idempotency: If ontology subjects are already present and we are not forcing, exit cleanly
    if (existingSubjects.length >= activeOntology.length && !force) {
      if (onProgress) onProgress(100, 'Curriculum already loaded');
      return { success: true, count: existingSubjects.length, reloaded: false };
    }

    if (showToast) {
      toast.info("Configuring Medical Curriculum... Please wait.");
    }

    if (onProgress) onProgress(15, 'Preparing Universal Curriculum structure...');

    // If forcing reset, only clear ontology hierarchy (subjects, systems, uiPreferences)
    // NEVER purge student user history, score logs, topic progress, or mistake logs!
    if (force) {
      await db.subjects.clear();
      await db.systems.clear();
      await db.uiPreferences.clear();
    }

    // Build a map of existing subjects by normalized name so we reuse existing IDs and NEVER duplicate
    const existingMapByNorm = new Map<string, T.Subject>();
    if (!force) {
      const allSubs = await db.subjects.toArray();
      allSubs.forEach(s => {
        if (s && s.name && !s.deletedAt) {
          existingMapByNorm.set(normalizeName(s.name), s);
        }
      });
    }

    const existingSystems = force ? [] : await db.systems.toArray().then(arr => arr.filter(s => s && !s.deletedAt));
    const existingSystemsByKey = new Map<string, T.StudySystem>();
    existingSystems.forEach(sys => {
      if (sys && sys.name && sys.subjectId) {
        existingSystemsByKey.set(`${sys.subjectId}_${normalizeName(sys.name)}`, sys);
      }
    });

    const newSubjects: T.Subject[] = [];
    const newSystems: T.StudySystem[] = [];
    const newPrefs: T.UIPreference[] = [];

    let subjectOrder = 0;

    for (const sub of activeOntology) {
      const normSubName = normalizeName(sub.name);
      const existingSub = existingMapByNorm.get(normSubName);

      // Use existing subject ID or deterministic slug ID
      const subjectId = existingSub ? existingSub.id! : (sub.id ? `subj_${sub.id.toLowerCase()}` : `subj_${slugify(sub.name)}`);
      
      if (!existingSub) {
        newSubjects.push({
          id: subjectId as any,
          name: sub.name,
          ontologySubjectId: sub.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        newPrefs.push({
          id: `subject:${subjectId}`,
          type: 'subject',
          entityId: subjectId as any,
          order: subjectOrder++,
          focus: null,
          updatedAt: new Date()
        });
      }

      let systemOrder = 0;
      for (const sys of sub.systems) {
        const normSysName = normalizeName(sys.name);
        const sysKey = `${subjectId}_${normSysName}`;
        const existingSys = existingSystemsByKey.get(sysKey);

        if (!existingSys) {
          const sysId = sys.id ? `sys_${sys.id.toLowerCase()}` : `sys_${slugify(sub.name)}_${slugify(sys.name)}`;
          
          newSystems.push({
            id: sysId as any,
            subjectId: subjectId as any,
            name: sys.name,
            updatedAt: new Date(),
            nextRevisionDate: null,
            revisionState: 'idle',
            contentInitialized: false,
            contentUnitsTotal: 0,
            contentUnitsCompleted: 0,
            completionDate: null,
            revisionCount: 0,
            lastRevisionDate: null,
            currentRevisionInterval: null,
            decayFactor: 1.0,
            isLengthy: false,
            revisionStartedAt: null,
            revisionLastCheckInDate: null,
            revisionDaysLogged: 0,
            revisionProgressPercent: 0,
            qbankDone: false,
            weakAreas: '',
            status: 'Average'
          } as any);

          newPrefs.push({
            id: `system:${sysId}`,
            type: 'system',
            entityId: sysId as any,
            order: systemOrder++,
            focus: null,
            updatedAt: new Date()
          });
        }
      }
    }

    if (onProgress) onProgress(45, 'Writing subjects and organ systems...');

    // Bulk put efficiently with idempotent keys
    if (newSubjects.length > 0) {
      await db.subjects.bulkPut(newSubjects);
    }
    if (onProgress) onProgress(75, 'Configuring system preferences...');
    if (newSystems.length > 0) {
      await db.systems.bulkPut(newSystems);
    }
    if (newPrefs.length > 0) {
      await db.uiPreferences.bulkPut(newPrefs);
    }

    dbEvents.emit('change', 'subjects');
    dbEvents.emit('change', 'systems');
    dbEvents.emit('change', 'uiPreferences');

    if (onProgress) onProgress(100, 'Curriculum ready');
    return { success: true, count: newSubjects.length, reloaded: true };
  } catch (err) {
    console.error("loadUniversalOntology ERROR:", err);
    if (showToast) {
      toast.error("Error loading ontology: " + String(err));
    }
    throw err;
  }
}
