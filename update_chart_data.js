const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/features/analytics/analyticsUtils.ts';
let content = fs.readFileSync(path, 'utf8');

const formatChartDataFunc = `export function formatChartData(
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
      scoreStr: \`\${log.score} / \${log.total}\`,
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
          id: \`decay-\${log.id}\`,
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
}`;

// Replace the existing export function formatChartData ... 
content = content.replace(/export function formatChartData\([\s\S]*?\)\s*\{[\s\S]*?\}\s*(?=(?:export function calculateSystemBreakdown|export))/m, formatChartDataFunc + '\n\n');

fs.writeFileSync(path, content);
