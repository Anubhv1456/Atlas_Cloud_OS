import { fsrs, Card, Rating, State, FSRS, createEmptyCard } from 'ts-fsrs';
import { db, StudySystem } from '@/db';

const f = fsrs({});

export { Rating, State, createEmptyCard };

export async function processFSRS(systemId: number | string, rating: Rating, logDate: Date) {
  // Load system
  const system = await db.systems.get(systemId);
  if (!system) return;

  // Build FSRS Card from system fields or create new
  let card: Card = {
    due: system.fsrsDue ? new Date(system.fsrsDue) : new Date(),
    stability: system.fsrsStability ?? 0,
    difficulty: system.fsrsDifficulty ?? 0,
    elapsed_days: system.fsrsElapsedDays ?? 0,
    scheduled_days: system.fsrsScheduledDays ?? 0,
    reps: system.fsrsReps ?? 0,
    lapses: system.fsrsLapses ?? 0,
    state: system.fsrsState ?? State.New,
    last_review: system.fsrsLastReview ? new Date(system.fsrsLastReview) : undefined,
  };

  if (card.state === State.New && card.stability === 0) {
     card = createEmptyCard(logDate);
  }

  const schedulingCards = f.repeat(card, logDate);
  const nextCard = schedulingCards[rating].card;

  await db.systems.update(systemId, {
    fsrsDue: nextCard.due,
    fsrsStability: nextCard.stability,
    fsrsDifficulty: nextCard.difficulty,
    fsrsElapsedDays: nextCard.elapsed_days,
    fsrsScheduledDays: nextCard.scheduled_days,
    fsrsReps: nextCard.reps,
    fsrsLapses: nextCard.lapses,
    fsrsState: nextCard.state,
    fsrsLastReview: nextCard.last_review,
  });
}

export function calculateFSRSRetention(system: StudySystem, now: Date = new Date()): number {
  if (!system.fsrsDue || !system.fsrsStability) return 100; // Unstudied or new
  
  const lastReview = system.fsrsLastReview ? new Date(system.fsrsLastReview) : new Date(system.fsrsDue);
  const elapsedDays = Math.max(0, (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
  
  // FSRS official retention formula: R = 0.9 ^ (elapsed_days / stability)
  const retention = Math.pow(0.9, elapsedDays / system.fsrsStability) * 100;
  return Math.max(0, Math.min(100, retention));
}

export async function runFSRSMigration() {
  const hasMigrated = localStorage.getItem('fsrs_migration_complete');
  if (hasMigrated) return;

  const logs = await db.scoreLogs.orderBy('timestamp').toArray();
  const sortedLogs = logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  for (const log of sortedLogs) {
    if (log.systemId) {
      // Avoid circular dependency by re-implementing mapScoreToFSRSRating here or importing it properly
      let rating = Rating.Good;
      if (log.percentage < 50) rating = Rating.Again;
      else if (log.percentage <= 70) rating = Rating.Hard;
      else if (log.percentage <= 85) rating = Rating.Good;
      else rating = Rating.Easy;

      await processFSRS(log.systemId, rating, new Date(log.timestamp));
    }
  }

  localStorage.setItem('fsrs_migration_complete', 'true');
  console.log('FSRS Background Migration Complete');
}
