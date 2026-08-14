import { toast } from "sonner";
import { db } from '@/db';
import { UNIVERSAL_ONTOLOGY } from '@/data/ontology';
import { generateHLC } from '@/lib/hlc';
import * as T from '@/db/types';

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export interface LoadOntologyOptions {
  force?: boolean;
  showToast?: boolean;
  onProgress?: (percent: number, stepLabel: string) => void;
}

export async function loadUniversalOntology(options: LoadOntologyOptions = {}) {
  const { force = false, showToast = false, onProgress } = options;

  try {
    // Check if ontology is already loaded (Idempotency)
    const existingCount = await db.subjects.count();
    if (existingCount > 0 && !force) {
      if (onProgress) onProgress(100, 'Curriculum already loaded');
      return { success: true, count: existingCount, reloaded: false };
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

    const newSubjects: T.Subject[] = [];
    const newSystems: T.StudySystem[] = [];
    const newPrefs: T.UIPreference[] = [];

    let subjectOrder = 0;

    for (const sub of UNIVERSAL_ONTOLOGY) {
      const subjectId = generateHLC();
      
      newSubjects.push({
        id: subjectId as any,
        name: sub.name,
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

      let systemOrder = 0;
      for (const sys of sub.systems) {
        const sysId = generateHLC();
        
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

    if (onProgress) onProgress(45, 'Writing subjects and organ systems...');

    // Bulk put efficiently
    await db.subjects.bulkPut(newSubjects);
    if (onProgress) onProgress(75, 'Configuring system preferences...');
    await db.systems.bulkPut(newSystems);
    await db.uiPreferences.bulkPut(newPrefs);

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
