import { ScoreLog, MistakeLog } from '@/db';
import { SUBJECT_METRICS_PROFILE } from '@/lib/ai/frictionEngine';
import { executeCognitiveCompiler } from '@/lib/ai/geminiClient';

export interface ClusterPerformance {
  cluster: 'Pre-Clinical' | 'Para-Clinical' | 'Clinical';
  totalQuestionsEstimated: number;
  weakCount: number;
  subjects: string[];
  leakageSeverity: 'HIGH' | 'MODERATE' | 'LOW';
}

export interface GtAutopsyReport {
  scoreLogId?: number | string;
  testName: string;
  score: number;
  total: number;
  percentage: number;
  scoreDelta?: number; // Delta against prior score
  priorTestName?: string;
  clusterBreakdown: ClusterPerformance[];
  primaryLeakageCluster: 'Pre-Clinical' | 'Para-Clinical' | 'Clinical';
  threePointSprintPlan: [
    { title: string; focus: string; durationDays: number; rationale: string },
    { title: string; focus: string; durationDays: number; rationale: string },
    { title: string; focus: string; durationDays: number; rationale: string }
  ];
  highYieldPearlsToAudit: string[];
}

/**
 * Analyzes a newly recorded Grand Test (GT) or Subject-Wise Test against historical score logs.
 */
export async function analyzeGtAutopsy(
  currentScore: ScoreLog,
  priorScores: ScoreLog[] = [],
  recentMistakes: MistakeLog[] = []
): Promise<GtAutopsyReport> {
  const currentTotal = currentScore.total > 0 ? currentScore.total : 200;
  const currentPct = Math.round((currentScore.score / currentTotal) * 100);

  // Find previous test of same type or last available score
  const sortedPriors = [...priorScores]
    .filter((s) => s.id !== currentScore.id)
    .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

  const lastScore = sortedPriors[0];
  const lastTotal = lastScore?.total > 0 ? lastScore.total : 200;
  const lastPct = lastScore ? Math.round((lastScore.score / lastTotal) * 100) : undefined;
  const scoreDelta = lastPct !== undefined ? currentPct - lastPct : undefined;

  // Aggregate weak subjects
  const weakSubjects = currentScore.weakSubjects || [];

  // Group by Clusters
  const clusters: Record<'Pre-Clinical' | 'Para-Clinical' | 'Clinical', { subjects: string[]; questions: number }> = {
    'Pre-Clinical': { subjects: [], questions: 0 },
    'Para-Clinical': { subjects: [], questions: 0 },
    'Clinical': { subjects: [], questions: 0 },
  };

  Object.entries(SUBJECT_METRICS_PROFILE).forEach(([subject, profile]) => {
    clusters[profile.cluster].questions += profile.weight;
    if (weakSubjects.some((ws) => ws.toLowerCase() === subject.toLowerCase())) {
      clusters[profile.cluster].subjects.push(subject);
    }
  });

  const clusterBreakdown: ClusterPerformance[] = (['Pre-Clinical', 'Para-Clinical', 'Clinical'] as const).map(
    (clusterKey) => {
      const data = clusters[clusterKey];
      const weakCount = data.subjects.length;
      let leakageSeverity: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';

      if (clusterKey === 'Clinical' && weakCount >= 2) leakageSeverity = 'HIGH';
      else if (clusterKey === 'Para-Clinical' && weakCount >= 2) leakageSeverity = 'HIGH';
      else if (weakCount >= 1) leakageSeverity = 'MODERATE';

      return {
        cluster: clusterKey,
        totalQuestionsEstimated: data.questions,
        weakCount,
        subjects: data.subjects,
        leakageSeverity,
      };
    }
  );

  // Determine Primary Leakage Cluster
  const sortedClusters = [...clusterBreakdown].sort((a, b) => b.weakCount - a.weakCount);
  const primaryLeakageCluster = sortedClusters[0]?.weakCount > 0 ? sortedClusters[0].cluster : 'Clinical';

  // High-Yield Mistake Pearls to Audit
  const highYieldPearlsToAudit = recentMistakes
    .filter((m) => !m.resolved)
    .slice(0, 3)
    .map((m) => m.keyTakeaway || m.title || 'High-Yield Clinical Rule');

  // Generate 3-Point Surgical Sprint Adjustment Plan
  const defaultSprintPlan: [
    { title: string; focus: string; durationDays: number; rationale: string },
    { title: string; focus: string; durationDays: number; rationale: string },
    { title: string; focus: string; durationDays: number; rationale: string }
  ] = [
    {
      title: 'Targeted High-Yield Leakage Sprint',
      focus: sortedClusters[0]?.subjects.join(', ') || 'General Medicine & Surgery',
      durationDays: 3,
      rationale: `Directly seal bleeding topics in ${primaryLeakageCluster} cluster which carries high question density.`,
    },
    {
      title: '20th Notebook Volatile Trap Audit',
      focus: 'Pharmacology DOCs & Microbiology culture media/diagnostics',
      durationDays: 2,
      rationale: 'Prevent memory decay on rapid-elimination factual stems that cause negative marking.',
    },
    {
      title: 'Active Recall & Time Pacing Calibration',
      focus: 'Timed 50-Q custom test blocks at 45s per stem',
      durationDays: 2,
      rationale: 'Reinforce clinical decision speed and stem reading accuracy for next assessment.',
    },
  ];

  return {
    scoreLogId: currentScore.id,
    testName: currentScore.testName || currentScore.title || 'Assessment Autopsy',
    score: currentScore.score,
    total: currentTotal,
    percentage: currentPct,
    scoreDelta,
    priorTestName: lastScore?.testName || lastScore?.title,
    clusterBreakdown,
    primaryLeakageCluster,
    threePointSprintPlan: defaultSprintPlan,
    highYieldPearlsToAudit,
  };
}
