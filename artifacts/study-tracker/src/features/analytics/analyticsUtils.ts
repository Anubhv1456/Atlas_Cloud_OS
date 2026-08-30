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
    if (selectedSubjectId === 'gt') {
      result = result.filter(log => log.type === 'gt' || !log.subjectId || String(log.subjectId).startsWith('gt'));
    } else {
      result = result.filter(log => {
        if (log.subjectId === undefined || log.subjectId === null) return false;
        return String(log.subjectId) === String(selectedSubjectId);
      });
    }
  }
  if (selectedSystemId !== 'all') {
    result = result.filter(log => {
      if (log.systemId === undefined || log.systemId === null) return false;
      return String(log.systemId) === String(selectedSystemId);
    });
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

export interface SubjectCurveSeries {
  subjectId: number;
  subjectName: string;
  color: string;
  data: Array<{
    id: string;
    index: number;
    date: string;
    fullDate: string;
    percentage: number;
    scoreStr?: string;
    title: string;
    type: string;
    subjectName: string;
    volume: number;
    notes?: string;
    isRealPoint: boolean;
    isProjected: boolean;
  }>;
}

// Subject decay factor calibration (Clinical vs Volatile facts)
export function getSubjectStabilityFactor(subjectName: string = '', baseScore: number = 75): number {
  const name = subjectName.toLowerCase();
  let baseStability = 16;

  // Volatile / fact-heavy medical disciplines decay faster
  if (name.includes('pharma') || name.includes('biochem') || name.includes('micro') || name.includes('forensic')) {
    baseStability = 10;
  } 
  // High conceptual / surgical / procedural disciplines retain longer
  else if (name.includes('surg') || name.includes('anat') || name.includes('med') || name.includes('obg') || name.includes('gyn')) {
    baseStability = 22;
  } else if (name.includes('pedia') || name.includes('path') || name.includes('physio')) {
    baseStability = 16;
  }

  // Scaling with test percentage: higher scores produce stronger memory traces
  return baseStability + (baseScore / 100) * 14;
}

export function formatChartData(
  displayLogs: ScoreLog[],
  subjectMap: Map<number, Subject>,
  selectedSubjectId: string = 'all'
) {
  if (displayLogs.length === 0) return [];
  
  // Sort logs chronologically to build the curve
  const sorted = [...displayLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const chartData = [];
  
  let lastDisplayedDate = '';

  for (let i = 0; i < sorted.length; i++) {
    const log = sorted[i];
    const logDate = new Date(log.timestamp);
    const subName = subjectMap.get(log.subjectId)?.name || '';
    const formattedDate = format(logDate, 'MMM d');
    
    // Avoid repeating adjacent identical dates on X-axis
    const showDateTick = formattedDate !== lastDisplayedDate;
    if (showDateTick) {
      lastDisplayedDate = formattedDate;
    }
    
    // Test volume weighting
    const questionVolume = log.total || (log.type === 'gt' ? 200 : log.type === 'pyq' ? 50 : 25);
    
    // Primary recorded test spike point
    chartData.push({
      id: String(log.id),
      index: chartData.length + 1,
      date: showDateTick ? formattedDate : '',
      fullDate: format(logDate, 'PPP'),
      percentage: log.percentage,
      scoreStr: `${log.score} / ${log.total}`,
      title: log.title,
      type: log.type === 'gt' ? 'Grand Test' : log.type === 'revision' ? 'System Revision' : log.type === 'pyq' ? 'PYQ Test' : 'Custom Set',
      subjectName: subName,
      volume: questionVolume,
      notes: log.notes || '',
      isRealPoint: true,
      isProjected: false,
    });
    
    // Calculate authentic exponential decay curve before the next log
    if (i < sorted.length - 1) {
      const nextLog = sorted[i + 1];
      const nextLogDate = new Date(nextLog.timestamp);
      const daysDiff = (nextLogDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // If gap is more than 2 days, insert multiple smooth decay steps along the Ebbinghaus curve
      if (daysDiff > 2) {
        const decayDays = Math.min(daysDiff - 0.5, daysDiff);
        const stabilityFactor = getSubjectStabilityFactor(subName, log.percentage);
        const decayedPercentage = Math.max(15, Math.round(log.percentage * Math.exp(-decayDays / stabilityFactor)));
        const decayDate = new Date(nextLogDate.getTime() - 86400000); // 1 day before next test
        
        chartData.push({
          id: `decay-${log.id}`,
          index: chartData.length + 1,
          date: '', // Hide tick for smooth spline
          fullDate: format(decayDate, 'PPP'),
          percentage: decayedPercentage,
          title: 'Memory Decay Phase',
          type: 'Decay',
          subjectName: subName,
          volume: 0,
          notes: 'Exponential forgetting before subsequent revision',
          isRealPoint: false,
          isProjected: false,
        });
      }
    }
  }
  
  // Add Current "Today" state
  const lastLog = sorted[sorted.length - 1];
  const lastDate = new Date(lastLog.timestamp);
  const lastSubName = subjectMap.get(lastLog.subjectId)?.name || '';
  const daysSinceLast = Math.max(0, (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  const stabilityFactor = getSubjectStabilityFactor(lastSubName, lastLog.percentage);
  const currentDecayed = Math.max(15, Math.round(lastLog.percentage * Math.exp(-daysSinceLast / stabilityFactor)));

  chartData.push({
    id: 'decay-today',
    index: chartData.length + 1,
    date: 'Today',
    fullDate: `${format(new Date(), 'PPP')} (Today)`,
    percentage: currentDecayed,
    title: selectedSubjectId === 'all' ? 'Current Retention Level' : `${lastSubName} Current Retention`,
    type: 'Current Status',
    subjectName: selectedSubjectId === 'all' ? 'All Systems' : lastSubName,
    volume: 0,
    isRealPoint: daysSinceLast < 0.5,
    isProjected: false,
  });

  // Future 7-Day & 14-Day Memory Decay Projection
  const project7Pct = Math.max(10, Math.round(currentDecayed * Math.exp(-7 / stabilityFactor)));
  const project14Pct = Math.max(10, Math.round(currentDecayed * Math.exp(-14 / stabilityFactor)));

  const future7Date = new Date(Date.now() + 7 * 86400000);
  const future14Date = new Date(Date.now() + 14 * 86400000);

  chartData.push({
    id: 'project-7d',
    index: chartData.length + 1,
    date: '+7d',
    fullDate: `${format(future7Date, 'MMM d')} (Projected)`,
    percentage: project7Pct,
    title: '7-Day Projected Decay',
    type: 'Forecast',
    subjectName: selectedSubjectId === 'all' ? 'Projected Retention' : lastSubName,
    volume: 0,
    isRealPoint: false,
    isProjected: true,
  });

  chartData.push({
    id: 'project-14d',
    index: chartData.length + 1,
    date: '+14d',
    fullDate: `${format(future14Date, 'MMM d')} (Projected)`,
    percentage: project14Pct,
    title: '14-Day Projected Decay',
    type: 'Forecast',
    subjectName: selectedSubjectId === 'all' ? 'Projected Retention' : lastSubName,
    volume: 0,
    isRealPoint: false,
    isProjected: true,
  });
  
  return chartData;
}

export function calculateSystemBreakdown(
  filteredLogs: ScoreLog[],
  systemMap: Map<number, StudySystem>,
  subjectMap: Map<number, Subject>
) {
  const sysGroup = new Map<string, { totalPct: number; count: number; name: string; subjectId?: number | string; systemId?: number | string }>();

  filteredLogs.forEach(log => {
    let keyName = log.title;
    let sId = log.subjectId;
    let sysId = log.systemId;

    if (log.systemId && systemMap.has(log.systemId)) {
      const foundSys = systemMap.get(log.systemId)!;
      keyName = foundSys.name;
      sId = foundSys.subjectId;
    } else if (log.subjectId && subjectMap.has(log.subjectId)) {
      keyName = subjectMap.get(log.subjectId)!.name;
    }

    if (!sysGroup.has(keyName)) {
      sysGroup.set(keyName, { totalPct: 0, count: 0, name: keyName, subjectId: sId, systemId: sysId });
    }
    const item = sysGroup.get(keyName)!;
    item.totalPct += log.percentage;
    item.count += 1;
    if (!item.subjectId && sId) item.subjectId = sId;
    if (!item.systemId && sysId) item.systemId = sysId;
  });

  return Array.from(sysGroup.values())
    .map(item => ({
      name: item.name.length > 18 ? item.name.substring(0, 15) + '...' : item.name,
      fullName: item.name,
      average: Math.round((item.totalPct / item.count) * 10) / 10,
      count: item.count,
      subjectId: item.subjectId,
      systemId: item.systemId,
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 8); // Top 8 systems
}
