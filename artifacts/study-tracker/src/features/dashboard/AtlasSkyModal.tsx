import { AtlasNorthStar } from '@/components/AtlasNorthStar';
import React, { useMemo, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Subject, StudySystem } from '@/db';
import { CurriculumSet } from '@/db/types';
import { cn } from '@/lib/utils';
import { calculateSubjectProgress, calculateOverallProgress } from '@/lib/progress';
import { motion } from 'framer-motion';

interface AtlasSkyModalProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  subjects: Subject[];
  systems: StudySystem[];
  curriculumSets: CurriculumSet[];
}

const FIXED_SUBJECTS = [
  { name: 'Anatomy', x: 28, y: 28 },
  { name: 'Physiology', x: 68, y: 32 },
  { name: 'Biochemistry', x: 48, y: 42 },
  { name: 'Pathology', x: 78, y: 52 },
  { name: 'Pharmacology', x: 32, y: 58 },
  { name: 'Microbiology', x: 58, y: 68 },
  { name: 'Forensic Medicine & Toxicology', x: 18, y: 72 },
  { name: 'Community Medicine (PSM)', x: 42, y: 82 },
  { name: 'ENT (Otorhinolaryngology)', x: 72, y: 82 },
  { name: 'Ophthalmology', x: 82, y: 38 },
  { name: 'Medicine', x: 52, y: 58 },
  { name: 'General Surgery', x: 22, y: 42 },
  { name: 'Obstetrics & Gynaecology', x: 62, y: 45 },
  { name: 'Pediatrics', x: 85, y: 70 },
  { name: 'Orthopedics', x: 12, y: 52 },
  { name: 'Psychiatry', x: 55, y: 22 },
  { name: 'Dermatology', x: 38, y: 22 },
  { name: 'Radiology', x: 38, y: 70 },
  { name: 'Anaesthesiology', x: 62, y: 85 }
];

export function AtlasSkyModal({ open, onOpenChange, subjects, systems, curriculumSets }: AtlasSkyModalProps) {
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState({ x: -1000, y: -1000 });
  const [winSize, setWinSize] = useState({ w: 1000, h: 800 });

  useEffect(() => {
    if (open) {
      setMounted(true);
      setWinSize({ w: window.innerWidth, h: window.innerHeight });
      const handleResize = () => setWinSize({ w: window.innerWidth, h: window.innerHeight });
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    } else {
      const timer = setTimeout(() => setMounted(false), 500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!open) return;
    const x = (e.clientX / winSize.w - 0.5) * 20; 
    const y = (e.clientY / winSize.h - 0.5) * 20;
    setMousePos({ x, y });
    setCursorPos({ x: e.clientX, y: e.clientY });
  };

  const { mappedStars, globalHealth } = useMemo(() => {
    const aliasMap: Record<string, string> = {
      'General Medicine': 'Medicine',
      'Surgery': 'General Surgery',
      'OBGY': 'Obstetrics & Gynaecology'
    };

    const mapped = FIXED_SUBJECTS.map(fixed => {
      let dbSubject = subjects.find(s => s.name === fixed.name || aliasMap[s.name] === fixed.name);
      
      let state: 'not_started' | 'in_progress' | 'revising' | 'strong' | 'completed' = 'not_started';
      let completionTime = 0;
      let progress = 0;

      if (dbSubject) {
        const subSets = curriculumSets.filter(c => c.subjectId === dbSubject!.id);
        progress = calculateSubjectProgress(dbSubject, systems, subSets);
        const totalTasks = subSets.length * 2;
        const isCompleted = progress === 100 && totalTasks > 0;

        const subSystems = systems.filter(s => s.subjectId === dbSubject!.id);
        const isRevising = subSystems.some(s => s.revisionState === 'in_progress');
        const isStrong = subSystems.some(s => s.status === 'Strong') && !subSystems.some(s => s.status === 'Weak');

        if (isCompleted) {
          state = 'completed';
          completionTime = Math.max(...subSystems.map(s => s.completionDate ? new Date(s.completionDate).getTime() : 0));
        } else if (isRevising) {
          state = 'revising';
        } else if (progress > 0) {
          state = isStrong ? 'strong' : 'in_progress';
        }
      }

      return {
        ...fixed,
        state,
        completionTime,
        progress
      };
    });

    const syllabusProgress = calculateOverallProgress(subjects, systems, curriculumSets);
    let totalQbankScore = 0;
    let qbankCount = 0;
    
    curriculumSets.forEach(s => {
      if (s.averageScore) {
        totalQbankScore += s.averageScore;
        qbankCount++;
      }
    });

    const syllabusHealth = syllabusProgress;
    const qbankHealth = qbankCount > 0 ? (totalQbankScore / qbankCount) : 0;
    
    const totalSystems = systems.length;
    let weakSystems = 0;
    let strongSystems = 0;
    systems.forEach(s => {
       if (s.status === 'Weak') weakSystems++;
       if (s.status === 'Strong') strongSystems++;
    });
    
    const statusHealth = totalSystems > 0 ? ((strongSystems + (totalSystems - weakSystems - strongSystems) * 0.5) / totalSystems) * 100 : 0;
    
    let health = 0;
    if (syllabusProgress === 0 && qbankHealth === 0 && statusHealth === 0) {
      health = 0;
    } else {
      health = (syllabusHealth * 0.5) + (qbankHealth * 0.3) + (statusHealth * 0.2);
    }

    
    const sortedMapped = mapped.sort((a, b) => {
      const distA = Math.sqrt(Math.pow(a.x - 50, 2) + Math.pow(a.y - 50, 2));
      const distB = Math.sqrt(Math.pow(b.x - 50, 2) + Math.pow(b.y - 50, 2));
      return distA - distB;
    });
    return { mappedStars: sortedMapped, globalHealth: health };
  }, [subjects, systems, curriculumSets]);

  const completedStars = mappedStars.filter(s => s.state === 'completed').sort((a, b) => a.completionTime - b.completionTime);
  const allCompleted = completedStars.length === 19;
  const northStarOpacity = globalHealth / 100;

    return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className={cn(
        "!max-w-none !w-screen !h-screen !max-h-none !m-0 !p-0 !rounded-none !border-none overflow-hidden flex flex-col [&>button]:hidden",
        "bg-[#030303] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
      )}>
        <DialogTitle className="sr-only">Atlas Sky Constellation</DialogTitle>
        
        <div className="absolute inset-0 w-full h-full bg-[#030303] overflow-hidden" onMouseMove={handleMouseMove}>
          
          {/* Subtle desaturated teal radial gradient only at the absolute center */}
          <div className={cn(
            "absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] opacity-60 pointer-events-none",
            allCompleted ? "from-amber-900/10 via-transparent to-transparent" : "from-teal-900/10 via-transparent to-transparent"
          )} />

          {/* Distant ambient noise/dust (moves very slowly) */}
          <motion.div 
            className="absolute inset-[-10%] z-0 pointer-events-none"
            animate={{ x: mousePos.x * 0.2, y: mousePos.y * 0.2 }}
            transition={{ type: "spring", stiffness: 40, damping: 25 }}
          >
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
            <div 
              className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#ffffff_1px,_transparent_1px)]"
              style={{ backgroundSize: '60px 60px', transform: 'rotate(15deg)' }} 
            />
             <div 
              className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#ffffff_1.5px,_transparent_1.5px)]"
              style={{ backgroundSize: '120px 120px', transform: 'rotate(-5deg)' }} 
            />
          </motion.div>

          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-6 right-6 sm:top-8 sm:right-8 z-50 w-12 h-12 rounded-full bg-transparent flex items-center justify-center text-slate-500/30 hover:text-white hover:bg-white/5 transition-all duration-500 hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
          >
            <X className="w-5 h-5" />
          </button>

          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes drawCurve {
              from { stroke-dasharray: 2000; stroke-dashoffset: 2000; }
              to { stroke-dasharray: 2000; stroke-dashoffset: 0; }
            }
            @keyframes pulseGlowSlow {
              0%, 100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 15px 2px rgba(251,191,36,0.4); }
              50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); box-shadow: 0 0 20px 4px rgba(251,191,36,0.6); }
            }
            @keyframes pulseFlicker {
              0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 8px 1px rgba(94,234,212,0.4); }
              50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); box-shadow: 0 0 12px 2px rgba(94,234,212,0.6); }
            }
            @keyframes travelLight {
              0% { stroke-dasharray: 0 3000; stroke-dashoffset: 0; opacity: 0; }
              10% { opacity: 0.8; }
              90% { opacity: 0.8; }
              100% { stroke-dasharray: 150 3000; stroke-dashoffset: -800; opacity: 0; }
            }
            @keyframes sonarRing {
              0% { transform: scale(0.5); opacity: 0.8; }
              100% { transform: scale(3.5); opacity: 0; }
            }
            @keyframes igniteStar {
              0% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
              50% { opacity: 1; transform: translate(-50%, -50%) scale(1.5); }
              100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            @keyframes fadeNode {
              0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
              100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
          `}} />

          {/* The constellation SVG lines (moves at medium speed) */}
          <motion.div 
            className="absolute inset-[-5%] z-10 pointer-events-none"
            animate={{ x: mousePos.x * 0.6, y: mousePos.y * 0.6 }}
            transition={{ type: "spring", stiffness: 40, damping: 25 }}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox={`0 0 ${winSize.w * 1.1} ${winSize.h * 1.1}`}>
              {(mounted || open) && mappedStars.length > 1 && mappedStars.map((star, i) => {
                if (i === 0) return null;
                // Connect to a previous star that is closer to center to form a web
                const prev = mappedStars[Math.max(0, i - 1)]; 
                const x1 = (prev.x / 100) * (winSize.w * 1.1);
                const y1 = (prev.y / 100) * (winSize.h * 1.1);
                const x2 = (star.x / 100) * (winSize.w * 1.1);
                const y2 = (star.y / 100) * (winSize.h * 1.1);
                
                const cx = (x1 + x2) / 2 + (y2 - y1) * 0.15;
                const cy = (y1 + y2) / 2 - (x2 - x1) * 0.15;
                
                const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;

                return (
                  <g key={`path-${i}`}>
                    <path
                      d={d}
                      fill="none"
                      stroke={allCompleted ? "rgba(252, 211, 77, 0.05)" : "rgba(20, 184, 166, 0.05)"}
                      strokeWidth="1.5"
                      className="transition-all duration-1000 ease-out"
                      style={{ animation: `drawCurve 2.5s cubic-bezier(0.2, 0, 0, 1) forwards`, animationDelay: `${1 + (Math.sqrt(Math.pow(x1/winSize.w*100 - 50, 2) + Math.pow(y1/winSize.h*100 - 50, 2))/70) * 1.5}s`, strokeDasharray: 2000, strokeDashoffset: 2000 }}
                    />
                    <path
                      d={d}
                      fill="none"
                      stroke={allCompleted ? "rgba(252, 211, 77, 0.3)" : "rgba(45, 212, 191, 0.3)"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="opacity-60"
                      style={{ animation: `travelLight 8s ease-in-out forwards infinite`, animationDelay: `${2.5 + (Math.sqrt(Math.pow(x1/winSize.w*100 - 50, 2) + Math.pow(y1/winSize.h*100 - 50, 2))/70) * 2}s`, strokeDasharray: 0, opacity: 0 }}
                    />
                  </g>
                );
              })}
            </svg>
          </motion.div>

          {/* Interactive star nodes (moves fastest) */}
          <motion.div 
            className="absolute inset-[-5%] z-20 pointer-events-none"
            animate={{ x: mousePos.x, y: mousePos.y }}
            transition={{ type: "spring", stiffness: 40, damping: 25 }}
          >
              <div 
                className="absolute transition-all duration-1000 flex items-center justify-center"
                style={{ 
                   left: '50%', top: '50%',
                   opacity: 0,
                   transform: 'translate(-50%, -50%) scale(0)',
                   animation: 'igniteStar 1.5s cubic-bezier(0.1, 0, 0.9, 1) forwards'
                }}
              >
                {/* Sonar Ring */}
                <div 
                  className="absolute rounded-full border border-teal-500/20"
                  style={{
                    width: '120px', height: '120px',
                    animation: 'sonarRing 10s cubic-bezier(0.1, 0, 0.9, 1) 1.5s infinite'
                  }}
                />
                <AtlasNorthStar globalHealth={globalHealth} />
              </div>

              {mappedStars.map((star, i) => {
                // Calculate proximity
                const containerX = -0.05 * winSize.w + mousePos.x;
                const containerY = -0.05 * winSize.h + mousePos.y;
                const starScreenX = containerX + (star.x / 100) * (1.1 * winSize.w);
                const starScreenY = containerY + (star.y / 100) * (1.1 * winSize.h);
                
                const dx = cursorPos.x - starScreenX;
                const dy = cursorPos.y - starScreenY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                const maxDist = 180;
                const isHovered = dist < maxDist;
                const labelOpacity = isHovered ? Math.max(0, 1 - dist / maxDist) : 0;
                // Add a tiny baseline opacity if not hovered
                const finalLabelOpacity = Math.max(0.05, labelOpacity);
                const isNearest = isHovered && dist < 60; // Very close
                
                let starClasses = "absolute rounded-full transition-all duration-1000 origin-center flex items-center justify-center ";
                let textClasses = "absolute top-4 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.25em] font-medium whitespace-nowrap transition-all duration-500 ";
                let animation = '';
                let sizeStyle = {};
                
                const distToCenter = Math.sqrt(Math.pow(star.x - 50, 2) + Math.pow(star.y - 50, 2));
                const enterDelay = 1.2 + (distToCenter / 70) * 1.5;
                const enterAnim = `fadeNode 1s ease-out forwards ${enterDelay}s`;
                
                
                switch (star.state) {
                  case 'not_started':
                    starClasses += "bg-white/10";
                    textClasses += "text-slate-500/30";
                    sizeStyle = { width: '1.5px', height: '1.5px' };
                    break;
                  case 'in_progress':
                    starClasses += "bg-white/40 shadow-[0_0_6px_rgba(20,184,166,0.3)]";
                    textClasses += "text-teal-500/50";
                    sizeStyle = { width: '2px', height: '2px' };
                    break;
                  case 'strong':
                    starClasses += "bg-white/80 shadow-[0_0_8px_rgba(45,212,191,0.5)]";
                    textClasses += "text-teal-200/60";
                    sizeStyle = { width: '2px', height: '2px' };
                    break;
                  case 'revising':
                    starClasses += "bg-white shadow-[0_0_10px_rgba(94,234,212,0.6)]";
                    animation = 'pulseFlicker 4s ease-in-out infinite';
                    textClasses += "text-teal-100/80";
                    sizeStyle = { width: '2px', height: '2px' };
                    break;
                  case 'completed':
                    starClasses += "bg-white shadow-[0_0_15px_rgba(251,191,36,0.6)]";
                    animation = 'pulseGlowSlow 8s ease-in-out infinite';
                    textClasses += "text-amber-100/90";
                    sizeStyle = { width: '2px', height: '2px' };
                    break;
                }

                return (
                  <div key={star.name} className="absolute" style={{ left: `${star.x}%`, top: `${star.y}%`, opacity: 0, animation: `fadeNode 1.5s cubic-bezier(0.2, 0, 0, 1) forwards ${enterDelay}s` }}>
                    <div 
                      className={starClasses} 
                      style={{
                        transform: `translate(-50%, -50%) scale(${isNearest ? 1.5 : 1})`,
                        ...sizeStyle,
                        animation
                      }}
                    >
                    </div>
                    <span className={textClasses} style={{ opacity: finalLabelOpacity }}>{star.name}</span>
                  </div>
                );
              })}
            </motion.div>

          {/* Heavy Vignette (z-30 to cover edges) */}
          <div className="absolute inset-0 z-30 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#030303_100%)] opacity-100" />

        </div>
        <div className="absolute bottom-10 left-0 w-full flex justify-center pointer-events-none z-30 opacity-70">
            <div className="text-center px-6 max-w-sm">
              <p className="text-sm sm:text-base font-serif text-teal-100/70 italic tracking-wide">"The art of medicine consists of amusing the patient while nature cures the disease."</p>
              <p className="text-[10px] text-teal-100/40 uppercase tracking-[0.2em] mt-3 border-t border-white/10 pt-2 inline-block">Your Atlas OS Journey</p>
            </div>
          </div>
      </DialogContent>
    </Dialog>
  );
}
