import { getLocalExamProfile } from "@/lib/examProfile";
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
  let { force = false, showToast = false, onProgress, targetExam } = options;
  if (!targetExam) {
    targetExam = getLocalExamProfile().targetExam || 'NEET PG';
  }

  // Ensure workspace matches target exam
  db.switchWorkspace(targetExam);

  const activeOntology = getOntologyForExam(targetExam);

  try {
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

    // Load existing active entities
    const existingSubjects = force ? [] : await db.subjects.toArray().then(arr => arr.filter(s => s && !s.deletedAt));
    const existingSystems = force ? [] : await db.systems.toArray().then(arr => arr.filter(s => s && !s.deletedAt));

    // Build lookup maps for subjects
    const existingMapByNorm = new Map<string, T.Subject>();
    const existingMapById = new Map<string, T.Subject>();
    existingSubjects.forEach(s => {
      if (s && s.name) {
        existingMapByNorm.set(normalizeName(s.name), s);
        if (s.id) existingMapById.set(String(s.id), s);
        if (s.ontologySubjectId) existingMapById.set(String(s.ontologySubjectId), s);
      }
    });

    // Build lookup maps for systems
    const existingSystemsByKey = new Map<string, T.StudySystem>();
    const existingSystemsByOntologyId = new Map<string, T.StudySystem>();
    existingSystems.forEach(sys => {
      if (sys && sys.name && sys.subjectId) {
        existingSystemsByKey.set(`${sys.subjectId}_${normalizeName(sys.name)}`, sys);
        if (sys.id) existingSystemsByKey.set(`${sys.subjectId}_${sys.id}`, sys);
        if (sys.ontologySystemId) {
          existingSystemsByOntologyId.set(`${sys.subjectId}_${sys.ontologySystemId}`, sys);
        }
      }
    });

    const subjectsToUpsert: T.Subject[] = [];
    const systemsToUpsert: T.StudySystem[] = [];
    const prefsToUpsert: T.UIPreference[] = [];

    let subjectOrder = 0;

    for (const sub of activeOntology) {
      const normSubName = normalizeName(sub.name);
      let existingSub = existingMapByNorm.get(normSubName) || (sub.id ? existingMapById.get(String(sub.id)) : undefined);

      // Deterministic ID for subject
      const subjectId = existingSub ? existingSub.id! : (sub.id ? `subj_${sub.id.toLowerCase()}` : `subj_${slugify(sub.name)}`);
      
      if (!existingSub) {
        const newSub: T.Subject = {
          id: subjectId as any,
          name: sub.name,
          ontologySubjectId: sub.id,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        subjectsToUpsert.push(newSub);
        existingMapByNorm.set(normSubName, newSub);
        
        prefsToUpsert.push({
          id: `subject:${subjectId}`,
          type: 'subject',
          entityId: subjectId as any,
          order: subjectOrder++,
          focus: null,
          updatedAt: new Date()
        });
      } else {
        // Sync name or ontologySubjectId if changed in updated blueprint
        let subChanged = false;
        if (existingSub.name !== sub.name) {
          existingSub.name = sub.name;
          subChanged = true;
        }
        if (existingSub.ontologySubjectId !== sub.id) {
          existingSub.ontologySubjectId = sub.id;
          subChanged = true;
        }
        if (subChanged) {
          existingSub.updatedAt = new Date();
          subjectsToUpsert.push(existingSub);
        }
      }

      let systemOrder = 0;
      for (const sys of sub.systems) {
        const normSysName = normalizeName(sys.name);
        const sysKeyByName = `${subjectId}_${normSysName}`;
        const sysKeyById = sys.id ? `${subjectId}_sys_${sys.id.toLowerCase()}` : '';
        const sysKeyByOntology = sys.id ? `${subjectId}_${sys.id}` : '';

        const sysId = sys.id ? `sys_${sys.id.toLowerCase()}` : `sys_${slugify(sub.name)}_${slugify(sys.name)}`;

        let existingSys = existingSystemsByKey.get(sysKeyByName) ||
          (sysKeyById ? existingSystemsByKey.get(sysKeyById) : undefined) ||
          (sysKeyByOntology ? existingSystemsByOntologyId.get(sysKeyByOntology) : undefined) ||
          existingSystemsByKey.get(`${subjectId}_${sysId}`);

        if (!existingSys) {
          // New system from updated blueprint!
          const newSysRecord: T.StudySystem = {
            id: sysId as any,
            subjectId: subjectId as any,
            ontologySystemId: sys.id,
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
          } as any;

          systemsToUpsert.push(newSysRecord);

          prefsToUpsert.push({
            id: `system:${sysId}`,
            type: 'system',
            entityId: sysId as any,
            order: systemOrder++,
            focus: null,
            updatedAt: new Date()
          });
        } else {
          // Update existing system with fresh name and ontologySystemId if modified
          let sysChanged = false;
          if (existingSys.name !== sys.name) {
            existingSys.name = sys.name;
            sysChanged = true;
          }
          if (existingSys.ontologySystemId !== sys.id) {
            existingSys.ontologySystemId = sys.id;
            sysChanged = true;
          }
          if (sysChanged) {
            existingSys.updatedAt = new Date();
            systemsToUpsert.push(existingSys);
          }
        }
      }
    }

    if (onProgress) onProgress(45, 'Writing subjects and organ systems...');

    // Bulk put efficiently with idempotent keys
    if (subjectsToUpsert.length > 0) {
      await db.subjects.bulkPut(subjectsToUpsert);
    }
    if (onProgress) onProgress(75, 'Configuring system preferences...');
    if (systemsToUpsert.length > 0) {
      await db.systems.bulkPut(systemsToUpsert);
    }
    if (prefsToUpsert.length > 0) {
      await db.uiPreferences.bulkPut(prefsToUpsert);
    }

    dbEvents.emit('change', 'subjects');
    dbEvents.emit('change', 'systems');
    dbEvents.emit('change', 'uiPreferences');

    if (onProgress) onProgress(100, 'Curriculum ready');
    return {
      success: true,
      count: existingSubjects.length + subjectsToUpsert.length,
      newSubjectsCount: subjectsToUpsert.length,
      newSystemsCount: systemsToUpsert.length,
      reloaded: true
    };
  } catch (err) {
    console.error("loadUniversalOntology ERROR:", err);
    if (showToast) {
      toast.error("Error loading ontology: " + String(err));
    }
    throw err;
  }
}
