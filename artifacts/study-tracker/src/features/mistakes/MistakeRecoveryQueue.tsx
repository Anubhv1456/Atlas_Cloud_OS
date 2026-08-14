import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { MistakeLog } from '@/db/types';
import { deleteMistakeLog, resolveMistake } from '@/db/mutations';
import { recordRecallDrill, flushTelemetryBatch } from '@/lib/telemetry';
import { QuickMistakeModal } from './QuickMistakeModal';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  BookOpen, 
  Brain, 
  RotateCcw, 
  Sparkles, 
  ChevronRight, 
  Eye, 
  HelpCircle, 
  Flame, 
  X, 
  ArrowRight,
  Filter,
  Check,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ALL_SUBJECTS } from '@/data/ontology';

export default function MistakeRecoveryQueue() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drillActive, setDrillActive] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'unresolved' | 'mastered' | 'all'>('unresolved');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  
  const rawMistakes = useLiveQuery(() => db.mistakeLogs?.toArray()) || [];
  const subjects = useLiveQuery(() => db.subjects?.filter(s => !s.deletedAt).toArray()) || [];
  const systems = useLiveQuery(() => db.systems?.filter(s => !s.deletedAt).toArray()) || [];

  // Exclude soft-deleted logs and sort newest first
  const mistakeLogs = useMemo(() => {
    return rawMistakes
      .filter(m => !m.deletedAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rawMistakes]);

  // Robust ID-to-Name Map for Subjects (combining DB subjects & Universal Ontology)
  const subjectMap = useMemo(() => {
    const map = new Map<string, string>();
    subjects.forEach(s => {
      if (s.id !== undefined) map.set(String(s.id), s.name);
    });
    ALL_SUBJECTS.forEach(s => {
      if (!map.has(String(s.id))) map.set(String(s.id), s.name);
    });
    return map;
  }, [subjects]);

  // Robust ID-to-Name Map for Systems
  const systemMap = useMemo(() => {
    const map = new Map<string, string>();
    systems.forEach(sys => {
      if (sys.id !== undefined) map.set(String(sys.id), sys.name);
    });
    return map;
  }, [systems]);

  // Telemetry Metrics
  const totalLogs = mistakeLogs.length;
  const unresolvedLogs = useMemo(() => mistakeLogs.filter(l => !l.resolved), [mistakeLogs]);
  const masteredCount = totalLogs - unresolvedLogs.length;
  const masteryRate = totalLogs > 0 ? Math.round((masteredCount / totalLogs) * 100) : 0;

  // Find Top Error Subject
  const topErrorSubject = useMemo(() => {
    if (unresolvedLogs.length === 0) return null;
    const counts: Record<string, number> = {};
    for (const log of unresolvedLogs) {
      const subName = subjectMap.get(String(log.subjectId)) || 'Subject';
      counts[subName] = (counts[subName] || 0) + 1;
    }
    let topName = '';
    let maxCount = 0;
    for (const [name, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        topName = name;
      }
    }
    return topName ? `${topName} (${maxCount})` : null;
  }, [unresolvedLogs, subjectMap]);

  // Filtered Logs for Main List
  const filteredLogs = useMemo(() => {
    return mistakeLogs.filter(log => {
      if (statusFilter === 'unresolved' && log.resolved) return false;
      if (statusFilter === 'mastered' && !log.resolved) return false;
      if (typeFilter !== 'all' && log.errorType !== typeFilter) return false;
      if (filterSubjectId !== 'all' && String(log.subjectId) !== filterSubjectId) return false;
      return true;
    });
  }, [mistakeLogs, statusFilter, typeFilter, filterSubjectId]);

  // Group filtered logs by Subject + System + Topic
  const groupedMap = useMemo(() => {
    const map = new Map<string, { subjectName: string; systemName: string; topicName?: string; logs: MistakeLog[] }>();
    for (const log of filteredLogs) {
      const subName = subjectMap.get(String(log.subjectId)) || 'Subject';
      const sysName = systemMap.get(String(log.systemId)) || 'General';
      const topName = log.topicId?.trim() || undefined;

      const groupKey = `${log.subjectId || 0}::${log.systemId || 0}::${topName || ''}`;
      const existing = map.get(groupKey);
      if (existing) {
        existing.logs.push(log);
      } else {
        map.set(groupKey, {
          subjectName: subName,
          systemName: sysName,
          topicName: topName,
          logs: [log]
        });
      }
    }
    return map;
  }, [filteredLogs, subjectMap, systemMap]);

  // Drill Deck (Unresolved logs matching active subject/type filters)
  const drillDeck = useMemo(() => {
    return mistakeLogs.filter(log => {
      if (log.resolved) return false;
      if (typeFilter !== 'all' && log.errorType !== typeFilter) return false;
      if (filterSubjectId !== 'all' && String(log.subjectId) !== filterSubjectId) return false;
      return true;
    });
  }, [mistakeLogs, typeFilter, filterSubjectId]);

  return (
    <div id="mistake-recovery-page" className="min-h-full bg-background px-4 sm:px-6 lg:px-8 pt-6 pb-28 md:pb-10 max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
      
      {/* 1. Header & Primary CTA Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-primary font-bold tracking-wider uppercase text-[10px]">
            <Brain className="w-3.5 h-3.5" /> High-Yield Error Vault
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Mistake Recovery
          </h1>
          <p className="text-xs text-muted-foreground">
            Transform QBank & GT error takeaways into rapid active recall drills.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {drillDeck.length > 0 && (
            <Button 
              id="btn-start-active-drill"
              onClick={() => setDrillActive(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start Active Drill ({drillDeck.length})</span>
            </Button>
          )}

          <Button 
            id="btn-open-log-mistake-modal"
            onClick={() => setModalOpen(true)}
            variant="outline"
            className="rounded-xl text-xs font-semibold border-border/80 gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Mistake</span>
          </Button>
        </div>
      </div>

      {/* 2. Telemetry Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div id="stat-unresolved-gaps" className="bg-card border border-border/80 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Unresolved Gaps
            </span>
            <span className="text-base font-extrabold text-foreground leading-none">
              {unresolvedLogs.length} <span className="text-xs font-normal text-muted-foreground">takeaways</span>
            </span>
          </div>
        </div>

        <div id="stat-top-weak-area" className="bg-card border border-border/80 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
            <Brain className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Top Weak Area
            </span>
            <span className="text-xs font-bold text-foreground truncate block leading-tight mt-0.5">
              {topErrorSubject || 'None (All Clear!)'}
            </span>
          </div>
        </div>

        <div id="stat-mastery-rate" className="col-span-2 sm:col-span-1 bg-card border border-border/80 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Mastery Rate
            </span>
            <span className="text-base font-extrabold text-foreground leading-none">
              {masteryRate}% <span className="text-xs font-normal text-muted-foreground">({masteredCount}/{totalLogs})</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sleek Streamlined Filter Pill Strip */}
      <div id="filter-control-panel" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/80 shadow-xs">
        
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            id="filter-tab-unresolved"
            type="button"
            onClick={() => setStatusFilter('unresolved')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
              statusFilter === 'unresolved'
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            Unresolved ({unresolvedLogs.length})
          </button>
          <button
            id="filter-tab-mastered"
            type="button"
            onClick={() => setStatusFilter('mastered')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
              statusFilter === 'mastered'
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            Mastered ({masteredCount})
          </button>
          <button
            id="filter-tab-all"
            type="button"
            onClick={() => setStatusFilter('all')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
              statusFilter === 'all'
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            All Items ({totalLogs})
          </button>
        </div>

        {/* Classification & Subject Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            id="select-error-type-filter"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="h-8 rounded-xl border border-border/80 bg-muted/20 px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="all">All Root Causes</option>
            <option value="concept">Knowledge Gaps</option>
            <option value="misread">Execution Slips</option>
            <option value="retrieval">Retrieval Failures</option>
            <option value="fomo">Overthinking</option>
          </select>

          <select
            id="select-subject-filter"
            value={filterSubjectId}
            onChange={e => setFilterSubjectId(e.target.value)}
            className="h-8 rounded-xl border border-border/80 bg-muted/20 px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer max-w-[160px] truncate"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={String(s.id)} value={String(s.id)}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. High-Density Micro-Cards List */}
      {Array.from(groupedMap.entries()).length > 0 ? (
        <div id="mistakes-grouped-list" className="space-y-4">
          {Array.from(groupedMap.entries()).map(([groupKey, group]) => {
            return (
              <div key={groupKey} id={`group-${groupKey.replace(/[^a-zA-Z0-9]/g, '-')}`} className="space-y-2">
                {/* Clean Group Header */}
                <div className="flex items-center gap-2 px-1 pt-1 flex-wrap">
                  <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    {group.subjectName}
                  </span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                  <span className="text-xs font-bold text-foreground">
                    {group.systemName}
                  </span>
                  {group.topicName && (
                    <>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                      <span className="text-xs font-medium text-primary">
                        {group.topicName}
                      </span>
                    </>
                  )}
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ({group.logs.length})
                  </span>
                </div>

                {/* Micro Cards */}
                <div className="space-y-2">
                  {group.logs.map(log => {
                    const isMastered = log.resolved;

                    return (
                      <div 
                        key={String(log.id)} 
                        id={`mistake-card-${log.id}`}
                        className={cn(
                          "p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 bg-card shadow-xs group",
                          isMastered 
                            ? "border-border/40 opacity-75 bg-muted/10" 
                            : "border-border/80 hover:border-border"
                        )}
                      >
                        {/* 1-Tap Mastery Toggle Button */}
                        <button
                          id={`btn-toggle-mastery-${log.id}`}
                          type="button"
                          onClick={() => {
                            if (log.id !== undefined) {
                              resolveMistake(log.id, !log.resolved);
                              const subName = subjectMap.get(String(log.subjectId)) || 'Clinical';
                              const topTitle = log.topicId || systemMap.get(String(log.systemId)) || 'Medical Topic';
                              recordRecallDrill(log.errorType, !log.resolved, topTitle, subName);
                            }
                          }}
                          title={isMastered ? "Reopen mistake" : "Mark as mastered"}
                          className={cn(
                            "mt-0.5 p-1 rounded-lg transition-colors cursor-pointer shrink-0",
                            isMastered 
                              ? "text-emerald-500 hover:bg-emerald-500/10" 
                              : "text-muted-foreground/60 hover:text-emerald-500 hover:bg-emerald-500/10"
                          )}
                        >
                          {isMastered ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>

                        {/* Content Area */}
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <p className={cn(
                            "text-xs sm:text-sm font-semibold text-foreground leading-relaxed",
                            isMastered && "line-through text-muted-foreground"
                          )}>
                            {log.keyTakeaway}
                          </p>

                          {/* Metadata Tags */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Error Type Badge */}
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0",
                                log.errorType === 'concept' && "border-rose-500/30 text-rose-500 bg-rose-500/10",
                                log.errorType === 'misread' && "border-amber-500/30 text-amber-500 bg-amber-500/10",
                                log.errorType === 'retrieval' && "border-sky-500/30 text-sky-500 bg-sky-500/10",
                                log.errorType === 'fomo' && "border-purple-500/30 text-purple-500 bg-purple-500/10"
                              )}
                            >
                              {log.errorType === 'concept' ? 'Knowledge Gap' : 
                               log.errorType === 'misread' ? 'Execution Slip' : 
                               log.errorType === 'retrieval' ? 'Retrieval' : 'Overthinking'}
                            </Badge>

                            {/* Source Badge */}
                            <span className="text-[10px] font-mono font-medium text-muted-foreground px-1.5 py-0.5 rounded bg-muted/30 border border-border/40">
                              {log.source === 'GT' ? 'Grand Test' : log.source}
                            </span>

                            {/* Date */}
                            <span className="text-[10px] text-muted-foreground/70">
                              {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        {/* Delete Action */}
                        <button
                          id={`btn-delete-mistake-${log.id}`}
                          type="button"
                          onClick={() => log.id !== undefined && deleteMistakeLog(log.id)}
                          className="p-1.5 rounded-xl text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shrink-0"
                          title="Delete takeaway"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div id="mistakes-empty-state" className="py-12 text-center space-y-3 rounded-2xl border border-dashed border-border/80 bg-card p-6">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-1">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            No Mistakes Found
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            {statusFilter === 'unresolved' 
              ? 'Awesome job! You have zero unresolved mistake takeaways in this view. Keep solving QBank blocks!'
              : 'No entries found matching your filter criteria.'}
          </p>
          <div className="pt-2">
            <Button 
              id="btn-empty-log-mistake"
              onClick={() => setModalOpen(true)}
              variant="outline"
              className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log New Takeaway</span>
            </Button>
          </div>
        </div>
      )}

      {/* Express Capture Modal */}
      <QuickMistakeModal open={modalOpen} onOpenChange={setModalOpen} />

      {/* Active Flashcard Drill Modal */}
      {drillActive && (
        <ActiveDrillModal 
          deck={drillDeck} 
          subjectMap={subjectMap}
          systemMap={systemMap}
          onClose={() => setDrillActive(false)} 
        />
      )}
    </div>
  );
}

// ── Active Flashcard Drill Modal Component ─────────────────────────────────────

interface ActiveDrillModalProps {
  deck: MistakeLog[];
  subjectMap: Map<string, string>;
  systemMap: Map<string, string>;
  onClose: () => void;
}

function ActiveDrillModal({ deck, subjectMap, systemMap, onClose }: ActiveDrillModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionMasteredCount, setSessionMasteredCount] = useState(0);

  const currentCard = deck[currentIndex];
  const isFinished = currentIndex >= deck.length;

  const handleNext = useCallback((mastered = false) => {
    if (currentCard) {
      if (mastered && currentCard.id !== undefined) {
        resolveMistake(currentCard.id, true);
        setSessionMasteredCount(prev => prev + 1);
      }
      const subName = subjectMap.get(String(currentCard.subjectId)) || 'Clinical';
      const topTitle = currentCard.topicId || systemMap.get(String(currentCard.systemId)) || 'Medical Topic';
      recordRecallDrill(currentCard.errorType, mastered, topTitle, subName);
    }
    setIsFlipped(false);
    setCurrentIndex(prev => prev + 1);
  }, [currentCard, subjectMap, systemMap]);

  // Keyboard Shortcuts for Active Recall Flow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if target is an input or textarea
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ' || e.key === 'ArrowDown') {
        // Space or Down Arrow: Toggle card flip
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (isFlipped) {
        if (e.key === 'Enter' || e.key === 'ArrowRight' || e.key.toLowerCase() === 'm') {
          // Mastered
          e.preventDefault();
          handleNext(true);
        } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'k') {
          // Keep in queue
          e.preventDefault();
          handleNext(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, handleNext, onClose]);

  // Flush telemetry buffer on modal completion
  const handleDone = () => {
    flushTelemetryBatch().catch(() => {});
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent id="active-recall-drill-modal" className="sm:max-w-md rounded-3xl p-6 border-primary/20 shadow-2xl bg-card text-foreground">
        {!isFinished && currentCard ? (
          <div className="space-y-5">
            {/* Header & Card Counter */}
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Active Recall Drill
                  </h3>
                  <p className="text-[11px] font-semibold text-foreground">
                    Card {currentIndex + 1} of {deck.length}
                  </p>
                </div>
              </div>

              <button
                id="btn-close-drill"
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}
              />
            </div>

            {/* Flashcard Body */}
            <div 
              id="active-drill-flashcard"
              onClick={() => setIsFlipped(!isFlipped)}
              className={cn(
                "min-h-[200px] p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden select-none",
                isFlipped 
                  ? "bg-primary/5 border-primary/30 shadow-md" 
                  : "bg-muted/20 border-border/80 hover:border-border"
              )}
            >
              {/* Card Meta Top */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary truncate max-w-[240px]">
                  {subjectMap.get(String(currentCard.subjectId)) || 'Subject'} › {systemMap.get(String(currentCard.systemId)) || 'System'}
                </span>
                <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0">
                  {currentCard.source === 'GT' ? 'Grand Test' : currentCard.source}
                </Badge>
              </div>

              {/* Card Center Content */}
              <div className="py-2 text-center my-auto space-y-2">
                {!isFlipped ? (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Recall Prompt
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {currentCard.topicId ? `What is the high-yield takeaway for ${currentCard.topicId}?` : 'What is the high-yield rule for this error?'}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary mt-3 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                      Tap card or press Space to reveal <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2 animate-in zoom-in-95 duration-200">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                      High-Yield Clinical Rule
                    </p>
                    <p className="text-sm sm:text-base font-bold text-foreground leading-relaxed">
                      {currentCard.keyTakeaway}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Meta Bottom */}
              <div className="text-[10px] text-muted-foreground text-center font-mono">
                {isFlipped ? 'Tap card again to flip back' : 'Click anywhere or press Space'}
              </div>
            </div>

            {/* Action Buttons */}
            {isFlipped ? (
              <div className="grid grid-cols-2 gap-3 pt-1 animate-in fade-in duration-150">
                <Button
                  id="btn-keep-in-queue"
                  type="button"
                  variant="outline"
                  onClick={() => handleNext(false)}
                  className="rounded-xl text-xs font-semibold border-border/80 cursor-pointer"
                >
                  Keep in Queue (←)
                </Button>
                <Button
                  id="btn-mark-drill-mastered"
                  type="button"
                  onClick={() => handleNext(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Mastered (→)</span>
                </Button>
              </div>
            ) : (
              <Button
                id="btn-reveal-drill-answer"
                type="button"
                onClick={() => setIsFlipped(true)}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Reveal Answer (Space)
              </Button>
            )}
          </div>
        ) : (
          /* Finished State */
          <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-foreground">Drill Completed!</h3>
              <p className="text-xs text-muted-foreground">
                You mastered <strong className="text-emerald-500 font-bold">{sessionMasteredCount}</strong> takeaway{sessionMasteredCount !== 1 ? 's' : ''} in this active recall session.
              </p>
            </div>
            <Button
              id="btn-drill-finish-done"
              type="button"
              onClick={handleDone}
              className="bg-primary text-primary-foreground font-bold text-xs rounded-xl px-6 cursor-pointer"
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
