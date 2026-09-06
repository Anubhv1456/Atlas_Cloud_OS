import React from 'react';
import { Target, BookOpen, Clock, Pencil, X, Plus } from 'lucide-react';
import { StudySystem, Subject } from '@/db';

interface ActiveRevisionsProps {
  primaryFocus: StudySystem | null;
  primaryFocusSubject: Subject | null;
  isAutoPrimary: boolean;
  isPrimaryOverriddenByRevision: boolean;
  isPrimaryIntentStale?: boolean;
  isSecondaryIntentStale?: boolean;
  secondaryFocus: StudySystem | null;
  secondaryFocusSubject: Subject | null;
  isAutoSecondary: boolean;
  isSecondaryOverriddenByRevision: boolean;
  secondaryDaysOverdue: number;
  setFocusDialogType: (type: 'primary' | 'secondary' | null) => void;
  setFocus: (sysId: number, type: 'primary' | 'secondary' | null) => void;
  setSubjectFocus: (subId: number, type: 'primary' | 'secondary' | null) => void;
  goToSystem: (subjectId: number, systemId: number) => void;
  subjects: Subject[];
  systems: StudySystem[];
  customPrimarySubject: Subject | undefined;
  customPrimarySystem: StudySystem | undefined;
  customSecondarySubject: Subject | undefined;
  customSecondarySystem: StudySystem | undefined;
}

export function ActiveRevisions({
  primaryFocus,
  primaryFocusSubject,
  isAutoPrimary,
  isPrimaryOverriddenByRevision,
  isPrimaryIntentStale,
  isSecondaryIntentStale,
  secondaryFocus,
  secondaryFocusSubject,
  isAutoSecondary,
  isSecondaryOverriddenByRevision,
  secondaryDaysOverdue,
  setFocusDialogType,
  setFocus,
  setSubjectFocus,
  goToSystem,
  subjects,
  systems,
  customPrimarySubject,
  customPrimarySystem,
  customSecondarySubject,
  customSecondarySystem
}: ActiveRevisionsProps) {
  return (
    <>
      {/* ── Focus for Today ───────────────────────── */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <Target className="w-3.5 h-3.5" /> Today's Primary Focus
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {/* Primary Focus */}
          {isPrimaryIntentStale && (customPrimarySubject || customPrimarySystem) && (
            <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm flex items-center justify-between">
              <span className="text-amber-500 font-medium">Are you still focusing on this? (Set {">"}72h ago)</span>
              <button onClick={(e) => {
                e.stopPropagation();
                if (customPrimarySubject?.id) setSubjectFocus(customPrimarySubject.id, null);
                if (customPrimarySystem?.id) setFocus(customPrimarySystem.id, null);
              }} className="text-xs px-2 py-1 bg-amber-500/20 text-amber-500 rounded hover:bg-amber-500/30">Clear</button>
            </div>
          )}
          <div className="bg-card rounded-2xl border border-primary/20 shadow-sm overflow-hidden relative flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-2 gap-1">
                <p className="text-xs uppercase tracking-wider text-primary font-semibold flex items-center gap-1.5 truncate">
                  {customPrimarySubject ? (
                    <><BookOpen className="w-3 h-3 shrink-0" /> {customPrimarySubject.name}</>
                  ) : isAutoPrimary ? (
                    <><Target className="w-3 h-3 shrink-0" /> Recommended Bearing</>
                  ) : (
                    "Primary Focus"
                  )}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  {customPrimarySubject ? (
                    <>
                      <button
                        onClick={() => setFocusDialogType('primary')}
                        className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-muted/50"
                        title="Edit primary focus"
                        aria-label="Edit primary focus"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSubjectFocus(customPrimarySubject.id!, null)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-muted/50"
                        title="Remove custom primary focus"
                        aria-label="Remove custom primary focus"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : customPrimarySystem ? (
                    <>
                      <button
                        onClick={() => setFocusDialogType('primary')}
                        className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-muted/50"
                        title="Edit primary focus"
                        aria-label="Edit primary focus"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setFocus(customPrimarySystem.id!, null)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-muted/50"
                        title="Remove custom primary focus"
                        aria-label="Remove custom primary focus"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setFocusDialogType('primary')}
                      className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-muted/50"
                      title="Customize primary focus"
                      aria-label="Customize primary focus"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {primaryFocus ? (
                <button onClick={() => goToSystem(primaryFocus.subjectId, primaryFocus.id!)} className="text-left group w-full">
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm leading-snug">
                    {primaryFocus.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {customPrimarySubject ? `Subject: ${customPrimarySubject.name}` : subjects.find(s => s.id === primaryFocus.subjectId)?.name}
                  </p>
                </button>
              ) : (
                <button
                  onClick={() => setFocusDialogType('primary')}
                  className="w-full py-3 mt-1 border border-dashed border-primary/30 rounded-xl text-xs text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-medium"
                >
                  <Plus className="w-3 h-3" /> Select Focus
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}