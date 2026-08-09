import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { MistakeLog } from '@/db/types';
import { resolveMistake, deleteMistakeLog } from '@/db/mutations';
import { QuickMistakeModal } from './QuickMistakeModal';
import { 
  AlertTriangle, 
  Brain, 
  Zap, 
  Eye, 
  CheckCircle2, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Folder, 
  Layers, 
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ALL_SUBJECTS } from '@/data/ontology';

export function MistakeRecoveryQueue() {
  const [activeTab, setActiveTab] = useState<'unresolved' | 'resolved'>('unresolved');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedErrorType, setSelectedErrorType] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch all active mistake logs
  const mistakeLogs: MistakeLog[] = useLiveQuery(
    () => db.mistakeLogs.filter(m => !m.deletedAt).toArray()
  ) || [];

  const subjects = useLiveQuery(() => db.subjects.filter(s => !s.deletedAt).toArray()) || [];
  const systems = useLiveQuery(() => db.systems.filter(s => !s.deletedAt).toArray()) || [];

  const subjectMap = new Map(subjects.map(s => [s.id!, s.name]));
  const systemMap = new Map(systems.map(sys => [sys.id!, sys.name]));

  // Filter logs by resolved state, error type, subject, search query
  const filteredLogs = mistakeLogs.filter(log => {
    if (activeTab === 'unresolved' && log.resolved) return false;
    if (activeTab === 'resolved' && !log.resolved) return false;

    if (selectedErrorType !== 'all' && log.errorType !== selectedErrorType) return false;
    if (selectedSubjectId !== 'all' && log.subjectId !== selectedSubjectId) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const takeawayMatch = log.keyTakeaway.toLowerCase().includes(q);
      const topicMatch = log.topicId ? log.topicId.toLowerCase().includes(q) : false;
      const systemName = systemMap.get(log.systemId) || '';
      const systemMatch = systemName.toLowerCase().includes(q);
      return takeawayMatch || topicMatch || systemMatch;
    }

    return true;
  });

  // Group filtered logs by System ID (Macro view)
  const systemGroupedMap = new Map<number, MistakeLog[]>();
  for (const log of filteredLogs) {
    const existing = systemGroupedMap.get(log.systemId) || [];
    existing.push(log);
    systemGroupedMap.set(log.systemId, existing);
  }

  const errorTypePills = [
    { id: 'all', label: 'All Errors' },
    { id: 'concept', label: '🧠 Concept', color: 'text-purple-500' },
    { id: 'retrieval', label: '⚡ Retrieval', color: 'text-amber-500' },
    { id: 'misread', label: '👁️ Misread', color: 'text-blue-500' },
    { id: 'fomo', label: '🔥 FOMO', color: 'text-destructive' },
  ];

  const getBadgeStyle = (type: MistakeLog['errorType']) => {
    switch (type) {
      case 'concept':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'retrieval':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'misread':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'fomo':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getSourceBadge = (source: MistakeLog['source']) => {
    switch (source) {
      case 'GT':
        return <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30">Grand Test</Badge>;
      case 'QBank':
        return <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/30">QBank</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px] bg-muted text-muted-foreground">Custom</Badge>;
    }
  };

  const unresolvedCount = mistakeLogs.filter(m => !m.resolved).length;
  const resolvedCount = mistakeLogs.filter(m => m.resolved).length;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
      {/* Quick Mistake Modal */}
      <QuickMistakeModal open={isModalOpen} onOpenChange={setIsModalOpen} />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-card via-card to-destructive/5 border border-destructive/20 shadow-sm relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-destructive/15 text-destructive border border-destructive/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Mistake Notebook
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono border-destructive/30 text-destructive uppercase px-2 py-0.5">
              Recovery Engine
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            Targeted weakness remediation. High-friction mistakes aggregated by system to convert repeat errors into mastered concepts.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-2xl px-5 py-2.5 shadow-md flex items-center gap-2 cursor-pointer text-xs self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Log Mistake</span>
        </Button>
      </div>

      {/* Controls Bar: Tabs, Search, Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Active / Mastered Tabs */}
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-2xl border border-border/60 self-start">
            <button
              onClick={() => setActiveTab('unresolved')}
              className={cn(
                "px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
                activeTab === 'unresolved'
                  ? "bg-background text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>Active Recovery</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-destructive/15 text-destructive font-mono">
                {unresolvedCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={cn(
                "px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
                activeTab === 'resolved'
                  ? "bg-background text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>Mastered Log</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono">
                {resolvedCount}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search key takeaways or topics..."
              className="pl-9 h-9 text-xs rounded-2xl border-border bg-card"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
            <Filter className="w-3 h-3" /> Error Type:
          </span>
          {errorTypePills.map(pill => (
            <button
              key={pill.id}
              onClick={() => setSelectedErrorType(pill.id)}
              className={cn(
                "px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                selectedErrorType === pill.id
                  ? "bg-foreground text-background border-foreground shadow-2xs font-bold"
                  : "bg-card text-muted-foreground border-border/80 hover:border-foreground/40"
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main List Grouped by System */}
      {Array.from(systemGroupedMap.entries()).length > 0 ? (
        <div className="space-y-5">
          {Array.from(systemGroupedMap.entries()).map(([sysId, logs]) => {
            const systemName = systemMap.get(sysId) || `System #${sysId}`;
            const firstLog = logs[0];
            const subjectName = subjectMap.get(firstLog.subjectId) || 
              ALL_SUBJECTS.find(s => s.id === firstLog.subjectId)?.name || 'Subject';

            return (
              <div 
                key={sysId}
                className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs space-y-4"
              >
                {/* System Group Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <Folder className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {subjectName}
                      </div>
                      <h3 className="text-base font-bold text-foreground">
                        {systemName}
                      </h3>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 rounded-xl border-border bg-muted/30">
                    {logs.length} mistake{logs.length > 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Mistakes in this system */}
                <div className="space-y-3">
                  {logs.map(log => (
                    <div
                      key={log.id}
                      className={cn(
                        "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                        log.resolved
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-background border-border/80 hover:border-border"
                      )}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border",
                              getBadgeStyle(log.errorType)
                            )}
                          >
                            {log.errorType}
                          </Badge>

                          {getSourceBadge(log.source)}

                          {log.topicId && (
                            <span className="text-xs font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded-lg border border-border/50">
                              {log.topicId}
                            </span>
                          )}

                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {new Date(log.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>

                        {/* Key Takeaway */}
                        <p className="text-xs font-semibold text-foreground leading-relaxed pt-1">
                          "{log.keyTakeaway}"
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                          size="sm"
                          variant={log.resolved ? "outline" : "default"}
                          onClick={() => log.id && resolveMistake(log.id, !log.resolved)}
                          className={cn(
                            "rounded-xl text-xs font-bold cursor-pointer h-8 px-3 flex items-center gap-1.5",
                            log.resolved
                              ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          )}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{log.resolved ? 'Mastered' : 'Mark Mastered'}</span>
                        </Button>

                        <button
                          type="button"
                          onClick={() => log.id && deleteMistakeLog(log.id)}
                          className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center space-y-3 rounded-3xl border border-dashed border-border/80 bg-card p-6">
          <div className="inline-flex p-3 rounded-2xl bg-muted text-muted-foreground mb-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {activeTab === 'unresolved' ? 'No Active Mistakes Logged' : 'No Mastered Entries Yet'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            {activeTab === 'unresolved'
              ? 'Great job! Log GT and QBank mistake takeaways here to track concepts needing remediation before exam day.'
              : 'Mistakes you mark as mastered will appear here for long-term reference.'}
          </p>
          {activeTab === 'unresolved' && (
            <Button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl px-4 py-2 cursor-pointer shadow-sm"
            >
              + Log First Mistake
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default MistakeRecoveryQueue;
