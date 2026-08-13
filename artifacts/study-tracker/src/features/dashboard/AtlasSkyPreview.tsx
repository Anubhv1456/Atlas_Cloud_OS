import React, { useState } from 'react';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { Sparkles } from 'lucide-react';
import { AtlasSkyModal } from './AtlasSkyModal';
import { calculateOverallProgress } from '@/lib/progress';

export function AtlasSkyPreview() {
  const [modalOpen, setModalOpen] = useState(false);

  const subjects = useLiveQuery(() => db.subjects.toArray()) || [];
  const systems = useLiveQuery(() => db.systems.toArray()) || [];
  const curriculumSets = useLiveQuery(() => (db.curriculumSets || db.revisionSets)?.toArray()) || [];
  
  const overallProgress = Math.round(calculateOverallProgress(subjects, systems, curriculumSets));

  return (
    <>
      <button 
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] dark:bg-white/[0.04] border border-border/60 hover:border-teal-500/40 hover:bg-teal-500/10 text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer group shadow-2xs"
        title="Open Atlas Sky Constellation Map"
      >
        <Sparkles className="w-3.5 h-3.5 text-teal-500 group-hover:text-amber-400 group-hover:scale-110 transition-all" />
        <span className="font-semibold text-foreground">Atlas Sky</span>
        <span className="text-[10px] font-mono text-teal-500 bg-teal-500/10 px-1.5 py-0.5 rounded-md border border-teal-500/20">
          {overallProgress}% Lit
        </span>
      </button>
      
      <AtlasSkyModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        subjects={subjects} 
        systems={systems} 
        curriculumSets={curriculumSets} 
      />
    </>
  );
}
