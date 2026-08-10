const fs = require('fs');
const file = './artifacts/study-tracker/src/lib/recommendations/nextActionEngine.ts';
let code = fs.readFileSync(file, 'utf8');

const strToRemove = `  // Build ScoreLog lookup
  const setScoreMap = new Map<string, number[]>();
  const systemScoreMap = new Map<number, number[]>();
  
  for (const log of scoreLogs) {
    if (log.percentage !== undefined && log.percentage !== null) {
      if (log.curriculumSetId) {
        const existing = setScoreMap.get(log.curriculumSetId) || [];
        existing.push(log.percentage);
        setScoreMap.set(log.curriculumSetId, existing);
      }
      if (log.systemId) {
        const existing = systemScoreMap.get(log.systemId) || [];
        existing.push(log.percentage);
        systemScoreMap.set(log.systemId, existing);
      }
    }
  }

  const rawCandidates: NextActionRecommendation[] = [];
  const systemsWithSets = new Set<number>();
  const systemsWithIncompleteSets = new Set<number>();

  // Helper for Study Block Health
  const calculateBlockHealth = (setId: string, topicIds: string[]) => {
    let isBlockWeak = false;
    let inferredScore = 70;
    let scoreSource: 'log' | 'status' = 'status';

    const scores = setScoreMap.get(setId) || [];
    if (scores.length > 0) {
      const recent = scores.slice(-3);
      inferredScore = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
      scoreSource = 'log';
      if (inferredScore < 50) isBlockWeak = true;
    }

    let weakTopicsInSet = 0;
    for (const tid of topicIds) {
      if (weakTopicMap.has(tid)) weakTopicsInSet++;
    }
    
    if (topicIds.length > 0 && (weakTopicsInSet / topicIds.length) > 0.3) {
      isBlockWeak = true;
    }

    return { isBlockWeak, inferredScore, scoreSource, weakTopicsInSet };
  };`;

const replacement = `  const rawCandidates: NextActionRecommendation[] = [];
  const systemsWithSets = new Set<number>();
  const systemsWithIncompleteSets = new Set<number>();`;

code = code.replace(strToRemove, replacement);
fs.writeFileSync(file, code);
