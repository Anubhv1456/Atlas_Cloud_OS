import { ExamStrategy, StrategyFactory } from './strategy';
import { SubjectWeightage } from '@/lib/recommendation-engine';

export class USMLEStrategy implements ExamStrategy {
  getBaseWeightage(subjectName: string, systemName?: string): SubjectWeightage {
    const lower = subjectName.toLowerCase();
    const subSys = (systemName || '').toLowerCase();
    
    // 1. Heavy Hitter Organ Systems (10-14% of Step 1 exam pool each)
    if (lower.includes('cardio') || lower.includes('cvs')) {
      return { weight: 96, tag: 'High-Yield Organ System (10-14%)', phase: 'Clinical Organ Systems' };
    }
    if (lower.includes('nervous') || lower.includes('neuro') || lower.includes('special senses')) {
      return { weight: 95, tag: 'High-Yield Organ System (10-13%)', phase: 'Clinical Organ Systems' };
    }
    if (lower.includes('respiratory') || lower.includes('resp') || lower.includes('pulmonary')) {
      return { weight: 93, tag: 'High-Yield Organ System (9-11%)', phase: 'Clinical Organ Systems' };
    }
    if (lower.includes('gastro') || lower.includes('gi') || lower.includes('digestive')) {
      return { weight: 92, tag: 'High-Yield Organ System (9-11%)', phase: 'Clinical Organ Systems' };
    }
    if (lower.includes('renal') || lower.includes('urinary') || lower.includes('kidney')) {
      return { weight: 92, tag: 'High-Yield Organ System (8-10%)', phase: 'Clinical Organ Systems' };
    }
    if (lower.includes('hematolog') || lower.includes('heme') || lower.includes('lymphatic') || lower.includes('oncolog')) {
      return { weight: 90, tag: 'High-Yield Organ System (8-10%)', phase: 'Clinical Organ Systems' };
    }
    if (lower.includes('endocrine') || lower.includes('endo') || lower.includes('metabolic')) {
      return { weight: 88, tag: 'High-Yield Organ System (7-9%)', phase: 'Clinical Organ Systems' };
    }
    if (lower.includes('reproductive') || lower.includes('repro') || lower.includes('obstetrics') || lower.includes('gynecol')) {
      return { weight: 88, tag: 'High-Yield Organ System (7-9%)', phase: 'Clinical Organ Systems' };
    }
    if (lower.includes('musculoskeletal') || lower.includes('msk') || lower.includes('connective tissue') || lower.includes('skin')) {
      return { weight: 86, tag: 'High-Yield Organ System (7-9%)', phase: 'Clinical Organ Systems' };
    }
    if (lower.includes('behavioral') || lower.includes('psych') || lower.includes('mental health')) {
      return { weight: 85, tag: 'High-Yield Organ System (6-8%)', phase: 'Clinical Organ Systems' };
    }

    // 2. Foundational Interdisciplinary Sciences
    if (lower.includes('pathology') || lower.includes('general principles')) {
      return { weight: 94, tag: 'Core Foundational Science', phase: 'General' };
    }
    if (lower.includes('pharmacology')) {
      return { weight: 92, tag: 'Core Foundational Science', phase: 'General' };
    }
    if (lower.includes('microbiology') || lower.includes('immunology')) {
      return { weight: 90, tag: 'Core Foundational Science', phase: 'General' };
    }
    if (lower.includes('biochem') || lower.includes('genetics')) {
      return { weight: 87, tag: 'Step 1 Heavy Hitters', phase: 'General' };
    }
    
    // Sub-discipline booster if within an organ system
    if (subSys.includes('patholog') || subSys.includes('pharmacolog')) {
      return { weight: 88, tag: 'High-Yield Clinical Discipline', phase: 'Clinical Organ Systems' };
    }
    
    return { weight: 75, tag: 'Standard System Review', phase: 'General' };
  }

  getRationaleVocabulary(isHighYield: boolean, urgencyScore: number): string {
    if (urgencyScore > 85) return "Critical for UWorld Block & NBME Performance";
    if (urgencyScore > 70) return "High-Yield Organ System Integration";
    if (isHighYield) return "Essential Step 1 Core Mastery";
    return "Balanced System Review";
  }

  getDecayConstants() {
    return {
      rapidDecayFactor: 1.5, // USMLE details decay faster without spaced repetition
      consolidationBonus: 1.5 // Deep QBank integration provides massive memory hooks
    };
  }

  getUrgencyCurve(daysRemaining: number | null) {
    if (daysRemaining === null || daysRemaining > 180) return { acquisitionWeight: 0.6, consolidationWeight: 0.4 };
    if (daysRemaining < 45) return { acquisitionWeight: 0.05, consolidationWeight: 0.95 }; // Dedicated Period (UWorld + NBME)
    return { acquisitionWeight: 0.3, consolidationWeight: 0.7 };
  }
}

StrategyFactory.register('usmle', new USMLEStrategy());
