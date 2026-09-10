import { ScoreLog } from '@/db';
import { db } from '@/db';

export function isSystemActive(s: any): boolean {
  if (s.deletedAt) return false;
  return (
    s.revisionState === 'in_progress' ||
    s.currentRevisionInterval !== null ||
    (s.contentUnitsCompleted !== undefined && s.contentUnitsCompleted > 0)
  );
}

export async function getActiveSystems(): Promise<any[]> {
  const allSystems = await db.systems.toArray();
  return allSystems.filter(isSystemActive);
}

export function calculateYearScoreMap(scoreLogs: ScoreLog[]) {
  const map = new Map<number, { percentage: number; score: number; total: number; timestamp: Date }>();
  for (const log of scoreLogs) {
    if (log.type === 'pyq' && log.pyqYearId) {
      const existing = map.get(log.pyqYearId);
      if (!existing || new Date(log.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
        map.set(log.pyqYearId, {
          percentage: log.percentage,
          score: log.score,
          total: log.total,
          timestamp: log.timestamp,
        });
      }
    }
  }
  return map;
}

export function generateCustomYearRange(endYear: number, span: number, prefix: string) {
  const generated: string[] = [];
  const prefixStr = prefix.trim() ? `${prefix.trim()} ` : '';
  for (let i = 0; i < span; i++) {
    generated.push(`${prefixStr}${endYear - i}`);
  }
  return generated;
}
