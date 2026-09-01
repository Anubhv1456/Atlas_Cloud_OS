import { SubjectWeightage } from '@/lib/recommendation-engine';

export interface RationaleContext {
  primary: string;
  metricDriven: string;
  temporal: string;
}

export interface ExamStrategy {
  // Returns base yield multiplier (0-100) for a given subject/system
  getBaseWeightage(subjectName: string, systemName?: string): SubjectWeightage;
  
  // Gets exam-specific terminology for rationale explanations
  getRationaleVocabulary(isHighYield: boolean, urgencyScore: number): string;
  
  // Math constant for spaced repetition half-life decay scaling
  getDecayConstants(): {
    rapidDecayFactor: number;
    consolidationBonus: number;
  };
  
  // Curve mapping days-remaining to focus intensity
  getUrgencyCurve(daysRemaining: number | null): {
    acquisitionWeight: number; // For reading/watching lectures
    consolidationWeight: number; // For qbanks/mock exams
  };
}

export class StrategyFactory {
  private static strategies = new Map<string, ExamStrategy>();

  static register(examName: string, strategy: ExamStrategy) {
    this.strategies.set(examName.toLowerCase(), strategy);
  }

  static get(examName: string | undefined): ExamStrategy {
    if (!examName) return this.strategies.get('neet pg')!;
    const lower = examName.toLowerCase();
    
    if (lower.includes('usmle')) return this.strategies.get('usmle')!;
    if (lower.includes('custom') || lower.includes('general')) return this.strategies.get('general')!;
    
    // Default fallback
    return this.strategies.get('neet pg') || this.strategies.values().next().value;
  }
}
