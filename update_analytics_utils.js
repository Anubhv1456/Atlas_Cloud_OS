const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/features/analytics/analyticsUtils.ts';
let content = fs.readFileSync(path, 'utf8');

const targetFunctionStart = "export function calculateAnalyticsStats(filteredLogs: ScoreLog[]) {";
const targetFunctionEnd = "  };\n}"; // Actually it's better to use regex to replace the function

const newFunction = `export function calculateAnalyticsStats(filteredLogs: ScoreLog[]) {
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
    const daysOld = Math.max(0, (now - new Date(log.timestamp).getTime()) / (1000 * 60 * 60 * 24));
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
}`;

const regex = /export function calculateAnalyticsStats\(filteredLogs: ScoreLog\[\]\) \{[\s\S]*?gtCount: gtLogs\.length\n  \};\n\}/;
content = content.replace(regex, newFunction);

fs.writeFileSync(path, content);
