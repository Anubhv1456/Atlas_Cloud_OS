import { useLexicon } from '@/lib/lexicon';
import React, { useState } from 'react';
import { useSubjects, useAllSystems, updateSubjectsOrder, db } from '@/db';
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
  ShieldAlert,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { useExamProfile } from '@/hooks/useExamProfile';
import { TargetExamModal } from '@/components/TargetExamModal';
import { MistakesNotebookCard } from '@/features/mistakes/MistakesNotebookCard';
import { Button } from '@/components/ui/button';
import { AddDialog } from '@/components/AddDialog';
import Analytics from '@/features/analytics/Analytics';
import { loadUniversalOntology } from '@/lib/exam-presets';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SubjectRadarPage() {
  const lexicon = useLexicon();

  const [activeTab, setActiveTab] = useState<'curriculum' | 'diagnostics'>('curriculum');
  const subjects = useSubjects();
  const systems = useAllSystems();
  const { profile, isConfigured, updateProfile } = useExamProfile();
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const isUSMLE = profile.targetExam?.toLowerCase().includes('usmle');

  const handleSubjectDragEnd = (result: DropResult) => {
    if (!result.destination || !subjects) return;
    const items = Array.from(subjects);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    updateSubjectsOrder(items);
  };

  const handleSwitchExamTrack = async (trackName: string) => {
    try {
      setIsSyncing(true);
      await updateProfile({
        targetExam: trackName,
        curriculum: trackName.includes('USMLE') 
          ? 'Organ-System Based (Cardiology, Neurology, etc.)'
          : 'Subject-Based (Anatomy, Pharmacology, Pathology, etc.)'
      });
      db.switchWorkspace(trackName);
      await loadUniversalOntology({ targetExam: trackName, force: false });
      toast.success(`Active Track: ${trackName}`, {
        description: trackName.includes('USMLE') 
          ? '10 Clinical Organ Systems active with complete 280+ topics.'
          : 'Curriculum portfolio loaded.'
      });
    } catch (e) {
      toast.error('Failed to switch exam track: ' + String(e));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncBlueprint = async () => {
    try {
      setIsSyncing(true);
      const res = await loadUniversalOntology({
        targetExam: profile.targetExam || 'USMLE Step 1',
        force: false,
        showToast: false
      });
      toast.success('Curriculum Blueprint Synchronized', {
        description: `Verified ${res.count} subjects and organ systems against the universal ontology.`
      });
    } catch (e) {
      toast.error('Sync failed: ' + String(e));
    } finally {
      setIsSyncing(false);
    }
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
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
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

      {/* ── Optional Blueprint Notification Banner if on NEET-PG track ── */}
      {!isUSMLE && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-foreground">
                Looking for the 10 Clinical Organ Systems blueprint?
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You are currently viewing the subject-based track ({subjects?.length || 0} subjects). Switch to USMLE Step 1 to explore CVS, RESP, RENAL, GI, ENDO, REPRO, NEURO, MSK, HEME, and PSYCH.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => handleSwitchExamTrack('USMLE Step 1')}
            className="text-xs font-bold px-3.5 h-8 rounded-xl bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs"
          >
            Switch to USMLE Step 1 →
          </Button>
        </div>
      )}

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
            <span className="text-xs font-mono px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground ml-1">
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
