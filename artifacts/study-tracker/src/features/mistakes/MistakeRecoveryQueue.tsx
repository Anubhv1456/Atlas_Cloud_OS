import React, { useState, useMemo } from 'react';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { MistakeLog } from '@/db/types';
import { deleteMistakeLog } from '@/db/mutations';
import { QuickMistakeModal } from './QuickMistakeModal';
import { 
  Plus, 
  Trash2, 
  BookOpen, 
  Brain, 
  ChevronRight, 
  Search,
  X,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ALL_SUBJECTS } from '@/data/ontology';

export default function MistakeRecoveryQueue() {
  const [modalOpen, setModalOpen] = useState(false);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
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

  // Overview Metrics
  const totalLogs = mistakeLogs.length;

  // Find Top Weak Subject
  const topErrorSubject = useMemo(() => {
    if (mistakeLogs.length === 0) return null;
    const counts: Record<string, number> = {};
    for (const log of mistakeLogs) {
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
  }, [mistakeLogs, subjectMap]);

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

  const hasActiveFilters = searchQuery.trim() !== '' || typeFilter !== 'all' || filterSubjectId !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setFilterSubjectId('all');
  };

  return (
    <div id="mistake-journal-page" className="min-h-full bg-background px-4 sm:px-6 lg:px-8 pt-6 pb-28 md:pb-12 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header & Primary Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-primary font-bold tracking-wider uppercase text-[10px]">
            <BookOpen className="w-3.5 h-3.5" /> 20th Notebook
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Mistake Journal
          </h1>
          <p className="text-xs text-muted-foreground">
            One-line clinical takeaways and high-yield rules extracted from QBank & Grand Test errors.
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

      {/* 2. Focused Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div id="stat-total-takeaways" className="bg-card border border-border/80 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Journal Entries
            </span>
            <span className="text-base font-extrabold text-foreground leading-none">
              {totalLogs} <span className="text-xs font-normal text-muted-foreground">distilled rules</span>
            </span>
          </div>
        </div>

        <div id="stat-top-weak-area" className="bg-card border border-border/80 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
            <Brain className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Highest Error Density
            </span>
            <span className="text-xs font-bold text-foreground truncate block leading-tight mt-0.5">
              {topErrorSubject || 'None (No mistakes recorded)'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Strip */}
      <div id="journal-control-panel" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-card p-3 rounded-2xl border border-border/80 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            id="input-search-mistakes"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search rules, drugs, triads, keywords (e.g. DOC, Thiamine, Stenosis)..."
            className="pl-8.5 pr-8 h-9 text-xs rounded-xl bg-muted/20 border-border/70 placeholder:text-muted-foreground/60 text-foreground w-full"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Classification & Subject Dropdowns */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            id="select-error-type-filter"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="h-9 rounded-xl border border-border/80 bg-muted/20 px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
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
            className="h-9 rounded-xl border border-border/80 bg-muted/20 px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer max-w-[160px] truncate"
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

      {/* 4. High-Density Journal Notebook Groupings */}
      {Array.from(groupedMap.entries()).length > 0 ? (
        <div id="mistakes-grouped-list" className="space-y-5">
          {Array.from(groupedMap.entries()).map(([groupKey, group]) => {
            return (
              <div key={groupKey} id={`group-${groupKey.replace(/[^a-zA-Z0-9]/g, '-')}`} className="space-y-2">
                {/* Clean Group Header */}
                <div className="flex items-center gap-1.5 px-1 pt-1 flex-wrap">
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

                {/* Journal Takeaway Rows */}
                <div className="space-y-2">
                  {group.logs.map(log => {
                    return (
                      <div 
                        key={String(log.id)} 
                        id={`mistake-card-${log.id}`}
                        className="p-3.5 rounded-2xl border border-border/80 hover:border-border transition-all flex items-start justify-between gap-3 bg-card shadow-xs group"
                      >
                        {/* Content Area */}
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed select-text">
                            {log.keyTakeaway}
                          </p>

                          {/* Metadata Badges */}
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
                          className="p-1.5 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shrink-0"
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
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-1">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {hasActiveFilters ? 'No Matching Takeaways' : 'Journal is Empty'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            {hasActiveFilters 
              ? 'No mistake takeaways matched your current search and filter criteria.'
              : 'As you solve QBank blocks and Grand Tests, log high-yield 1-line takeaways to build your 20th Notebook for rapid pre-exam review.'}
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
                <span>Log New Takeaway</span>
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
