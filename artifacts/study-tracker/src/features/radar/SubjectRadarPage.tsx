import { useLexicon } from '@/lib/lexicon';
import React, { useState } from 'react';
import { useSubjects, useAllSystems, updateSubjectsOrder } from '@/db';
import { SubjectsGrid } from '@/features/dashboard/SubjectsGrid';
import { DropResult } from '@hello-pangea/dnd';
import { 
  LayoutGrid, 
  BookOpen, 
  BarChart3, 
  Target, 
  Plus, 
  Sparkles, 
  TrendingUp, 
  ShieldAlert 
} from 'lucide-react';
import { useExamProfile } from '@/hooks/useExamProfile';
import { TargetExamModal } from '@/components/TargetExamModal';
import { MistakesNotebookCard } from '@/features/mistakes/MistakesNotebookCard';
import { Button } from '@/components/ui/button';
import { AddDialog } from '@/components/AddDialog';
import Analytics from '@/features/analytics/Analytics';
import { cn } from '@/lib/utils';

export default function SubjectRadarPage() {
  const lexicon = useLexicon();

  const [activeTab, setActiveTab] = useState<'curriculum' | 'diagnostics'>('curriculum');
  const subjects = useSubjects();
  const systems = useAllSystems();
  const { profile, isConfigured } = useExamProfile();
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);

  const handleSubjectDragEnd = (result: DropResult) => {
    if (!result.destination || !subjects) return;
    const items = Array.from(subjects);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    updateSubjectsOrder(items);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground px-3.5 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] md:pb-12 max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full overflow-x-hidden">
      {/* ── Curriculum Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <LayoutGrid className="w-4 h-4" />
            </span>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Medical Curriculum
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Curriculum Portfolio
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
            High-yield overview across all medical subjects, curriculum units, memory retention, and active clinical rules.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setExamModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border/80 hover:border-primary/40 text-xs font-semibold text-foreground transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            title="Recalibrate Exam Target"
          >
            <Target className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate max-w-[140px] sm:max-w-none">
              {isConfigured ? profile.targetExam : 'Set Target Exam'}
            </span>
          </button>

          {activeTab === 'curriculum' ? (
            <Button
              size="sm"
              onClick={() => setAddSubjectOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs gap-1 cursor-pointer px-3 h-9"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => window.dispatchEvent(new CustomEvent('open-score-log-modal'))}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs gap-1 cursor-pointer px-3 h-9"
            >
              <Plus className="w-4 h-4" />
              <span>Log Score</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Segmented View Switcher ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center p-1 rounded-2xl bg-muted/40 border border-border/80 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('curriculum')}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeTab === 'curriculum'
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-500" />
            <span>All Subjects</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground ml-1">
              {subjects?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('diagnostics')}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeTab === 'diagnostics'
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span>Analytics & Readiness</span>
          </button>
        </div>
      </div>

      {/* ── Main Tab Content ─────────────────────────────────────────────── */}
      {activeTab === 'curriculum' ? (
        <div className="space-y-6">
          {/* {lexicon.mistakesJournal} Mistakes & Traps Card */}
          <MistakesNotebookCard />

          {/* Subjects Grid & Portfolio */}
          <div className="pt-2">
            <SubjectsGrid
              subjects={subjects || []}
              systems={systems || []}
              handleSubjectDragEnd={handleSubjectDragEnd}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Analytics />
        </div>
      )}

      {/* Target Exam and Add Subject Modals */}
      <TargetExamModal open={examModalOpen} onOpenChange={setExamModalOpen} />
      <AddDialog open={addSubjectOpen} onOpenChange={setAddSubjectOpen} type="subject" />
    </div>
  );
}
