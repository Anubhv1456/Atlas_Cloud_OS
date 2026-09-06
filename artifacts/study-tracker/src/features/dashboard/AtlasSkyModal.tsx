import React, { useMemo, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { 
  X, ArrowRight, Brain, Target, Sparkles, Filter, 
  RotateCcw, ShieldAlert, CheckCircle2, BookOpen, Share2, GraduationCap 
} from 'lucide-react';
import { Subject, StudySystem } from '@/db';
import { CurriculumSet } from '@/db/types';
import { cn } from '@/lib/utils';
import { calculateSubjectProgress, calculateOverallProgress } from '@/lib/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { AtlasNorthStar } from '@/components/AtlasNorthStar';
import { useLocation } from 'wouter';
import { useClinicalFrictionEngine } from '@/lib/ai/frictionEngine';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { AtlasSkyShareModal } from './AtlasSkyShareModal';
import { useExamProfile } from '@/hooks/useExamProfile';
import { isSubjectInProfScope, getPhaseNameForProfile } from '@/lib/curriculumScope';

interface AtlasSkyModalProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  subjects: Subject[];
  systems: StudySystem[];
  curriculumSets: CurriculumSet[];
}

export type PhaseType = 'pre_clinical' | 'para_clinical' | 'clinical';

export interface CelestialSubject {
  name: string;
  shortName: string;
  phase: PhaseType;
  phaseLabel: string;
  angle: number; // in degrees
  radiusPercent: number; // percentage radius from center
  x: number; // calculated percentage x (0..100)
  y: number; // calculated percentage y (0..100)
}

// 19 MBBS / NEET PG Subjects arranged into 3 Concentric Medical Phase Orbits with non-overlapping celestial angles
const CELESTIAL_CONFIG: Omit<CelestialSubject, 'x' | 'y'>[] = [
  // --- PRE-CLINICAL FOUNDATION (Orbit 1: r = 18%) ---
  {
    name: 'Anatomy',
    shortName: 'Anatomy',
    phase: 'pre_clinical',
    phaseLabel: 'Pre-Clinical Foundation',
    angle: 270,
    radiusPercent: 18
  },
  {
    name: 'Physiology',
    shortName: 'Physiology',
    phase: 'pre_clinical',
    phaseLabel: 'Pre-Clinical Foundation',
    angle: 30,
    radiusPercent: 18
  },
  {
    name: 'Biochemistry',
    shortName: 'Biochemistry',
    phase: 'pre_clinical',
    phaseLabel: 'Pre-Clinical Foundation',
    angle: 150,
    radiusPercent: 18
  },

  // --- PARA-CLINICAL BRIDGE (Orbit 2: r = 31%) ---
  {
    name: 'Pathology',
    shortName: 'Pathology',
    phase: 'para_clinical',
    phaseLabel: 'Para-Clinical Bridge',
    angle: 220,
    radiusPercent: 31
  },
  {
    name: 'Pharmacology',
    shortName: 'Pharmacology',
    phase: 'para_clinical',
    phaseLabel: 'Para-Clinical Bridge',
    angle: 330,
    radiusPercent: 31
  },
  {
    name: 'Microbiology',
    shortName: 'Microbiology',
    phase: 'para_clinical',
    phaseLabel: 'Para-Clinical Bridge',
    angle: 35,
    radiusPercent: 31
  },
  {
    name: 'Forensic Medicine & Toxicology',
    shortName: 'Forensic Med',
    phase: 'para_clinical',
    phaseLabel: 'Para-Clinical Bridge',
    angle: 90,
    radiusPercent: 31
  },
  {
    name: 'Community Medicine (PSM)',
    shortName: 'Community Med',
    phase: 'para_clinical',
    phaseLabel: 'Para-Clinical Bridge',
    angle: 172,
    radiusPercent: 31
  },

  // --- CLINICAL SPECIALTIES (Orbit 3: r = 43%) ---
  {
    name: 'Medicine',
    shortName: 'Medicine',
    phase: 'clinical',
    phaseLabel: 'Clinical Specialty',
    angle: 270,
    radiusPercent: 43
  },
  {
    name: 'General Surgery',
    shortName: 'Surgery',
    phase: 'clinical',
    phaseLabel: 'Clinical Specialty',
    angle: 302.7,
    radiusPercent: 43
  },
  {
    name: 'Obstetrics & Gynaecology',
    shortName: 'OBGY',
    phase: 'clinical',
    phaseLabel: 'Clinical Specialty',
    angle: 335.5,
    radiusPercent: 43
  },
  {
    name: 'Pediatrics',
    shortName: 'Pediatrics',
    phase: 'clinical',
    phaseLabel: 'Clinical Specialty',
    angle: 8.2,
    radiusPercent: 43
  },
  {
    name: 'Orthopedics',
    shortName: 'Orthopedics',
    phase: 'clinical',
    phaseLabel: 'Clinical Specialty',
    angle: 40.9,
    radiusPercent: 43
  },
  {
    name: 'ENT (Otorhinolaryngology)',
    shortName: 'ENT',
    phase: 'clinical',
    phaseLabel: 'Clinical Specialty',
    angle: 73.6,
    radiusPercent: 43
  },
  {
    name: 'Ophthalmology',
    shortName: 'Ophthal',
    phase: 'clinical',
    phaseLabel: 'Clinical Specialty',
    angle: 106.4,
    radiusPercent: 43
  },
  {
    name: 'Psychiatry',
    shortName: 'Psychiatry',
    phase: 'clinical',
    phaseLabel: 'Clinical Specialty',
    angle: 139.1,
    radiusPercent: 43
  },
  {
    name: 'Dermatology',
    shortName: 'Dermatology',
    phase: 'clinical',
    phaseLabel: 'Clinical Specialty',
    angle: 171.8,
    radiusPercent: 43
  },
  {
    name: 'Radiology',
    shortName: 'Radiology',
    phase: 'clinical',
    phaseLabel: 'Clinical Specialty',
    angle: 204.5,
    radiusPercent: 43
  },
  {
    name: 'Anaesthesiology',
    shortName: 'Anaesthesia',
    phase: 'clinical',
    phaseLabel: 'Clinical Specialty',
    angle: 237.3,
    radiusPercent: 43
  }
];

// Helper to compute Cartesian percentages from polar angles
const CELESTIAL_SUBJECTS: CelestialSubject[] = CELESTIAL_CONFIG.map(item => {
  const rad = (item.angle * Math.PI) / 180;
  const x = 50 + item.radiusPercent * Math.cos(rad);
  const y = 50 + item.radiusPercent * Math.sin(rad);
  return {
    ...item,
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2))
  };
});

export function AtlasSkyModal({ open, onOpenChange, subjects, systems, curriculumSets }: AtlasSkyModalProps) {
  const [, setLocation] = useLocation();
  const [activeFilter, setActiveFilter] = useState<'all' | 'prof_year' | 'pre_clinical' | 'para_clinical' | 'clinical' | 'decay'>('all');
  const [selectedStarName, setSelectedStarName] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { metrics } = useClinicalFrictionEngine();

  const { profile } = useExamProfile();
  const isMBBSProf = Boolean(
    profile.targetExam && 
    (profile.targetExam.toLowerCase().includes('mbbs') || profile.targetExam.toLowerCase().includes('professional exam'))
  );
  const activeYear = profile.currentYear || 'Final MBBS';

  // Clear selected star when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedStarName(null);
    }
  }, [open]);

  // Compute live progress, retentive status, and chronological completion chain for all 19 stars
  const { mappedStars, completedChronologicalChain, globalHealth, decayCount } = useMemo(() => {
    const aliasMap: Record<string, string> = {
      'General Medicine': 'Medicine',
      'Surgery': 'General Surgery',
      'OBGY': 'Obstetrics & Gynaecology'
    };

    let totalDecayAlerts = 0;

    const mapped = CELESTIAL_SUBJECTS.map(star => {
      const dbSubject = subjects.find(s => s.name === star.name || aliasMap[s.name] === star.name);

      let state: 'not_started' | 'in_progress' | 'revising' | 'strong' | 'completed' = 'not_started';
      let progress = 0;
      let dbSubjectId: string | null = null;
      let totalSystemsCount = 0;
      let strongSystemsCount = 0;
      let weakSystemsCount = 0;
      let completedAtTime = 0;
      const metric = metrics.find(m => m.subjectName === star.name || aliasMap[m.subjectName] === star.name);
      const frictionScore = metric?.frictionScore || 0;
      const decayUrgency = metric?.decayUrgency || 'STABLE';

      if (dbSubject) {
        dbSubjectId = dbSubject.id;
        const subSets = curriculumSets.filter(c => c.subjectId === dbSubject.id);
        progress = Math.round(calculateSubjectProgress(dbSubject, systems, subSets));

        const subSystems = systems.filter(s => s.subjectId === dbSubject.id);
        totalSystemsCount = subSystems.length;
        weakSystemsCount = subSystems.filter(s => s.status === 'Weak').length;
        strongSystemsCount = subSystems.filter(s => s.status === 'Strong').length;

        const isRevising = subSystems.some(s => s.revisionState === 'in_progress' || s.status === 'Weak');
        const isCompleted = progress === 100 && subSets.length > 0;

        if (isCompleted) {
          state = 'completed';
          const setTimes = subSets
            .map(s => s.completedAt ? new Date(s.completedAt).getTime() : (s.updatedAt ? new Date(s.updatedAt).getTime() : 0))
            .filter(t => t > 0);
          if (setTimes.length > 0) {
            completedAtTime = Math.max(...setTimes);
          } else if (dbSubject.updatedAt) {
            completedAtTime = new Date(dbSubject.updatedAt).getTime();
          }
        } else if (isRevising || weakSystemsCount > 0) {
          state = 'revising';
          totalDecayAlerts++;
        } else if (progress > 0) {
          state = strongSystemsCount > 0 ? 'strong' : 'in_progress';
        }
      }

      return {
        ...star,
        state,
        progress,
        dbSubjectId,
        totalSystemsCount,
        strongSystemsCount,
        weakSystemsCount,
        completedAtTime,
        frictionScore,
        decayUrgency
      };
    });

    // Chronological constellation chain connecting only 100% completed golden subjects in order
    const completedChain = mapped
      .filter(star => star.state === 'completed')
      .sort((a, b) => {
        if (a.completedAtTime !== b.completedAtTime) {
          return a.completedAtTime - b.completedAtTime;
        }
        return CELESTIAL_SUBJECTS.findIndex(s => s.name === a.name) - CELESTIAL_SUBJECTS.findIndex(s => s.name === b.name);
      });

    const overallProgress = calculateOverallProgress(subjects, systems, curriculumSets);

    return {
      mappedStars: mapped,
      completedChronologicalChain: completedChain,
      globalHealth: overallProgress,
      decayCount: totalDecayAlerts
    };
  }, [subjects, systems, curriculumSets]);

  // Currently selected star details for the HUD Inspector
  const selectedStar = useMemo(() => {
    if (!selectedStarName) return null;
    return mappedStars.find(s => s.name === selectedStarName) || null;
  }, [selectedStarName, mappedStars]);

  const handleNavigateToSubject = (subjectId: string | null) => {
    onOpenChange(false);
    if (subjectId) {
      setLocation(`/subjects/${subjectId}`);
    } else {
      setLocation('/');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideCloseButton 
        className={cn(
          "!max-w-none !w-screen !h-screen !max-h-none !m-0 !p-0 !rounded-none !border-none overflow-hidden flex flex-col [&>button]:hidden",
          "bg-[#030303] text-zinc-100 selection:bg-teal-500/30 font-sans"
        )}
      >
        <DialogTitle className="sr-only">Atlas Sky Astronomical Map</DialogTitle>

        {/* Outer Viewport Container */}
        <div className="relative w-full h-full bg-[#030303] overflow-hidden flex flex-col justify-between p-4 sm:p-6">
          
          {/* Subtle Ambient Nebula Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-900/10 via-transparent to-transparent pointer-events-none z-0" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-teal-500/[0.02] rounded-full blur-[150px] pointer-events-none z-0" />

                    {/* TOP HUD HEADER BAR */}
          <div className="z-30 flex items-center justify-between gap-4 w-full max-w-7xl mx-auto">
            
            {/* Title & Luminosity HUD Indicator */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center backdrop-blur-md shadow-md">
                <Sparkles className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-semibold text-zinc-100 tracking-tight">Atlas Sky</h2>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400">
                    {Math.round(globalHealth)}% Luminosity
                  </span>
                </div>
                <p className="text-xs text-zinc-400 hidden sm:block">
                  Astronomical Map of Medical Retention • 19 MBBS Subjects
                </p>
              </div>
            </div>

            {/* Spotlight Search / Filter Bar */}
            <div className="hidden md:flex relative w-64 lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input 
                placeholder="Query graph (e.g. #Volatile, Pharma)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-teal-500/50 pl-9 rounded-full h-9 text-xs"
              />
            </div>

            {/* Top Right Action Controls */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShareModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-medium transition-all cursor-pointer backdrop-blur-md shadow-xs group"
                title="Share Atlas Sky Constellation"
              >
                <Share2 className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline font-medium">Share Map</span>
              </button>

              <button 
                onClick={() => onOpenChange(false)}
                className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                title="Close Sky View"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* CENTER CELESTIAL CANVAS AREA */}
          <div className="relative flex-1 w-full flex items-center justify-center z-10 my-auto py-2 overflow-hidden">
            <div className="relative w-full aspect-square max-w-[min(100%,68vh,520px)] max-h-[min(100%,68vh,520px)] mx-auto flex items-center justify-center">
              
              {/* SVG Orbit Rings & Chronological Golden Constellation Lines */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none z-10" 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none"
              >
              <defs>
                <filter id="goldenConstellationGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="0.4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <linearGradient id="starlightGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#FCD34D" stopOpacity="0.9" />
                </linearGradient>

                <radialGradient id="starlightJointHalo">
                  <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.8" />
                  <stop offset="40%" stopColor="#F59E0B" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Concentric Orbit Rings */}
              <circle cx="50" cy="50" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.25" strokeDasharray="1 1.5" />
              <circle cx="50" cy="50" r="31" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.25" strokeDasharray="1.5 2" />
              <circle cx="50" cy="50" r="43" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.25" strokeDasharray="2 3" />

              
              {/* Chronological Golden Constellation Lines connecting 100% completed subjects in order of completion */}
              {(()=>{
                 // If there's a search query, draw constellation lines between all matched stars
                 let renderChain = completedChronologicalChain;
                 if (searchQuery.trim().length > 0) {
                    const q = searchQuery.toLowerCase();
                    renderChain = mappedStars.filter(star => {
                        if (q.includes('#volatile') || q.includes('#rescue')) return star.decayUrgency === 'CRITICAL' || star.decayUrgency === 'ELEVATED';
                        if (q.includes('#highyield')) return star.state !== 'not_started';
                        return star.name.toLowerCase().includes(q) || star.shortName.toLowerCase().includes(q);
                    });
                 }
                 return renderChain.map((currStar, index) => {
                    if (index === 0) return null;
                    const prevStar = renderChain[index - 1];
                    const isFiltered = true;
                    return (
                      <g key={`constellation-line-${prevStar.name}-${currStar.name}`}>
                        <line 
                          x1={prevStar.x}
                          y1={prevStar.y}
                          x2={currStar.x}
                          y2={currStar.y}
                          stroke={isFiltered ? "rgba(251, 191, 36, 0.35)" : "rgba(251, 191, 36, 0.08)"}
                          strokeWidth="0.65"
                          filter="url(#goldenConstellationGlow)"
                        />
                        <line 
                          x1={prevStar.x}
                          y1={prevStar.y}
                          x2={currStar.x}
                          y2={currStar.y}
                          stroke={isFiltered ? "url(#starlightGoldGrad)" : "rgba(251, 191, 36, 0.2)"}
                          strokeWidth="0.26"
                          strokeLinecap="round"
                        />
                        {searchQuery.trim().length > 0 && (
                          <line 
                            x1={prevStar.x}
                            y1={prevStar.y}
                            x2={currStar.x}
                            y2={currStar.y}
                            stroke="#FFFFFF"
                            strokeWidth="0.28"
                            strokeDasharray="1 3.5"
                            strokeOpacity="0.6"
                            className="animate-pulse"
                          />
                        )}
                        <circle cx={prevStar.x} cy={prevStar.y} r="0.75" fill="url(#starlightJointHalo)" opacity={isFiltered ? 0.9 : 0.2} />
                        <circle cx={currStar.x} cy={currStar.y} r="0.75" fill="url(#starlightJointHalo)" opacity={isFiltered ? 0.9 : 0.2} />
                      </g>
                    );
                 });
              })()}
            </svg>

            {/* Central North Star (Readiness Anchor) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
              <AtlasNorthStar globalHealth={globalHealth} />
            </div>

            {/* Interactive Subject Stars */}
            <div className="absolute inset-0 w-full h-full z-20">
              {mappedStars.map(star => {
                const isSelected = selectedStarName === star.name;
                
                // Filter matching logic
                let matchesFilter = true;
                if (searchQuery.trim().length > 0) {
                  const q = searchQuery.toLowerCase();
                  // N-to-N Graph Search logic
                  if (q.includes('#volatile') || q.includes('#rescue')) {
                    matchesFilter = star.decayUrgency === 'CRITICAL' || star.decayUrgency === 'ELEVATED';
                  } else if (q.includes('#highyield')) {
                    matchesFilter = star.state !== 'not_started';
                  } else {
                    matchesFilter = star.name.toLowerCase().includes(q) || star.shortName.toLowerCase().includes(q);
                  }
                } else {
                  if (activeFilter === 'prof_year') {
                    matchesFilter = isSubjectInProfScope(star.name, profile.targetExam, activeYear);
                  } else if (activeFilter === 'pre_clinical') {
                    matchesFilter = star.phase === 'pre_clinical';
                  } else if (activeFilter === 'para_clinical') {
                    matchesFilter = star.phase === 'para_clinical';
                  } else if (activeFilter === 'clinical') {
                    matchesFilter = star.phase === 'clinical';
                  } else if (activeFilter === 'decay') {
                    matchesFilter = star.state === 'revising' || star.weakSystemsCount > 0;
                  }
                }

                // SDSR Decay Opacity
                // Mastered topics glow brightly (opacity 1.0). As memory decays (high friction), stars visibly dim (down to 0.25).
                let decayOpacity = 1;
                if (star.state !== 'not_started') {
                  decayOpacity = Math.max(0.25, 1 - (star.frictionScore / 100));
                }


                // Color & glow styling based on retentive state
                let dotColorClass = "bg-zinc-800/40 border border-zinc-700/30 shadow-none";
                let pulseRingClass = "";
                let isDarkMatter = star.state === 'not_started';
                
                if (star.state === 'completed') {
                  dotColorClass = "bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.9)] border-amber-300/50";
                  pulseRingClass = "border-amber-400/40 animate-ping";
                } else if (star.state === 'revising') {
                  // "Supernova" Alert Styling - Intense, unstable amber glow
                  dotColorClass = "bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,1)] border-amber-400";
                  pulseRingClass = "border-amber-500/60 animate-pulse scale-150";
                } else if (star.state === 'strong') {
                  dotColorClass = "bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.8)] border-teal-300/50";
                } else if (star.state === 'in_progress') {
                  dotColorClass = "bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.7)] border-sky-300/50";
                }

                // Smart label position: Upper hemisphere = label above; Lower hemisphere = label below
                const isUpperHemisphere = star.y < 48;

                return (
                  <div
                    key={star.name}
                    style={{ left: `${star.x}%`, top: `${star.y}%`, opacity: matchesFilter ? decayOpacity : 0.05 }}
                    className={cn(
                      "absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500 cursor-pointer group p-2",
                      matchesFilter ? "z-30" : "z-10 hover:opacity-80"
                    )}
                    onClick={() => setSelectedStarName(isSelected ? null : star.name)}
                  >
                    {/* Outer Tap Target Ring */}
                    <div className="relative flex items-center justify-center">
                      
                      {/* Pulse Ring for Active/Completed Stars */}
                      {pulseRingClass && matchesFilter && (
                        <div className={cn("absolute w-6 h-6 rounded-full border", pulseRingClass)} />
                      )}

                      {/* Selection Aura Highlight */}
                      {isSelected && (
                        <div className="absolute w-8 h-8 rounded-full bg-teal-500/20 border border-teal-400/60 animate-pulse" />
                      )}

                      {/* Main Star Node Dot */}
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full transition-all duration-500 border-0.5",
                        isDarkMatter && "w-2 h-2 opacity-40 group-hover:opacity-100 group-hover:scale-125 group-hover:bg-zinc-700",
                        !isDarkMatter && "group-hover:scale-150",
                        dotColorClass,
                        isSelected && "scale-150 ring-2 ring-white"
                      )} />

                      {/* Smart Radial Label Text */}
                      <span className={cn(
                        "absolute left-1/2 -translate-x-1/2 text-xs tracking-wider uppercase font-semibold whitespace-nowrap transition-all duration-300 pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]",
                        isUpperHemisphere ? "-top-4" : "top-3.5",
                        isSelected ? "text-teal-300 font-bold scale-105" : (isDarkMatter ? "text-zinc-600 opacity-0 group-hover:opacity-100 group-hover:text-zinc-400" : "text-zinc-400 group-hover:text-zinc-100")
                      )}>
                        {star.shortName || star.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM HUD INSPECTOR & FILTER BAR CONTAINER */}
          <div className="z-30 w-full max-w-xl mx-auto space-y-3">
            
            {/* Selected Star Details Card (HUD Inspector Drawer) */}
            <AnimatePresence mode="wait">
              {selectedStar ? (
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-[#0a0a0a] border border-teal-500/30 rounded-2xl p-4 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.9)] space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
                        <Brain className="w-3 h-3" />
                        <span>{selectedStar.phaseLabel}</span>
                      </div>
                      <h3 className="text-base font-semibold text-zinc-100 tracking-tight">
                        {selectedStar.name}
                      </h3>
                    </div>

                    <button
                      onClick={() => setSelectedStarName(null)}
                      className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Retention Status Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Syllabus & Retention Progress</span>
                      <span className="font-mono font-semibold text-teal-400">{selectedStar.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-400 rounded-full transition-all duration-500" 
                        style={{ width: `${selectedStar.progress}%` }} 
                      />
                    </div>
                  </div>

                  {/* Systems Breakdown & Focus Action */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-white/[0.06]">
                    <div className="text-xs text-zinc-400 flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                      <span>
                        {selectedStar.totalSystemsCount > 0 
                          ? `${selectedStar.strongSystemsCount} / ${selectedStar.totalSystemsCount} Systems Mastered`
                          : "Curriculum Pending"}
                      </span>
                    </div>

                    <button
                      onClick={() => handleNavigateToSubject(selectedStar.dbSubjectId)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Initiate Focus Revision</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Legend Indicators */}
            <div className="flex items-center justify-center gap-6 py-1 px-4 rounded-xl bg-white/[0.01] border border-white/[0.05] w-fit mx-auto">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 border border-zinc-700/50 opacity-60" />
                <span className="text-xs text-zinc-500 uppercase tracking-tighter font-medium">Dark Matter (Unstarted)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
                <span className="text-xs text-amber-500/80 uppercase tracking-tighter font-semibold">Supernova (High-Alert)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                <span className="text-xs text-amber-400/80 uppercase tracking-tighter font-semibold">Mastered Constellation</span>
              </div>
            </div>

            {/* Medical Phase Filter Strip */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-md">
              {isMBBSProf && (
                <button
                  onClick={() => setActiveFilter(activeFilter === 'prof_year' ? 'all' : 'prof_year')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                    activeFilter === 'prof_year'
                      ? "bg-teal-500 text-slate-950 shadow-md font-bold"
                      : "bg-teal-500/15 text-teal-300 border border-teal-500/30 hover:bg-teal-500/25"
                  )}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{activeYear} Syllabus</span>
                </button>
              )}

              <button
                onClick={() => setActiveFilter('all')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer",
                  activeFilter === 'all'
                    ? "bg-white/10 text-zinc-100 border border-white/10 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                )}
              >
                All 19
              </button>
              <button
                onClick={() => setActiveFilter('pre_clinical')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer",
                  activeFilter === 'pre_clinical'
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                )}
              >
                Pre-Clinical (3)
              </button>
              <button
                onClick={() => setActiveFilter('para_clinical')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer",
                  activeFilter === 'para_clinical'
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                )}
              >
                Para-Clinical (5)
              </button>
              <button
                onClick={() => setActiveFilter('clinical')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer",
                  activeFilter === 'clinical'
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                )}
              >
                Clinical (11)
              </button>
              {decayCount > 0 && (
                <button
                  onClick={() => setActiveFilter('decay')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5",
                    activeFilter === 'decay'
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold"
                      : "text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10"
                  )}
                >
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  <span>Revision Alert ({decayCount})</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </DialogContent>

      <AtlasSkyShareModal 
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        globalHealth={globalHealth}
        mappedStars={mappedStars}
        completedChronologicalChain={completedChronologicalChain}
      />
    </Dialog>
  );
}
