import React from 'react';
import { useLiveQuery } from '@/db';
import { db, Subject, CurriculumUnit, MistakeLog, ScoreLog, HistoryEntry } from '@/db';
import { STANDARD_MEDICAL_SUBJECTS } from './intentParser';

export interface SubjectFrictionMetric {
  subjectId: string | number;
  subjectName: string;
  frictionScore: number;
  examWeightage: number; // Estimated marks in 200/300 question mock
  mistakeCount: number;
  unresolvedMistakes: number;
  daysSinceReview: number;
  decayUrgency: 'CRITICAL' | 'ELEVATED' | 'MODERATE' | 'STABLE';
  subjectHalfLifeDays: number;
  cluster: 'Pre-Clinical' | 'Para-Clinical' | 'Clinical';
  recommendedTopic?: string;
  recommendedActionText: string;
  hasStarted: boolean;
}

export interface DailyAgendaPulse {
  id: string;
  subjectName: string;
  topicName: string;
  urgency: 'CRITICAL' | 'ELEVATED' | 'MODERATE';
  reason: string;
  estimatedMinutes: number;
  actionType: 'ACTIVE_RECALL' | 'PEARL_AUDIT' | 'WEAK_SPRINT';
  actionPayload: {
    subjectId: string | number;
    subjectName: string;
    systemName: string;
  };
}

/**
 * Standard NEET PG / INI-CET Subject Weightage (out of 200 questions) and Memory Decay Half-Lives (in days)
 */
export const SUBJECT_METRICS_PROFILE: Record<
  string,
  { weight: number; halfLifeDays: number; cluster: 'Pre-Clinical' | 'Para-Clinical' | 'Clinical'; volatileTopics: string[] }
> = {
  Anatomy: { weight: 17, halfLifeDays: 14, cluster: 'Pre-Clinical', volatileTopics: ['Brachial Plexus & Nerve Injuries', 'Perineum & Pelvic Diaphragm', 'Embryology & Pharyngeal Arches'] },
  Physiology: { weight: 17, halfLifeDays: 16, cluster: 'Pre-Clinical', volatileTopics: ['Renal Clearance & Acid-Base', 'Cardiac Action Potential & Murmurs', 'Respiratory Compliance & Dead Space'] },
  Biochemistry: { weight: 16, halfLifeDays: 8, cluster: 'Pre-Clinical', volatileTopics: ['Inborn Errors of Metabolism', 'Enzyme Kinetics & Inhibitors', 'Vitamin Deficiencies & Cofactors'] }, // Fast decay
  Pharmacology: { weight: 20, halfLifeDays: 9, cluster: 'Para-Clinical', volatileTopics: ['Antimicrobial DOC & Mechanisms', 'Antiarrhythmics Class I-IV', 'Chemotherapy Adverse Effects & Antidotes'] }, // Volatile drug classes
  Pathology: { weight: 25, halfLifeDays: 15, cluster: 'Para-Clinical', volatileTopics: ['Glomerulonephritis & Electron Microscopy', 'Hematologic Malignancies & Translocations', 'Vasculitis & Autoantibodies'] },
  Microbiology: { weight: 20, halfLifeDays: 10, cluster: 'Para-Clinical', volatileTopics: ['Culture Media & Bacterial Toxins', 'Viral Hepatitis Serology & PCR', 'Systemic Mycology & Dimorphic Fungi'] }, // Volatile bugs/media
  'Forensic Medicine & Toxicology': { weight: 10, halfLifeDays: 12, cluster: 'Para-Clinical', volatileTopics: ['Poisoning Antidotes & SLUDGE', 'Post-Mortem Intervals & Rigor Mortis', 'IPC Sections & Medical Jurisprudence'] },
  'Community Medicine (PSM)': { weight: 25, halfLifeDays: 11, cluster: 'Para-Clinical', volatileTopics: ['Biostatistics & Screening Tests (Sens/Spec)', 'National Health Programs & Vaccines (NIS)', 'Epidemiological Study Designs & Bias'] },
  Ophthalmology: { weight: 10, halfLifeDays: 14, cluster: 'Clinical', volatileTopics: ['Glaucoma Medical & Surgical Protocol', 'Retinopathy & Fundus Findings', 'Neuro-Ophthalmology & Pupil Defects'] },
  'Otorhinolaryngology (ENT)': { weight: 10, halfLifeDays: 14, cluster: 'Clinical', volatileTopics: ['Audiology (Rinne/Weber interpretation)', 'Stridor & Pediatric Airway Emergencies', 'Sinus Anatomy & FESS Landmarks'] },
  'General Medicine': { weight: 35, halfLifeDays: 20, cluster: 'Clinical', volatileTopics: ['ECG STEMI Localization & Arrhythmias', 'Diabetic Ketoacidosis & Hyperosmolar Protocol', 'Secondary Hypertension & Endocrine Workup'] },
  'General Surgery': { weight: 30, halfLifeDays: 18, cluster: 'Clinical', volatileTopics: ['Acute Abdomen & Appendicitis Mimics', 'Thyroid Malignancies & Lymph Node Stations', 'Trauma ATLS Protocol & Shock Classifications'] },
  'Obstetrics & Gynecology': { weight: 25, halfLifeDays: 16, cluster: 'Clinical', volatileTopics: ['PPH Management & Uterotonic Steps', 'Preeclampsia & Eclampsia Magnesium Protocol', 'CTG Patterns & Fetal Distress Algorithm'] },
  Pediatrics: { weight: 10, halfLifeDays: 15, cluster: 'Clinical', volatileTopics: ['Developmental Milestones & Red Flags', 'Cyanotic Congenital Heart Diseases', 'Inborn Errors & Neonatal Jaundice Nomogram'] },
  Orthopedics: { weight: 8, halfLifeDays: 18, cluster: 'Clinical', volatileTopics: ['Pediatric Fractures & Salter-Harris', 'Nerve Palsies in Upper Limb Trauma', 'Bone Tumors & X-Ray Signs'] },
  Dermatology: { weight: 6, halfLifeDays: 14, cluster: 'Clinical', volatileTopics: ['Vesiculobullous Disorders (Pemphigus vs BP)', 'STD Diagnostic Ulcers & Syndromic Management', 'Papulosquamous Lesions & Auspitz Sign'] },
  Psychiatry: { weight: 6, halfLifeDays: 21, cluster: 'Clinical', volatileTopics: ['Schizophrenia & Mood Disorder Criteria', 'Antipsychotic Adverse Effects (EPS/NMS)', 'Substance Dependence & Withdrawal Scales'] },
  Radiology: { weight: 6, halfLifeDays: 14, cluster: 'Clinical', volatileTopics: ['Chest X-Ray Classic Signs & Cavities', 'HRCT Thorax Patterns (UIP vs NSIP)', 'MRI Brain Stroke Sequences & Ischemic Penumbra'] },
  Anesthesiology: { weight: 6, halfLifeDays: 12, cluster: 'Clinical', volatileTopics: ['Difficult Airway Algorithm & Mallampati', 'Local Anesthetic Toxicity (LAST) & Lipid Rescue', 'Inhalational Anesthetic Partition Coefficients'] },
};

/**
 * Calculates Clinical Friction Score for a given subject based on the formula:
 * Friction = (Exam Weightage / Total Marks) * (1 + Mistakes / 5) * e^(DaysElapsed / (HalfLife * Stability))
 */
export function calculateSubjectFriction(
  subjectName: string,
  subjectId: string | number,
  mistakes: MistakeLog[],
  history: HistoryEntry[],
  curriculumSets: CurriculumUnit[]
): SubjectFrictionMetric {
  const profile = SUBJECT_METRICS_PROFILE[subjectName] || {
    weight: 12,
    halfLifeDays: 14,
    cluster: 'Clinical' as const,
  };

  // 1. Calculate days since last active engagement
  const relevantHistory = history.filter((h) => {
    const ids = h.subjectIds || (h.subjectId !== undefined ? [h.subjectId] : []);
    return ids.some(id => String(id) === String(subjectId));
  });

  let lastActivityDate = 0;
  relevantHistory.forEach((h) => {
    const d = new Date(h.timestamp || h.createdAt || 0).getTime();
    if (d > lastActivityDate) lastActivityDate = d;
  });

  const now = Date.now();
  const daysSinceReview = lastActivityDate > 0 
    ? Math.max(1, Math.round((now - lastActivityDate) / (1000 * 60 * 60 * 24)))
    : 30; // Default to 30 days if unreviewed

  // 2. Count mistakes and unresolved 20th notebook pearls
  const subjectMistakes = mistakes.filter((m) => {
    const ids = m.subjectIds || (m.subjectId !== undefined ? [m.subjectId] : []);
    return ids.some(id => String(id) === String(subjectId));
  });
  const unresolvedMistakes = subjectMistakes.filter((m) => !m.resolved).length;
  const volatileMistakes = subjectMistakes.filter((m) => m.isVolatile).length;

  // 3. Curriculum completion ratio as stability factor
  const subjectSets = curriculumSets.filter((c) => {
    const ids = c.subjectIds || (c.subjectId !== undefined ? [c.subjectId] : []);
    return ids.some(id => String(id) === String(subjectId));
  });
  const completedSets = subjectSets.filter((c) => c.contentCompleted || c.qbankCompleted).length;
  const completionRatio = subjectSets.length > 0 ? completedSets / subjectSets.length : 0.5;
  const stabilityFactor = Math.max(0.7, Math.min(1.5, 0.8 + completionRatio * 0.7));
  const hasStarted = relevantHistory.length > 0 || subjectMistakes.length > 0 || subjectSets.length > 0;

  // 4. Mathematical Friction Formulation
  const weightFactor = profile.weight / 200; // Normalized exam weight
  const mistakeFactor = 1 + (unresolvedMistakes * 0.4) + (volatileMistakes * 0.6);
  const decayExponent = daysSinceReview / (profile.halfLifeDays * stabilityFactor);
  const decayMultiplier = Math.exp(Math.min(decayExponent, 2.8)); // Cap exponential to prevent numerical overflow

  const rawFriction = weightFactor * mistakeFactor * decayMultiplier * 100;
  const frictionScore = Math.round(rawFriction * 10) / 10;

  // 5. Assign Urgency Tier
  let decayUrgency: 'CRITICAL' | 'ELEVATED' | 'MODERATE' | 'STABLE' = 'STABLE';
  if (frictionScore >= 45 || daysSinceReview > (profile.halfLifeDays * 2)) {
    decayUrgency = 'CRITICAL';
  } else if (frictionScore >= 25 || daysSinceReview > profile.halfLifeDays) {
    decayUrgency = 'ELEVATED';
  } else if (frictionScore >= 12) {
    decayUrgency = 'MODERATE';
  }

  // 6. Formulate high-yield recommended topic
  const uncompletedSet = subjectSets.find((c) => !c.contentCompleted || !c.qbankCompleted);
  const recommendedTopic = uncompletedSet?.name || `${subjectName} High-Yield Core`;

  const recommendedActionText =
    decayUrgency === 'CRITICAL'
      ? `${daysSinceReview}d unreviewed. ${unresolvedMistakes} active error traps decaying.`
      : decayUrgency === 'ELEVATED'
      ? `Approaching half-life threshold (${profile.halfLifeDays}d). Refresh volatile topics.`
      : `Retention stable. Keep queued for spaced cycle.`;

  return {
    subjectId,
    subjectName,
    frictionScore,
    examWeightage: profile.weight,
    mistakeCount: subjectMistakes.length,
    unresolvedMistakes,
    daysSinceReview,
    decayUrgency,
    subjectHalfLifeDays: profile.halfLifeDays,
    cluster: profile.cluster,
    recommendedTopic,
    recommendedActionText,
    hasStarted,
  };
}

/**
 * React Hook that computes real-time Subject Friction Metrics & Top 3 Daily Agenda Pulses
 */

export function useClinicalFrictionEngine() {
  const subjects = useLiveQuery(() => db.subjects.toArray().then((s) => s.filter((x) => !x.deletedAt))) || [];
  const mistakes = useLiveQuery(() => db.mistakeLogs.toArray().then((m) => m.filter((x) => !x.deletedAt))) || [];
  const history = useLiveQuery(() => db.history.toArray(), []) || [];
  const curriculumSets = useLiveQuery(() => db.curriculumSets.toArray().then((c) => c.filter((x) => !x.deletedAt))) || [];

  const metrics: SubjectFrictionMetric[] = React.useMemo(() => {
    if (!subjects.length) return [];
    
    // One highly efficient loop to group by subjectId
    const mistakesBySub = new Map();
    const historyBySub = new Map();
    const curriculumBySub = new Map();
    
    mistakes.forEach(m => {
      const ids = m.subjectIds || (m.subjectId !== undefined ? [m.subjectId] : []);
      ids.forEach(rawId => {
        const id = String(rawId);
        if (!mistakesBySub.has(id)) mistakesBySub.set(id, []);
        mistakesBySub.get(id).push(m);
      });
    });
    
    history.forEach(h => {
      const ids = h.subjectIds || (h.subjectId !== undefined ? [h.subjectId] : []);
      ids.forEach(rawId => {
        const id = String(rawId);
        if (!historyBySub.has(id)) historyBySub.set(id, []);
        historyBySub.get(id).push(h);
      });
    });
    
    curriculumSets.forEach(c => {
      const ids = c.subjectIds || (c.subjectId !== undefined ? [c.subjectId] : []);
      ids.forEach(rawId => {
        const id = String(rawId);
        if (!curriculumBySub.has(id)) curriculumBySub.set(id, []);
        curriculumBySub.get(id).push(c);
      });
    });

    const calculated = subjects.map((sub) => {
      const subId = sub.id !== undefined ? sub.id : sub.name;
      const sIdStr = String(subId);
      return calculateSubjectFriction(
        sub.name, 
        subId, 
        mistakesBySub.get(sIdStr) || [], 
        historyBySub.get(sIdStr) || [], 
        curriculumBySub.get(sIdStr) || []
      );
    });

    return calculated.sort((a, b) => b.frictionScore - a.frictionScore);
  }, [subjects, mistakes, history, curriculumSets]);

  const topDailyPulses: DailyAgendaPulse[] = React.useMemo(() => {
    if (!metrics.length) return [];
    const startedMetrics = metrics.filter(m => m.hasStarted);
    // If there are pending revisions in started subjects, don't show unstarted ones.
    const eligibleMetrics = startedMetrics.length > 0 ? startedMetrics : metrics;
    const topThree = eligibleMetrics.slice(0, 3);
    return topThree.map((m, idx) => {
      let actionType: 'ACTIVE_RECALL' | 'PEARL_AUDIT' | 'WEAK_SPRINT' = 'ACTIVE_RECALL';
      let estimatedMinutes = 30;
      if (m.unresolvedMistakes >= 3) {
        actionType = 'PEARL_AUDIT';
        estimatedMinutes = 20;
      } else if (m.decayUrgency === 'CRITICAL') {
        actionType = 'WEAK_SPRINT';
        estimatedMinutes = 45;
      }
      return {
        id: `pulse-${m.subjectId}-${idx}`,
        subjectName: m.subjectName,
        topicName: m.recommendedTopic || `${m.subjectName} Revision`,
        urgency: m.decayUrgency === 'CRITICAL' ? 'CRITICAL' : m.decayUrgency === 'ELEVATED' ? 'ELEVATED' : 'MODERATE',
        reason: m.recommendedActionText,
        estimatedMinutes,
        actionType,
        actionPayload: {
          subjectId: m.subjectId,
          subjectName: m.subjectName,
          systemName: m.recommendedTopic || 'Core Review',
        },
      };
    });
  }, [metrics]);

  return {
    metrics,
    topDailyPulses,
    criticalCount: metrics.filter((m) => m.decayUrgency === 'CRITICAL').length,
    elevatedCount: metrics.filter((m) => m.decayUrgency === 'ELEVATED').length,
  };
}
