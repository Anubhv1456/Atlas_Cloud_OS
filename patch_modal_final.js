const fs = require('fs');
const file = './artifacts/study-tracker/src/features/dashboard/AtlasSkyModal.tsx';
const content = `import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, Sparkles } from 'lucide-react';
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
  { name: 'Medicine', x: 50, y: 35 },
  { name: 'General Surgery', x: 35, y: 40 },
  { name: 'Anatomy', x: 65, y: 40 },
  { name: 'Physiology', x: 25, y: 50 },
  { name: 'Biochemistry', x: 75, y: 50 },
  { name: 'Pharmacology', x: 40, y: 55 },
  { name: 'Pathology', x: 60, y: 55 },
  { name: 'Microbiology', x: 20, y: 65 },
  { name: 'Obstetrics & Gynaecology', x: 80, y: 65 },
  { name: 'Pediatrics', x: 35, y: 70 },
  { name: 'Orthopedics', x: 65, y: 70 },
  { name: 'ENT (Otorhinolaryngology)', x: 50, y: 75 },
  { name: 'Ophthalmology', x: 25, y: 80 },
  { name: 'Psychiatry', x: 75, y: 80 },
  { name: 'Dermatology', x: 40, y: 85 },
  { name: 'Radiology', x: 60, y: 85 },
  { name: 'Anaesthesiology', x: 20, y: 90 },
  { name: 'Community Medicine (PSM)', x: 80, y: 90 },
  { name: 'Forensic Medicine & Toxicology', x: 50, y: 95 }
];

export function AtlasSkyModal({ open, onOpenChange, subjects, systems, curriculumSets }: AtlasSkyModalProps) {
  
  const mappedStars = useMemo(() => {
    // Fallback aliases if DB names differ slightly
    const aliasMap: Record<string, string> = {
      'General Medicine': 'Medicine',
      'Surgery': 'General Surgery',
      'OBGY': 'Obstetrics & Gynaecology'
    };

    const stars = FIXED_SUBJECTS.map(fixed => {
      // Find matching subject in DB
      let dbSubject = subjects.find(s => s.name === fixed.name || aliasMap[s.name] === fixed.name);
      
      let state = 'not_started';
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

    return stars;
  }, [subjects, systems, curriculumSets]);

  const completedStars = mappedStars.filter(s => s.state === 'completed').sort((a, b) => a.completionTime - b.completionTime);
  const allCompleted = completedStars.length === 19;
  
  // Calculate North Star brightness (0 to 1) based on completion
  const northStarOpacity = completedStars.length / 19;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "!max-w-none !w-screen !h-screen !max-h-none !m-0 !p-0 !rounded-none !border-none overflow-hidden flex flex-col bg-slate-950",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
      )}>
        <DialogTitle className="sr-only">Atlas Sky Constellation</DialogTitle>
        
        {/* Universal Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
        </div>

        <button 
          onClick={() => onOpenChange(false)}
          className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-slate-900/60 backdrop-blur-md border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Constellation Canvas */}
        <div className="relative flex-1 w-full h-full z-10 overflow-hidden">
          <style>
          {\`
            @keyframes drawLine {
              from { stroke-dasharray: 2000; stroke-dashoffset: 2000; }
              to { stroke-dasharray: 2000; stroke-dashoffset: 0; }
            }
          \`}
        </style>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.2))' }}>
            {/* The Personal Journey Mechanic (Lines) */}
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
                  stroke={allCompleted ? "#FCD34D" : "rgba(16, 185, 129, 0.4)"}
                  strokeWidth="1.5"
                  className="transition-all duration-1000"
                  style={{ animation: \`drawLine 2s ease-out forwards\` }}
                />
              );
            })}
          </svg>

          {/* North Star */}
          <div 
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 flex flex-col items-center gap-2"
            style={{ 
              left: '50%', top: '15%',
              opacity: Math.max(0.1, northStarOpacity),
              boxShadow: allCompleted ? '0 0 40px 10px rgba(252, 211, 77, 0.4)' : \`0 0 \${20 * northStarOpacity}px \${5 * northStarOpacity}px rgba(255,255,255,\${northStarOpacity})\`
            }}
          >
            <div className={\`w-2 h-2 sm:w-3 sm:h-3 rounded-full \${allCompleted ? 'bg-amber-300' : 'bg-white'}\`} />
            <span className="text-[10px] font-medium tracking-widest uppercase text-slate-300/50">The Competent Physician</span>
          </div>

          {/* 19 Subject Stars */}
          {mappedStars.map((star, i) => {
            let starClasses = "absolute rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ";
            let textClasses = "absolute top-4 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] whitespace-nowrap transition-colors duration-1000 font-medium tracking-wide ";
            
            switch (star.state) {
              case 'not_started':
                starClasses += "w-1.5 h-1.5 bg-slate-600/40";
                textClasses += "text-slate-600/40";
                break;
              case 'in_progress':
                starClasses += "w-2 h-2 bg-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]";
                textClasses += "text-emerald-500/60";
                break;
              case 'strong':
                starClasses += "w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]";
                textClasses += "text-emerald-400";
                break;
              case 'revising':
                starClasses += "w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-300 shadow-[0_0_15px_rgba(110,231,183,0.8)] animate-pulse";
                textClasses += "text-emerald-300";
                break;
              case 'completed':
                starClasses += "w-3 h-3 sm:w-4 sm:h-4 bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)]";
                textClasses += "text-amber-400/80";
                break;
            }

            return (
              <div key={star.name} className="absolute" style={{ left: \`\${star.x}%\`, top: \`\${star.y}%\` }}>
                <div className={starClasses} />
                <span className={textClasses}>{star.name}</span>
              </div>
            );
          })}
        </div>

      </DialogContent>
    </Dialog>
  );
}
`;
fs.writeFileSync(file, content);
