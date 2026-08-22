import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, HistoryEntry, ScoreLog } from '@/db';
import { getLocalExamProfile, ExamProfile } from '@/lib/examProfile';

export interface CircadianTelemetry {
  todayLoggedMinutes: number;
  todaySessionCount: number;
  activeStreakDays: number;
  daysRemaining: number | null;
  targetExam: string;
  isPeakStudyWindow: boolean;
  circadianPacingStatus: 'FRESH' | 'OPTIMAL' | 'FATIGUE_RISK' | 'RECOVERY_WINDOW';
  averageSessionMinutes: number;
  recommendedNextDurationMinutes: number;
  formattedTelemetrySummary: string;
}

/**
 * Calculates current consecutive study streak in days
 */
export function calculateStreakFromHistory(history: HistoryEntry[]): number {
  if (!history || history.length === 0) return 0;
  const validHistory = history.filter(h => !h.deletedAt);
  if (validHistory.length === 0) return 0;

  const dates = new Set(validHistory.map(entry => {
    const d = new Date(entry.completedAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }));

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let timeToCheck = now.getTime();
  if (!dates.has(timeToCheck)) {
    timeToCheck -= 86400000;
    if (!dates.has(timeToCheck)) return 0;
  }

  let streak = 0;
  while (dates.has(timeToCheck)) {
    streak++;
    timeToCheck -= 86400000;
  }
  return streak;
}

/**
 * Real-time Circadian Telemetry Hook for Atlas Voice & Socratic AI
 */
export function useCircadianTelemetry(): CircadianTelemetry {
  const history = useLiveQuery(() => db.history.toArray()) || [];
  const opMode = useLiveQuery(() => db.operationalModes.get('current'));
  const examProfile: ExamProfile = getLocalExamProfile();

  const [telemetry, setTelemetry] = useState<CircadianTelemetry>(() => {
    return computeTelemetry(history, opMode, examProfile);
  });

  useEffect(() => {
    setTelemetry(computeTelemetry(history, opMode, examProfile));
  }, [history, opMode, examProfile]);

  return telemetry;
}

function computeTelemetry(
  history: HistoryEntry[],
  opMode: any,
  examProfile: ExamProfile
): CircadianTelemetry {
  const now = new Date();
  const currentHour = now.getHours();

  // Target exam calculation
  const targetDateStr = opMode?.targetDate || examProfile.targetExamDate || null;
  let daysRemaining: number | null = null;
  if (targetDateStr) {
    try {
      const target = new Date(targetDateStr);
      if (!isNaN(target.getTime())) {
        target.setHours(0, 0, 0, 0);
        const todayZero = new Date(now);
        todayZero.setHours(0, 0, 0, 0);
        daysRemaining = Math.max(0, Math.ceil((target.getTime() - todayZero.getTime()) / (1000 * 60 * 60 * 24)));
      }
    } catch {
      daysRemaining = null;
    }
  }

  // Today's history calculations
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const todayEntries = (history || []).filter(h => {
    if (h.deletedAt) return false;
    const completed = new Date(h.completedAt);
    return completed.getTime() >= startOfDay.getTime();
  });

  const todayLoggedMinutes = todayEntries.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const todaySessionCount = todayEntries.length;

  // Average session length across past 30 entries
  const recentValid = (history || []).filter(h => !h.deletedAt).slice(-30);
  const avgMinutes = recentValid.length > 0
    ? Math.round(recentValid.reduce((a, b) => a + (b.durationMinutes || 45), 0) / recentValid.length)
    : 45;

  // Circadian state (Peak hours for medical synthesis vs late-night burnout danger)
  // Peak: 09:00 - 13:00 and 15:00 - 19:00
  // Fatigue: 23:00 - 05:00 or > 360 mins logged today
  const isPeakStudyWindow = (currentHour >= 9 && currentHour <= 13) || (currentHour >= 15 && currentHour <= 19);
  
  let circadianPacingStatus: 'FRESH' | 'OPTIMAL' | 'FATIGUE_RISK' | 'RECOVERY_WINDOW' = 'OPTIMAL';
  if (currentHour >= 23 || currentHour < 5 || todayLoggedMinutes >= 420) {
    circadianPacingStatus = 'FATIGUE_RISK';
  } else if (todayLoggedMinutes === 0 && (currentHour >= 6 && currentHour <= 10)) {
    circadianPacingStatus = 'FRESH';
  } else if (todayLoggedMinutes >= 240 && isPeakStudyWindow) {
    circadianPacingStatus = 'RECOVERY_WINDOW';
  }

  // Recommended next duration based on fatigue
  let recommendedNextDurationMinutes = 45;
  if (circadianPacingStatus === 'FATIGUE_RISK') {
    recommendedNextDurationMinutes = 15; // Rapid 15m volatile drill or wrap up
  } else if (circadianPacingStatus === 'FRESH' || isPeakStudyWindow) {
    recommendedNextDurationMinutes = 60; // Deep block
  }

  const streakDays = calculateStreakFromHistory(history);

  const formattedTelemetrySummary = [
    `Today: ${todayLoggedMinutes} mins (${todaySessionCount} sessions)`,
    `Streak: ${streakDays}d`,
    `Exam in: ${daysRemaining !== null ? daysRemaining + 'd' : 'Unset'}`,
    `Pacing: ${circadianPacingStatus} (${isPeakStudyWindow ? 'Peak Window' : 'Standard'})`,
  ].join(' | ');

  return {
    todayLoggedMinutes,
    todaySessionCount,
    activeStreakDays: streakDays,
    daysRemaining,
    targetExam: examProfile.targetExam || 'NEET PG',
    isPeakStudyWindow,
    circadianPacingStatus,
    averageSessionMinutes: avgMinutes,
    recommendedNextDurationMinutes,
    formattedTelemetrySummary,
  };
}
