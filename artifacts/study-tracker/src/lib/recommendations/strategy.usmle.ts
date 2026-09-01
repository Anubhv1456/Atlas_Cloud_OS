import { ExamStrategy, StrategyFactory } from './strategy';
import { SubjectWeightage } from '@/lib/recommendation-engine';

export class USMLEStrategy implements ExamStrategy {
  getBaseWeightage(subjectName: string, systemName?: string): SubjectWeightage {
    const lower = subjectName.toLowerCase();
    
    // USMLE specific heavy-hitters
    if (lower.includes('cardio') || lower.includes('resp') || lower.includes('neuro') || lower.includes('renal')) {
      return { weight: 95, tag: 'High-Yield System Integration', phase: 'General' };
    }
    if (lower.includes('pathology') || lower.includes('pharmacology') || lower.includes('microbiology')) {
      return { weight: 90, tag: 'Core Foundational Science', phase: 'General' };
    }
    if (lower.includes('biochem') || lower.includes('immuno')) {
      return { weight: 85, tag: 'Step 1 Heavy Hitters', phase: 'General' };
    }
    
    return { weight: 60, tag: 'Standard System Review', phase: 'General' };
  }

  getRationaleVocabulary(isHighYield: boolean, urgencyScore: number): string {
    if (urgencyScore > 80) return "Critical for UWorld Block Performance";
    if (isHighYield) return "High-Yield for Step 1 Integration";
    return "Essential System Consolidation";
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
