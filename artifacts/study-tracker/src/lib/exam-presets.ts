import { db } from '@/db';
import { UNIVERSAL_ONTOLOGY } from '@/data/ontology';

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export async function loadUniversalOntology() {
  await db.transaction('rw', [db.subjects, db.systems, db.uiPreferences, db.topicProgress, db.history, db.pyqYears, db.scoreLogs], async () => {
    // Purge the local database to force implement the Atlas ontology template
    await db.subjects.clear();
    await db.systems.clear();
    await db.uiPreferences.clear();
    await db.topicProgress.clear();
    await db.history.clear();
    await db.pyqYears.clear();
    await db.scoreLogs.clear();

    const existingSubjects = await db.subjects.toArray();
    const existingSystems = await db.systems.toArray();
    const existingPrefs = await db.uiPreferences.toArray();

    let maxSubjectOrder = -1;
    for (const pref of existingPrefs) {
      if (pref.type === 'subject' && pref.order !== undefined && pref.order > maxSubjectOrder) {
        maxSubjectOrder = pref.order;
      }
    }
    let subjectOrder = maxSubjectOrder + 1;

    for (const sub of UNIVERSAL_ONTOLOGY) {
      let subject = existingSubjects.find(s => normalizeName(s.name) === normalizeName(sub.name));
      let subjectId = subject?.id;
      if (!subjectId) {
        subjectId = await db.subjects.add({ name: sub.name, createdAt: new Date(), updatedAt: new Date() });
        await db.uiPreferences.add({
          id: `subject:${subjectId}`,
          type: 'subject',
          entityId: subjectId,
          order: subjectOrder++,
          focus: null,
          updatedAt: new Date()
        });
      }

      let maxSystemOrder = -1;
      const systemsInSubject = existingSystems.filter(sys => sys.subjectId === subjectId);
      for (const sys of systemsInSubject) {
        const pref = existingPrefs.find(p => p.id === `system:${sys.id}`);
        if (pref && pref.order !== undefined && pref.order > maxSystemOrder) {
          maxSystemOrder = pref.order;
        }
      }
      let systemOrder = maxSystemOrder + 1;

      for (const sys of sub.systems) {
        const sysExists = existingSystems.find(s =>
          s.subjectId === subjectId &&
          normalizeName(s.name) === normalizeName(sys.name)
        );

        if (!sysExists) {
          const sysId = await db.systems.add({
            subjectId,
            name: sys.name,
            updatedAt: new Date(),
            nextRevisionDate: null,
            revisionState: 'idle' as const,
            contentInitialized: false,
            contentUnitsTotal: 0,
            contentUnitsCompleted: 0,
            contentCompleted: false,
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

          await db.uiPreferences.add({
            id: `system:${sysId}`,
            type: 'system',
            entityId: sysId,
            order: systemOrder++,
            focus: null,
            updatedAt: new Date()
          });
        }
      }
    }
  });
}
