import { useLexicon } from '@/lib/lexicon';
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useSearch, Link } from 'wouter';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { MistakeLog } from '@/db/types';
import { 
  deleteMistakeLog, 
  restoreMistakeLog, 
  resolveMistake, 
  toggleMistakeVolatile,
  markMistakesAsAnkiExported
} from '@/db/mutations';
import { QuickMistakeModal, HIGH_YIELD_CLINICAL_LENSES } from './QuickMistakeModal';
import { 
  Plus, 
  Trash2, 
  BookOpen, 
  ChevronRight, 
  Search,
  X,
  Zap,
  CheckCircle2,
  Tag,
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Edit3,
  Layers,
  Archive,
  ArchiveRestore,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getOntologyForExam } from '@/data/ontology';
import { useExamProfile } from '@/hooks/useExamProfile';
import { toast } from 'sonner';
import { useAISettings } from '@/lib/ai/aiSettingsStorage';
import { AIVoiceCaptureModal } from '@/components/ai/AIVoiceCaptureModal';
import { FlashcardStudioModal } from '@/components/FlashcardStudioModal';

export function getTagMeta(tag: string) {
  const lexicon = useLexicon();

  const norm = tag.toLowerCase();
  if (norm === 'doc' || norm.includes('pharma') || norm.includes('drug')) {
    return { icon: '💊', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' };
  }
  if (norm === 'ioc' || norm.includes('investigation')) {
    return { icon: '🔍', color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25' };
  }
  if (norm === 'histopath' || norm === 'biopsy' || norm.includes('pathology')) {
    return { icon: '🔬', color: 'bg-primary/10 text-purple-600 dark:text-primary border-purple-500/25' };
  }
  if (norm === 'imaging' || norm.includes('radiology') || norm === 'x-ray' || norm === 'ct') {
    return { icon: '🩻', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25' };
  }
  if (norm === 'triad' || norm.includes('sign')) {
    return { icon: '⚠️', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25' };
  }
  if (norm === 'criteria' || norm === 'staging' || norm === 'score') {
    return { icon: '📊', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25' };
  }
  if (norm === 'contraindicated' || norm === 'contra') {
    return { icon: '🚫', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25' };
  }
  if (norm.includes('peds') || norm.includes('preg')) {
    return { icon: '👶', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/25' };
  }
  if (norm.includes('confusion') || norm.includes('twin')) {
    return { icon: '🔄', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25' };
  }
  if (norm === 'volatile') {
    return { icon: '⚡', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/35 font-bold' };
  }
  return { icon: null, color: 'bg-primary/10 text-primary border-primary/20 font-semibold' };
}

export default function MistakeRecoveryQueue() {
  const { profile } = useExamProfile();
  const lexicon = useLexicon();

  const searchStr = useSearch();
  const [, setLocation] = useLocation();

  const [modalOpen, setModalOpen] = useState(false);
  const [flashcardModalOpen, setFlashcardModalOpen] = useState(false);
  const [editingMistake, setEditingMistake] = useState<MistakeLog | null>(null);
  const [modalDefaultSubjectId, setModalDefaultSubjectId] = useState<string | number | undefined>(undefined);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const { settings } = useAISettings();

  // Filters & View State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [viewLayout, setViewLayout] = useState<'grouped' | 'stream'>('grouped');
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Sync initial subject from query string if available (e.g. ?subjectId=...)
  useEffect(() => {
    if (searchStr) {
      const params = new URLSearchParams(searchStr);
      const subId = params.get('subjectId');
      if (subId) {
        setSelectedSubjectId(subId);
        setModalDefaultSubjectId(subId);
      }
    }
  }, [searchStr]);

  // Database queries
  const toggleSelection = (id: string | number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const rawMistakes = useLiveQuery(() => db.mistakeLogs?.toArray(), []) || [];
  const dbSubjects = useLiveQuery(() => db.subjects?.filter(s => !s.deletedAt).toArray(), []) || [];

  const currentOntology = useMemo(() => {
    return getOntologyForExam(profile.targetExam || 'NEET PG');
  }, [profile.targetExam]);

  const totalSubjectCount = useMemo(() => {
    return dbSubjects.length > 0 ? dbSubjects.length : currentOntology.length;
  }, [dbSubjects.length, currentOntology.length]);

  const subjectMap = useMemo(() => {
    const map = new Map<string, string>();
    currentOntology.forEach(s => map.set(String(s.id), s.name));
    dbSubjects.forEach(s => map.set(String(s.id), s.name));
    return map;
  }, [currentOntology, dbSubjects]);

  // Metrics
  const activeMistakes = useMemo(() => {
    return rawMistakes.filter(m => !m.deletedAt && !m.resolved);
  }, [rawMistakes]);

  const volatileMistakes = useMemo(() => {
    return activeMistakes.filter(m => m.isVolatile);
  }, [activeMistakes]);

  const archivedMistakes = useMemo(() => {
    return rawMistakes.filter(m => !m.deletedAt && m.resolved);
  }, [rawMistakes]);

  const representedSubjectCount = useMemo(() => {
    const set = new Set<string>();
    activeMistakes.forEach(m => {
      if (m.subjectId !== undefined) set.add(String(m.subjectId));
    });
    return set.size;
  }, [activeMistakes]);

  // Filtered dataset
  const filteredMistakes = useMemo(() => {
    return rawMistakes.filter(m => {
      if (m.deletedAt) return false;

      // Status filter
      if (statusFilter === 'active' && m.resolved) return false;
      if (statusFilter === 'archived' && !m.resolved) return false;

      // Subject filter
      if (selectedSubjectId !== 'all') {
        const subMatch = String(m.subjectId) === selectedSubjectId;
        const subNameMatch = subjectMap.get(String(m.subjectId))?.toLowerCase() === selectedSubjectId.toLowerCase();
        if (!subMatch && !subNameMatch) return false;
      }

      // Tag filter
      if (selectedTag === 'volatile') {
        if (!m.isVolatile) return false;
      } else if (selectedTag !== 'all') {
        const tags = m.tags || (m as any).coreLenses || [];
        const hasTag = tags.some((t: string) => t.toLowerCase() === selectedTag.toLowerCase());
        if (!hasTag) return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const ruleText = (m.keyTakeaway || (m as any).goldenTakeaway || (m as any).questionTopic || '').toLowerCase();
        const subName = (subjectMap.get(String(m.subjectId)) || '').toLowerCase();
        const tagsStr = (m.tags || []).join(' ').toLowerCase();
        if (!ruleText.includes(q) && !subName.includes(q) && !tagsStr.includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Sort pinned volatile rules to top, then by recency
      if (a.isVolatile && !b.isVolatile) return -1;
      if (!a.isVolatile && b.isVolatile) return 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [rawMistakes, statusFilter, selectedSubjectId, selectedTag, searchQuery, subjectMap]);

  // Grouped by Subject for Accordion Mode
  const groupedMistakes = useMemo(() => {
    const groups = new Map<string, { subjectId: string; subjectName: string; rules: MistakeLog[] }>();

    filteredMistakes.forEach(m => {
      const sId = String(m.subjectId || 'general');
      const sName = subjectMap.get(sId) || 'General Clinical';
      if (!groups.has(sId)) {
        groups.set(sId, { subjectId: sId, subjectName: sName, rules: [] });
      }
      groups.get(sId)!.rules.push(m);
    });

    return Array.from(groups.values()).sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  }, [filteredMistakes, subjectMap]);

  // Copy single rule to clipboard
  const handleCopyRule = (rule: MistakeLog) => {
    const subName = subjectMap.get(String(rule.subjectId)) || 'Clinical';
    const text = (rule.keyTakeaway || (rule as any).goldenTakeaway || '').trim();
    const formatted = `[${subName}] ${text}`;
    navigator.clipboard.writeText(formatted);
    setCopiedId(rule.id || null);
    toast.success('Rule copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy entire filtered notebook as formatted markdown
  const handleCopyFullSheet = () => {
    if (filteredMistakes.length === 0) {
      toast.error('No rules to copy.');
      return;
    }

    let markdown = `# ${lexicon.mistakesJournal} — Rapid Pre-GT Revision Sheet\n`;
    markdown += `Generated on ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}\n\n`;

    groupedMistakes.forEach(group => {
      markdown += `## ${group.subjectName} (${group.rules.length} rules)\n`;
      group.rules.forEach(rule => {
        const text = (rule.keyTakeaway || (rule as any).goldenTakeaway || '').trim();
        const volatileMark = rule.isVolatile ? ' ⚡ [VOLATILE]' : '';
        const tags = (rule.tags && rule.tags.length > 0) ? ` #${rule.tags.join(' #')}` : '';
        markdown += `- ${text}${volatileMark}${tags}\n`;
      });
      markdown += `\n`;
    });

    navigator.clipboard.writeText(markdown);
    toast.success('Complete Revision Sheet copied to clipboard!', {
      description: 'Ready to paste into Obsidian, Notion, or print.'
    });
  };

  const toggleGroupCollapse = (sId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [sId]: !prev[sId]
    }));
  };

  return (
    <div className="min-h-full bg-background text-foreground px-3.5 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-28 md:pb-12 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 w-full">
      {/* ── Top Header & Navigation ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/radar"
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1 rounded-lg hover:bg-muted/60 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Subject Radar</span>
            </Link>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              High-Density Rule Ledger
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <span>{lexicon.mistakesJournal}</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
              {activeMistakes.length} Active Rules
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
            Your personal cheat sheet of confusing twin concepts, drug choices, classic triads, and volatile facts curated across 19 subjects.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyFullSheet}
            className="rounded-xl font-bold text-xs h-9 px-3 gap-1.5 cursor-pointer hover:bg-muted/80 shadow-2xs"
            title="Copy all rules as markdown"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Sheet</span>
            <span className="sm:hidden">Export</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setFlashcardModalOpen(true)}
            className="rounded-xl font-bold text-xs h-9 px-3 gap-1.5 cursor-pointer border-primary/30 text-purple-600 dark:text-primary hover:bg-purple-50 dark:hover:bg-primary/10 shadow-2xs"
            title="Export Flashcards"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Flashcard Studio</span>
            <span className="sm:hidden">Cards</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingMistake(null);
              setModalOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs gap-1.5 h-9 px-3.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Rule</span>
          </Button>
        </div>
      </div>

      {/* ── Diagnostic Metrics Strip ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => { setStatusFilter('active'); setSelectedTag('all'); }}
          className={cn(
            "p-3.5 rounded-2xl border transition-all cursor-pointer space-y-0.5",
            statusFilter === 'active' && selectedTag === 'all'
              ? "bg-card border-border shadow-xs ring-1 ring-primary/30"
              : "bg-muted/30 border-border/60 hover:bg-muted/50"
          )}
        >
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            Active Rules
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-foreground">
              {activeMistakes.length}
            </span>
            <span className="text-xs text-muted-foreground">active</span>
          </div>
        </div>

        <div 
          onClick={() => { setSelectedTag('volatile'); setStatusFilter('active'); }}
          className={cn(
            "p-3.5 rounded-2xl border transition-all cursor-pointer space-y-0.5",
            selectedTag === 'volatile'
              ? "bg-amber-500/15 border-amber-500/40 shadow-xs ring-1 ring-amber-500/40"
              : "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15"
          )}
        >
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
            Volatile Rules
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {volatileMistakes.length}
            </span>
            <span className="text-xs text-amber-600/80 dark:text-amber-400/80">urgent</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 space-y-0.5">
          <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            Subjects
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-primary">
              {representedSubjectCount}
            </span>
            <span className="text-xs text-primary/80">of {totalSubjectCount}</span>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'archived' ? 'active' : 'archived')}
          className={cn(
            "p-3.5 rounded-2xl border transition-all cursor-pointer space-y-0.5",
            statusFilter === 'archived'
              ? "bg-emerald-500/15 border-emerald-500/40 shadow-xs ring-1 ring-emerald-500/40"
              : "bg-muted/30 border-border/60 hover:bg-muted/50"
          )}
        >
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Archive className="w-3 h-3 text-emerald-500" />
            Archived
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-foreground">
              {archivedMistakes.length}
            </span>
            <span className="text-xs text-muted-foreground">stored</span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ────────────────────────────────────── */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs space-y-3.5">
        {/* Search Bar & View Toggle */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rules, drug names, triads, investigations, or subjects..."
              className="pl-9 pr-8 h-9 text-xs rounded-xl bg-muted/40 border-border/80 focus:bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-start">
            {/* Status Filter */}
            <div className="flex items-center p-1 rounded-xl bg-muted/50 border border-border/80">
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  statusFilter === 'active'
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('archived')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  statusFilter === 'archived'
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Archived ({archivedMistakes.length})
              </button>
            </div>

            {/* Layout Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-muted/50 border border-border/80">
              <button
                type="button"
                onClick={() => setViewLayout('grouped')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  viewLayout === 'grouped'
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Group by Subject"
              >
                Subjects
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('stream')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  viewLayout === 'stream'
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Continuous Stream"
              >
                Stream
              </button>
            </div>
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="space-y-1.5 pt-1 border-t border-border/40">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Subject Filter</span>
            {selectedSubjectId !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedSubjectId('all')}
                className="text-primary hover:underline lowercase font-normal cursor-pointer"
              >
                clear filter
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedSubjectId('all')}
              className={cn(
                "px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all border cursor-pointer",
                selectedSubjectId === 'all'
                  ? "bg-foreground text-background border-foreground shadow-xs"
                  : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
              )}
            >
              All Subjects ({filteredMistakes.length})
            </button>

            {(dbSubjects.length > 0 ? dbSubjects : getOntologyForExam(profile.targetExam || 'NEET PG')).map(sub => {
              const count = rawMistakes.filter(m => !m.deletedAt && !m.resolved && String(m.subjectId) === String(sub.id)).length;
              if (count === 0 && selectedSubjectId !== String(sub.id)) return null;

              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubjectId(String(sub.id))}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all border cursor-pointer",
                    selectedSubjectId === String(sub.id)
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <span>{sub.name}</span>
                  {count > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-muted text-xs font-mono">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tag Lens Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          <button
            type="button"
            onClick={() => setSelectedTag('all')}
            className={cn(
              "px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all border cursor-pointer",
              selectedTag === 'all'
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-muted/30 border-border/60 text-muted-foreground hover:text-foreground"
            )}
          >
            All Tags
          </button>

          <button
            type="button"
            onClick={() => setSelectedTag('volatile')}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all border cursor-pointer",
              selectedTag === 'volatile'
                ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                : "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
            )}
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>Volatile Only ({volatileMistakes.length})</span>
          </button>

          {HIGH_YIELD_CLINICAL_LENSES.map(lens => (
            <button
              key={lens.id}
              type="button"
              onClick={() => setSelectedTag(lens.tag)}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all border cursor-pointer",
                selectedTag === lens.tag
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-muted/30 border-border/60 text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{lens.icon}</span>
              <span>{lens.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Ledger Display ────────────────────────────────────────── */}
      {filteredMistakes.length === 0 ? (
        /* Clean Empty State */
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20 space-y-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-base font-bold text-foreground">
              {statusFilter === 'archived' ? 'No Archived Rules' : `No ${lexicon.mistakesJournal} Rules Found`}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {searchQuery || selectedSubjectId !== 'all' || selectedTag !== 'all'
                ? 'No rules match your active filter criteria. Try clearing filters or search terms.'
                : 'Whenever you miss an MCQ or confuse twin concepts in Grand Tests, log the single discriminating rule here for rapid pre-exam revision.'}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            {(searchQuery || selectedSubjectId !== 'all' || selectedTag !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSubjectId('all');
                  setSelectedTag('all');
                }}
                className="text-xs font-semibold rounded-xl"
              >
                Reset Filters
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => {
                setEditingMistake(null);
                setModalOpen(true);
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs gap-1 h-9 px-4 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>
                {selectedSubjectId !== 'all'
                  ? `Add ${subjectMap.get(selectedSubjectId) || 'Subject'} Rule`
                  : 'Add First Rule'}
              </span>
            </Button>
          </div>
        </div>
      ) : viewLayout === 'grouped' ? (
        /* ── Subject Grouped Accordion Mode ─────────────────────────── */
        <div className="space-y-4">
          {groupedMistakes.map(group => {
            const isCollapsed = collapsedGroups[group.subjectId];
            return (
              <div 
                key={group.subjectId}
                className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs transition-all hover:border-border"
              >
                {/* Group Header */}
                <div 
                  onClick={() => toggleGroupCollapse(group.subjectId)}
                  className="flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer border-b border-border/40 select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <h3 className="text-sm font-extrabold text-foreground tracking-tight">
                      {group.subjectName}
                    </h3>
                    <span className="text-xs font-mono px-2 py-0.2 rounded-full bg-muted text-muted-foreground font-semibold">
                      {group.rules.length} {group.rules.length === 1 ? 'rule' : 'rules'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalDefaultSubjectId(group.subjectId);
                        setEditingMistake(null);
                        setModalOpen(true);
                      }}
                      className="h-7 px-2 text-xs font-bold rounded-lg gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </Button>

                    <button
                      type="button"
                      className="p-1 text-muted-foreground hover:text-foreground transition-transform"
                    >
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Group Rules Stream */}
                {!isCollapsed && (
                  <div className="divide-y divide-border/40">
                    {group.rules.map(rule => (
                      <RuleCardRow
                        key={rule.id}
                        rule={rule}
                        subjectName={group.subjectName}
                        isCopied={copiedId === rule.id}
                        selectionMode={selectionMode}
                        isSelected={rule.id !== undefined && selectedIds.has(rule.id)}
                        onToggleSelection={() => rule.id !== undefined && toggleSelection(rule.id)}
                        onCopy={() => handleCopyRule(rule)}
                        onEdit={() => {
                          setEditingMistake(rule);
                          setModalOpen(true);
                        }}
                        onToggleVolatile={() => toggleMistakeVolatile(rule.id!, !rule.isVolatile)}
                        onToggleArchive={() => resolveMistake(rule.id!, !rule.resolved)}
                        onDelete={() => deleteMistakeLog(rule.id!)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Continuous Flat Stream Mode ───────────────────────────── */
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs divide-y divide-border/40">
          {filteredMistakes.map(rule => {
            const subName = subjectMap.get(String(rule.subjectId)) || 'Clinical';
            return (
              <RuleCardRow
                key={rule.id}
                rule={rule}
                subjectName={subName}
                isCopied={copiedId === rule.id}
                selectionMode={selectionMode}
                isSelected={rule.id !== undefined && selectedIds.has(rule.id)}
                onToggleSelection={() => rule.id !== undefined && toggleSelection(rule.id)}
                onCopy={() => handleCopyRule(rule)}
                onEdit={() => {
                  setEditingMistake(rule);
                  setModalOpen(true);
                }}
                onToggleVolatile={() => toggleMistakeVolatile(rule.id!, !rule.isVolatile)}
                onToggleArchive={() => resolveMistake(rule.id!, !rule.resolved)}
                onDelete={() => deleteMistakeLog(rule.id!)}
              />
            );
          })}
        </div>
      )}

      {/* ── Quick Capture Modal ─────────────────────────────────────── */}
      <QuickMistakeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultSubjectId={selectedSubjectId !== 'all' ? selectedSubjectId : modalDefaultSubjectId}
        editingMistake={editingMistake}
        onDeleteMistake={(m) => {
          if (m.id) {
            deleteMistakeLog(m.id);
            setModalOpen(false);
          }
        }}
      />

      {settings.isAiEnabled && (
        <AIVoiceCaptureModal
          open={voiceModalOpen}
          onOpenChange={setVoiceModalOpen}
        />
      )}

      <FlashcardStudioModal
        isOpen={flashcardModalOpen}
        onClose={() => setFlashcardModalOpen(false)}
        allMistakes={rawMistakes.filter(m => !m.deletedAt)}
        visibleMistakes={filteredMistakes}
        selectedMistakes={Array.from(selectedIds).map(id => rawMistakes.find(m => m.id === id)).filter(Boolean)} // For pass 1, we pass empty. Pass 2 will implement selection.
        onMarkExported={async (ids) => {
          await markMistakesAsAnkiExported(ids);
          toast.success(`Marked ${ids.length} rules as exported.`);
        }}
      />
    </div>
  );
}

// ── Atomic High-Density Rule Row Component ─────────────────────────────────
interface RuleCardRowProps {
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
  rule: MistakeLog;
  subjectName: string;
  isCopied: boolean;
  onCopy: () => void;
  onEdit: () => void;
  onToggleVolatile: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
}

function RuleCardRow({
  rule,
  subjectName,
  isCopied,
  onCopy,
  onEdit,
  onToggleVolatile,
  onToggleArchive,
  onDelete
}: RuleCardRowProps) {
  const ruleText = (rule.keyTakeaway || (rule as any).goldenTakeaway || (rule as any).questionTopic || '').trim();
  const tags = rule.tags || (rule as any).coreLenses || [];

  return (
    <div className={cn(
      "p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group hover:bg-muted/30",
      rule.isVolatile && "bg-amber-500/[0.03]"
    )}>
      {/* Rule Content */}
      <div className="space-y-1.5 min-w-0 flex-1">
        {/* Meta badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
            {subjectName}
          </span>

          {rule.isVolatile && (
            <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <Zap className="w-2.5 h-2.5 fill-amber-500" />
              <span>Volatile</span>
            </span>
          )}

          {rule.source && (
            <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground border border-border/40">
              {rule.source}
            </span>
          )}

          {tags.map((t: string) => {
            const meta = getTagMeta(t);
            return (
              <span 
                key={t}
                className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.2 rounded-full border font-semibold", meta.color)}
              >
                {meta.icon && <span>{meta.icon}</span>}
                <span>#{t}</span>
              </span>
            );
          })}
        </div>

        {/* Primary Rule Takeaway */}
        <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed selection:bg-primary/20">
          {ruleText}
        </p>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-1 shrink-0 self-end sm:self-center opacity-80 sm:opacity-40 group-hover:opacity-100 transition-opacity">
        {/* Volatile Toggle Button */}
        <button
          type="button"
          onClick={onToggleVolatile}
          className={cn(
            "p-1.5 rounded-lg border transition-all cursor-pointer",
            rule.isVolatile
              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40"
              : "bg-muted/40 border-border/60 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
          )}
          title={rule.isVolatile ? "Remove volatile pin" : "Pin as Volatile Trap ⚡"}
        >
          <Zap className={cn("w-3.5 h-3.5", rule.isVolatile && "fill-amber-500")} />
        </button>

        {/* Copy Button */}
        <button
          type="button"
          onClick={onCopy}
          className="p-1.5 rounded-lg bg-muted/40 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
          title="Copy rule to clipboard"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        {/* Edit Button */}
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded-lg bg-muted/40 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
          title="Edit rule"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>

        {/* Archive Toggle Button */}
        <button
          type="button"
          onClick={onToggleArchive}
          className="p-1.5 rounded-lg bg-muted/40 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
          title={rule.resolved ? "Restore to active ledger" : "Archive rule"}
        >
          {rule.resolved ? <ArchiveRestore className="w-3.5 h-3.5 text-emerald-500" /> : <Archive className="w-3.5 h-3.5" />}
        </button>

        {/* Delete Button */}
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-lg bg-muted/40 border border-border/60 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
          title="Delete rule"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
