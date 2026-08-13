import { format } from 'date-fns';
import { ScoreLog, StudySystem, Subject } from '@/db';

export function getLogTimestamp(log: any): Date {
  if (!log || !log.timestamp) return new Date();
  const d = new Date(log.timestamp);

  // If timestamp was parsed from date-only string like "YYYY-MM-DD", it defaults to 00:00:00.000 UTC.
  // In negative timezones (e.g. UTC-7), 00:00:00 UTC on Aug 13 appears as 17:00 on Aug 12 (11+ hrs ago).
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
    if (log.createdAt) {
      return new Date(log.createdAt);
    }
    const now = new Date();
    const todayLocalStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const logUtcDateStr = d.toISOString().split('T')[0];
    if (logUtcDateStr === todayLocalStr) {
      return now;
    }
  }
  return d;
}

export function filterScoreLogs(
  scoreLogs: ScoreLog[],
  selectedType: string,
  selectedSubjectId: string,
  selectedSystemId: string,
  searchQuery: string
) {
  let result = [...scoreLogs];
  if (selectedType !== 'all') {
    result = result.filter(log => log.type === selectedType);
  }
  if (selectedSubjectId !== 'all') {
    const subId = selectedSubjectId as string | number;
    result = result.filter(log => log.subjectId === subId);
  }
  if (selectedSystemId !== 'all') {
    const sysId = selectedSystemId as string | number;
    result = result.filter(log => log.systemId === sysId);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(log =>
      log.title.toLowerCase().includes(q) ||
      (log.notes && log.notes.toLowerCase().includes(q))
    );
  }
  result.sort((a, b) => getLogTimestamp(a).getTime() - getLogTimestamp(b).getTime());
  return result;
}

export function applyDensityLimit(filteredLogs: ScoreLog[], densityLimit: string) {
  if (densityLimit === 'all') return filteredLogs;
  const limit = parseInt(densityLimit, 10);
  if (isNaN(limit)) return filteredLogs;
  return filteredLogs.slice(-limit);
}

export function calculateAnalyticsStats(filteredLogs: ScoreLog[]) {
  if (filteredLogs.length === 0) {
    return {
      avgPercentage: 0,
      totalLogs: 0,
      targetPassRate: 0,
      totalSubjectsCovered: 0,
      avgGtScore: 0,
      gtCount: 0,
      readinessIndex: 0,
      readinessTrend: 0
    };
  }

  // Calculate traditional stats
  const totalPct = filteredLogs.reduce((acc, log) => acc + log.percentage, 0);
  const avgPercentage = Math.round((totalPct / filteredLogs.length) * 10) / 10;
  const targetPassed = filteredLogs.filter(log => log.percentage >= 75).length;
  const targetPassRate = Math.round((targetPassed / filteredLogs.length) * 100);
  const subIds = new Set(filteredLogs.map(l => l.subjectId).filter(id => id && id !== 'gt'));
  
  const gtLogs = filteredLogs.filter(log => log.type === 'gt');
  const avgGtScore = gtLogs.length > 0 
    ? Math.round((gtLogs.reduce((acc, log) => acc + log.score, 0) / gtLogs.length) * 10) / 10 
    : 0;

  // Calculate Readiness Index (time-decayed)
  const now = Date.now();
  let totalWeight = 0;
  let weightedScore = 0;
  let recentScore = 0; let recentWeight = 0;
  let pastScore = 0; let pastWeight = 0;

  filteredLogs.forEach(log => {
    const daysOld = Math.max(0, (now - getLogTimestamp(log).getTime()) / (1000 * 60 * 60 * 24));
    const weight = Math.exp(-daysOld / 30); // 30-day decay constant
    totalWeight += weight;
    weightedScore += log.percentage * weight;
    
    if (daysOld <= 7) {
        recentWeight += weight;
        recentScore += log.percentage * weight;
    } else if (daysOld > 7 && daysOld <= 14) {
        pastWeight += weight;
        pastScore += log.percentage * weight;
    }
  });

  const readinessIndex = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 10) / 10 : 0;
  
  // Trend calculation
  const recentReadiness = recentWeight > 0 ? (recentScore / recentWeight) : readinessIndex;
  const pastReadiness = pastWeight > 0 ? (pastScore / pastWeight) : readinessIndex;
  const rawTrend = recentReadiness - pastReadiness;
  const readinessTrend = Math.round(rawTrend * 10) / 10;
    
  return {
    avgPercentage,
    totalLogs: filteredLogs.length,
    targetPassRate,
    totalSubjectsCovered: subIds.size,
    avgGtScore,
    gtCount: gtLogs.length,
    readinessIndex,
    readinessTrend
  };
}

export function formatChartData(
  displayLogs: ScoreLog[],
  subjectMap: Map<number, Subject>
) {
  if (displayLogs.length === 0) return [];
  
  // Sort logs chronologically to build the curve
  const sorted = [...displayLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const chartData = [];
  
  for (let i = 0; i < sorted.length; i++) {
    const log = sorted[i];
    const logDate = new Date(log.timestamp);
    const subName = subjectMap.get(log.subjectId)?.name || '';
    
    // Real data point
    chartData.push({
      id: log.id,
      index: i + 1,
      date: format(logDate, 'MMM d'),
      fullDate: format(logDate, 'PPP'),
      percentage: log.percentage,
      scoreStr: `${log.score} / ${log.total}`,
      title: log.title,
      type: log.type === 'gt' ? 'Grand Test' : log.type === 'revision' ? 'System Revision' : log.type === 'pyq' ? 'PYQ Test' : 'Custom Set',
      subjectName: subName,
      notes: log.notes || '',
      isRealPoint: true,
    });
    
    // Calculate decay curve before the next log
    if (i < sorted.length - 1) {
      const nextLog = sorted[i + 1];
      const nextLogDate = new Date(nextLog.timestamp);
      const daysDiff = (nextLogDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // If gap is more than 2 days, insert a decay point to create the dropping arc
      if (daysDiff > 2) {
        // Ebbinghaus forgetting curve simulation (simplified exponential decay)
        const decayedPercentage = Math.max(10, Math.round(log.percentage * Math.exp(-daysDiff / 15)));
        const decayDate = new Date(nextLogDate.getTime() - (1000 * 60 * 60 * 24)); // 1 day before next test
        
        chartData.push({
          id: `decay-${log.id}`,
          date: '', // Hide tick for fake point
          fullDate: format(decayDate, 'PPP'),
          percentage: decayedPercentage,
          title: 'Memory Decay',
          type: 'Decay',
          isRealPoint: false,
        });
      }
    }
  }
  
  // Add a final 'Today' point if the last log was over 2 days ago
  const lastLog = sorted[sorted.length - 1];
  const daysSinceLast = (Date.now() - new Date(lastLog.timestamp).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceLast > 2) {
    const decayedPercentage = Math.max(10, Math.round(lastLog.percentage * Math.exp(-daysSinceLast / 15)));
    chartData.push({
      id: 'decay-now',
      date: 'Today',
      fullDate: format(new Date(), 'PPP'),
      percentage: decayedPercentage,
      title: 'Current Estimated Retention',
      type: 'Decay',
      isRealPoint: false,
    });
  }
  
  return chartData;
}

export function calculateSystemBreakdown(
  filteredLogs: ScoreLog[],
  systemMap: Map<number, StudySystem>,
  subjectMap: Map<number, Subject>
) {
  const sysGroup = new Map<string, { totalPct: number; count: number; name: string }>();

  filteredLogs.forEach(log => {
    let keyName = log.title;
    if (log.systemId && systemMap.has(log.systemId)) {
      keyName = systemMap.get(log.systemId)!.name;
    } else if (log.subjectId && subjectMap.has(log.subjectId)) {
      keyName = subjectMap.get(log.subjectId)!.name;
    }

    if (!sysGroup.has(keyName)) {
      sysGroup.set(keyName, { totalPct: 0, count: 0, name: keyName });
    }
    const item = sysGroup.get(keyName)!;
    item.totalPct += log.percentage;
    item.count += 1;
  });

  return Array.from(sysGroup.values())
    .map(item => ({
      name: item.name.length > 18 ? item.name.substring(0, 15) + '...' : item.name,
      fullName: item.name,
      average: Math.round((item.totalPct / item.count) * 10) / 10,
      count: item.count,
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 8); // Top 8 systems
}
