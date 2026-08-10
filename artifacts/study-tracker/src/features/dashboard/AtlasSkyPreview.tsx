import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { Sparkles } from 'lucide-react';
import { AtlasSkyModal } from './AtlasSkyModal';

export function AtlasSkyPreview() {
  const [modalOpen, setModalOpen] = useState(false);

  // Get completed topics/systems (e.g. anything with 100% progress or mastered)
  const subjects = useLiveQuery(() => db.subjects.toArray()) || [];
  const systems = useLiveQuery(() => db.systems.toArray()) || [];
  const curriculumSets = useLiveQuery(() => (db.curriculumSets || db.revisionSets)?.toArray()) || [];
  const masteredCount = curriculumSets.filter(s => s.contentCompleted && s.qbankCompleted).length;

  // Generate a tiny random star pattern for the preview
  const stars = Array.from({ length: Math.min(masteredCount, 50) }).map((_, i) => {
    return {
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3
    };
  });

  return (
    <>
      <button 
        onClick={() => setModalOpen(true)}
        className="text-muted-foreground hover:text-foreground rounded-full w-10 h-10 flex items-center justify-center transition-colors relative group"
        title="Atlas Sky"
      >
        <Sparkles className="w-5 h-5 group-hover:text-amber-300 transition-colors" />
        {masteredCount > 0 && (
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
        )}
      </button>
      <AtlasSkyModal open={modalOpen} onOpenChange={setModalOpen} subjects={subjects} systems={systems} curriculumSets={curriculumSets} />
    </>
  );
}
