import { normalizeName } from "@/lib/exam-presets";
import { Link } from "wouter";
import { ChevronRight, MoreVertical, PencilLine, Trash2 } from "lucide-react";
import { Subject, StudySystem, db, updateSubject, deleteSubject } from "@/db";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { ALL_SYSTEMS, ALL_SUBJECTS } from "@/data/ontology";
import { useLiveQuery } from "dexie-react-hooks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

interface SubjectCardProps {
  subject: Subject;
  systems: StudySystem[];
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

export function SubjectCard({
  subject,
  systems,
  dragHandleProps,
}: SubjectCardProps) {
  const systemIds = systems.map(s => s.id!);
  
  const curriculumSets = useLiveQuery(
    async () => {
      const table = db.curriculumSets || db.revisionSets;
      if (systemIds.length === 0) return [];
      return await table.where('systemId').anyOf(systemIds).toArray();
    },
    [systemIds.join(',')]
  ) || [];

  const totalTasks = curriculumSets.length * 2;
  let completedTasks = 0;
  curriculumSets.forEach(set => {
    if (set.contentCompleted) completedTasks++;
    if (set.qbankCompleted) completedTasks++;
  });

  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const isFullyComplete = progress === 100 && totalTasks > 0;

  return (
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
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-widest uppercase border border-primary/20 flex-shrink-0 animate-in fade-in zoom-in duration-300">
                Mastered
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              {systems.length} {systems.length === 1 ? "System" : "Systems"}
            </span>
            <span className="font-mono tabular-nums text-[11px] text-foreground/80 font-semibold bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
              {completedTasks}/{totalTasks} set tasks
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1 shrink-0 ml-1 relative z-20">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors focus:outline-none shrink-0"
              aria-label="Subject options"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <MoreVertical className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                 
              <DropdownMenuItem
                onClick={async (e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this subject and all its systems?')) {
                    await deleteSubject(subject.id!);
                    toast.success('Subject deleted');
                  }
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
            Mastery
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
  );
}
