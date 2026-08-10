const fs = require('fs');

const content = `import React, { useMemo, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Subject, StudySystem } from '@/db';
import { CurriculumSet } from '@/db/types';
import { cn } from '@/lib/utils';
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
  const [winSize, setWinSize] = useState({ w: 1000, h: 800 });

  useEffect(() => {
    if (open) {
      setMounted(true);
      setWinSize({ w: window.innerWidth, h: window.innerHeight });
      const handleResize = () => setWinSize({ w: window.innerWidth, h: window.innerHeight });
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    } else {
      setTimeout(() => setMounted(false), 500); // Wait for unmount animation
    }
  }, [open]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!open) return;
    const x = (e.clientX / winSize.w - 0.5) * 20; // -10 to +10 px
    const y = (e.clientY / winSize.h - 0.5) * 20;
    setMousePos({ x, y });
  };

  const { mappedStars, globalHealth } = useMemo(() => {
    // Fallback aliases if DB names differ slightly
    const aliasMap: Record<string, string> = {
      'General Medicine': 'Medicine',
      'Surgery': 'General Surgery',
      'OBGY': 'Obstetrics & Gynaecology'
    };

    const mapped = FIXED_SUBJECTS.map(fixed => {
      // Find matching subject in DB
      let dbSubject = subjects.find(s => s.name === fixed.name || aliasMap[s.name] === fixed.name);
      
      let state: 'not_started' | 'in_progress' | 'revising' | 'strong' | 'completed' = 'not_started';
      let completionTime = 0;
      let progress = 0;

      if (dbSubject) {
        const subSets = curriculumSets.filter(c => c.subjectId === dbSubject!.id);
        const totalTasks = subSets.length * 2;
        let completedTasks = 0;
        subSets.forEach(s => {
          if (s.contentCompleted) completedTasks++;
          if (s.qbankCompleted) completedTasks++;
        });

        progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
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

    // Calculate global health score
    const totalSyllabusTasks = curriculumSets.length * 2;
    let completedSyllabusTasks = 0;
    let totalQbankScore = 0;
    let qbankCount = 0;
    
    curriculumSets.forEach(s => {
      if (s.contentCompleted) completedSyllabusTasks++;
      if (s.qbankCompleted) completedSyllabusTasks++;
      if (s.averageScore) {
        totalQbankScore += s.averageScore;
        qbankCount++;
      }
    });

    const syllabusHealth = totalSyllabusTasks > 0 ? (completedSyllabusTasks / totalSyllabusTasks) * 100 : 0;
    const qbankHealth = qbankCount > 0 ? (totalQbankScore / qbankCount) : 0;
    
    const totalSystems = systems.length;
    let weakSystems = 0;
    let strongSystems = 0;
    systems.forEach(s => {
       if (s.status === 'Weak') weakSystems++;
       if (s.status === 'Strong') strongSystems++;
    });
    
    const statusHealth = totalSystems > 0 ? ((strongSystems + (totalSystems - weakSystems - strongSystems) * 0.5) / totalSystems) * 100 : 0;
    
    // Weighted health score (0-100)
    let health = 0;
    if (totalSyllabusTasks === 0) {
      health = 0;
    } else {
      health = (syllabusHealth * 0.5) + (qbankHealth * 0.3) + (statusHealth * 0.2);
    }

    return { mappedStars: mapped, globalHealth: health };
  }, [subjects, systems, curriculumSets]);

  const completedStars = mappedStars.filter(s => s.state === 'completed').sort((a, b) => a.completionTime - b.completionTime);
  const allCompleted = completedStars.length === 19;
  const northStarOpacity = globalHealth / 100;

  // Circadian bg
  const hour = new Date().getHours();
  let bgGradient = "from-teal-900/20 via-[#050816] to-[#050816]";
  if (hour >= 5 && hour < 8) bgGradient = "from-indigo-900/30 via-[#050816] to-[#050816]";
  else if (hour >= 8 && hour < 17) bgGradient = "from-sky-900/20 via-[#050816] to-[#050816]";
  else if (hour >= 17 && hour < 20) bgGradient = "from-purple-900/20 via-[#050816] to-[#050816]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "!max-w-none !w-screen !h-screen !max-h-none !m-0 !p-0 !rounded-none !border-none overflow-hidden flex flex-col",
        "bg-[#050816] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
      )}>
        <DialogTitle className="sr-only">Atlas Sky Constellation</DialogTitle>
        
        {/* Full Interactive Canvas */}
        <div className="absolute inset-0 w-full h-full" onMouseMove={handleMouseMove}>
          
          {/* Layer 1: Fixed Background Stars */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
            <div 
              className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#ffffff_1px,_transparent_1px)]" 
              style={{ backgroundSize: '60px 60px', transform: 'rotate(15deg)' }} 
            />
             <div 
              className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#ffffff_1.5px,_transparent_1.5px)]" 
              style={{ backgroundSize: '120px 120px', transform: 'rotate(-5deg)' }} 
            />
          </div>

          {/* Layer 2: Circadian Layer */}
          <div className={cn("absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] opacity-80 pointer-events-none", bgGradient)} />

          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Layer 3: Constellation Canvas with Parallax */}
          <motion.div 
            className="relative flex-1 w-full h-full z-10 overflow-hidden"
            animate={{ x: mousePos.x, y: mousePos.y }}
            transition={{ type: "spring", stiffness: 40, damping: 25 }}
          >
            <style>
            {`
              @keyframes drawCurve {
                from { stroke-dasharray: 2000; stroke-dashoffset: 2000; }
                to { stroke-dasharray: 2000; stroke-dashoffset: 0; }
              }
              @keyframes pulseGlow {
                0%, 100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
                50% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
              }
              @keyframes travelLight {
                0% { stroke-dasharray: 20 3000; stroke-dashoffset: 0; }
                100% { stroke-dasharray: 20 3000; stroke-dashoffset: -3000; }
              }
            `}
            </style>

            {/* SVG Canvas for Curves */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox={\`0 0 \${winSize.w} \${winSize.h}\`}>
              {(mounted || open) && completedStars.length > 1 && completedStars.map((star, i) => {
                if (i === 0) return null;
                const prev = completedStars[i - 1];
                const x1 = (prev.x / 100) * winSize.w;
                const y1 = (prev.y / 100) * winSize.h;
                const x2 = (star.x / 100) * winSize.w;
                const y2 = (star.y / 100) * winSize.h;
                
                // Calculate Bezier control point for an elegant curve
                const cx = (x1 + x2) / 2 + (y2 - y1) * 0.15;
                const cy = (y1 + y2) / 2 - (x2 - x1) * 0.15;
                
                const d = \`M \${x1} \${y1} Q \${cx} \${cy} \${x2} \${y2}\`;

                return (
                  <g key={\`path-\${i}\`}>
                    {/* Base faint synapse */}
                    <path
                      d={d}
                      fill="none"
                      stroke={allCompleted ? "rgba(252, 211, 77, 0.15)" : "rgba(20, 184, 166, 0.15)"}
                      strokeWidth="1.5"
                      className="transition-all duration-1000 ease-out"
                      style={{ animation: \`drawCurve 2s ease-out forwards\`, animationDelay: \`\${i * 0.1}s\` }}
                    />
                    {/* Traveling light pulse for active neural flow */}
                    <path
                      d={d}
                      fill="none"
                      stroke={allCompleted ? "rgba(252, 211, 77, 0.8)" : "rgba(45, 212, 191, 0.8)"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="opacity-60"
                      style={{ animation: \`travelLight 3s linear infinite\`, animationDelay: \`\${i * 0.3}s\` }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* HTML Canvas for Stars */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              
              {/* North Star (Centered) */}
              <div 
                className="absolute transition-all duration-1000 flex items-center justify-center"
                style={{ 
                   left: '50%', top: '50%',
                   opacity: Math.max(0.15, northStarOpacity),
                   transform: 'translate(-50%, -50%)',
                }}
              >
                <div 
                  className={cn(
                    "rounded-full transition-all duration-1000",
                    globalHealth >= 90 ? "bg-amber-100 shadow-[0_0_40px_15px_rgba(252,211,77,0.4)]" : "bg-sky-100 shadow-[0_0_30px_10px_rgba(224,242,254,0.3)]"
                  )}
                  style={{
                    width: \`\${10 + (globalHealth / 100) * 8}px\`,
                    height: \`\${10 + (globalHealth / 100) * 8}px\`,
                  }}
                 />
              </div>

              {/* 19 Subject Stars */}
              {mappedStars.map((star, i) => {
                let starClasses = "absolute rounded-full transition-all duration-1000 origin-center flex items-center justify-center ";
                let textClasses = "absolute top-5 left-1/2 -translate-x-1/2 text-[10px] sm:text-[11px] whitespace-nowrap transition-colors duration-1000 font-medium tracking-wide ";
                let animation = '';
                let sizeStyle = {};
                
                switch (star.state) {
                  case 'not_started':
                    starClasses += "bg-slate-600/30";
                    textClasses += "text-slate-500/40";
                    sizeStyle = { width: '4px', height: '4px' };
                    break;
                  case 'in_progress':
                    starClasses += "bg-teal-500/20 border border-teal-500/40 shadow-[0_0_10px_rgba(20,184,166,0.3)]";
                    textClasses += "text-teal-500/70";
                    // Scales organically from 8px to 16px based on progress
                    const size = 8 + (star.progress / 100) * 8; 
                    sizeStyle = { width: \`\${size}px\`, height: \`\${size}px\` };
                    break;
                  case 'strong':
                    starClasses += "bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.6)]";
                    textClasses += "text-teal-400/80";
                    sizeStyle = { width: '8px', height: '8px' };
                    break;
                  case 'revising':
                    starClasses += "bg-teal-300 shadow-[0_0_15px_rgba(94,234,212,0.8)]";
                    animation = 'pulseGlow 3s ease-in-out infinite';
                    textClasses += "text-teal-300";
                    sizeStyle = { width: '10px', height: '10px' };
                    break;
                  case 'completed':
                    starClasses += "bg-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.8)]";
                    animation = 'pulseGlow 4s ease-in-out infinite';
                    textClasses += "text-amber-200/90";
                    sizeStyle = { width: '12px', height: '12px' };
                    break;
                }

                return (
                  <div key={star.name} className="absolute" style={{ left: \`\${star.x}%\`, top: \`\${star.y}%\` }}>
                    <div 
                      className={starClasses} 
                      style={{ 
                        transform: 'translate(-50%, -50%)', 
                        ...sizeStyle, 
                        ...(animation ? { animation } : {}) 
                      }}
                    >
                       {/* Inner core for in_progress to represent percentage fill */}
                       {star.state === 'in_progress' && (
                         <div 
                           className="bg-teal-400 rounded-full opacity-80" 
                           style={{ 
                             width: \`\${Math.max(20, star.progress)}%\`, 
                             height: \`\${Math.max(20, star.progress)}%\` 
                           }} 
                         />
                       )}
                    </div>
                    <span className={textClasses}>{star.name}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-10 left-0 w-full flex justify-center pointer-events-none z-30 opacity-70">
            <div className="text-center px-6 max-w-sm">
              <p className="text-xs sm:text-sm font-medium text-teal-100/60 italic">"The art of medicine consists of amusing the patient while nature cures the disease."</p>
              <p className="text-[10px] text-teal-100/40 uppercase tracking-[0.2em] mt-3 border-t border-white/10 pt-2 inline-block">Your Atlas OS Journey</p>
            </div>
          </div>
      </DialogContent>
    </Dialog>
  );
}
`;

fs.writeFileSync('./artifacts/study-tracker/src/features/dashboard/AtlasSkyModal.tsx', content);
