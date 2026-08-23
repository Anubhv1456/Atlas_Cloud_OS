import React, { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { 
  BookOpen, 
  Sparkles, 
  Zap, 
  ChevronRight, 
  Plus, 
  Archive, 
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTagMeta } from './MistakeRecoveryQueue';
import { QuickMistakeModal } from './QuickMistakeModal';
import { AIVoiceCaptureModal } from '@/components/ai/AIVoiceCaptureModal';
import { useAISettings } from '@/lib/ai/aiSettingsStorage';
import { cn } from '@/lib/utils';

export function MistakesNotebookCard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubjectId, setModalSubjectId] = useState<string | number | undefined>(undefined);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const { settings } = useAISettings();

  const rawMistakes = useLiveQuery(() => db.mistakeLogs?.toArray(), []) || [];
  const subjects = useLiveQuery(() => db.subjects?.filter(s => !s.deletedAt).toArray(), []) || [];

  const subjectMap = useMemo(() => new Map(subjects.map(s => [String(s.id), s])), [subjects]);

  const activeMistakes = useMemo(() => {
    return rawMistakes.filter(m => !m.deletedAt && !m.resolved);
  }, [rawMistakes]);

  const volatileMistakes = useMemo(() => {
    return activeMistakes.filter(m => m.isVolatile);
  }, [activeMistakes]);

  const archivedMistakes = useMemo(() => {
    return rawMistakes.filter(m => !m.deletedAt && m.resolved);
  }, [rawMistakes]);

  // Group top subjects with active mistake rules
  const topSubjectStats = useMemo(() => {
    const counts = new Map<string, { id: string; name: string; activeCount: number; volatileCount: number }>();

    subjects.forEach(s => {
      counts.set(String(s.id), {
        id: String(s.id),
        name: s.name,
        activeCount: 0,
        volatileCount: 0
      });
    });

    activeMistakes.forEach(m => {
      const sId = String(m.subjectId);
      if (counts.has(sId)) {
        const entry = counts.get(sId)!;
        entry.activeCount += 1;
        if (m.isVolatile) entry.volatileCount += 1;
      }
    });

    return Array.from(counts.values())
      .filter(s => s.activeCount > 0)
      .sort((a, b) => b.activeCount - a.activeCount)
      .slice(0, 4);
  }, [subjects, activeMistakes]);

  // Recent volatile traps preview
  const recentVolatileTraps = useMemo(() => {
    return [...volatileMistakes]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 3);
  }, [volatileMistakes]);

  return (
    <>
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-4 transition-all hover:border-border">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <BookOpen className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                20th Notebook
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              High-yield clinical rules, drug choices, classic triads, and volatile distinctions curated across 19 subjects.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            {settings.isAiEnabled && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setVoiceModalOpen(true)}
                className="rounded-xl font-bold text-xs h-8 px-2.5 gap-1 cursor-pointer border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10"
                title="Dictate clinical pearl or mistake"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Voice Pearl</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setModalSubjectId(undefined);
                setModalOpen(true);
              }}
              className="rounded-xl font-bold text-xs h-8 px-3 gap-1 cursor-pointer hover:bg-muted/80"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Rule</span>
            </Button>

            <Link
              href="/mistakes"
              className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <span>Open Notebook</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Diagnostic Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
              Active Rules
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-foreground">
                {activeMistakes.length}
              </span>
              <span className="text-[11px] text-muted-foreground">active</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-0.5">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              Volatile Rules
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {volatileMistakes.length}
              </span>
              <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80">urgent</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-0.5">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              Coverage
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-primary">
                {topSubjectStats.length}
              </span>
              <span className="text-[11px] text-primary/80">subjects</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
              <Archive className="w-3 h-3 text-emerald-500" />
              Archived
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {archivedMistakes.length}
              </span>
              <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">mastered</span>
            </div>
          </div>
        </div>

        {/* Subject Breakdown Quick Chips */}
        {topSubjectStats.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Top Subject Notebooks</span>
              <Link href="/mistakes" className="text-[11px] font-bold text-primary hover:underline">
                View full ledger →
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              {topSubjectStats.map(sub => (
                <Link
                  key={sub.id}
                  href={`/mistakes?subjectId=${encodeURIComponent(sub.id)}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/80 hover:border-primary/50 text-xs font-bold transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
                >
                  <span className="text-foreground group-hover:text-primary transition-colors">
                    {sub.name}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-muted text-[10px] font-mono text-muted-foreground">
                    {sub.activeCount}
                  </span>
                  {sub.volatileCount > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title={`${sub.volatileCount} volatile`} />
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Volatile Spotlight Feed */}
        {recentVolatileTraps.length > 0 && (
          <div className="pt-2 border-t border-border/40 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1.5 text-foreground">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Pre-GT Volatile Spotlight</span>
              </span>
              <span className="text-[11px] text-muted-foreground">High-yield revision</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {recentVolatileTraps.map(trap => {
                const subName = subjectMap.get(String(trap.subjectId))?.name || 'Clinical';
                const text = (trap.keyTakeaway || (trap as any).goldenTakeaway || (trap as any).questionTopic || '').trim();
                const tags = trap.tags || (trap as any).coreLenses || [];

                return (
                  <Link
                    key={trap.id}
                    href={`/mistakes?subjectId=${encodeURIComponent(String(trap.subjectId))}`}
                    className="p-3 rounded-xl bg-muted/30 border border-border/60 hover:border-primary/40 transition-all flex flex-col justify-between gap-2 group cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-primary truncate">{subName}</span>
                        <span className="text-amber-500 font-mono flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5 fill-amber-500" />
                          Volatile
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground line-clamp-2 leading-relaxed group-hover:text-primary transition-colors">
                        {text}
                      </p>
                    </div>

                    {tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {tags.slice(0, 2).map((tag: string) => {
                          const meta = getTagMeta(tag);
                          return (
                            <span key={tag} className={cn("text-[9px] px-1.5 py-0.2 rounded-md border font-semibold", meta.color)}>
                              {meta.icon && <span className="mr-0.5">{meta.icon}</span>}
                              #{tag}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <QuickMistakeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultSubjectId={modalSubjectId}
      />

      {settings.isAiEnabled && (
        <AIVoiceCaptureModal
          open={voiceModalOpen}
          onOpenChange={setVoiceModalOpen}
        />
      )}
    </>
  );
}
