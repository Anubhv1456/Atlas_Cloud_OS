import { ExamStrategy, StrategyFactory } from './strategy';
import { SubjectWeightage } from '@/lib/recommendation-engine';

export class GeneralStrategy implements ExamStrategy {
  getBaseWeightage(subjectName: string, systemName?: string): SubjectWeightage {
    const lower = subjectName.toLowerCase();
    
    if (lower.includes('medicine') || lower.includes('surgery')) {
      return { weight: 90, tag: 'Major Clinical Rotation', phase: 'General' };
    }
    if (lower.includes('pediatrics') || lower.includes('obstetrics') || lower.includes('gynecology')) {
      return { weight: 85, tag: 'Core Clinical Specialty', phase: 'General' };
    }
    
    return { weight: 70, tag: 'Medical Science Review', phase: 'General' };
  }

  getRationaleVocabulary(isHighYield: boolean, urgencyScore: number): string {
    if (urgencyScore > 80) return "High priority for upcoming clinicals/boards";
    if (isHighYield) return "Core Medical Competency";
    return "Foundational Knowledge Review";
  }

  getDecayConstants() {
    return {
      rapidDecayFactor: 1.0,
      consolidationBonus: 1.0
    };
  }

  getUrgencyCurve(daysRemaining: number | null) {
    if (daysRemaining === null || daysRemaining > 90) return { acquisitionWeight: 0.5, consolidationWeight: 0.5 };
    if (daysRemaining < 30) return { acquisitionWeight: 0.2, consolidationWeight: 0.8 };
    return { acquisitionWeight: 0.4, consolidationWeight: 0.6 };
  }
}

StrategyFactory.register('general', new GeneralStrategy());
StrategyFactory.register('custom', new GeneralStrategy());
