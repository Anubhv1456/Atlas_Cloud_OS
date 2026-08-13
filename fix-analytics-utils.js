const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/features/analytics/analyticsUtils.ts';
let code = fs.readFileSync(file, 'utf8');

const targetStats = `export function calculateAnalyticsStats(filteredLogs: ScoreLog[]) {
  if (filteredLogs.length === 0) {
    return {
      avgPercentage: 0,
      totalLogs: 0,
      targetPassRate: 0,
      totalSubjectsCovered: 0
    };
  }
  const totalPct = filteredLogs.reduce((acc, log) => acc + log.percentage, 0);
  const avgPercentage = Math.round((totalPct / filteredLogs.length) * 10) / 10;
  const targetPassed = filteredLogs.filter(log => log.percentage >= 75).length;
  const targetPassRate = Math.round((targetPassed / filteredLogs.length) * 100);
  const subIds = new Set(filteredLogs.map(l => l.subjectId));
  
  return {
    avgPercentage,
    totalLogs: filteredLogs.length,
    targetPassRate,
    totalSubjectsCovered: subIds.size,
  };
}`;

const replaceStats = `export function calculateAnalyticsStats(filteredLogs: ScoreLog[]) {
  if (filteredLogs.length === 0) {
    return {
      avgPercentage: 0,
      totalLogs: 0,
      targetPassRate: 0,
      totalSubjectsCovered: 0,
      avgGtScore: 0,
      gtCount: 0
    };
  }
  const totalPct = filteredLogs.reduce((acc, log) => acc + log.percentage, 0);
  const avgPercentage = Math.round((totalPct / filteredLogs.length) * 10) / 10;
  const targetPassed = filteredLogs.filter(log => log.percentage >= 75).length;
  const targetPassRate = Math.round((targetPassed / filteredLogs.length) * 100);
  const subIds = new Set(filteredLogs.map(l => l.subjectId).filter(id => id && id !== 'gt'));
  
  const gtLogs = filteredLogs.filter(log => log.type === 'gt');
  const avgGtScore = gtLogs.length > 0 
    ? Math.round((gtLogs.reduce((acc, log) => acc + log.score, 0) / gtLogs.length) * 10) / 10 
    : 0;
  
  return {
    avgPercentage,
    totalLogs: filteredLogs.length,
    targetPassRate,
    totalSubjectsCovered: subIds.size,
    avgGtScore,
    gtCount: gtLogs.length
  };
}`;

code = code.replace(targetStats, replaceStats);

const targetChart = `type: log.type === 'revision' ? 'System Revision' : 'PYQ Test',`;
const replaceChart = `type: log.type === 'gt' ? 'Grand Test' : log.type === 'revision' ? 'System Revision' : log.type === 'pyq' ? 'PYQ Test' : 'Custom Set',`;

code = code.replace(targetChart, replaceChart);

fs.writeFileSync(file, code);
