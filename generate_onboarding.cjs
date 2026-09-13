const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { 
  Sparkles, Brain, Check, Zap, Target, BookOpen
} from 'lucide-react';
import { useExamProfile } from '@/hooks/useExamProfile';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { AtlasEmblem } from '@/components/AtlasEmblem';
import { loadUniversalOntology } from '@/lib/exam-presets';
import { db } from '@/db';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type OnboardingStep = 
  | 'welcome_exam'
  | 'year'
  | 'fork'
  | 'baseline'
  | 'syllabus'
  | 'computing';

export default function Onboarding() {
  const [step, setStep] = useState<OnboardingStep>('welcome_exam');
  const [, setLocation] = useLocation();
  const { profile, updateProfile } = useExamProfile();
  const { markOnboarded } = useOnboardingStatus();
  
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  
  const [baselineScore, setBaselineScore] = useState<number>(50);
  const [syllabusStatus, setSyllabusStatus] = useState<Record<string, 'untouched' | 'familiar' | 'weak'>>({});
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [computingStep, setComputingStep] = useState(0);

  const EXAMS = [
    { id: 'USMLE Step 1', label: 'USMLE Step 1', desc: 'Foundations' },
    { id: 'USMLE Step 2 CK', label: 'USMLE Step 2 CK', desc: 'Clinical' },
    { id: 'NEET PG', label: 'NEET PG', desc: 'Post-Grad' },
    { id: 'INI-CET', label: 'INI-CET', desc: 'Premier' },
    { id: 'FMGE', label: 'FMGE', desc: 'Licensing' },
  ];

  const YEARS = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    'Final Year',
    'Intern / Post-Grad'
  ];

  const handleExamSelect = (exam: string) => {
    setSelectedExam(exam);
    updateProfile({ targetExam: exam });
    
    // Background magic
    db.switchWorkspace(exam);
    loadUniversalOntology({ targetExam: exam, force: true }).catch(console.error);
    
    setStep('year');
  };

  const handleYearSelect = (year: string) => {
    setSelectedYear(year);
    updateProfile({ currentYear: year });
    setStep('fork');
  };

  const handleJumpRightIn = async () => {
    await markOnboarded();
    setLocation('/');
  };

  const handleStartPersonalize = async () => {
    const subs = await db.subjects.toArray();
    setSubjects(subs);
    
    const initialStatus: Record<string, 'untouched' | 'familiar' | 'weak'> = {};
    subs.forEach(s => initialStatus[s.id] = 'untouched');
    setSyllabusStatus(initialStatus);
    
    setStep('baseline');
  };

  const handleBuildRoadmap = async () => {
    setStep('computing');
    
    const now = new Date();
    const lastReviewTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    for (const sub of subjects) {
      const status = syllabusStatus[sub.id];
      if (status === 'untouched') continue;
      
      const systems = await db.systems.where('subjectId').equals(sub.id).toArray();
      const updates = [];
      
      for (const sys of systems) {
        if (status === 'familiar') {
          updates.push({
            ...sys,
            fsrsStability: 40,
            fsrsDifficulty: 5,
            fsrsState: 2, 
            fsrsReps: 5,
            fsrsLastReview: lastReviewTime,
            fsrsDue: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
        } else if (status === 'weak') {
          updates.push({
            ...sys,
            fsrsStability: 2,
            fsrsDifficulty: 9,
            fsrsState: 2,
            fsrsReps: 2,
            fsrsLastReview: lastReviewTime,
            fsrsDue: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      }
      
      if (updates.length > 0) {
        await db.transaction('rw', db.systems, async () => {
          for (const u of updates) {
            await db.systems.put(u);
          }
        });
      }
    }
    
    setTimeout(() => setComputingStep(1), 800);
    setTimeout(() => setComputingStep(2), 1600);
    setTimeout(async () => {
      await markOnboarded();
      setLocation('/');
    }, 2500);
  };

  const setStatus = (subId: string, status: 'untouched' | 'familiar' | 'weak') => {
    setSyllabusStatus(prev => ({ ...prev, [subId]: status }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-950/10 via-zinc-950 to-zinc-950 pointer-events-none" />
      
      <div className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-12 flex flex-col relative z-10">
        
        <div className="mb-12 flex justify-center">
          <AtlasEmblem size="lg" className="animate-fade-in" />
        </div>

        <AnimatePresence mode="wait">
          
          {/* STEP 1: WELCOME & EXAM */}
          {step === 'welcome_exam' && (
            <motion.div
              key="welcome_exam"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-center space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight font-serif">
                  Let's get you set up.
                </h2>
                <p className="text-sm text-zinc-400">What are we preparing for?</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto w-full">
                {EXAMS.map(exam => (
                  <button
                    key={exam.id}
                    onClick={() => handleExamSelect(exam.id)}
                    className="p-4 rounded-xl border border-zinc-800 bg-white/[0.02] hover:bg-white/[0.05] hover:border-zinc-700 transition-all text-left flex flex-col gap-1 cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-zinc-100">{exam.label}</span>
                    <span className="text-xs text-zinc-500">{exam.desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: ACADEMIC YEAR */}
          {step === 'year' && (
            <motion.div
              key="year"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-center space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight font-serif">
                  Where are you in your medical journey?
                </h2>
                <p className="text-sm text-zinc-400">This helps adapt the curriculum timeline to your current focus.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto w-full">
                {YEARS.map(year => (
                  <button
                    key={year}
                    onClick={() => handleYearSelect(year)}
                    className="p-4 rounded-xl border border-zinc-800 bg-white/[0.02] hover:bg-white/[0.05] hover:border-zinc-700 transition-all text-center cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-zinc-100">{year}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: THE FORK */}
          {step === 'fork' && (
            <motion.div
              key="fork"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-center space-y-8 max-w-3xl mx-auto w-full"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                
                {/* Quick Start */}
                <div className="p-6 rounded-2xl border border-zinc-800 bg-white/[0.01] flex flex-col justify-between h-full space-y-6">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">
                      <span>⏱️ Takes 10 Seconds</span>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-100">Jump Right In</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      Start studying immediately. Atlas will quietly learn your strengths and weaknesses as you go over the next few days.
                    </p>
                  </div>
                  <button
                    onClick={handleJumpRightIn}
                    className="w-full h-11 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-zinc-200 font-semibold text-sm transition-colors border border-white/[0.05] cursor-pointer"
                  >
                    Start Studying
                  </button>
                </div>

                {/* Deep Setup */}
                <div className="p-6 rounded-2xl border border-teal-500/40 bg-teal-950/10 shadow-[0_0_24px_rgba(20,184,166,0.1)] flex flex-col justify-between h-full space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Sparkles className="w-24 h-24 text-teal-400" />
                  </div>
                  <div className="space-y-3 relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-950/50 border border-teal-500/30 text-teal-400 text-[10px] font-semibold uppercase tracking-wider">
                      <span>⏱️ Takes 3 Minutes</span>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-100">Personalize My Schedule</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      Take a few minutes to map out what you already know. We'll build a highly accurate, personalized plan for Day 1.
                    </p>
                  </div>
                  <button
                    onClick={handleStartPersonalize}
                    className="w-full h-11 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-sm transition-colors cursor-pointer relative z-10 shadow-[0_0_16px_rgba(20,184,166,0.2)]"
                  >
                    Start Calibration
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {/* STEP 4: GLOBAL BASELINE */}
          {step === 'baseline' && (
            <motion.div
              key="baseline"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-center space-y-12 max-w-xl mx-auto w-full"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight font-serif">
                  Roughly speaking, how have your recent practice scores been?
                </h2>
                <p className="text-sm text-zinc-400">This helps us adapt the frequency of easier foundational topics.</p>
              </div>

              <div className="space-y-6 pt-4">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={baselineScore}
                  onChange={(e) => setBaselineScore(parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <div className="flex justify-between text-xs font-medium text-zinc-500">
                  <span className={cn(baselineScore < 33 && "text-teal-400")}>Just starting out</span>
                  <span className={cn(baselineScore >= 33 && baselineScore <= 66 && "text-teal-400")}>Getting there (Average)</span>
                  <span className={cn(baselineScore > 66 && "text-teal-400")}>Scoring consistently high</span>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => setStep('syllabus')}
                  className="w-full h-12 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_16px_rgba(20,184,166,0.2)] cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: SYLLABUS TRIAGE */}
          {step === 'syllabus' && (
            <motion.div
              key="syllabus"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col max-h-[80vh] w-full max-w-2xl mx-auto"
            >
              <div className="space-y-1 mb-6 text-center">
                <h2 className="text-2xl font-bold text-zinc-100 tracking-tight font-serif">
                  Syllabus Review
                </h2>
                <p className="text-xs text-zinc-400">Be honest. Atlas uses this to build your Synthetic History.</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                {subjects.map(sub => {
                  const currentStatus = syllabusStatus[sub.id];
                  return (
                    <div key={sub.id} className="p-4 rounded-xl border border-zinc-800 bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <span className="text-sm font-semibold text-zinc-200">{sub.name}</span>
                      
                      <div className="flex bg-zinc-900/80 rounded-lg p-1 border border-zinc-800 w-full sm:w-auto">
                        <button
                          onClick={() => setStatus(sub.id, 'untouched')}
                          className={cn(
                            "flex-1 sm:px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                            currentStatus === 'untouched' ? "bg-zinc-700 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                          )}
                        >
                          Haven't Started
                        </button>
                        <button
                          onClick={() => setStatus(sub.id, 'familiar')}
                          className={cn(
                            "flex-1 sm:px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                            currentStatus === 'familiar' ? "bg-teal-500/20 text-teal-300 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                          )}
                        >
                          Feeling Good
                        </button>
                        <button
                          onClick={() => setStatus(sub.id, 'weak')}
                          className={cn(
                            "flex-1 sm:px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                            currentStatus === 'weak' ? "bg-amber-500/20 text-amber-300 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                          )}
                        >
                          Needs Work
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-6 mt-2 border-t border-white/[0.05]">
                <button
                  onClick={handleBuildRoadmap}
                  className="w-full h-12 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_24px_rgba(20,184,166,0.3)] cursor-pointer"
                >
                  <span>Build My Roadmap</span>
                  <Brain className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 6: COMPUTING ANIMATION */}
          {step === 'computing' && (
            <motion.div
              key="computing"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-teal-950/30 border border-teal-500/30 flex items-center justify-center animate-pulse">
                  <Brain className="w-12 h-12 text-teal-400" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-teal-500/50 border-t-transparent animate-spin" />
              </div>

              <div className="w-full max-w-sm space-y-3 text-left">
                {[
                  'Reviewing your syllabus progress...',
                  'Finding your highest-yield study gaps...',
                  'Drafting your personalized Day 1 schedule...'
                ].map((msg, idx) => (
                  <div
                    key={msg}
                    className={cn(
                      "flex items-center gap-3 text-sm transition-all duration-500",
                      computingStep >= idx ? "text-zinc-200" : "text-zinc-700 opacity-0 transform translate-y-2"
                    )}
                    style={{ opacity: computingStep >= idx ? 1 : 0 }}
                  >
                    {computingStep > idx ? (
                      <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    ) : computingStep === idx ? (
                      <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-zinc-700 shrink-0" />
                    )}
                    <span>{msg}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          
        </AnimatePresence>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('artifacts/study-tracker/src/pages/Onboarding.tsx', code);
console.log("Onboarding.tsx generated");
