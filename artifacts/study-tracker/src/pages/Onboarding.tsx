import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { 
  Sparkles, BookOpen, CheckCircle2, ArrowRight, ChevronRight, ChevronLeft,
  Loader2, Brain, Check, Flame, Zap, Calendar, Target, ShieldCheck, LogOut
} from 'lucide-react';
import { useExamProfile } from '@/hooks/useExamProfile';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { useAuth } from '@/hooks/useAuth';
import { AtlasEmblem } from '@/components/AtlasEmblem';
import { loadUniversalOntology } from '@/lib/exam-presets';
import { computeIntelligentRecommendation, RecommendationResult } from '@/lib/recommendation-engine';
import { db } from '@/db';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Onboarding() {
  const [step, setStep] = useState<number>(1);
  const [, setLocation] = useLocation();
  const { profile, updateProfile } = useExamProfile();
  const { markOnboarded } = useOnboardingStatus();
  const { hasAccess } = useBetaAccess();
  const { user, logout } = useAuth();

  // Step 2: Goal
  const [selectedGoal, setSelectedGoal] = useState<string>(profile.targetExam || 'NEET PG');

  // Step 3: Curriculum loading progress
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importStatusText, setImportStatusText] = useState<string>('Initializing Curriculum...');

  // Step 4: Personalization
  const [examDate, setExamDate] = useState<string>(profile.targetExamDate || '');
  const [currentYear, setCurrentYear] = useState<string>(profile.currentYear || 'Final MBBS');
  const [startedStudying, setStartedStudying] = useState<'yes' | 'fresh'>(profile.startedStudying || 'yes');
  const [dailyGoal, setDailyGoal] = useState<number>(profile.dailyQuestionGoal || 40);

  // Step 6: Computing animation
  const [computingStep, setComputingStep] = useState<number>(0);

  // Step 7: Recommendation
  const [recommendedSystem, setRecommendedSystem] = useState<RecommendationResult>({
    subjectName: 'General Medicine',
    systemName: 'Cardiology & Vascular',
    reasons: [
      'High-yield clinical foundation for medical licensing',
      'Calibrated starting point for active recall question banks',
      'Optimizes early memory retention intervals'
    ],
    score: 100
  });

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

  // Sync profile if already partially filled
  useEffect(() => {
    if (profile.targetExam) setSelectedGoal(profile.targetExam);
    if (profile.targetExamDate) setExamDate(profile.targetExamDate);
    if (profile.currentYear) setCurrentYear(profile.currentYear);
    if (profile.dailyQuestionGoal) setDailyGoal(profile.dailyQuestionGoal);
    if (profile.startedStudying) setStartedStudying(profile.startedStudying);
  }, [profile]);

  const GOAL_OPTIONS = [
    { id: 'NEET PG', label: 'NEET PG', badge: 'Indian Board', desc: '19 Clinical & Pre-Clinical Subjects' },
    { id: 'INI-CET', label: 'INI-CET', badge: 'AIIMS / Premier', desc: 'High-Yield Clinical Scenario Focus' },
    { id: 'USMLE Step 1', label: 'USMLE Step 1', badge: 'US Licensing', desc: 'Organ Systems & Foundational Sciences' },
    { id: 'USMLE Step 2', label: 'USMLE Step 2 CK', badge: 'US Clerkships', desc: 'Clinical Diagnostics & Management' },
    { id: 'MBBS Professional Exams', label: 'MBBS Professional Exams', badge: 'University Profs', desc: 'Year-by-Year Academic Curriculum' },
    { id: 'FMGE', label: 'FMGE / Screening', badge: 'Licensing', desc: 'NBE Medical Screening Examination' },
    { id: 'NExT', label: 'NExT (Upcoming)', badge: 'Unified Exam', desc: 'Clinical Problem Solving Framework' },
    { id: 'Custom', label: 'General Medical Review', badge: 'Flexible', desc: 'Tailored Question Bank Tracking' },
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

  const applyDatePreset = (monthsAhead: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsAhead);
    setExamDate(d.toISOString().split('T')[0]);
  };

  const handleDismiss = async () => {
    clearTimers();
    updateProfile({
      targetExam: selectedGoal || 'NEET PG',
      targetExamDate: examDate || '',
      curriculum: 'Universal Ontology',
      currentYear: currentYear || 'Final MBBS',
      dailyQuestionGoal: dailyGoal || 40,
      startedStudying: startedStudying || 'yes'
    });

    loadUniversalOntology({ targetExam: selectedGoal || 'NEET PG', force: true }).catch(() => {});
    await markOnboarded();

    setLocation('/');
  };

  const handleNextFromGoal = async () => {
    try {
      const count = await db.subjects.count();
      if (count > 0) {
        setStep(4);
        return;
      }

      setStep(3);
      setImportProgress(15);
      setImportStatusText('Preparing Universal Medical Curriculum...');

      await loadUniversalOntology({
        targetExam: selectedGoal,
        force: true,
        onProgress: (pct, msg) => {
          setImportProgress(pct);
          setImportStatusText(msg);
        }
      });

      setStep(4);
    } catch (err) {
      console.error('Error during ontology setup:', err);
      setStep(4);
    }
  };

  const handleNextFromPersonalization = () => {
    updateProfile({
      targetExam: selectedGoal,
      targetExamDate: examDate,
      curriculum: 'Universal Ontology',
      currentYear: currentYear,
      dailyQuestionGoal: dailyGoal,
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

    const recPromise = computeRecommendationSafe().then(rec => {
      setRecommendedSystem(rec);
      return rec;
    });

    const t1 = setTimeout(() => setComputingStep(1), 500);
    const t2 = setTimeout(() => setComputingStep(2), 1000);
    const t3 = setTimeout(() => setComputingStep(3), 1500);
    const t4 = setTimeout(async () => {
      await recPromise;
      setStep(7);
    }, 2000);

    timerRefs.current = [t1, t2, t3, t4];
  };

  const handleFinishOnboarding = async () => {
    updateProfile({
      targetExam: selectedGoal,
      targetExamDate: examDate,
      curriculum: 'Universal Ontology',
      currentYear: currentYear,
      dailyQuestionGoal: dailyGoal,
      startedStudying: startedStudying
    });

    await markOnboarded();
    toast.success('Calibration Saved', {
      description: 'Your medical study trajectory has been initialized.'
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

  const handleSignOut = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (e) {
      console.error(e);
      toast.error('Failed to sign out');
    }
  };

  // Calculate days to exam for live preview
  const daysUntilExam = React.useMemo(() => {
    if (!examDate) return null;
    const target = new Date(examDate);
    if (isNaN(target.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  }, [examDate]);

  return (
    <div className="min-h-[100dvh] bg-[#030303] text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans selection:bg-teal-500/30">
      
      {/* Background Teal Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-teal-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header Controls */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-6 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-center backdrop-blur-md">
            <AtlasEmblem className="w-4 h-4 text-teal-400" />
          </div>
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-300">Atlas OS</span>
          <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">• Calibration Engine</span>
        </div>

        <div className="flex items-center gap-2">
          {step > 1 && step < 6 && (
            <button
              onClick={handleDismiss}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2.5 py-1 rounded-lg hover:bg-white/5 cursor-pointer"
            >
              Skip to Trial
            </button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-white/10 cursor-pointer">
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#0a0a0a] border-white/10 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out?</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400">
                  You will return to the welcome screen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-white/10 bg-transparent hover:bg-white/5 hover:text-white text-zinc-300">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleSignOut}
                  className="bg-zinc-800 text-white hover:bg-zinc-700"
                >
                  Sign out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 w-full max-w-2xl"
      >
        <div className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-[28px] p-6 sm:p-10 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col justify-between min-h-[460px]">
          
          {/* Subtle Ambient Inner Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-sm h-32 bg-teal-500/10 blur-[60px] pointer-events-none" />

          {/* Stepper Progress Bar */}
          {step > 1 && step < 6 && (
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5 relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-300">Calibration Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[2, 4, 5].map((s, idx) => (
                  <div
                    key={s}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      step === s ? "w-6 bg-teal-400" : step > s ? "w-2 bg-teal-500/40" : "w-2 bg-zinc-800"
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 1: WELCOME & VALUE PROP ────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col items-center justify-center text-center my-auto space-y-6 relative z-10 py-2"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-teal-950/30 border border-teal-500/30 flex items-center justify-center shadow-lg">
                  <AtlasEmblem className="w-10 h-10 text-teal-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 bg-teal-400 text-black rounded-full shadow-md">
                  <Zap className="w-3.5 h-3.5 fill-black" />
                </div>
              </div>

              <div className="space-y-3 max-w-md">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950/40 border border-teal-500/30 text-teal-300 text-xs font-semibold">
                  <Sparkles className="w-3 h-3 text-teal-400" />
                  <span>Medical Study Operating System</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100">
                  Calibrate Your Study Roadmap
                </h1>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Atlas solves one critical question with mathematical precision:
                  <br />
                  <span className="font-semibold text-zinc-200">"What should I study next?"</span>
                </p>
                <p className="text-xs text-zinc-500">
                  Take 30 seconds to calibrate your target exam and timeline before activating your trial pass.
                </p>
              </div>

              {/* Highlights */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left pt-2">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-teal-400" />
                    <span>Goal Tailored</span>
                  </div>
                  <div className="text-[11px] text-zinc-500">NEET PG, USMLE, INI-CET, or MBBS profs.</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-400" />
                    <span>Dynamic Pacing</span>
                  </div>
                  <div className="text-[11px] text-zinc-500">Daily question volume matched to exam countdown.</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-teal-400" />
                    <span>FSRS Engine</span>
                  </div>
                  <div className="text-[11px] text-zinc-500">Memory retention scheduled before decay occurs.</div>
                </div>
              </div>

              <div className="w-full max-w-sm space-y-2.5 pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="w-full h-12 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_24px_rgba(20,184,166,0.3)] cursor-pointer"
                >
                  <span>Begin 30-Second Calibration</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDismiss}
                  className="w-full h-9 rounded-xl bg-transparent hover:bg-white/5 text-zinc-400 hover:text-zinc-200 font-medium text-xs transition-colors cursor-pointer"
                >
                  Skip for now with standard defaults
                </button>
              </div>

              <p className="text-[11px] text-zinc-600 text-center">
                ⚖️ Strictly for medical exam revision and preparation. Not for clinical patient care.
              </p>
            </motion.div>
          )}

          {/* ── STEP 2: CHOOSE TARGET GOAL ────────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-between space-y-4 relative z-10"
            >
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">Step 1 of 3</span>
                <h2 className="text-xl sm:text-2xl font-semibold text-zinc-100">What are you preparing for?</h2>
                <p className="text-xs text-zinc-400">Select your primary examination to calibrate high-yield weightings and taxonomy.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[290px] overflow-y-auto pr-1">
                {GOAL_OPTIONS.map((goal) => {
                  const isSelected = selectedGoal === goal.id;
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => setSelectedGoal(goal.id)}
                      className={cn(
                        "p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer relative",
                        isSelected
                          ? "bg-teal-950/30 border-teal-500/60 shadow-[0_0_16px_rgba(20,184,166,0.15)]"
                          : "bg-white/[0.02] border-white/[0.07] hover:border-white/20 hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-100">{goal.label}</span>
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-mono px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/5">{goal.badge}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 leading-snug">{goal.desc}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                <button
                  onClick={() => setStep(1)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  onClick={handleNextFromGoal}
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_16px_rgba(20,184,166,0.2)] cursor-pointer"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: CURRICULUM SETUP (Fast Loader) ────────────────── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col items-center justify-center space-y-6 relative z-10 py-10 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-teal-950/30 border border-teal-500/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
              </div>
              <div className="space-y-2 max-w-xs">
                <h3 className="text-base font-bold text-zinc-100">Configuring Medical Taxonomy</h3>
                <p className="text-xs text-zinc-400">{importStatusText}</p>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden mt-3">
                  <div 
                    className="bg-teal-400 h-full transition-all duration-300 rounded-full" 
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: TIMELINE & PACING ─────────────────────────────── */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-between space-y-4 relative z-10"
            >
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">Step 2 of 3</span>
                <h2 className="text-xl sm:text-2xl font-semibold text-zinc-100">Personalize Your Pacing</h2>
                <p className="text-xs text-zinc-400">Help Atlas calibrate daily targets matched to your exam date.</p>
              </div>

              <div className="space-y-3.5 max-h-[290px] overflow-y-auto pr-1">
                {/* Expected Exam Date */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
                    <span>Expected Exam Date</span>
                    {daysUntilExam !== null && (
                      <span className="text-teal-400 font-mono text-[11px] font-medium">
                        🗓️ {daysUntilExam} Days Remaining
                      </span>
                    )}
                  </div>
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
                        className="text-xs font-medium py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] transition-colors text-zinc-300 cursor-pointer"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full bg-zinc-900/90 border border-white/[0.1] rounded-xl text-xs h-10 px-3 text-zinc-100 focus:outline-none focus:border-teal-500/60"
                  />
                </div>

                {/* Current Stage / Year */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-200 block">Current Academic Stage</label>
                  <select
                    value={currentYear}
                    onChange={(e) => setCurrentYear(e.target.value)}
                    className="w-full bg-zinc-900/90 border border-white/[0.1] rounded-xl text-xs h-10 px-3 text-zinc-100 focus:outline-none focus:border-teal-500/60"
                  >
                    {YEAR_OPTIONS.map((yr) => (
                      <option key={yr} value={yr} className="bg-zinc-900 text-zinc-100">{yr}</option>
                    ))}
                  </select>
                </div>

                {/* Daily Question Target */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-200 block">Daily Question Pacing Goal</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[20, 40, 60, 80].map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => setDailyGoal(goal)}
                        className={cn(
                          "py-2 rounded-xl border text-xs font-medium transition-all text-center cursor-pointer",
                          dailyGoal === goal
                            ? "bg-teal-950/40 border-teal-500/60 text-teal-300 font-bold"
                            : "bg-white/[0.02] border-white/[0.08] text-zinc-400 hover:text-zinc-200"
                        )}
                      >
                        {goal} Qs/day
                      </button>
                    ))}
                  </div>
                </div>

                {/* Study Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-200 block">Current Preparation State</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStartedStudying('yes')}
                      className={cn(
                        "p-2.5 rounded-xl border text-xs font-semibold transition-all text-center cursor-pointer",
                        startedStudying === 'yes'
                          ? "bg-teal-950/40 border-teal-500/60 text-teal-300"
                          : "bg-white/[0.02] border-white/[0.08] text-zinc-400"
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
                          ? "bg-teal-950/40 border-teal-500/60 text-teal-300"
                          : "bg-white/[0.02] border-white/[0.08] text-zinc-400"
                      )}
                    >
                      Starting Fresh
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                <button
                  onClick={() => setStep(2)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  onClick={handleNextFromPersonalization}
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_16px_rgba(20,184,166,0.2)] cursor-pointer"
                >
                  <span>Continue to Blueprint</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 5: ALGORITHMIC BLUEPRINT ─────────────────────────── */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-between space-y-4 relative z-10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">Step 3 of 3</span>
                  <h2 className="text-xl sm:text-2xl font-semibold text-zinc-100">How Atlas Guides You</h2>
                  <p className="text-xs text-zinc-400">Four algorithmic pillars driving your daily study decisions.</p>
                </div>
                <button
                  onClick={handleStartComputing}
                  className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1 cursor-pointer"
                >
                  Skip
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-1">
                <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    Macro Mastery
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Tracks full systems and subjects rather than isolated flashcards. Works alongside any question bank.
                  </p>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Intelligent Direction
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Curriculum weightage automatically guides daily priority so you never second-guess your schedule.
                  </p>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    Active Recall
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Prioritizes active clinical practice and mistake logging over passive reading.
                  </p>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                    Adaptive Spaced Repetition
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Schedules memory callbacks before knowledge decay occurs, powered by FSRS memory models.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                <button
                  onClick={() => setStep(4)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  onClick={handleStartComputing}
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs flex items-center gap-2 transition-all shadow-[0_0_16px_rgba(20,184,166,0.2)] cursor-pointer"
                >
                  <span>Calibrate & Synthesize</span>
                  <Sparkles className="w-4 h-4 fill-black" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 6: COMPUTING ANIMATION ───────────────────────────── */}
          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center my-auto space-y-6 relative z-10 py-6"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-teal-950/30 border border-teal-500/30 flex items-center justify-center animate-pulse">
                  <Brain className="w-10 h-10 text-teal-400" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-teal-500/50 border-t-transparent animate-spin" />
              </div>

              <div className="space-y-1.5 max-w-sm">
                <h2 className="text-xl font-bold text-zinc-100">Calibrating Atlas OS</h2>
                <p className="text-xs text-zinc-400">
                  Synthesizing your personalized {selectedGoal} study trajectory...
                </p>
              </div>

              <div className="w-full max-w-xs space-y-2 text-left bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                {[
                  `Analyzing ${selectedGoal} curriculum structure...`,
                  'Calibrating spaced repetition decay constants...',
                  'Prioritizing high-yield clinical systems...',
                  'Generating initial recommendation matrix...'
                ].map((msg, idx) => (
                  <div
                    key={msg}
                    className={cn(
                      "flex items-center gap-2 text-xs transition-all duration-300",
                      computingStep >= idx ? "text-zinc-200 font-medium" : "text-zinc-600"
                    )}
                  >
                    {computingStep > idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : computingStep === idx ? (
                      <Loader2 className="w-3.5 h-3.5 text-teal-400 animate-spin shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-zinc-700 shrink-0" />
                    )}
                    <span>{msg}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP 7: CALIBRATION COMPLETE ─────────────────────────── */}
          {step === 7 && (
            <motion.div
              key="step7"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col justify-between space-y-4 relative z-10"
            >
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950/40 border border-teal-500/30 text-teal-300 text-xs font-semibold">
                  <Sparkles className="w-3 h-3 text-teal-400" />
                  <span>Calibration Complete</span>
                </div>
                <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">
                  Your {selectedGoal} Roadmap is Ready
                </h2>
                <p className="text-xs text-zinc-400">
                  Here is your first algorithmic study priority based on your timeline and exam goal:
                </p>
              </div>

              {/* Recommendation Card */}
              <div className="bg-white/[0.02] border border-teal-500/30 rounded-2xl p-5 shadow-lg space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 bg-teal-950/40 rounded-bl-2xl border-l border-b border-teal-500/20 text-teal-400">
                  <Flame className="w-5 h-5 text-amber-400" />
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider block">
                    {recommendedSystem.subjectName}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-zinc-100">
                    {recommendedSystem.systemName}
                  </h3>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Why Atlas Chose This
                  </span>
                  <ul className="space-y-1">
                    {recommendedSystem.reasons && recommendedSystem.reasons.length > 0 ? (
                      recommendedSystem.reasons.map((r, i) => (
                        <li key={i} className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span>{r.replace(/^[•\s]+/, '')}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span>High-yield medical curriculum priority</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Summary of Plan */}
              <div className="bg-white/[0.01] border border-white/[0.06] rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Goal</span>
                  <span className="font-semibold text-zinc-200 truncate block">{selectedGoal}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Pacing</span>
                  <span className="font-semibold text-zinc-200 block">{dailyGoal} Qs/day</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Timeline</span>
                  <span className="font-semibold text-teal-400 block">
                    {daysUntilExam ? `${daysUntilExam} Days` : 'Self-Paced'}
                  </span>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                onClick={handleFinishOnboarding}
                className="w-full h-12 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_24px_rgba(20,184,166,0.3)] cursor-pointer"
              >
                {!hasAccess ? (
                  <>
                    <Zap className="w-4 h-4 fill-black" />
                    <span>Proceed to Activate Trial Pass</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    <span>Start Studying Now</span>
                  </>
                )}
              </button>
            </motion.div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
