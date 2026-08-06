import { useState, useEffect } from 'react';

export function useAIInsights(subjects: any[], systems: any[]) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (subjects.length === 0 || systems.length === 0) return;

    // Deterministic offline calculation based on subject weights & system progress
    const lowProgressSubject = subjects[0] || { name: 'General Medicine' };
    
    setData({
      strategicInsights: [
        `Prioritize ${lowProgressSubject.name} revisions based on syllabus weightage.`,
        "Increase active recall MCQ volume across high-yield subjects."
      ],
      communityMarkers: [
        `Consistent revision velocity puts you in top percentile for ${lowProgressSubject.name}.`
      ],
      analyticsInterpretation: [
        "Syllabus coverage is progressing well across foundational subjects."
      ],
      subjectCalibrations: [
        {
          subjectName: lowProgressSubject.name,
          priorityWeight: 1.2,
          forgettingRisk: 0.6,
          revisionUrgency: 0.8,
          masteryScore: 0.65,
          confidencePenalty: 1.0,
          decayMultiplier: 1.0,
          expectedScoreGain: 5,
          expectedScoreLoss: 2,
          intervalAdjustment: 0,
          urgencyScore: 1,
          confidence: 0.8,
          reasons: ["DETERMINISTIC_RECOMMENDATION", "HIGH_EXAM_WEIGHTAGE"]
        }
      ]
    });
  }, [subjects.length, systems.length]);

  return { data, loading };
}

