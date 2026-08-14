import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { MistakeLog } from '@/db/types';
import { deleteMistakeLog, restoreMistakeLog } from '@/db/mutations';
import { QuickMistakeModal } from './QuickMistakeModal';
import { 
  Plus, 
  Trash2, 
  BookOpen, 
  Brain, 
  ChevronRight, 
  Search,
  X,
  FileText,
  ChevronDown,
  Sparkles,
  Zap,
  ArrowUpRight,
  SlidersHorizontal,
  Command
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ALL_SUBJECTS } from '@/data/ontology';
import { toast } from 'sonner';

export default function MistakeRecoveryQueue() {
  const [modalOpen, setModalOpen] = useState(false);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  
  // Collapsible subject sections state (default all open)
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>({});

  const searchInputRef = useRef<HTMLInputElement>(null);

  const rawMistakes = useLiveQuery(() => db.mistakeLogs?.toArray()) || [];
  const subjects = useLiveQuery(() => db.subjects?.filter(s => !s.deletedAt).toArray()) || [];
  const systems = useLiveQuery(() => db.systems?.filter(s => !s.deletedAt).toArray()) || [];

  // Global keyboard shortcuts: 'N' to open modal, '⌘K' or '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea or modal is open
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (!isInput && !modalOpen) {
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          setModalOpen(true);
        } else if (e.key === '/') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

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

  // Overview Metrics
  const totalLogs = mistakeLogs.length;

  // Find Top Weak Subject & Counts
  const subjectErrorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of mistakeLogs) {
      const subName = subjectMap.get(String(log.subjectId)) || 'Subject';
      counts[subName] = (counts[subName] || 0) + 1;
    }
    return counts;
  }, [mistakeLogs, subjectMap]);

  const topErrorSubject = useMemo(() => {
    if (mistakeLogs.length === 0) return null;
    let topName = '';
    let maxCount = 0;
    for (const [name, count] of Object.entries(subjectErrorCounts)) {
      if (count > maxCount) {
        maxCount = count;
        topName = name;
      }
    }
    return topName ? { name: topName, count: maxCount } : null;
  }, [mistakeLogs, subjectErrorCounts]);

  // Filtered & Searched Logs
  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return mistakeLogs.filter(log => {
      // Error Root Cause filter
      if (typeFilter !== 'all' && log.errorType !== typeFilter) return false;

      // Subject filter
      if (filterSubjectId !== 'all' && String(log.subjectId) !== filterSubjectId) return false;

      // Text search query across takeaway text, topic, subject, and system
      if (query) {
        const subName = (subjectMap.get(String(log.subjectId)) || '').toLowerCase();
        const sysName = (systemMap.get(String(log.systemId)) || '').toLowerCase();
        const takeaway = (log.keyTakeaway || '').toLowerCase();
        const topic = (log.topicId || '').toLowerCase();
        const source = (log.source || '').toLowerCase();

        const matches = 
          takeaway.includes(query) || 
          topic.includes(query) || 
          subName.includes(query) || 
          sysName.includes(query) ||
          source.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [mistakeLogs, typeFilter, filterSubjectId, searchQuery, subjectMap, systemMap]);

  // Hierarchical Grouping by Subject -> System
  interface SubjectGroup {
    subjectId: string;
    subjectName: string;
    totalCount: number;
    systems: {
      systemId: string;
      systemName: string;
      logs: MistakeLog[];
    }[];
  }

  const hierarchicalGroups = useMemo(() => {
    const map = new Map<string, { subjectName: string; systemsMap: Map<string, { systemName: string; logs: MistakeLog[] }> }>();

    for (const log of filteredLogs) {
      const subId = String(log.subjectId || 0);
      const subName = subjectMap.get(subId) || 'Subject';
      const sysId = String(log.systemId || 0);
      const sysName = systemMap.get(sysId) || 'General';

      if (!map.has(subId)) {
        map.set(subId, {
          subjectName: subName,
          systemsMap: new Map()
        });
      }

      const subEntry = map.get(subId)!;
      if (!subEntry.systemsMap.has(sysId)) {
        subEntry.systemsMap.set(sysId, {
          systemName: sysName,
          logs: []
        });
      }

      subEntry.systemsMap.get(sysId)!.logs.push(log);
    }

    const result: SubjectGroup[] = [];
    map.forEach((subVal, subId) => {
      let subTotal = 0;
      const systemsArr: { systemId: string; systemName: string; logs: MistakeLog[] }[] = [];
      
      subVal.systemsMap.forEach((sysVal, sysId) => {
        subTotal += sysVal.logs.length;
        systemsArr.push({
          systemId: sysId,
          systemName: sysVal.systemName,
          logs: sysVal.logs
        });
      });

      result.push({
        subjectId: subId,
        subjectName: subVal.subjectName,
        totalCount: subTotal,
        systems: systemsArr
      });
    });

    // Sort subjects by number of entries descending
    return result.sort((a, b) => b.totalCount - a.totalCount);
  }, [filteredLogs, subjectMap, systemMap]);

  const hasActiveFilters = searchQuery.trim() !== '' || typeFilter !== 'all' || filterSubjectId !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setFilterSubjectId('all');
  };

  const toggleSubjectCollapse = (subId: string) => {
    setCollapsedSubjects(prev => ({
      ...prev,
      [subId]: !prev[subId]
    }));
  };

  // Safe Deletion with Undo Toast
  const handleDelete = (log: MistakeLog) => {
    if (log.id === undefined) return;
    const logId = log.id;
    const rulePreview = log.keyTakeaway.slice(0, 30);

    deleteMistakeLog(logId);

    toast('Takeaway deleted', {
      description: `"${rulePreview}..."`,
      action: {
        label: 'Undo',
        onClick: () => restoreMistakeLog(logId)
      },
      duration: 5000
    });
  };

  return (
    <div id="mistake-journal-page" className="min-h-full bg-background px-4 sm:px-6 lg:px-8 pt-6 pb-28 md:pb-12 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-primary font-bold tracking-wider uppercase text-[10px]">
            <BookOpen className="w-3.5 h-3.5" /> 20th Notebook
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <span>Mistake Journal</span>
            <span className="text-xs font-mono font-medium text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full border border-border/40">
              {totalLogs} {totalLogs === 1 ? 'rule' : 'rules'}
            </span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Distilled high-yield rules from your QBank & Grand Test errors. Press <kbd className="font-mono bg-muted/60 px-1 rounded text-[10px] text-foreground">N</kbd> to quick log.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <Button 
            id="btn-open-log-mistake-modal"
            onClick={() => setModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs gap-1.5 cursor-pointer px-4"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Takeaway</span>
          </Button>
        </div>
      </div>

      {/* 2. Intelligent High-Error Bridge (If High Concentration Exists) */}
      {topErrorSubject && topErrorSubject.count >= 3 && (
        <div id="high-error-density-card" className="p-3.5 rounded-2xl bg-card border border-primary/20 shadow-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-foreground">
                  High Mistake Density in {topErrorSubject.name}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  {topErrorSubject.count} entries
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                Consider prioritizing this subject during your next scheduled revision session.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Search & Refined Filter Controls */}
      <div id="journal-control-panel" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-card p-2.5 rounded-2xl border border-border/80 shadow-xs">
        
        {/* Search Input with Keyboard Shortcut Indicator */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchInputRef}
            id="input-search-mistakes"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search rules, drugs, triads, keywords (e.g. DOC, Thiamine, PSVT)..."
            className="pl-8.5 pr-14 h-8.5 text-xs rounded-xl bg-muted/20 border-border/70 placeholder:text-muted-foreground/60 text-foreground w-full"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted/60 text-[10px] text-muted-foreground font-mono pointer-events-none">
              <Command className="w-2.5 h-2.5" />K
            </div>
          )}
        </div>

        {/* Clean Dropdown Filters */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            id="select-error-type-filter"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="h-8.5 rounded-xl border border-border/70 bg-muted/20 px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
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
            className="h-8.5 rounded-xl border border-border/70 bg-muted/20 px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer max-w-[150px] truncate"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={String(s.id)} value={String(s.id)}>{s.name}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] font-semibold text-primary hover:underline px-1 shrink-0 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 4. Editorial Notebook View (The 20th Notebook) */}
      {hierarchicalGroups.length > 0 ? (
        <div id="mistakes-notebook-container" className="space-y-4">
          {hierarchicalGroups.map(subjectGroup => {
            const isCollapsed = !!collapsedSubjects[subjectGroup.subjectId];

            return (
              <div 
                key={subjectGroup.subjectId} 
                id={`subject-section-${subjectGroup.subjectId}`}
                className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden transition-all"
              >
                {/* Collapsible Subject Section Header */}
                <button
                  type="button"
                  onClick={() => toggleSubjectCollapse(subjectGroup.subjectId)}
                  className="w-full px-4 py-3 bg-muted/30 hover:bg-muted/50 border-b border-border/60 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-extrabold text-xs sm:text-sm text-foreground tracking-tight uppercase">
                      {subjectGroup.subjectName}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border/40 shrink-0">
                      {subjectGroup.totalCount} {subjectGroup.totalCount === 1 ? 'rule' : 'rules'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                    <span className="text-[11px] font-medium hidden sm:inline-block">
                      {isCollapsed ? 'Expand' : 'Collapse'}
                    </span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isCollapsed && "-rotate-90")} />
                  </div>
                </button>

                {/* Subject Content (Systems & Rules) */}
                {!isCollapsed && (
                  <div className="divide-y divide-border/40">
                    {subjectGroup.systems.map(systemGroup => (
                      <div key={systemGroup.systemId} className="p-4 space-y-3">
                        
                        {/* System Header */}
                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                          <span>{systemGroup.systemName}</span>
                          <span className="text-[10px] text-muted-foreground/60 font-mono">
                            ({systemGroup.logs.length})
                          </span>
                        </div>

                        {/* List of Distilled Rules */}
                        <div className="space-y-2.5 pl-1 sm:pl-3">
                          {systemGroup.logs.map(log => {
                            return (
                              <div 
                                key={String(log.id)} 
                                id={`mistake-row-${log.id}`}
                                className="group flex items-start justify-between gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border/40"
                              >
                                {/* Left Content */}
                                <div className="flex-1 space-y-1.5 min-w-0">
                                  {/* Clinical Rule Text */}
                                  <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed select-text">
                                    {log.keyTakeaway}
                                  </p>

                                  {/* Metadata Line */}
                                  <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                                    {/* Topic Tag if present */}
                                    {log.topicId && (
                                      <span className="font-semibold text-primary/90 bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                        {log.topicId}
                                      </span>
                                    )}

                                    {/* Source Pill */}
                                    <span className="font-mono bg-muted/40 px-1.5 py-0.5 rounded border border-border/40">
                                      {log.source === 'GT' ? 'Grand Test' : log.source}
                                    </span>

                                    {/* Error Cause */}
                                    <span className={cn(
                                      "font-semibold px-1.5 py-0.5 rounded border",
                                      log.errorType === 'concept' && "border-rose-500/20 text-rose-400 bg-rose-500/10",
                                      log.errorType === 'misread' && "border-amber-500/20 text-amber-400 bg-amber-500/10",
                                      log.errorType === 'retrieval' && "border-sky-500/20 text-sky-400 bg-sky-500/10",
                                      log.errorType === 'fomo' && "border-purple-500/20 text-purple-400 bg-purple-500/10"
                                    )}>
                                      {log.errorType === 'concept' ? 'Knowledge Gap' : 
                                       log.errorType === 'misread' ? 'Execution Slip' : 
                                       log.errorType === 'retrieval' ? 'Retrieval' : 'Overthinking'}
                                    </span>

                                    {/* Date */}
                                    <span className="text-muted-foreground/60">
                                      {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                </div>

                                {/* Safe Delete Action */}
                                <button
                                  id={`btn-delete-mistake-${log.id}`}
                                  type="button"
                                  onClick={() => handleDelete(log)}
                                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer shrink-0"
                                  title="Delete takeaway (with undo)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div id="mistakes-empty-state" className="py-12 text-center space-y-3 rounded-2xl border border-dashed border-border/80 bg-card p-6">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-1">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {hasActiveFilters ? 'No Matching Rules Found' : 'Your 20th Notebook is Empty'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            {hasActiveFilters 
              ? 'No takeaways matched your current search filters.'
              : 'As you complete QBank blocks and Grand Tests, log high-yield 1-line takeaways to build your personal pre-exam notebook.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            {hasActiveFilters ? (
              <Button 
                id="btn-clear-search-filters"
                onClick={resetFilters}
                variant="outline"
                className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </Button>
            ) : (
              <Button 
                id="btn-empty-log-mistake"
                onClick={() => setModalOpen(true)}
                className="bg-primary text-primary-foreground font-bold text-xs rounded-xl gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log First Takeaway</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Express Takeaway Capture Modal */}
      <QuickMistakeModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
