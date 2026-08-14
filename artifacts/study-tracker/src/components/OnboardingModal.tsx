import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { loadUniversalOntology } from '@/lib/exam-presets';
import { useExamProfile } from '@/hooks/useExamProfile';
import { db } from '@/db';
import { useLocation } from 'wouter';
import { 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight, 
  ChevronLeft,
  Loader2, 
  Brain, 
  Check, 
  Flame, 
  Zap,
  ShieldCheck,
  CalendarDays,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { computeIntelligentRecommendation, RecommendationResult } from '@/lib/recommendation-engine';
import { toast } from 'sonner';

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const [step, setStep] = useState<number>(1);
  const [, setLocation] = useLocation();
  const { profile, updateProfile } = useExamProfile();
  const { markOnboarded } = useOnboardingStatus();

  // Step 2 state: Goal
  const [selectedGoal, setSelectedGoal] = useState<string>('MBBS Professional Exams');

  // Step 3 state: Curriculum loading progress
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importStatusText, setImportStatusText] = useState<string>('Initializing Curriculum...');

  // Step 4 state: Personalization
  const [examDate, setExamDate] = useState<string>('');
  const [currentYear, setCurrentYear] = useState<string>('Final MBBS');
  const [startedStudying, setStartedStudying] = useState<'yes' | 'fresh'>('yes');

  // Step 6 state: Computing animation step
  const [computingStep, setComputingStep] = useState<number>(0);

  // Recommendation target system
  const [recommendedSystem, setRecommendedSystem] = useState<RecommendationResult>({
    subjectName: 'General Medicine',
    systemName: 'Cardiology & Vascular',
    reasons: [
      'High-yield clinical foundation for medical licensing',
      'Recommended starting point for medical curriculum calibration',
      'Optimizes active recall and core question bank mastery'
    ],
    score: 100
  });

  // Track timers for safe cleanup on unmount
  const timerRefs = useRef<NodeJS.Timeout[]>([]);

  const clearTimers = () => {
    timerRefs.current.forEach(t => clearTimeout(t));
    timerRefs.current = [];
  };

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  // Synchronize initial defaults from existing profile
  useEffect(() => {
    if (profile.targetExam) {
      setSelectedGoal(profile.targetExam);
    }
    if (profile.targetExamDate) {
      setExamDate(profile.targetExamDate);
    }
    if (profile.currentYear) {
      setCurrentYear(profile.currentYear);
    }
    if (profile.startedStudying) {
      setStartedStudying(profile.startedStudying);
    }
  }, [profile]);

  // Goal options
  const GOAL_OPTIONS = [
    { id: 'MBBS Professional Exams', label: 'MBBS Professional Exams', badge: 'Standard India' },
    { id: 'NEET PG', label: 'NEET PG', badge: 'Indian Board' },
    { id: 'INI-CET', label: 'INI-CET', badge: 'AIIMS / Premier' },
    { id: 'FMGE', label: 'FMGE / Screening', badge: 'Licensing' },
    { id: 'NExT', label: 'NExT (Upcoming)', badge: 'Unified Exam' },
    { id: 'USMLE Step 1', label: 'USMLE Step 1 / Step 2', badge: 'US Licensing' },
    { id: 'Custom', label: 'Custom / General Medical', badge: 'Flexible' },
  ];

  const YEAR_OPTIONS = [
    '1st Year MBBS',
    '2nd Year MBBS',
    '3rd Year MBBS',
    'Final MBBS',
    'Intern',
    'Postgraduate Resident',
    'Other'
  ];

  // Quick date presets
  const applyDatePreset = (monthsAhead: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsAhead);
    setExamDate(d.toISOString().split('T')[0]);
  };

  // Step transitions
  const handleNextFromGoal = async () => {
    try {
      const count = await db.subjects.count();
      if (count > 0) {
        // Fast forward: curriculum already configured
        setStep(4);
        return;
      }

      setStep(3);
      setImportProgress(15);
      setImportStatusText('Preparing Universal Medical Curriculum...');

      await loadUniversalOntology({
        onProgress: (pct, msg) => {
          setImportProgress(pct);
          setImportStatusText(msg);
        }
      });

      setStep(4);
    } catch (err) {
      console.error('Error during ontology setup:', err);
      // Advance to personalization even on network fallback
      setStep(4);
    }
  };

  const handleNextFromPersonalization = () => {
    updateProfile({
      targetExam: selectedGoal,
      targetExamDate: examDate,
      curriculum: 'Universal Ontology',
      currentYear: currentYear,
      startedStudying: startedStudying
    });
    setStep(5);
  };

  const computeRecommendationSafe = async (): Promise<RecommendationResult> => {
    try {
      const allSubs = await db.subjects.toArray();
      const allSys = await db.systems.toArray();
      const topicProgresses = await db.topicProgress.toArray();
      const curriculumSets = await (db.curriculumSets || db.revisionSets).toArray();

      if (allSubs.length > 0 && allSys.length > 0) {
        const result = computeIntelligentRecommendation(
          allSubs,
          allSys,
          currentYear,
          selectedGoal,
          topicProgresses,
          curriculumSets
        );

        if (result && result.subjectName && result.systemName) {
          return result;
        }
      }
    } catch (err) {
      console.warn('Direct recommendation calculation fallback engaged:', err);
    }

    // Deterministic safe fallback
    return {
      subjectName: selectedGoal.includes('USMLE') ? 'General Pathology' : 'General Medicine',
      systemName: selectedGoal.includes('USMLE') ? 'Cardiovascular System' : 'Cardiology & Vascular',
      reasons: [
        'Highest yield core organ system for medical licensing',
        'Calibrated foundation for upcoming spaced repetition cycles',
        'Immediate high-priority active recall target'
      ],
      score: 100
    };
  };

  const handleStartComputing = () => {
    clearTimers();
    setStep(6);
    setComputingStep(0);

    // Compute recommendation asynchronously in background immediately
    const recPromise = computeRecommendationSafe().then(rec => {
      setRecommendedSystem(rec);
      return rec;
    });

    const t1 = setTimeout(() => setComputingStep(1), 600);
    const t2 = setTimeout(() => setComputingStep(2), 1200);
    const t3 = setTimeout(() => setComputingStep(3), 1800);
    const t4 = setTimeout(async () => {
      await recPromise;
      setStep(7);
    }, 2400);

    timerRefs.current = [t1, t2, t3, t4];
  };

  const handleStartStudying = async () => {
    await markOnboarded();
    onOpenChange(false);
    toast.success('Atlas Calibrated', {
      description: 'Your intelligent study plan is active.'
    });

    if (recommendedSystem?.subjectId) {
      if (recommendedSystem.systemId) {
        setLocation(`/subjects/${recommendedSystem.subjectId}?highlight=${recommendedSystem.systemId}`);
      } else {
        setLocation(`/subjects/${recommendedSystem.subjectId}`);
      }
    } else {
      setLocation('/');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] rounded-3xl p-0 gap-0 overflow-hidden border-border/80 shadow-2xl bg-card">
        <div className="p-6 md:p-8 relative overflow-hidden min-h-[480px] flex flex-col justify-between">
          {/* Subtle Ambient Background Glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

          {/* Top Header / Progress Indicator */}
          {step > 1 && step < 6 && (
            <div className="flex items-center justify-between mb-5 border-b border-border/40 pb-3 z-10">
              <div className="flex items-center gap-2">
                <img src="/emblem.svg" alt="Atlas" className="w-5 h-5 rounded-md object-contain" />
                <span className="text-xs font-bold text-foreground tracking-tight">Onboarding Calibration</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      step === s ? "w-6 bg-primary" : step > s ? "w-2 bg-primary/40" : "w-2 bg-muted/80"
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 1: WELCOME ────────────────────────────────────────────── */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col items-center justify-center text-center my-auto space-y-6 z-10 py-4"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-md overflow-hidden">
                  <img src="/emblem.svg" alt="Atlas Logo" className="w-16 h-16 rounded-2xl object-contain" />
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 bg-primary text-primary-foreground rounded-full shadow-sm">
                  <Zap className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-2 max-w-sm">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[11px] font-bold px-3 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Medical Study Operating System
                </Badge>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                  Welcome to Atlas.
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Answers one critical question with mathematical precision: <br />
                  <span className="font-semibold text-foreground">"What should I study next?"</span>
                </p>
              </div>

              <Button
                onClick={() => setStep(2)}
                size="lg"
                className="w-full max-w-xs rounded-2xl text-sm font-semibold h-12 shadow-md gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                Begin Calibration
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* ── STEP 2: CHOOSE YOUR GOAL ────────────────────────────────────── */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-between space-y-4 z-10"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Step 1 of 3</span>
                <h2 className="text-xl font-bold text-foreground">What are you preparing for?</h2>
                <p className="text-xs text-muted-foreground">Select your primary examination goal to tailor your presets and revision schedule.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                {GOAL_OPTIONS.map((goal) => {
                  const isSelected = selectedGoal === goal.id;
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => setSelectedGoal(goal.id)}
                      className={cn(
                        "p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer relative",
                        isSelected
                          ? "bg-primary/10 border-primary shadow-xs"
                          : "bg-background border-border/60 hover:border-border hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{goal.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">{goal.badge}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <Button
                  onClick={handleNextFromGoal}
                  className="rounded-xl text-xs font-semibold h-10 px-5 gap-1.5 cursor-pointer"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: INITIALIZING ONTOLOGY ───────────────────────────────── */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col items-center justify-center space-y-6 z-10 py-6 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div className="space-y-2 max-w-xs">
                <h3 className="text-base font-bold text-foreground">Setting Up Curriculum</h3>
                <p className="text-xs text-muted-foreground">{importStatusText}</p>
                <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden mt-3">
                  <div 
                    className="bg-primary h-full transition-all duration-300 rounded-full" 
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: OPTIONAL PERSONALIZATION ────────────────────────────── */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-between space-y-4 z-10"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Step 2 of 3</span>
                <h2 className="text-xl font-bold text-foreground">Personalize Your Pacing</h2>
                <p className="text-xs text-muted-foreground">Help Atlas tailor recommendations to your exact timeline.</p>
              </div>

              <div className="space-y-3.5 max-h-[270px] overflow-y-auto pr-1">
                {/* Expected Exam Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Expected Exam Date</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                    {[
                      { label: '3 Months', m: 3 },
                      { label: '6 Months', m: 6 },
                      { label: '1 Year', m: 12 },
                      { label: '2 Years', m: 24 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => applyDatePreset(btn.m)}
                        className="text-[10px] font-medium py-1.5 rounded-xl border border-border/60 hover:bg-muted/60 transition-colors text-foreground cursor-pointer"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full bg-background border border-border/80 rounded-xl text-xs h-9 px-3 text-foreground"
                  />
                </div>

                {/* Current Year / Level */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Current Level / Year</label>
                  <select
                    value={currentYear}
                    onChange={(e) => setCurrentYear(e.target.value)}
                    className="w-full bg-background border border-border/80 rounded-xl text-xs h-9 px-3 text-foreground"
                  >
                    {YEAR_OPTIONS.map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>

                {/* Have you started studying? */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Current Study Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStartedStudying('yes')}
                      className={cn(
                        "p-2.5 rounded-xl border text-xs font-semibold transition-all text-center cursor-pointer",
                        startedStudying === 'yes'
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-background border-border/60 text-muted-foreground"
                      )}
                    >
                      Existing Progress
                    </button>
                    <button
                      type="button"
                      onClick={() => setStartedStudying('fresh')}
                      className={cn(
                        "p-2.5 rounded-xl border text-xs font-semibold transition-all text-center cursor-pointer",
                        startedStudying === 'fresh'
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-background border-border/60 text-muted-foreground"
                      )}
                    >
                      Starting Fresh
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <Button
                  variant="ghost"
                  onClick={() => setStep(2)}
                  className="rounded-xl text-xs font-medium h-9 px-3 cursor-pointer gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </Button>

                <Button
                  onClick={handleNextFromPersonalization}
                  className="rounded-xl text-xs font-semibold h-10 px-5 gap-1.5 cursor-pointer"
                >
                  Continue to Principles
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 5: QUICK TOUR (SKIP AVAILABLE) ─────────────────────────── */}
          {step === 5 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-between space-y-4 z-10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Step 3 of 3</span>
                  <h2 className="text-xl font-bold text-foreground">How Atlas Guides You</h2>
                  <p className="text-xs text-muted-foreground">Four algorithmic pillars drive every study decision.</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartComputing}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Skip
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 my-2">
                <div className="p-3 bg-muted/30 border border-border/60 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Intelligent Direction
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Curriculum weightage dynamically guides daily priorities.
                  </p>
                </div>

                <div className="p-3 bg-muted/30 border border-border/60 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                    Active Recall
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Prioritizes active retrieval practice over passive reading.
                  </p>
                </div>

                <div className="p-3 bg-muted/30 border border-border/60 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
                    Spaced Repetition
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Schedules memory callbacks before knowledge decay occurs.
                  </p>
                </div>

                <div className="p-3 bg-muted/30 border border-border/60 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                    Continuous Calibration
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Real-time adaptation to test scores and weak areas.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <Button
                  variant="ghost"
                  onClick={() => setStep(4)}
                  className="rounded-xl text-xs font-medium h-9 px-3 cursor-pointer gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </Button>

                <Button
                  onClick={handleStartComputing}
                  className="rounded-2xl text-xs font-semibold h-10 px-5 shadow-sm gap-2 cursor-pointer"
                >
                  Calibrate & Generate
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 6: COMPUTING ANIMATION ─────────────────────────────────── */}
          {step === 6 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center my-auto space-y-6 z-10 py-6"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center animate-pulse">
                  <Brain className="w-10 h-10 text-primary" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-primary/40 border-t-transparent animate-spin" />
              </div>

              <div className="space-y-1.5 max-w-sm">
                <h2 className="text-xl font-bold text-foreground">Calibrating Atlas OS</h2>
                <p className="text-xs text-muted-foreground">
                  Building your personalized medical study trajectory...
                </p>
              </div>

              <div className="w-full max-w-xs space-y-2 text-left bg-muted/40 border border-border/50 rounded-2xl p-4">
                {[
                  'Analyzing curriculum structure...',
                  'Calibrating spaced repetition intervals...',
                  'Prioritizing high-yield topics...',
                  'Finalizing recommendation matrix...'
                ].map((msg, idx) => (
                  <div
                    key={msg}
                    className={cn(
                      "flex items-center gap-2 text-xs transition-all duration-300",
                      computingStep >= idx ? "text-foreground font-medium" : "text-muted-foreground/40"
                    )}
                  >
                    {computingStep > idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : computingStep === idx ? (
                      <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
                    )}
                    <span>{msg}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP 7: FIRST RECOMMENDATION ("AHA!" MOMENT) ────────────────── */}
          {step === 7 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col justify-between space-y-4 z-10"
            >
              <div className="text-center space-y-1">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold px-3 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 mr-1 text-emerald-500" />
                  Calibration Complete
                </Badge>
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                  What to Study Next
                </h2>
              </div>

              {/* Recommendation Card */}
              <div className="bg-card border-2 border-primary/40 rounded-3xl p-5 shadow-lg space-y-3.5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 bg-primary/10 rounded-bl-2xl border-l border-b border-primary/20 text-primary">
                  <Flame className="w-5 h-5 text-amber-500" />
                </div>

                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
                    {recommendedSystem.subjectName}
                  </span>
                  <h3 className="text-xl font-extrabold text-foreground">
                    {recommendedSystem.systemName}
                  </h3>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Why Atlas Chose This
                  </span>
                  <ul className="space-y-1">
                    {recommendedSystem.reasons && recommendedSystem.reasons.length > 0 ? (
                      recommendedSystem.reasons.map((r, i) => (
                        <li key={i} className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{r.replace(/^[•\s]+/, '')}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>High-yield medical curriculum priority</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Micro-copy explanation */}
              <p className="text-center text-xs text-muted-foreground italic px-2">
                "Atlas is now calibrated. Recommendations sharpen continuously as you log study units and active recall tests."
              </p>

              <Button
                onClick={handleStartStudying}
                size="lg"
                className="w-full rounded-2xl text-sm font-bold h-12 shadow-md gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                Start Studying
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
