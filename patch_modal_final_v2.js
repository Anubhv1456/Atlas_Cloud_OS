const fs = require('fs');
const file = './artifacts/study-tracker/src/features/dashboard/AtlasSkyModal.tsx';
const content = `import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Subject, StudySystem } from '@/db';
import { CurriculumSet } from '@/db/types';
import { cn } from '@/lib/utils';

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
  
  const mappedStars = useMemo(() => {
    // Fallback aliases if DB names differ slightly
    const aliasMap: Record<string, string> = {
      'General Medicine': 'Medicine',
      'Surgery': 'General Surgery',
      'OBGY': 'Obstetrics & Gynaecology'
    };

    return FIXED_SUBJECTS.map(fixed => {
      // Find matching subject in DB
      let dbSubject = subjects.find(s => s.name === fixed.name || aliasMap[s.name] === fixed.name);
      
      let state: 'not_started' | 'in_progress' | 'revising' | 'strong' | 'completed' = 'not_started';
      let completionTime = 0;

      if (dbSubject) {
        const subSets = curriculumSets.filter(c => c.subjectId === dbSubject!.id);
        const totalTasks = subSets.length * 2;
        let completedTasks = 0;
        subSets.forEach(s => {
          if (s.contentCompleted) completedTasks++;
          if (s.qbankCompleted) completedTasks++;
        });

        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
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
        completionTime
      };
    });
  }, [subjects, systems, curriculumSets]);

  const completedStars = mappedStars.filter(s => s.state === 'completed').sort((a, b) => a.completionTime - b.completionTime);
  const allCompleted = completedStars.length === 19;
  
  // Calculate North Star brightness (0 to 1) based on completion
  const northStarOpacity = completedStars.length / 19;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "!max-w-none !w-screen !h-screen !max-h-none !m-0 !p-0 !rounded-none !border-none overflow-hidden flex flex-col",
        "bg-[#050816] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
      )}>
        <DialogTitle className="sr-only">Atlas Sky Constellation</DialogTitle>
        
        {/* Universal Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(20,184,166,0.06)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay" />
        </div>

        <button 
          onClick={() => onOpenChange(false)}
          className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Constellation Canvas */}
        <div className="relative flex-1 w-full h-full z-10 overflow-hidden">
          <style>
          {\`
            @keyframes drawLine {
              from { stroke-dasharray: 1; stroke-dashoffset: 1; }
              to { stroke-dasharray: 1; stroke-dashoffset: 0; }
            }
            @keyframes subtlePulse {
              0%, 100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
              50% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
            }
            @keyframes bloom {
              0% { box-shadow: 0 0 10px rgba(251,191,36,0.2); }
              100% { box-shadow: 0 0 30px 4px rgba(251,191,36,0.5); }
            }
          \`}
          </style>

          {/* SVG Canvas for Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ filter: 'drop-shadow(0 0 8px rgba(20, 184, 166, 0.4))' }}>
            {completedStars.length > 1 && completedStars.map((star, i) => {
              if (i === 0) return null;
              const prev = completedStars[i - 1];
              return (
                <line 
                  key={\`line-\${i}\`}
                  x1={\`\${prev.x}%\`} 
                  y1={\`\${prev.y}%\`} 
                  x2={\`\${star.x}%\`} 
                  y2={\`\${star.y}%\`} 
                  stroke={allCompleted ? "rgba(252, 211, 77, 0.6)" : "rgba(20, 184, 166, 0.4)"}
                  strokeWidth="1.5"
                  pathLength="1"
                  className="transition-all duration-1000 ease-out"
                  style={{ animation: \`drawLine 1.5s ease-out forwards\`, animationDelay: \`\${i * 0.1}s\` }}
                />
              );
            })}
          </svg>

          {/* HTML Canvas for Stars (z-20 to sit above SVG) */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            {/* North Star */}
            <div 
              className="absolute transition-all duration-1000 flex flex-col items-center gap-2"
              style={{ 
                left: '50%', top: '10%',
                opacity: Math.max(0.15, northStarOpacity),
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div 
                className={cn(
                  "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full",
                  allCompleted ? "bg-amber-100 shadow-[0_0_20px_5px_rgba(252,211,77,0.5)]" : "bg-sky-100 shadow-[0_0_15px_3px_rgba(224,242,254,0.4)]"
                )} 
              />
              <span className="text-[9px] font-medium tracking-[0.2em] uppercase text-white/40">The Competent Physician</span>
            </div>

            {/* 19 Subject Stars */}
            {mappedStars.map((star, i) => {
              let starClasses = "absolute rounded-full transition-all duration-1000 origin-center ";
              let textClasses = "absolute top-5 left-1/2 -translate-x-1/2 text-[10px] sm:text-[11px] whitespace-nowrap transition-colors duration-1000 font-medium tracking-wide ";
              let animation = '';
              
              switch (star.state) {
                case 'not_started':
                  starClasses += "w-[3px] h-[3px] bg-slate-600/30";
                  textClasses += "text-slate-500/40";
                  break;
                case 'in_progress':
                  starClasses += "w-1 h-1 bg-teal-500/60 shadow-[0_0_8px_rgba(20,184,166,0.4)]";
                  textClasses += "text-teal-500/60";
                  break;
                case 'strong':
                  starClasses += "w-1.5 h-1.5 bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.6)]";
                  textClasses += "text-teal-400/80";
                  break;
                case 'revising':
                  starClasses += "w-1.5 h-1.5 bg-teal-300 shadow-[0_0_15px_rgba(94,234,212,0.8)]";
                  animation = 'subtlePulse 3s ease-in-out infinite';
                  textClasses += "text-teal-300";
                  break;
                case 'completed':
                  starClasses += "w-2 h-2 bg-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.8)]";
                  animation = 'bloom 2s ease-out forwards';
                  textClasses += "text-amber-200/80";
                  break;
              }

              return (
                <div key={star.name} className="absolute" style={{ left: \`\${star.x}%\`, top: \`\${star.y}%\` }}>
                  <div className={starClasses} style={{ transform: 'translate(-50%, -50%)', ...(animation ? { animation } : {}) }} />
                  <span className={textClasses}>{star.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
\`
fs.writeFileSync(file, content);
