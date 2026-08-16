import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { MistakeLog } from '@/db/types';
import { 
  deleteMistakeLog, 
  restoreMistakeLog, 
  resolveMistake, 
  toggleMistakeVolatile 
} from '@/db/mutations';
import { QuickMistakeModal } from './QuickMistakeModal';
import { 
  Plus, 
  Trash2, 
  BookOpen, 
  Brain, 
  ChevronRight, 
  Search,
  X,
  ChevronDown,
  Sparkles,
  Zap,
  Command,
  Flame,
  CheckCircle2,
  Circle,
  Tag,
  ArrowLeft,
  Filter,
  Download,
  FileText,
  RotateCcw,
  SlidersHorizontal,
  FolderOpen,
  Eye,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ALL_SUBJECTS, UNIVERSAL_ONTOLOGY } from '@/data/ontology';
import { toast } from 'sonner';

export default function MistakeRecoveryQueue() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultSubjectId, setModalDefaultSubjectId] = useState<string | number | undefined>(undefined);
  const [modalDefaultSystemId, setModalDefaultSystemId] = useState<string | number | undefined>(undefined);
  const [modalDefaultTags, setModalDefaultTags] = useState<string[]>([]);
  
  // Navigation & View State
  const [activeView, setActiveView] = useState<'notebooks' | 'stream'>('notebooks');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Filters within Subject or Stream
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [systemFilter, setSystemFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [volatileOnly, setVolatileOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'mastered'>('active');
  
  // Collapsible subject sections state (in stream view)
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>({});

  const searchInputRef = useRef<HTMLInputElement>(null);

  const rawMistakes = useLiveQuery(() => db.mistakeLogs?.toArray()) || [];
  const subjects = useLiveQuery(() => db.subjects?.filter(s => !s.deletedAt).toArray()) || [];
  const systems = useLiveQuery(() => db.systems?.filter(s => !s.deletedAt).toArray()) || [];

  // Robust ID-to-Name Map for Subjects
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
    UNIVERSAL_ONTOLOGY.forEach(sub => {
      sub.systems.forEach(sys => {
        if (!map.has(String(sys.id))) map.set(String(sys.id), sys.name);
      });
    });
    return map;
  }, [systems]);

  // Global keyboard shortcuts: 'N' to open modal, '⌘K' or '/' to focus search, 'Escape' to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
          openModalWithContext();
        } else if (e.key === '/') {
          e.preventDefault();
          searchInputRef.current?.focus();
        } else if (e.key === 'Escape' && selectedSubjectId) {
          e.preventDefault();
          setSelectedSubjectId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, selectedSubjectId]);

  // Exclude soft-deleted logs and sort newest first
  const mistakeLogs = useMemo(() => {
    return rawMistakes
      .filter(m => !m.deletedAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rawMistakes]);

  // Metrics Summary
  const totalLogs = mistakeLogs.length;
  const volatileCount = useMemo(() => mistakeLogs.filter(m => m.isVolatile).length, [mistakeLogs]);
  const masteredCount = useMemo(() => mistakeLogs.filter(m => m.resolved).length, [mistakeLogs]);
  const activeCount = totalLogs - masteredCount;

  // Find Top Weak Subject & Counts
  const subjectErrorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of mistakeLogs) {
      if (log.resolved) continue;
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
    return topName && maxCount >= 3 ? { name: topName, count: maxCount } : null;
  }, [mistakeLogs, subjectErrorCounts]);

  // Dynamic Subject Notebooks Data (ONLY for subjects that contain mistake logs!)
  interface SubjectNotebookMeta {
    subjectId: string;
    subjectName: string;
    totalCount: number;
    activeCount: number;
    volatileCount: number;
    masteredCount: number;
    systems: { id: string; name: string; count: number }[];
    crossTags: string[];
    lastUpdated: Date;
  }

  const subjectNotebooks = useMemo(() => {
    const map = new Map<string, {
      subjectName: string;
      logs: MistakeLog[];
      systemsMap: Map<string, number>;
      tagsSet: Set<string>;
      lastUpdated: Date;
    }>();

    for (const log of mistakeLogs) {
      const subId = String(log.subjectId || 0);
      const subName = subjectMap.get(subId) || 'Subject';
      const sysId = String(log.systemId || 0);
      const logDate = new Date(log.createdAt || Date.now());

      if (!map.has(subId)) {
        map.set(subId, {
          subjectName: subName,
          logs: [],
          systemsMap: new Map(),
          tagsSet: new Set(),
          lastUpdated: logDate
        });
      }

      const entry = map.get(subId)!;
      entry.logs.push(log);
      if (logDate > entry.lastUpdated) {
        entry.lastUpdated = logDate;
      }

      entry.systemsMap.set(sysId, (entry.systemsMap.get(sysId) || 0) + 1);

      if (log.tags && Array.isArray(log.tags)) {
        log.tags.forEach(t => entry.tagsSet.add(t));
      }
    }

    const result: SubjectNotebookMeta[] = [];
    map.forEach((val, subId) => {
      const systemsArr: { id: string; name: string; count: number }[] = [];
      val.systemsMap.forEach((count, sysId) => {
        systemsArr.push({
          id: sysId,
          name: systemMap.get(sysId) || 'General',
          count
        });
      });
      systemsArr.sort((a, b) => b.count - a.count);

      const totalCount = val.logs.length;
      const mastered = val.logs.filter(l => l.resolved).length;
      const active = totalCount - mastered;
      const volatile = val.logs.filter(l => l.isVolatile).length;

      result.push({
        subjectId: subId,
        subjectName: val.subjectName,
        totalCount,
        activeCount: active,
        volatileCount: volatile,
        masteredCount: mastered,
        systems: systemsArr,
        crossTags: Array.from(val.tagsSet),
        lastUpdated: val.lastUpdated
      });
    });

    // Sort by active count descending
    return result.sort((a, b) => b.activeCount - a.activeCount || b.totalCount - a.totalCount);
  }, [mistakeLogs, subjectMap, systemMap]);

  // Selected Subject Details
  const currentSubjectNotebook = useMemo(() => {
    if (!selectedSubjectId) return null;
    return subjectNotebooks.find(n => n.subjectId === selectedSubjectId) || null;
  }, [selectedSubjectId, subjectNotebooks]);

  // Filtered & Searched Logs for Current View
  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return mistakeLogs.filter(log => {
      // If we are deep inside a subject notebook
      if (selectedSubjectId && String(log.subjectId) !== selectedSubjectId) {
        return false;
      }

      // Subject filter (in stream mode)
      if (!selectedSubjectId && filterSubjectId !== 'all' && String(log.subjectId) !== filterSubjectId) {
        return false;
      }

      // System filter (inside notebook mode)
      if (systemFilter !== 'all' && String(log.systemId) !== systemFilter) {
        return false;
      }

      // Tag filter
      if (tagFilter !== 'all') {
        if (!log.tags || !log.tags.includes(tagFilter)) return false;
      }

      // Volatile filter
      if (volatileOnly && !log.isVolatile) {
        return false;
      }

      // Status filter
      if (statusFilter === 'active' && log.resolved) return false;
      if (statusFilter === 'mastered' && !log.resolved) return false;

      // Error Root Cause filter
      if (typeFilter !== 'all' && log.errorType !== typeFilter) return false;

      // Text search query across takeaway text, title, trigger, topic, subject, tags, and system
      if (query) {
        const subName = (subjectMap.get(String(log.subjectId)) || '').toLowerCase();
        const sysName = (systemMap.get(String(log.systemId)) || '').toLowerCase();
        const takeaway = (log.keyTakeaway || '').toLowerCase();
        const title = (log.title || '').toLowerCase();
        const trigger = (log.clinicalTrigger || '').toLowerCase();
        const topic = (log.topicId || '').toLowerCase();
        const source = (log.source || '').toLowerCase();
        const sourceExam = (log.sourceExam || '').toLowerCase();
        const tagsJoined = (log.tags || []).join(' ').toLowerCase();

        const matches = 
          takeaway.includes(query) || 
          title.includes(query) ||
          trigger.includes(query) ||
          topic.includes(query) || 
          subName.includes(query) || 
          sysName.includes(query) ||
          source.includes(query) ||
          sourceExam.includes(query) ||
          tagsJoined.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [
    mistakeLogs, 
    selectedSubjectId, 
    filterSubjectId, 
    systemFilter, 
    tagFilter, 
    volatileOnly, 
    statusFilter, 
    typeFilter, 
    searchQuery, 
    subjectMap, 
    systemMap
  ]);

  // Hierarchical Grouping for Stream View: Subject -> System
  interface StreamSubjectGroup {
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

    const result: StreamSubjectGroup[] = [];
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

    return result.sort((a, b) => b.totalCount - a.totalCount);
  }, [filteredLogs, subjectMap, systemMap]);

  const hasActiveFilters = 
    searchQuery.trim() !== '' || 
    typeFilter !== 'all' || 
    filterSubjectId !== 'all' ||
    systemFilter !== 'all' ||
    tagFilter !== 'all' ||
    volatileOnly ||
    statusFilter !== 'active';

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setFilterSubjectId('all');
    setSystemFilter('all');
    setTagFilter('all');
    setVolatileOnly(false);
    setStatusFilter('active');
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
    const rulePreview = log.keyTakeaway.slice(0, 35);

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

  // Toggle Mastered
  const handleToggleMastered = (log: MistakeLog) => {
    if (log.id === undefined) return;
    resolveMistake(log.id, !log.resolved);
  };

  // Toggle Volatile Flag
  const handleToggleVolatile = (log: MistakeLog) => {
    if (log.id === undefined) return;
    toggleMistakeVolatile(log.id, !log.isVolatile);
  };

  const openModalWithContext = (subId?: string | number, sysId?: string | number, tags?: string[]) => {
    setModalDefaultSubjectId(subId || selectedSubjectId || undefined);
    setModalDefaultSystemId(sysId || (systemFilter !== 'all' ? systemFilter : undefined));
    setModalDefaultTags(tags || (tagFilter !== 'all' ? [tagFilter] : []));
    setModalOpen(true);
  };

  // Export 20th Notebook to Markdown / Plain Text
  const exportNotebook = () => {
    if (filteredLogs.length === 0) {
      toast.error('No takeaways to export.');
      return;
    }

    const title = selectedSubjectId && currentSubjectNotebook 
      ? `Atlas 20th Notebook - ${currentSubjectNotebook.subjectName}`
      : `Atlas 20th Notebook - High Yield Revision Rules`;
    
    let content = `# ${title}\nGenerated on ${new Date().toLocaleDateString()} • ${filteredLogs.length} Rules\n\n`;

    filteredLogs.forEach((log, idx) => {
      const sub = subjectMap.get(String(log.subjectId)) || 'Subject';
      const sys = systemMap.get(String(log.systemId)) || 'General';
      content += `### ${idx + 1}. [${sub} › ${sys}] ${log.title ? `- ${log.title}` : ''}\n`;
      if (log.clinicalTrigger) {
        content += `> **Scenario / Trigger:** ${log.clinicalTrigger}\n\n`;
      }
      content += `**Rule:** ${log.keyTakeaway}\n\n`;
      const metaParts: string[] = [];
      if (log.isVolatile) metaParts.push('⚡ Volatile Fact');
      if (log.errorType) metaParts.push(`Type: ${log.errorType}`);
      if (log.source) metaParts.push(`Source: ${log.source} ${log.sourceExam ? `(${log.sourceExam})` : ''}`);
      if (log.tags && log.tags.length > 0) metaParts.push(`Tags: #${log.tags.join(' #')}`);
      content += `*${metaParts.join(' • ')}*\n\n---\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('20th Notebook exported to Markdown!');
  };

  return (
    <div id="mistake-journal-page" className="min-h-full bg-background px-4 sm:px-6 lg:px-8 pt-6 pb-28 md:pb-12 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header & Global Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold tracking-wider uppercase text-[10px]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>20th Notebook Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5 flex-wrap">
            <span>Mistake Recovery Vault</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-muted-foreground bg-muted/40 px-2.5 py-0.5 rounded-full border border-border/40">
                {activeCount} active
              </span>
              {volatileCount > 0 && (
                <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                  <Flame className="w-3 h-3" /> {volatileCount} volatile
                </span>
              )}
            </div>
          </h1>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Distilled high-yield rules from your QBank & Grand Test errors. Press <kbd className="font-mono bg-muted/60 px-1 py-0.5 rounded text-[10px] text-foreground font-semibold">N</kbd> to quick log.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
          {/* Export button */}
          {totalLogs > 0 && (
            <Button
              id="btn-export-mistakes"
              variant="outline"
              size="sm"
              onClick={exportNotebook}
              className="h-8.5 rounded-xl border-border/80 text-xs font-semibold gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
              title="Export high-yield rules to Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}

          {/* Log Primary Action */}
          <Button 
            id="btn-open-log-mistake-modal"
            onClick={() => openModalWithContext()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs gap-1.5 cursor-pointer px-4 h-8.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Takeaway</span>
          </Button>
        </div>
      </div>

      {/* 2. Intelligent High-Error Bridge (If High Concentration Exists) */}
      {topErrorSubject && !selectedSubjectId && (
        <div id="high-error-density-card" className="p-3.5 rounded-2xl bg-card border border-primary/20 shadow-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-foreground">
                  High Mistake Concentration in {topErrorSubject.name}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  {topErrorSubject.count} active mistakes
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                Consider prioritizing this subject during your next scheduled revision session.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const match = subjectNotebooks.find(n => n.subjectName.toLowerCase() === topErrorSubject.name.toLowerCase());
              if (match) {
                setSelectedSubjectId(match.subjectId);
                setActiveView('notebooks');
              }
            }}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0 px-2 py-1 cursor-pointer"
          >
            <span>Review</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. View Switcher & Control Panel */}
      {!selectedSubjectId && (
        <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
          {/* Segmented Mode Control */}
          <div className="flex items-center p-1 rounded-2xl bg-muted/30 border border-border/70">
            <button
              type="button"
              onClick={() => setActiveView('notebooks')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                activeView === 'notebooks'
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span>Subject Notebooks</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-muted/60 text-muted-foreground">
                {subjectNotebooks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('stream')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                activeView === 'stream'
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Unified Stream</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-muted/60 text-muted-foreground">
                {totalLogs}
              </span>
            </button>
          </div>

          {/* Quick Volatile Filter Toggle */}
          <button
            type="button"
            onClick={() => setVolatileOnly(prev => !prev)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer",
              volatileOnly
                ? "bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-xs"
                : "bg-card border-border/70 text-muted-foreground hover:text-foreground"
            )}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Volatile Traps ({volatileCount})</span>
          </button>
        </div>
      )}

      {/* 4. MODE A: SUBJECT NOTEBOOKS GALLERY (When not deep in a subject) */}
      {activeView === 'notebooks' && !selectedSubjectId && (
        <div className="space-y-4">
          {subjectNotebooks.length > 0 ? (
            <div id="subject-notebooks-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectNotebooks.map(notebook => {
                return (
                  <div
                    key={notebook.subjectId}
                    id={`notebook-card-${notebook.subjectId}`}
                    onClick={() => {
                      setSelectedSubjectId(notebook.subjectId);
                      setSystemFilter('all');
                      setTagFilter('all');
                    }}
                    className="group relative flex flex-col justify-between p-4.5 rounded-2xl bg-card border border-border/80 hover:border-primary/50 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
                  >
                    {/* Top Subject Title & Badges */}
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-105 transition-transform">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors tracking-tight line-clamp-1">
                              {notebook.subjectName}
                            </h3>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                              Notebook
                            </span>
                          </div>
                        </div>

                        {/* Volatile badge if any */}
                        {notebook.volatileCount > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                            <Flame className="w-2.5 h-2.5" />
                            {notebook.volatileCount}
                          </span>
                        )}
                      </div>

                      {/* Systems Pill Preview */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {notebook.systems.slice(0, 3).map(sys => (
                          <span key={sys.id} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted/40 text-muted-foreground border border-border/40 truncate max-w-[140px]">
                            {sys.name} ({sys.count})
                          </span>
                        ))}
                        {notebook.systems.length > 3 && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-muted/20 text-muted-foreground">
                            +{notebook.systems.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Cross Tags Preview */}
                      {notebook.crossTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center pt-0.5">
                          <Tag className="w-2.5 h-2.5 text-primary/70 mr-0.5" />
                          {notebook.crossTags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[9px] font-bold text-primary/80 bg-primary/5 px-1.5 py-0.2 rounded border border-primary/20">
                              #{tag}
                            </span>
                          ))}
                          {notebook.crossTags.length > 2 && (
                            <span className="text-[9px] text-muted-foreground">
                              +{notebook.crossTags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Meta & Action */}
                    <div className="pt-4 mt-3 border-t border-border/40 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground font-mono">
                          {notebook.activeCount}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {notebook.activeCount === 1 ? 'active rule' : 'active rules'}
                        </span>
                        {notebook.masteredCount > 0 && (
                          <span className="text-[10px] text-emerald-500 font-semibold ml-1">
                            ({notebook.masteredCount} mastered)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 font-bold text-primary text-xs group-hover:translate-x-0.5 transition-transform">
                        <span>Open</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State for Notebooks */
            <div id="mistakes-empty-state" className="py-14 text-center space-y-3 rounded-2xl border border-dashed border-border/80 bg-card p-6">
              <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-1">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Your 20th Notebook is Pristine
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                As you complete QBank modules and Grand Tests, log high-yield clinical rules, drug choices, triads, and volatile traps to build your subject-wise 20th Notebook.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <Button 
                  id="btn-empty-log-mistake"
                  onClick={() => openModalWithContext()}
                  className="bg-primary text-primary-foreground font-bold text-xs rounded-xl gap-1.5 cursor-pointer px-4"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log First Takeaway</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. MODE A (DEEP DIVE): SELECTED SUBJECT NOTEBOOK LEDGER */}
      {selectedSubjectId && currentSubjectNotebook && (
        <div id="subject-notebook-ledger" className="space-y-4 animate-in fade-in duration-200">
          
          {/* Breadcrumb & Navigation Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSubjectId(null)}
                className="h-8.5 px-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Notebooks</span>
              </Button>

              <div className="h-4 w-px bg-border/60" />

              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2">
                  <span>{currentSubjectNotebook.subjectName} Notebook</span>
                  <span className="text-xs font-mono font-medium text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full border border-border/40">
                    {filteredLogs.length} {filteredLogs.length === 1 ? 'rule' : 'rules'}
                  </span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <Button
                size="sm"
                onClick={() => openModalWithContext(currentSubjectNotebook.subjectId)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs gap-1.5 cursor-pointer h-8"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to {currentSubjectNotebook.subjectName}</span>
              </Button>
            </div>
          </div>

          {/* System Chapters Filter Bar */}
          {currentSubjectNotebook.systems.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSystemFilter('all')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0",
                  systemFilter === 'all'
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card border border-border/70 text-muted-foreground hover:text-foreground"
                )}
              >
                All Chapters ({currentSubjectNotebook.totalCount})
              </button>

              {currentSubjectNotebook.systems.map(sys => (
                <button
                  key={sys.id}
                  type="button"
                  onClick={() => setSystemFilter(sys.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer shrink-0",
                    systemFilter === sys.id
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-card border-border/70 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {sys.name} ({sys.count})
                </button>
              ))}
            </div>
          )}

          {/* Cross-Discipline Tags Filter Bar (if any tags present in this subject) */}
          {currentSubjectNotebook.crossTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mr-1 shrink-0">
                <Tag className="w-3 h-3 text-primary" /> Cross-Tags:
              </span>
              <button
                type="button"
                onClick={() => setTagFilter('all')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0",
                  tagFilter === 'all'
                    ? "bg-muted text-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              {currentSubjectNotebook.crossTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTagFilter(tag === tagFilter ? 'all' : tag)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-all cursor-pointer shrink-0",
                    tagFilter === tag
                      ? "bg-primary/20 text-primary border-primary/40"
                      : "bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-card p-2.5 rounded-2xl border border-border/80 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Search inside ${currentSubjectNotebook.subjectName} rules, drugs, triads...`}
                className="pl-8.5 pr-8 h-8.5 text-xs rounded-xl bg-muted/20 border-border/70 placeholder:text-muted-foreground/60 text-foreground w-full"
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

            {/* Filter Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Status Segmented */}
              <div className="flex items-center p-0.5 rounded-xl bg-muted/40 border border-border/60">
                {(['active', 'mastered', 'all'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer capitalize",
                      statusFilter === st
                        ? "bg-card text-foreground shadow-xs border border-border/60"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Volatile Toggle */}
              <button
                type="button"
                onClick={() => setVolatileOnly(prev => !prev)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer",
                  volatileOnly
                    ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                    : "bg-muted/20 border-border/70 text-muted-foreground hover:text-foreground"
                )}
                title="Filter volatile traps only"
              >
                <Flame className="w-3 h-3" />
                <span className="hidden sm:inline">Volatile</span>
              </button>

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

          {/* List of Clinical Takeaway Cards */}
          {filteredLogs.length > 0 ? (
            <div className="space-y-3">
              {filteredLogs.map(log => {
                const sysName = systemMap.get(String(log.systemId)) || 'General Chapter';

                return (
                  <div
                    key={String(log.id)}
                    id={`mistake-card-${log.id}`}
                    className={cn(
                      "group relative p-4 rounded-2xl bg-card border transition-all duration-150 space-y-2.5",
                      log.resolved
                        ? "border-border/40 opacity-70 bg-muted/10"
                        : "border-border/80 hover:border-border shadow-xs"
                    )}
                  >
                    {/* Top Row: System Chapter, Topic & Actions */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {sysName}
                        </span>

                        {log.topicId && (
                          <span className="text-[10px] font-bold text-primary/90 bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                            {log.topicId}
                          </span>
                        )}

                        {log.isVolatile && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/30">
                            <Flame className="w-2.5 h-2.5" /> Volatile Fact
                          </span>
                        )}
                      </div>

                      {/* Right Action Icons */}
                      <div className="flex items-center gap-1">
                        {/* Mastered Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleMastered(log)}
                          className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                            log.resolved
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              : "bg-muted/40 text-muted-foreground border-border/40 hover:text-foreground"
                          )}
                          title={log.resolved ? "Reopen for review" : "Mark as Mastered"}
                        >
                          {log.resolved ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Mastered</span>
                            </>
                          ) : (
                            <>
                              <Circle className="w-3 h-3" />
                              <span>Mark Mastered</span>
                            </>
                          )}
                        </button>

                        {/* Volatile Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleVolatile(log)}
                          className={cn(
                            "p-1.5 rounded-lg border transition-all cursor-pointer",
                            log.isVolatile
                              ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                              : "border-transparent text-muted-foreground/50 hover:text-amber-500 hover:bg-amber-500/10"
                          )}
                          title={log.isVolatile ? "Remove volatile flag" : "Mark as volatile trap"}
                        >
                          <Flame className="w-3.5 h-3.5" />
                        </button>

                        {/* Safe Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete(log)}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                          title="Delete takeaway (with undo)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Optional Clinical Trigger / Scenario */}
                    {log.clinicalTrigger && (
                      <div className="p-2.5 rounded-xl bg-muted/20 border border-border/40 text-xs text-muted-foreground italic leading-relaxed">
                        <span className="font-bold not-italic text-foreground/80 mr-1">Vignette Trigger:</span>
                        {log.clinicalTrigger}
                      </div>
                    )}

                    {/* Hero Golden Rule Text */}
                    <div className="space-y-1">
                      {log.title && (
                        <h4 className="text-xs font-bold text-foreground">
                          {log.title}
                        </h4>
                      )}
                      <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed select-text">
                        {log.keyTakeaway}
                      </p>
                    </div>

                    {/* Bottom Metadata Line */}
                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground pt-1">
                      {/* Cross-Discipline Tags */}
                      {log.tags && log.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {log.tags.map(tag => (
                            <span key={tag} className="font-semibold text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/20">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Source Pill */}
                      <span className="font-mono bg-muted/40 px-1.5 py-0.5 rounded border border-border/40">
                        {log.source === 'GT' ? 'Grand Test' : log.source}
                        {log.sourceExam ? ` • ${log.sourceExam}` : ''}
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
                      <span className="text-muted-foreground/60 ml-auto">
                        {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center space-y-2 rounded-2xl border border-dashed border-border/80 bg-card p-6">
              <p className="text-xs font-semibold text-muted-foreground">
                No takeaways matched your current filters in {currentSubjectNotebook.subjectName}.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="rounded-xl text-xs font-semibold"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 6. MODE B: UNIFIED RAPID STREAM (Chronological across all subjects) */}
      {activeView === 'stream' && !selectedSubjectId && (
        <div className="space-y-4">
          
          {/* Universal Search & Multi-Filters */}
          <div id="journal-control-panel" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-card p-2.5 rounded-2xl border border-border/80 shadow-xs">
            
            {/* Search Input with Keyboard Shortcut Indicator */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchInputRef}
                id="input-search-mistakes"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search across all 19 subjects, rules, tags, drugs (e.g. DOC, Phenoxybenzamine)..."
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
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
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

          {/* Grouped Subject Stream */}
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
                    <div className="w-full px-4 py-3 bg-muted/30 border-b border-border/60 flex items-center justify-between gap-3 text-left">
                      <button
                        type="button"
                        onClick={() => toggleSubjectCollapse(subjectGroup.subjectId)}
                        className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                      >
                        <span className="font-extrabold text-xs sm:text-sm text-foreground tracking-tight uppercase">
                          {subjectGroup.subjectName}
                        </span>
                        <span className="text-[11px] font-mono font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border/40 shrink-0">
                          {subjectGroup.totalCount} {subjectGroup.totalCount === 1 ? 'rule' : 'rules'}
                        </span>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubjectId(subjectGroup.subjectId);
                            setActiveView('notebooks');
                          }}
                          className="text-[11px] font-bold text-primary hover:underline px-1 cursor-pointer hidden sm:inline-block"
                        >
                          Open Notebook ➔
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSubjectCollapse(subjectGroup.subjectId)}
                          className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isCollapsed && "-rotate-90")} />
                        </button>
                      </div>
                    </div>

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
                                      {/* Trigger if present */}
                                      {log.clinicalTrigger && (
                                        <p className="text-[11px] text-muted-foreground italic line-clamp-1">
                                          Trigger: {log.clinicalTrigger}
                                        </p>
                                      )}

                                      {/* Clinical Rule Text */}
                                      <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed select-text">
                                        {log.keyTakeaway}
                                      </p>

                                      {/* Metadata Line */}
                                      <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                                        {/* Volatile badge */}
                                        {log.isVolatile && (
                                          <span className="flex items-center gap-0.5 text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                                            <Flame className="w-2.5 h-2.5" /> Volatile
                                          </span>
                                        )}

                                        {/* Cross-Discipline Tags */}
                                        {log.tags && log.tags.length > 0 && (
                                          <div className="flex items-center gap-1 flex-wrap">
                                            {log.tags.map(tag => (
                                              <span key={tag} className="font-semibold text-primary/90 bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                                #{tag}
                                              </span>
                                            ))}
                                          </div>
                                        )}

                                        {/* Topic Tag if present */}
                                        {log.topicId && (
                                          <span className="font-semibold text-foreground/80 bg-muted/50 px-1.5 py-0.5 rounded border border-border/40">
                                            {log.topicId}
                                          </span>
                                        )}

                                        {/* Source Pill */}
                                        <span className="font-mono bg-muted/40 px-1.5 py-0.5 rounded border border-border/40">
                                          {log.source === 'GT' ? 'Grand Test' : log.source}
                                          {log.sourceExam ? ` • ${log.sourceExam}` : ''}
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

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleMastered(log)}
                                        className={cn(
                                          "p-1.5 rounded-lg transition-all cursor-pointer",
                                          log.resolved
                                            ? "text-emerald-500 bg-emerald-500/10"
                                            : "text-muted-foreground/50 hover:text-foreground"
                                        )}
                                        title={log.resolved ? "Marked as Mastered" : "Mark Mastered"}
                                      >
                                        {log.resolved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                                      </button>

                                      <button
                                        id={`btn-delete-mistake-${log.id}`}
                                        type="button"
                                        onClick={() => handleDelete(log)}
                                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                                        title="Delete takeaway (with undo)"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
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
            <div id="mistakes-stream-empty-state" className="py-12 text-center space-y-3 rounded-2xl border border-dashed border-border/80 bg-card p-6">
              <p className="text-xs text-muted-foreground">
                No takeaways matched your search filters.
              </p>
              <Button 
                onClick={resetFilters}
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-semibold"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Express Takeaway Capture Modal */}
      <QuickMistakeModal 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        defaultSubjectId={modalDefaultSubjectId}
        defaultSystemId={modalDefaultSystemId}
        defaultTags={modalDefaultTags}
      />
    </div>
  );
}
