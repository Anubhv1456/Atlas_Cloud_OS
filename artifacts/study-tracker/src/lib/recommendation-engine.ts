import { normalizeName } from '@/lib/exam-presets';
import { StrategyFactory } from './recommendations/strategies';
import { REC_WEIGHTS, REC_MULTIPLIERS } from './recommendation-constants';
import { Subject, StudySystem } from '@/db';
import { ALL_SYSTEMS, ALL_SUBJECTS, OntologyTopic } from '@/data/ontology';
import { TopicProgress } from '@/db/types';

export interface SubjectWeightage {
  weight: number; // 0 - 100 score
  tag: string;    // e.g. "35+ Questions (High Yield)"
  phase: '1st Year' | '2nd Year' | '3rd Year' | 'Final MBBS' | 'General';
}

export interface RecommendationResult {
  subjectName: string;
  systemName: string;
  subjectId?: number;
  systemId?: number;
  reasons: string[];
  score: number;
}

// ── Medical Exam Subject Weightage Dictionary ───────────────────────────
export const EXAM_WEIGHTAGES: Record<string, Record<string, SubjectWeightage>> = {
  'NEET PG': {
    'Medicine': { weight: 100, tag: '35-40 Qs • High Yield Core', phase: 'Final MBBS' },
    'General Medicine': { weight: 100, tag: '35-40 Qs • High Yield Core', phase: 'Final MBBS' },
    'Surgery': { weight: 98, tag: '35-40 Qs • High Yield Core', phase: 'Final MBBS' },
    'General Surgery': { weight: 98, tag: '35-40 Qs • High Yield Core', phase: 'Final MBBS' },
    'Obstetrics & Gynecology': { weight: 95, tag: '30 Qs • High Yield Core', phase: 'Final MBBS' },
    'Obstetrics and Gynaecology': { weight: 95, tag: '30 Qs • High Yield Core', phase: 'Final MBBS' },
    'Community Medicine (PSM)': { weight: 90, tag: '25 Qs • High Yield', phase: '3rd Year' },
    'Community Medicine': { weight: 90, tag: '25 Qs • High Yield', phase: '3rd Year' },
    'Pathology': { weight: 92, tag: '25 Qs • Para-Clinical Foundation', phase: '2nd Year' },
    'Pharmacology': { weight: 88, tag: '20 Qs • Para-Clinical High Yield', phase: '2nd Year' },
    'Pediatrics': { weight: 82, tag: '15 Qs • High Yield Clinical', phase: 'Final MBBS' },
    'Paediatrics': { weight: 82, tag: '15 Qs • High Yield Clinical', phase: 'Final MBBS' },
    'Microbiology': { weight: 78, tag: '15 Qs • Para-Clinical', phase: '2nd Year' },
    'Biochemistry': { weight: 72, tag: '12 Qs • Pre-Clinical Core', phase: '1st Year' },
    'Anatomy': { weight: 70, tag: '12 Qs • Pre-Clinical Core', phase: '1st Year' },
    'Physiology': { weight: 70, tag: '12 Qs • Pre-Clinical Core', phase: '1st Year' },
    'ENT': { weight: 68, tag: '10 Qs • Clinical Phase 1', phase: '3rd Year' },
    'Ophthalmology': { weight: 68, tag: '10 Qs • Clinical Phase 1', phase: '3rd Year' },
    'Forensic Medicine (FMT)': { weight: 62, tag: '10 Qs • Para-Clinical', phase: '2nd Year' },
    'Forensic Medicine': { weight: 62, tag: '10 Qs • Para-Clinical', phase: '2nd Year' },
    'Orthopedics': { weight: 58, tag: '8 Qs • Minor Clinical', phase: 'Final MBBS' },
    'Dermatology': { weight: 55, tag: '6 Qs • Minor Clinical', phase: 'Final MBBS' },
    'Psychiatry': { weight: 55, tag: '6 Qs • Minor Clinical', phase: 'Final MBBS' },
    'Radiology': { weight: 55, tag: '6 Qs • Minor Clinical', phase: 'Final MBBS' },
    'Anaesthesia': { weight: 55, tag: '6 Qs • Minor Clinical', phase: 'Final MBBS' },
  },

  'USMLE Step 1': {
    'General Pathology & Pharmacology': { weight: 100, tag: 'High Yield ~45% Integration', phase: '2nd Year' },
    'Cardiovascular System': { weight: 95, tag: 'High Yield Organ System', phase: 'General' },
    'Gastrointestinal System': { weight: 92, tag: 'High Yield Organ System', phase: 'General' },
    'Microbiology & Immunology': { weight: 90, tag: 'Core Microbiology ~15%', phase: '2nd Year' },
    'Biochemistry & Medical Genetics': { weight: 88, tag: 'Molecular & Metabolic Core', phase: '1st Year' },
    'Renal & Urinary System': { weight: 85, tag: 'Organ System High Yield', phase: 'General' },
    'Neurology & Special Senses': { weight: 85, tag: 'Neuroscience Core', phase: 'General' },
    'Endocrine System': { weight: 82, tag: 'Endocrine Pathology & Pharma', phase: 'General' },
    'Respiratory System': { weight: 82, tag: 'Pulmonary Mechanics & Path', phase: 'General' },
    'Reproductive System': { weight: 80, tag: 'Reproductive Endocrinology', phase: 'General' },
    'Behavioral Health & Ethics': { weight: 75, tag: 'Biostatistics & Ethics ~10%', phase: 'General' },
  },

  'USMLE Step 2 CK': {
    'Internal Medicine': { weight: 100, tag: '~35-40% Step 2 Weightage', phase: 'Final MBBS' },
    'Surgery': { weight: 95, tag: '~25-30% Step 2 Weightage', phase: 'Final MBBS' },
    'Pediatrics': { weight: 88, tag: '~15-20% Step 2 Weightage', phase: 'Final MBBS' },
    'Obstetrics & Gynecology': { weight: 85, tag: '~10-15% Step 2 Weightage', phase: 'Final MBBS' },
    'Psychiatry & Behavioral Health': { weight: 80, tag: '~10-15% Step 2 Weightage', phase: 'Final MBBS' },
    'Emergency Medicine & Preventive Care': { weight: 75, tag: 'Acute Resuscitation & Safety', phase: 'Final MBBS' },
  }
};

// Fallback lookup for NEET PG equivalents (covers INI-CET, FMGE, NExT, MBBS)
export function getSubjectWeightageInfo(subjectName: string, targetExam: string): SubjectWeightage {
  const normalizedExam = Object.keys(EXAM_WEIGHTAGES).find(key => 
    targetExam.toLowerCase().includes(key.toLowerCase())
  ) || 'NEET PG';

  const dict = EXAM_WEIGHTAGES[normalizedExam] || EXAM_WEIGHTAGES['NEET PG'];

  // Match exact or substring
  const key = Object.keys(dict).find(k => k.toLowerCase() === subjectName.toLowerCase() || subjectName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(subjectName.toLowerCase()));

  if (key && dict[key]) {
    return dict[key];
  }

  return { weight: REC_WEIGHTS.DEFAULT_SUBJECT_WEIGHT, tag: 'Core Curriculum Topic', phase: 'General' };
}

// Check if a subject aligns with student year
export function getYearMultiplier(subjectPhase: string, currentYear: string): number {
  if (!currentYear) return REC_MULTIPLIERS.YEAR_ALIGN_NEUTRAL;

  const yr = currentYear.toLowerCase();

  if (yr.includes('1st year') || yr.includes('first')) {
    if (subjectPhase === '1st Year') return REC_MULTIPLIERS.YEAR_ALIGN_EXACT_1ST_2ND;
    if (subjectPhase === '2nd Year') return REC_MULTIPLIERS.YEAR_ALIGN_VERY_LOW;
    return REC_MULTIPLIERS.YEAR_ALIGN_AVOID; // Avoid 3rd / Final year subjects for 1st year students unless requested
  }

  if (yr.includes('2nd year') || yr.includes('second')) {
    if (subjectPhase === '2nd Year') return REC_MULTIPLIERS.YEAR_ALIGN_EXACT_1ST_2ND;
    if (subjectPhase === '1st Year') return REC_MULTIPLIERS.YEAR_ALIGN_SLIGHT; // Good for revision
    return REC_MULTIPLIERS.YEAR_ALIGN_MINIMAL;
  }

  if (yr.includes('3rd year') || yr.includes('third')) {
    if (subjectPhase === '3rd Year') return REC_MULTIPLIERS.YEAR_ALIGN_EXACT_3RD;
    if (subjectPhase === '2nd Year') return REC_MULTIPLIERS.YEAR_ALIGN_MODERATE;
    if (subjectPhase === '1st Year') return REC_MULTIPLIERS.YEAR_ALIGN_NEUTRAL;
    return REC_MULTIPLIERS.YEAR_ALIGN_LOW;
  }

  if (yr.includes('final') || yr.includes('intern') || yr.includes('resident') || yr.includes('postgraduate')) {
    if (subjectPhase === 'Final MBBS') return REC_MULTIPLIERS.YEAR_ALIGN_EXACT_FINAL;
    if (subjectPhase === '3rd Year' || subjectPhase === '2nd Year') return REC_MULTIPLIERS.YEAR_ALIGN_GOOD;
    return REC_MULTIPLIERS.YEAR_ALIGN_MODERATE;
  }

  return REC_MULTIPLIERS.YEAR_ALIGN_NEUTRAL;
}

export function computeIntelligentRecommendation(
  subjects: Subject[],
  systems: StudySystem[],
  currentYear: string = 'Final MBBS',
  targetExam: string = 'NEET PG',
  topicProgresses: TopicProgress[] = [],
  curriculumSets: any[] = []
): RecommendationResult {
  if (systems.length === 0) {
    return {
      subjectName: 'Medicine',
      systemName: 'Gastroenterology',
      reasons: [
        '• #1 High-Yield Core Topic (~35 Qs in NEET PG / INI-CET)',
        '• Essential foundation for your study target',
        '• Recommended starting point for Atlas calibration'
      ],
      score: 100
    };
  }

  let bestSystem: StudySystem | null = null;
  let bestSubject: Subject | null = null;
  let bestTopicOrSetName: string | null = null;
  let bestScore = -1;
  let bestReasons: string[] = [];

  for (const sys of systems) {
    const sub = subjects.find(s => s.id === sys.subjectId);
    const subName = sub?.name || 'General Topic';
    const weightage = getSubjectWeightageInfo(subName, targetExam);
    const yearMult = getYearMultiplier(weightage.phase, currentYear);

    const systemSets = curriculumSets.filter(s => s.systemId === sys.id);

        
    
    if (systemSets.length > 0) {
      for (const set of systemSets) {
        let score = weightage.weight * yearMult;
      
      // Smart Clinical Tags (System level)
      if (sys.tags && sys.tags.includes('#HighYield')) {
        score += 25;
        reasons.push('• Core Clinical Integration Hub (#HighYield)');
      }
      if (sys.tags && sys.tags.includes('#Volatile')) {
        score += 15;
        reasons.push('• Identified as #Volatile cluster');
      }
        
        // Smart Clinical Tags
        if (set.tags && set.tags.includes('#HighYield')) {
          score += 25;
          reasons.push('• Identified as #HighYield');
        }
        if (set.tags && set.tags.includes('#Volatile')) {
          score += 15;
          reasons.push('• Identified as #Volatile (requires spaced repetition)');
        }
        const reasons: string[] = [];

        if (yearMult > 2.0) {
          reasons.push(`• Essential ${currentYear} priority (${subName})`);
        } else {
          reasons.push(`• High yield for ${targetExam}: ${weightage.tag}`);
        }

        // Check if any topic in set is weak
        const weakTopics = set.topicIds.filter((tId: string) => {
          const tp = topicProgresses.find(p => p.topicId === tId);
          return tp && tp.isWeak;
        });

        if (weakTopics.length > 0) {
          score += REC_WEIGHTS.WEAK_CONFIDENCE_BONUS;
          reasons.push(`• Contains ${weakTopics.length} weak topics`);
        }

        if (false) {
          score += REC_WEIGHTS.PENDING_CONTENT_BONUS;
          reasons.push('• Pending core content completion');
        } else if (!set.qbankCompleted) {
          score += REC_WEIGHTS.PENDING_QBANK_BONUS;
          reasons.push('• Pending QBank practice');
        }

        if (true) {
          if (set.nextRevisionDate && new Date(set.nextRevisionDate) < new Date()) {
            score += REC_WEIGHTS.REVISION_DUE_BONUS;
            reasons.push('• Active revision due based on spaced repetition');
          } else {
            score += REC_WEIGHTS.MASTERED_PENALTY;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestSystem = sys;
          bestSubject = sub || null;
          bestTopicOrSetName = `Set: ${set.name}`;
          bestReasons = reasons.slice(0, 3);
        }
      }
    } else {
            // Fallback
      let score = weightage.weight * yearMult;
      const reasons: string[] = [];
      if (sys.isHighYield) {
        score += 150;
        reasons.unshift('🔥 Marked as High Yield');
      }
      if (yearMult > 2.0) {
        reasons.push(`• Essential ${currentYear} priority (${subName})`);
      }
      if (sys.status === 'Weak') {
        score += REC_WEIGHTS.WEAK_CONFIDENCE_BONUS;
        reasons.push('• Weak confidence tag');
      } else {
        score += REC_WEIGHTS.UNEXPLORED_TOPIC_BONUS;
        reasons.push('• Start building Study Blocks here');
      }

      if (score > bestScore) {
        bestScore = score;
        bestSystem = sys;
        bestSubject = sub || null;
        bestTopicOrSetName = null;
        bestReasons = reasons.slice(0, 3);
      }
    }
  }

  const sysName = bestTopicOrSetName ? bestTopicOrSetName : (bestSystem?.name || 'Gastroenterology');

  return {
    subjectName: bestSubject?.name || 'General Medicine',
    systemName: sysName,
    subjectId: bestSystem?.subjectId,
    systemId: bestSystem?.id,
    reasons: bestReasons,
    score: Math.round(bestScore)
  };
}
