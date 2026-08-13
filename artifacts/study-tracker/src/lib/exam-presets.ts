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

export async function loadUniversalOntology() {
  try {
    toast.info("Loading MBBS Preset... Please wait.");
    // Purge existing data
    await db.subjects.clear();
    await db.systems.clear();
    await db.uiPreferences.clear();
    await db.topicProgress.clear();
    await db.history.clear();
    await db.pyqYears.clear();
    await db.scoreLogs.clear();
    await db.curriculumSets.clear();
    await db.revisionSets.clear();
    await db.mistakeLogs.clear();
    await db.recommendationSkips.clear();

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

    const chunkArray = (arr: any[], size: number) => {
      const chunked = [];
      for (let i = 0; i < arr.length; i += size) {
        chunked.push(arr.slice(i, i + size));
      }
      return chunked;
    };

    const subjectChunks = chunkArray(newSubjects, 400);
    for (const chunk of subjectChunks) {
      await db.subjects.bulkPut(chunk);
    }
    
    const systemChunks = chunkArray(newSystems, 400);
    for (const chunk of systemChunks) {
      await db.systems.bulkPut(chunk);
    }

    const prefChunks = chunkArray(newPrefs, 400);
    for (const chunk of prefChunks) {
      await db.uiPreferences.bulkPut(chunk);
    }
    
  } catch (err) {
    console.error("loadUniversalOntology ERROR:", err);
    toast.error("Error loading ontology: " + String(err));
  }
}
