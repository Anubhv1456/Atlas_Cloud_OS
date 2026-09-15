import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { 
  Sparkles, Brain, Check, Zap, Target, BookOpen, ArrowRight, ChevronRight, ChevronLeft
} from 'lucide-react';
import { useExamProfile } from '@/hooks/useExamProfile';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { AtlasEmblem } from '@/components/AtlasEmblem';
import { loadUniversalOntology } from '@/lib/exam-presets';
import { getOntologyForExam } from '@/data/ontology';
import { db } from '@/db';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type OnboardingStep = 
  | 'welcome_exam'
  | 'year'
  | 'fork'
  | 'baseline'
  | 'syllabus'
  | 'computing'
  | 'start_trial';

const DRAFT_KEY = 'atlas_onboarding_draft';

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

  // Hydrate draft state if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.selectedExam) setSelectedExam(data.selectedExam);
        if (data.selectedYear) setSelectedYear(data.selectedYear);
        if (typeof data.baselineScore === 'number') setBaselineScore(data.baselineScore);
        if (data.syllabusStatus) setSyllabusStatus(data.syllabusStatus);
        if (data.step && data.step !== 'computing') {
          setStep(data.step);
          if (data.step === 'syllabus' || data.step === 'baseline') {
            const exam = data.selectedExam || 'NEET PG';
            const activeOntology = getOntologyForExam(exam);
            setSubjects(activeOntology.map(s => ({
              id: s.id as any,
              name: s.name,
              createdAt: new Date(),
              updatedAt: new Date()
            })));
          }
        }
      }
    } catch (e) {
      console.warn('Failed to hydrate onboarding draft', e);
    }
  }, []);

  // Persist draft updates
  useEffect(() => {
    if (step === 'computing') return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        step,
        selectedExam,
        selectedYear,
        baselineScore,
        syllabusStatus
      }));
    } catch {
      // ignore storage quota issues
    }
  }, [step, selectedExam, selectedYear, baselineScore, syllabusStatus]);

  const EXAMS = [
    { 
      id: 'USMLE Step 1', 
      label: 'USMLE Step 1', 
      tag: 'Foundations', 
      desc: 'Pre-clinical organ systems & basic medical sciences',
      icon: '🩺'
    },
    { 
      id: 'USMLE Step 2 CK', 
      label: 'USMLE Step 2 CK', 
      tag: 'Clinical', 
      desc: 'Clinical diagnosis, patient management & shelf exams',
      icon: '🏥'
    },
    { 
      id: 'NEET PG', 
      label: 'NEET PG', 
      tag: 'Post-Grad', 
      desc: '19-subject comprehensive Indian medical PG blueprint',
      icon: '⚡'
    },
    { 
      id: 'INI-CET', 
      label: 'INI-CET', 
      tag: 'Premier', 
      desc: 'High-yield recall for AIIMS, PGI, JIPMER & NIMHANS',
      icon: '🏛️'
    },
    { 
      id: 'FMGE', 
      label: 'FMGE', 
      tag: 'Licensing', 
      desc: 'Foreign Medical Graduate screening & core revision',
      icon: '🌐'
    },
  ];

  interface AcademicStage {
    id: string;
    label: string;
    tag: string;
    desc: string;
  }

  const getStagesForExam = (exam: string): AcademicStage[] => {
    const lower = (exam || '').toLowerCase();
    if (lower.includes('step 1')) {
      return [
        { id: 'MS1 (1st Year)', label: 'MS1 (First Year)', tag: 'Pre-Clinical', desc: 'Gross Anatomy, Embryology, Physiology & Biochemistry' },
        { id: 'MS2 (2nd Year)', label: 'MS2 (Second Year)', tag: 'Organ Systems', desc: 'Pathology, Pharmacology, Microbiology & Pathophysiology' },
        { id: 'Dedicated Period', label: 'Dedicated Study Period', tag: 'Intensive', desc: '6–12 week full-time intensive question bank & practice exam pass' },
        { id: 'IMG / Graduate', label: 'IMG / Graduate Candidate', tag: 'Licensing', desc: 'International medical graduate preparing for Step 1' },
      ];
    }
    if (lower.includes('step 2')) {
      return [
        { id: 'MS3 (3rd Year)', label: 'MS3 (Third Year)', tag: 'Clerkships', desc: 'Core clinical rotations & shelf examinations' },
        { id: 'MS4 (4th Year)', label: 'MS4 (Fourth Year)', tag: 'Sub-Internships', desc: 'Acting internships, clinical electives & Step 2 CK' },
        { id: 'Dedicated Period', label: 'Dedicated Study Period', tag: 'Intensive', desc: 'High-volume clinical question bank & mock exam active recall' },
        { id: 'IMG / Residency Match', label: 'IMG / Residency Applicant', tag: 'Match Year', desc: 'Graduates aiming for ECFMG certification & US residency match' },
      ];
    }
    if (lower.includes('fmge')) {
      return [
        { id: 'Final Year Abroad', label: 'Final Year Student Abroad', tag: 'Pre-Screening', desc: 'Completing foreign medical curriculum abroad' },
        { id: 'Graduate (1st Attempt)', label: 'First Attempt Dedicated', tag: 'Screening Exam', desc: 'Covering 19 subjects with NBE clinical question pattern' },
        { id: 'Repeat Intensive', label: 'Repeat Intensive Sprint', tag: 'Rapid Revision', desc: 'Focused on high-yield clinical images & past year questions' },
      ];
    }
    // Default: NEET PG & INI-CET
    return [
      { id: '1st / 2nd Prof', label: '1st / 2nd Prof MBBS', tag: 'Early Start', desc: 'Pre & para-clinical subjects (Anatomy to Microbiology)' },
      { id: '3rd / Final Prof', label: '3rd / Final Prof MBBS', tag: 'Clinical Years', desc: 'Clinical postings, Medicine, Surgery, OBGYN & Minor subjects' },
      { id: 'Internship', label: 'Compulsory Rotatory Internship', tag: 'Ward Postings', desc: 'Balancing hospital duty hours with daily MCQ sprints' },
      { id: 'Post-Intern Dedicated', label: 'Post-Intern Dedicated', tag: 'Full-Time', desc: 'Full-time test series, rapid revision & Grand Tests' },
    ];
  };

  const isUsmleStep1 = (selectedExam || '').toLowerCase().includes('step 1');
  const isUsmleStep2 = (selectedExam || '').toLowerCase().includes('step 2');
  const isUsmle = isUsmleStep1 || isUsmleStep2;

  const getComputingMessages = () => {
    if (isUsmleStep1) {
      return [
        'Synthesizing USMLE Step 1 organ-system ontology...',
        'Calibrating core review & question bank retention intervals...',
        'Drafting high-yield Step 1 Day 1 revision queue...'
      ];
    }
    if (isUsmleStep2) {
      return [
        'Synthesizing USMLE Step 2 CK clinical blueprint...',
        'Calibrating diagnostic management & shelf recall intervals...',
        'Drafting high-yield Step 2 CK Day 1 revision queue...'
      ];
    }
    return [
      'Synthesizing 19-subject clinical blueprint ontology...',
      'Calibrating Grand Test strike-rate memory stability...',
      'Drafting high-yield Day 1 revision queue...'
    ];
  };

  const handleExamSelect = (exam: string) => {
    setSelectedExam(exam);
    updateProfile({ targetExam: exam });
    
    // Background workspace initialization
    db.switchWorkspace(exam);
    loadUniversalOntology({ targetExam: exam, force: true }).catch(console.error);
    
    setStep('year');
  };

  const handleYearSelect = (year: string) => {
    setSelectedYear(year);
    updateProfile({ currentYear: year });
    setStep('fork');
  };

  const handleBack = () => {
    if (step === 'year') setStep('welcome_exam');
    else if (step === 'fork') setStep('year');
    else if (step === 'baseline') setStep('fork');
    else if (step === 'syllabus') setStep('baseline');
  };

  const handleJumpRightIn = async () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    await markOnboarded();
    setLocation('/');
  };

  const handleStartPersonalize = async () => {
    let subs = await db.subjects.toArray().then(arr => arr.filter(s => s && !s.deletedAt));
    if (!subs || subs.length === 0) {
      const activeOntology = getOntologyForExam(selectedExam || 'NEET PG');
      subs = activeOntology.map(s => ({
        id: s.id as any,
        name: s.name,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    }
    setSubjects(subs);
    
    const initialStatus: Record<string, 'untouched' | 'familiar' | 'weak'> = {};
    subs.forEach(s => { if (s.id) initialStatus[s.id as string] = 'untouched'; });
    setSyllabusStatus(initialStatus);
    
    setStep('baseline');
  };

  const handleBuildRoadmap = async () => {
    setStep('computing');
    // Yield to let the computing animation mount smoothly
    await new Promise(r => setTimeout(r, 60));
    
    const now = new Date();
    const lastReviewTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    try {
      const activeSubIds = subjects.map(s => s.id).filter(Boolean);
      const allSystems = await db.systems.where('subjectId').anyOf(activeSubIds).toArray();
      const systemUpdates: any[] = [];
      const curriculumSetInserts: any[] = [];
      
      for (const sub of subjects) {
        const status = sub.id ? syllabusStatus[sub.id as string] : undefined;
        if (status === 'untouched' || !status) continue;
        
        const subSystems = allSystems.filter(sys => sys.subjectId === sub.id);
        for (const sys of subSystems) {
          let updatedSys = { ...sys };
          if (status === 'familiar') {
            updatedSys = {
              ...updatedSys,
              fsrsStability: 40,
              fsrsDifficulty: 5,
              fsrsState: 2, 
              fsrsReps: 5,
              fsrsLastReview: lastReviewTime,
              fsrsDue: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
            };
          } else if (status === 'weak') {
            updatedSys = {
              ...updatedSys,
              fsrsStability: 2,
              fsrsDifficulty: 9,
              fsrsState: 2,
              fsrsReps: 2,
              fsrsLastReview: lastReviewTime,
              fsrsDue: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
            };
          }
          systemUpdates.push(updatedSys);
          
          const setId = `cs_${sub.id}_${sys.id}_${Date.now()}`;
          const rationale = status === 'weak' ? 'Targeted Review' : 'Baseline Confirmation';
          curriculumSetInserts.push({
            id: setId,
            subjectId: sub.id,
            systemId: sys.id,
            name: `${sub.name || 'System'} • ${sys.name || 'Core'}`,
            depth: 'standard',
            tags: ['onboarding', rationale],
            fsrsStability: updatedSys.fsrsStability,
            fsrsDifficulty: updatedSys.fsrsDifficulty,
            fsrsState: updatedSys.fsrsState,
            fsrsReps: updatedSys.fsrsReps,
            fsrsLastReview: updatedSys.fsrsLastReview,
            fsrsDue: updatedSys.fsrsDue,
            createdAt: now,
            updatedAt: now
          });
        }
      }
      
      // Write in micro-batches across animation frames to guarantee 60fps on radar graphic
      if (systemUpdates.length > 0) {
        const batchSize = 30;
        for (let i = 0; i < systemUpdates.length; i += batchSize) {
          await db.systems.bulkPut(systemUpdates.slice(i, i + batchSize));
          await new Promise(r => requestAnimationFrame(r));
        }
      }
      if (curriculumSetInserts.length > 0) {
        const batchSize = 30;
        for (let i = 0; i < curriculumSetInserts.length; i += batchSize) {
          await db.curriculumSets.bulkPut(curriculumSetInserts.slice(i, i + batchSize) as any);
          await new Promise(r => requestAnimationFrame(r));
        }
      }
    } catch (e) {
      console.warn('Roadmap generation warning:', e);
    }
    
    setTimeout(() => setComputingStep(1), 800);
    setTimeout(() => setComputingStep(2), 1600);
    setTimeout(() => {
      setStep('start_trial');
    }, 2500);
  };

  const setStatus = (subId: string, status: 'untouched' | 'familiar' | 'weak') => {
    setSyllabusStatus(prev => ({ ...prev, [subId]: status }));
  };

  const canGoBack = step !== 'welcome_exam' && step !== 'computing';

  return (
    <div className="min-h-screen bg-[#090a0d] text-zinc-100 flex flex-col justify-between selection:bg-teal-500/20 selection:text-teal-200 relative overflow-x-hidden font-sans">
      {/* Top Ambient Glow (Atmospheric Twilight Aura) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[radial-gradient(ellipse_at_top,_rgba(45,212,191,0.12),_transparent_70%)] pointer-events-none" />
      
      {/* Main Content Area */}
      <div className="w-full max-w-lg mx-auto px-4 sm:px-6 pt-6 pb-12 flex-1 flex flex-col justify-between relative z-10">
        
        {/* Top Header: Navigation & Segmented Progress */}
        <div className="flex items-center justify-between h-10 mb-6 shrink-0">
          <div className="w-20">
            {canGoBack && (
              <button 
                onClick={handleBack}
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors py-1.5 px-2 rounded-lg hover:bg-white/[0.05] active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
          </div>

          {/* Segmented Step Indicator */}
          {step !== 'computing' && (
            <div className="flex items-center gap-1.5">
              <div 
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  step === 'welcome_exam' ? "w-6 bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]" : "w-2 bg-teal-500/40"
                )} 
              />
              <div 
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  step === 'year' 
                    ? "w-6 bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]" 
                    : (['fork', 'baseline', 'syllabus'].includes(step) ? "w-2 bg-teal-500/40" : "w-2 bg-zinc-800")
                )} 
              />
              <div 
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  ['fork', 'baseline', 'syllabus'].includes(step) 
                    ? "w-6 bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]" 
                    : "w-2 bg-zinc-800"
                )} 
              />
            </div>
          )}

          <div className="w-20 flex justify-end">
            {step !== 'computing' && (
              <span className="text-[11px] font-medium text-zinc-500 font-mono">
                {step === 'welcome_exam' && '01 / 03'}
                {step === 'year' && '02 / 03'}
                {step === 'fork' && '03 / 03'}
                {step === 'baseline' && 'Calibration'}
                {step === 'syllabus' && 'Diagnostic'}
              </span>
            )}
          </div>
        </div>

        {/* Liberated Atlas Beacon Brand (Unboxed & Radiant) */}
        <div className="flex flex-col items-center justify-center mb-6 sm:mb-8 shrink-0">
          <div className="relative flex items-center justify-center group">
            {/* Atmospheric Star Glow behind apex */}
            <div className="absolute w-24 h-24 -top-2 rounded-full bg-teal-500/15 blur-xl pointer-events-none transition-all group-hover:bg-teal-500/25" />
            <AtlasEmblem className="w-14 h-14 relative z-10 transition-transform duration-500 hover:scale-105" glow={true} />
          </div>
          <span className="mt-3 text-[11px] font-bold tracking-[0.3em] text-zinc-400 uppercase font-mono">
            A T L A S
          </span>
        </div>

        {/* Dynamic Step View */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {/* STEP 1: WELCOME & EXAM */}
            {step === 'welcome_exam' && (
              <motion.div
                key="welcome_exam"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Which exam are we mastering?
                  </h1>
                  <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    Atlas customizes your spaced repetition, question triage, and high-yield milestones to this blueprint.
                  </p>
                </div>

                <div className="space-y-2.5 w-full pt-2">
                  {EXAMS.map((exam, idx) => (
                    <motion.button
                      key={exam.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.04 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExamSelect(exam.id)}
                      className="w-full p-4 rounded-2xl border border-white/[0.07] bg-zinc-900/70 hover:bg-zinc-800/80 hover:border-teal-500/40 hover:shadow-[0_4px_20px_rgba(20,184,166,0.12)] transition-all duration-200 text-left flex items-center justify-between gap-3.5 cursor-pointer group relative overflow-hidden"
                    >
                      {/* Top micro-highlight */}
                      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-teal-400/40 transition-all" />
                      
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-lg shrink-0 group-hover:bg-teal-500/10 group-hover:border-teal-500/20 group-hover:scale-105 transition-all">
                          {exam.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base font-semibold text-zinc-100 group-hover:text-white transition-colors truncate">
                              {exam.label}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-400 border border-white/[0.05] group-hover:text-teal-300 group-hover:border-teal-500/30 group-hover:bg-teal-500/10 transition-colors shrink-0">
                              {exam.tag}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors mt-0.5 truncate">
                            {exam.desc}
                          </p>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-white/[0.03] group-hover:bg-teal-500/10 flex items-center justify-center shrink-0 transition-colors">
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2: ACADEMIC YEAR / TRAINING STAGE */}
            {step === 'year' && (
              <motion.div
                key="year"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {isUsmle ? "Where are you in medical training?" : "Where are you in your journey?"}
                  </h2>
                  <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    {isUsmleStep1 
                      ? "Calibrates preclinical science depth and organ-system prioritization."
                      : isUsmleStep2
                      ? "Calibrates clinical clerkship depth and diagnostic management focus."
                      : "Calibrates clinical depth and foundational pacing for your curriculum."}
                  </p>
                </div>

                <div className="space-y-2.5 w-full pt-2">
                  {getStagesForExam(selectedExam).map((year, idx) => (
                    <motion.button
                      key={year.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.04 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleYearSelect(year.id)}
                      className="w-full p-4 rounded-2xl border border-white/[0.07] bg-zinc-900/70 hover:bg-zinc-800/80 hover:border-teal-500/40 hover:shadow-[0_4px_20px_rgba(20,184,166,0.12)] transition-all duration-200 text-left flex items-center justify-between gap-3.5 cursor-pointer group relative overflow-hidden"
                    >
                      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-teal-400/40 transition-all" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm sm:text-base font-semibold text-zinc-100 group-hover:text-white transition-colors">
                            {year.label}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-400 border border-white/[0.05] group-hover:text-teal-300 group-hover:border-teal-500/30 group-hover:bg-teal-500/10 transition-colors">
                            {year.tag}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors mt-0.5 truncate">
                          {year.desc}
                        </p>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-white/[0.03] group-hover:bg-teal-500/10 flex items-center justify-center shrink-0 transition-colors">
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3: PATHWAY / FORK */}
            {step === 'fork' && (
              <motion.div
                key="fork"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    How would you like to begin?
                  </h2>
                  <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    Choose your onboarding pace. You can adjust your targets at any time.
                  </p>
                </div>

                <div className="space-y-3.5 pt-2">
                  {/* Option A: Fast Start */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleJumpRightIn}
                    className="p-5 rounded-2xl border border-white/[0.08] bg-zinc-900/70 hover:bg-zinc-800/80 hover:border-white/20 transition-all duration-200 cursor-pointer group relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-100 group-hover:text-white">Jump Right In</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Instant
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                            Start with high-yield foundational reviews. Atlas continuously recalibrates your schedule as you study.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
                    </div>
                  </motion.div>

                  {/* Option B: Deep Diagnostic */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartPersonalize}
                    className="p-5 rounded-2xl border border-teal-500/30 bg-teal-500/[0.03] hover:bg-teal-500/[0.08] hover:border-teal-400/50 shadow-[0_0_24px_rgba(20,184,166,0.1)] transition-all duration-200 cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute -top-6 -right-6 w-28 h-28 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-start justify-between gap-4 relative z-10">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 shrink-0 mt-0.5 shadow-[0_0_12px_rgba(20,184,166,0.25)]">
                          <Brain className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-100 group-hover:text-white">Personalize Schedule</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                              Recommended
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                            3-minute diagnostic triage. Quickly rate your subjects to produce an intelligent Day 1 revision roadmap.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-teal-400 group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: GLOBAL BASELINE */}
            {step === 'baseline' && (
              <motion.div
                key="baseline"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {isUsmleStep1 
                      ? "Practice Exam & QBank Diagnostic Average" 
                      : isUsmleStep2 
                      ? "Clinical Shelf & Practice Exam Average" 
                      : "Recent Practice Performance"}
                  </h2>
                  <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    {isUsmleStep1 
                      ? "Estimate your recent mock exam or question bank block average (Step 1 passing standard is ~60%)."
                      : isUsmleStep2
                      ? "Estimate your clinical shelf exam, assessment, or question bank percentage."
                      : "Estimate your recent Grand Test (GT) or mock score to calibrate starting recall."}
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-white/[0.08] bg-zinc-900/60 backdrop-blur-sm space-y-6">
                  <div className="text-center">
                    <span className="text-5xl font-black tracking-tight font-mono text-teal-400 drop-shadow-[0_0_16px_rgba(45,212,191,0.3)]">
                      {baselineScore}%
                    </span>
                    <p className="text-xs text-zinc-400 mt-2 font-medium">
                      {isUsmleStep1 ? (
                        baselineScore < 55 ? 'Building foundations — focusing on basic science principles'
                        : baselineScore <= 66 ? 'Borderline passing window — targeted organ-system review'
                        : 'Safe passing tier (>95% predicted pass probability)'
                      ) : isUsmleStep2 ? (
                        baselineScore < 60 ? 'Building diagnostic algorithms & management essentials'
                        : baselineScore <= 75 ? 'Competitive score trajectory (predicted 235–250)'
                        : 'High-percentile mastery (predicted 255+)'
                      ) : (
                        baselineScore < 35 ? 'Building 19-subject core foundations'
                        : baselineScore <= 65 ? 'Solid core — ready for high-yield Grand Test triage'
                        : 'Top percentile — fine-tuning recall speed & image questions'
                      )}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={baselineScore}
                      onChange={(e) => setBaselineScore(parseInt(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                    />
                    <div className="flex justify-between text-[11px] font-semibold text-zinc-500">
                      {isUsmleStep1 ? (
                        <>
                          <span className={cn(baselineScore < 55 && "text-teal-400 transition-colors")}>&lt;55% Pass Risk</span>
                          <span className={cn(baselineScore >= 55 && baselineScore <= 66 && "text-teal-400 transition-colors")}>~60% Passing Standard</span>
                          <span className={cn(baselineScore > 66 && "text-teal-400 transition-colors")}>70%+ Safe Pass</span>
                        </>
                      ) : isUsmleStep2 ? (
                        <>
                          <span className={cn(baselineScore < 60 && "text-teal-400 transition-colors")}>Foundations</span>
                          <span className={cn(baselineScore >= 60 && baselineScore <= 75 && "text-teal-400 transition-colors")}>Competitive (240+)</span>
                          <span className={cn(baselineScore > 75 && "text-teal-400 transition-colors")}>High Tier (255+)</span>
                        </>
                      ) : (
                        <>
                          <span className={cn(baselineScore < 35 && "text-teal-400 transition-colors")}>Starting Out</span>
                          <span className={cn(baselineScore >= 35 && baselineScore <= 65 && "text-teal-400 transition-colors")}>Average GT</span>
                          <span className={cn(baselineScore > 65 && "text-teal-400 transition-colors")}>Top Percentile</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep('syllabus')}
                  className="w-full h-12 rounded-xl bg-white text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all cursor-pointer active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                >
                  <span>Continue to Syllabus</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* STEP 5: SYLLABUS TRIAGE */}
            {step === 'syllabus' && (
              <motion.div
                key="syllabus"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6 flex flex-col max-h-[68vh]"
              >
                <div className="text-center space-y-2 shrink-0">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {isUsmleStep1 
                      ? "USMLE Step 1 Disciplines" 
                      : isUsmleStep2 
                      ? "USMLE Step 2 CK Clerkships" 
                      : "19-Subject Blueprint Review"}
                  </h2>
                  <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    {isUsmleStep1
                      ? "Tag your confidence across basic science disciplines & organ systems to seed Day 1 reviews."
                      : isUsmleStep2
                      ? "Tag your confidence across clinical clerkships and diagnostic management domains."
                      : "Tag your confidence per subject. Atlas constructs your synthetic repetition matrix."}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                  {subjects.map(sub => {
                    const currentStatus = syllabusStatus[sub.id];
                    return (
                      <div key={sub.id} className="p-3.5 rounded-2xl border border-white/[0.07] bg-zinc-900/60 flex flex-col gap-2.5">
                        <span className="text-sm font-semibold text-zinc-100">{sub.name}</span>
                        
                        <div className="grid grid-cols-3 gap-1.5 bg-zinc-950/70 rounded-xl p-1 border border-white/[0.04]">
                          <button
                            onClick={() => setStatus(sub.id, 'untouched')}
                            className={cn(
                              "py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center",
                              currentStatus === 'untouched' ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                            )}
                          >
                            Untouched
                          </button>
                          <button
                            onClick={() => setStatus(sub.id, 'familiar')}
                            className={cn(
                              "py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center",
                              currentStatus === 'familiar' ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                            )}
                          >
                            Solid
                          </button>
                          <button
                            onClick={() => setStatus(sub.id, 'weak')}
                            className={cn(
                              "py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center",
                              currentStatus === 'weak' ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                            )}
                          >
                            Needs Work
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 shrink-0">
                  <button
                    onClick={handleBuildRoadmap}
                    className="w-full h-12 rounded-xl bg-teal-400 hover:bg-teal-300 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_24px_rgba(45,212,191,0.3)] cursor-pointer active:scale-[0.98]"
                  >
                    <span>Build My Personalized Roadmap</span>
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
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="py-12 flex flex-col items-center justify-center text-center space-y-10"
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-teal-950/40 border border-teal-500/30 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(20,184,166,0.2)]">
                    <Brain className="w-10 h-10 text-teal-400" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl border-2 border-teal-400/60 border-t-transparent animate-spin" style={{ animationDuration: '2.5s' }} />
                </div>

                <div className="w-full max-w-sm space-y-4 text-left px-4">
                  {getComputingMessages().map((msg, idx) => (
                    <div
                      key={msg}
                      className={cn(
                        "flex items-center gap-3 text-sm font-medium transition-all duration-700",
                        computingStep >= idx ? "text-zinc-100" : "text-zinc-600 opacity-30 transform translate-y-3"
                      )}
                    >
                      {computingStep > idx ? (
                        <div className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 text-teal-400" />
                        </div>
                      ) : computingStep === idx ? (
                        <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-zinc-800 shrink-0" />
                      )}
                      <span>{msg}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 7: START TRIAL */}
            {step === 'start_trial' && (
              <motion.div
                key="start_trial"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="py-12 flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6">
                  <Zap className="w-8 h-8 text-teal-400" />
                </div>
                
                <h2 className="text-2xl font-bold tracking-tight text-zinc-100 mb-3">
                  Your Personalized Roadmap is Ready
                </h2>
                
                <p className="text-zinc-400 mb-8 max-w-sm">
                  We've built your baseline matrix. Start your 14-day free trial to unlock the complete spaced-repetition engine and predictive analytics.
                </p>

                <div className="space-y-4 w-full max-w-sm">
                  <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 text-left space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Smart scheduling powered by FSRS-4.5</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Targeted review for your weak subjects</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Predictive exam readiness scoring</span>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      try {
                        localStorage.removeItem(DRAFT_KEY);
                      } catch {
                        // ignore
                      }
                      await markOnboarded();
                      setLocation('/');
                    }}
                    className="w-full h-12 rounded-xl bg-teal-400 hover:bg-teal-300 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_24px_rgba(45,212,191,0.3)] cursor-pointer active:scale-[0.98]"
                  >
                    <span>Start My 14-Day Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Micro-Affordance */}
        <div className="text-center pt-6 shrink-0 space-y-1">
          <p className="text-[11px] text-zinc-400 font-medium">
            Offline-first local data architecture with private client-side storage.
          </p>
          <p className="text-[10px] text-zinc-500">
            For medical examination preparation. By continuing, you agree to our{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-300">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-300">Privacy Policy</a>.
          </p>
        </div>

      </div>
    </div>
  );
}
