import { normalizeName } from "@/lib/exam-presets";
import { Link } from "wouter";
import { ChevronRight, MoreVertical, PencilLine, Trash2, Merge, AlertTriangle, BookOpen } from "lucide-react";
import { Subject, StudySystem, db, updateSubject, deleteSubject, isRevisionDue } from "@/db";
import { toast } from "sonner";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useLiveQuery } from '@/hooks/useLiveQuery';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

import { calculateSubjectProgress } from "@/lib/progress";
import { SafeDeleteSubjectDialog } from "@/components/SafeDeleteSubjectDialog";
import { evaluateSubjectProgress, SubjectProgressScore, mergeAndDeduplicateAllSubjects } from "@/lib/subjectDeduplication";

interface SubjectCardProps {
  subject: Subject;
  systems: StudySystem[];
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

import { useLexicon } from '@/lib/lexicon';

export function SubjectCard({
  subject,
  systems = [],
  dragHandleProps,
}: SubjectCardProps) {
  const lexicon = useLexicon();
  const [showSafeDelete, setShowSafeDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const safeSystems = Array.isArray(systems) ? systems : [];
  const systemIds = safeSystems.map(s => s?.id!).filter(Boolean);
  
  const curriculumSets = useLiveQuery(
    async () => {
      const table = db.curriculumSets || db.revisionSets;
      if (!table || systemIds.length === 0 || !subject?.id) return [];
      return await table.where('subjectId').equals(subject.id).toArray().then(arr => (arr || []).filter(s => s && !s.deletedAt));
    },
    [subject?.id, systemIds.length]
  ) || [];

  const history = useLiveQuery(
    async () => {
      if (!subject?.id) return [];
      return await db.history.where('subjectId').equals(subject.id).toArray().then(arr => (arr || []).filter(h => !h.deletedAt));
    },
    [subject?.id]
  ) || [];

  const pyqYears = useLiveQuery(
    async () => {
      if (!subject?.id) return [];
      return await db.pyqYears.where('subjectId').equals(subject.id).toArray().then(arr => (arr || []).filter(p => !p.deletedAt));
    },
    [subject?.id]
  ) || [];

  const scoreLogs = useLiveQuery(
    async () => {
      if (!subject?.id) return [];
      return await db.scoreLogs.where('subjectId').equals(subject.id).toArray().then(arr => (arr || []).filter(sc => !sc.deletedAt));
    },
    [subject?.id]
  ) || [];

  const subjectMistakes = useLiveQuery(
    async () => {
      if (!subject?.id) return [];
      const logs = await db.mistakeLogs?.toArray() || [];
      return logs.filter(m => !m.deletedAt && (
        String(m.subjectId) === String(subject.id) ||
        (subject.ontologySubjectId && String(m.subjectId) === String(subject.ontologySubjectId)) ||
        (m.subjectId && typeof m.subjectId === 'string' && m.subjectId.toLowerCase() === subject.name.toLowerCase())
      ));
    },
    [subject?.id, subject?.name, subject?.ontologySubjectId]
  ) || [];

  const allSubjects = useLiveQuery(() => db.subjects.toArray().then(res => res.filter(s => !s.deletedAt)), []) || [];

  const safeSets = Array.isArray(curriculumSets) ? curriculumSets : [];
  const safeHistory = Array.isArray(history) ? history : [];
  const safePyqs = Array.isArray(pyqYears) ? pyqYears : [];
  const safeScores = Array.isArray(scoreLogs) ? scoreLogs : [];
  const safeMistakes = Array.isArray(subjectMistakes) ? subjectMistakes : [];

  const activeMistakesCount = safeMistakes.filter(m => !m.resolved).length;
  const volatileMistakesCount = safeMistakes.filter(m => !m.resolved && m.isVolatile).length;

  const progressScore: SubjectProgressScore = evaluateSubjectProgress(
    subject,
    safeSystems,
    safeSets,
    safeHistory,
    safePyqs,
    safeScores
  );

  // Check if there is a sibling duplicate of this subject in the DB
  const siblingDuplicateSubject = allSubjects.find(
    s => s.id !== subject.id && normalizeName(s.name) === normalizeName(subject.name)
  );

  const progress = calculateSubjectProgress(subject, safeSystems, safeSets);
  const isFullyComplete = progress === 100 && safeSystems.length > 0;
  const weakCount = safeSystems.filter(s => s?.status === 'Weak').length;
  const overdueCount = safeSystems.filter(s => s && isRevisionDue(s, safeSets)).length;

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteSubject(subject.id!);
      setShowSafeDelete(false);
      toast.success(`Deleted "${subject.name}"`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete subject');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMergeDuplicates = async () => {
    try {
      setIsDeleting(true);
      const res = await mergeAndDeduplicateAllSubjects();
      setShowSafeDelete(false);
      toast.success('Subjects Merged Successfully', {
        description: `Consolidated duplicate subjects and preserved all study progress.`
      });
    } catch (e) {
      console.error(e);
      toast.error('Failed to merge duplicate subjects');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "group relative w-full p-4 rounded-2xl border transition-all duration-300 hover:shadow-sm",
          isFullyComplete
            ? "bg-primary/5 border-primary/20 shadow-[inset_0_0_20px_rgba(var(--primary),0.02)]"
            : "bg-card border-border/40 hover:border-border",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <Link
            href={`/subjects/${subject.id}`}
            className="flex-1 min-w-0 group-hover:opacity-90 transition-opacity"
          >
            <div className="flex items-center gap-3 mb-3">
              <h3
                className={cn(
                  "font-bold text-lg sm:text-xl truncate tracking-tight transition-colors",
                  isFullyComplete ? "text-primary/90" : "text-foreground",
                )}
              >
                {subject.name}
              </h3>
              {isFullyComplete && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase border border-primary/20 flex-shrink-0 animate-in fade-in zoom-in duration-300">
                  Mastered
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                {safeSystems.length} {safeSystems.length === 1 ? "System" : "Systems"}
              </span>
              {overdueCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  ⚡ {overdueCount} Due
                </span>
              )}
              {weakCount > 0 && overdueCount === 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                  {weakCount} Weak
                </span>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-1.5 shrink-0 ml-1 relative z-20">
            {activeMistakesCount > 0 && (
              <Link
                href={`/mistakes?subjectId=${encodeURIComponent(String(subject.id))}&origin=subject_card`}
                onClick={(e) => e.stopPropagation()}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-xl bg-card border border-border/70 hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                title={`Open ${lexicon.mistakesJournal} for ${subject.name} (${activeMistakesCount} active rules)`}
              >
                <BookOpen className="w-3 h-3 text-primary" />
                <span className="font-mono text-foreground font-semibold">{activeMistakesCount}</span>
                {volatileMistakesCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title={`${volatileMistakesCount} volatile`} />
                )}
              </Link>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors focus:outline-none shrink-0 cursor-pointer"
                aria-label="Subject options"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                <MoreVertical className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/mistakes?subjectId=${encodeURIComponent(String(subject.id))}&origin=subject_card_menu`}
                    className="flex items-center gap-2 py-2 cursor-pointer text-xs font-semibold"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    <span>{lexicon.mistakesJournal}</span>
                    {activeMistakesCount > 0 && (
                      <span className="ml-auto font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                        {activeMistakesCount}
                      </span>
                    )}
                  </Link>
                </DropdownMenuItem>
                {siblingDuplicateSubject && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMergeDuplicates();
                    }}
                    className="text-primary focus:text-primary gap-2 py-2 cursor-pointer text-xs font-semibold"
                  >
                    <Merge className="w-3.5 h-3.5" /> Merge Duplicates
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSafeDelete(true);
                  }}
                  className="text-destructive focus:text-destructive gap-2 py-2 cursor-pointer text-xs font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div
              {...dragHandleProps}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors cursor-grab active:cursor-grabbing focus:outline-none shrink-0"
              aria-label="Drag handle"
            >
              <div className="grid grid-cols-2 gap-0.5">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full bg-current opacity-70"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/40">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-muted-foreground">
              Coverage
            </span>
            <span className="font-mono font-bold text-foreground tabular-nums tracking-tight">
              {progress}%
            </span>
          </div>
          <div className="h-3 sm:h-4 w-full bg-muted/60 rounded-full overflow-hidden border border-border/20 shadow-inner">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <SafeDeleteSubjectDialog
        open={showSafeDelete}
        onOpenChange={setShowSafeDelete}
        subjectName={subject.name}
        subjectId={subject.id!}
        progressScore={progressScore}
        siblingDuplicate={siblingDuplicateSubject ? {
          subjectId: siblingDuplicateSubject.id!,
          progressScore: evaluateSubjectProgress(
            siblingDuplicateSubject,
            safeSystems,
            safeSets,
            safeHistory,
            safePyqs,
            safeScores
          )
        } : null}
        isDeleting={isDeleting}
        onConfirmDelete={handleConfirmDelete}
        onMergeWithDuplicate={siblingDuplicateSubject ? handleMergeDuplicates : undefined}
      />
    </>
  );
}
