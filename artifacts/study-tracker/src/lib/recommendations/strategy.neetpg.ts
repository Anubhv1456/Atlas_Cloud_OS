import { ExamStrategy, StrategyFactory } from './strategy';
import { SubjectWeightage, EXAM_WEIGHTAGES } from '@/lib/recommendation-engine';

export class NeetPGStrategy implements ExamStrategy {
  getBaseWeightage(subjectName: string, systemName?: string): SubjectWeightage {
    const dict = EXAM_WEIGHTAGES['NEET PG'] || {};
    return dict[subjectName] || { weight: 50, tag: 'Standard Yield', phase: 'General' };
  }

  getRationaleVocabulary(isHighYield: boolean, urgencyScore: number): string {
    if (urgencyScore > 80) return "Crucial gap for upcoming NEET PG mock exams";
    if (isHighYield) return "High-yield topic for Clinical Part 2";
    return "Foundation building for Para-Clinicals";
  }

  getDecayConstants() {
    return {
      rapidDecayFactor: 1.0, // Standard retention curve
      consolidationBonus: 1.2
    };
  }

  getUrgencyCurve(daysRemaining: number | null) {
    if (daysRemaining === null || daysRemaining > 120) return { acquisitionWeight: 0.7, consolidationWeight: 0.3 };
    if (daysRemaining < 30) return { acquisitionWeight: 0.1, consolidationWeight: 0.9 }; // Pure QBank phase
    return { acquisitionWeight: 0.4, consolidationWeight: 0.6 };
  }
}

StrategyFactory.register('neet pg', new NeetPGStrategy());
