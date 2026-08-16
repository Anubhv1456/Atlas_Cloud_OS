import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { logMistake } from '@/db/mutations';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Brain, 
  Eye, 
  RotateCcw,
  Sparkles,
  Zap,
  HelpCircle,
  CheckCircle2,
  CornerDownLeft,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Plus,
  Tag,
  Flame,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_SUBJECTS } from '@/data/ontology';
import { toast } from 'sonner';

export interface QuickMistakeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSubjectId?: number | string;
  defaultSystemId?: number | string;
  defaultCurriculumSetId?: string;
  defaultTopicId?: string;
  defaultTags?: string[];
}

// Retain session memory across closes so reopening retains active context
let sessionSubjectId: string | number | undefined;
let sessionSystemId: string | number | undefined;
let sessionTopicId: string | undefined;
let sessionSource: 'GT' | 'QBank' | 'Custom' = 'QBank';
let sessionSourceExam: string = '';
let sessionErrorType: 'concept' | 'retrieval' | 'misread' | 'fomo' = 'concept';

const COMMON_CROSS_TAGS = [
  'Medicine', 'Surgery', 'Pathology', 'Pharmacology', 'Pediatrics', 
  'OBGYN', 'Endocrine', 'CVS', 'CNS', 'Renal', 'Infection', 'Toxicology', 'Emergency'
];

export function QuickMistakeModal({
  open,
  onOpenChange,
  defaultSubjectId,
  defaultSystemId,
  defaultCurriculumSetId,
  defaultTopicId,
  defaultTags = []
}: QuickMistakeModalProps) {
  const dbSubjects = useLiveQuery(() => db.subjects?.filter(s => !s.deletedAt).toArray()) || [];
  const dbSystems = useLiveQuery(() => db.systems?.filter(s => !s.deletedAt).toArray()) || [];

  // Combine db subjects with ontology subjects for comprehensive selection
  const subjects = useMemo(() => {
    if (dbSubjects.length > 0) return dbSubjects;
    return ALL_SUBJECTS.map(s => ({ id: s.id, name: s.name }));
  }, [dbSubjects]);

  const [subjectId, setSubjectId] = useState<string | number>('');
  const [systemId, setSystemId] = useState<string | number>('');
  const [curriculumSetId, setCurriculumSetId] = useState<string>('');
  const [topicId, setTopicId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [clinicalTrigger, setClinicalTrigger] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [isVolatile, setIsVolatile] = useState<boolean>(false);
  const [errorType, setErrorType] = useState<'concept' | 'retrieval' | 'misread' | 'fomo'>('concept');
  const [source, setSource] = useState<'GT' | 'QBank' | 'Custom'>('QBank');
  const [sourceExam, setSourceExam] = useState<string>('');
  const [keyTakeaway, setKeyTakeaway] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedBatchCount, setSavedBatchCount] = useState(0);
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Available systems filtered by selected subject
  const availableSystems = useMemo(() => {
    if (!subjectId) return [];
    return dbSystems.filter(sys => String(sys.subjectId) === String(subjectId));
  }, [dbSystems, subjectId]);

  // Sync state whenever modal opens
  useEffect(() => {
    if (open) {
      setSavedBatchCount(0);

      // Determine initial subject
      const initialSubjectId = defaultSubjectId !== undefined
        ? defaultSubjectId 
        : sessionSubjectId !== undefined 
          ? sessionSubjectId 
          : (subjects[0]?.id !== undefined ? subjects[0].id : 1);
      
      setSubjectId(initialSubjectId);
      setCurriculumSetId(defaultCurriculumSetId || '');
      setTopicId(defaultTopicId !== undefined ? defaultTopicId : (sessionTopicId || ''));
      setTitle('');
      setClinicalTrigger('');
      setSelectedTags(defaultTags || []);
      setTagInput('');
      setIsVolatile(false);
      setKeyTakeaway('');
      setErrorType(sessionErrorType || 'concept');
      setSource(sessionSource || 'QBank');
      setSourceExam(sessionSourceExam || '');

      // Find matching systems for initial subject
      const matchingSystems = dbSystems.filter(sys => String(sys.subjectId) === String(initialSubjectId));
      if (defaultSystemId !== undefined && matchingSystems.some(sys => String(sys.id) === String(defaultSystemId))) {
        setSystemId(defaultSystemId);
      } else if (sessionSystemId !== undefined && matchingSystems.some(sys => String(sys.id) === String(sessionSystemId))) {
        setSystemId(sessionSystemId);
      } else if (matchingSystems.length > 0) {
        setSystemId(matchingSystems[0].id!);
      } else {
        setSystemId(0);
      }

      // Auto-focus textarea on open
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [open, defaultSubjectId, defaultSystemId, defaultCurriculumSetId, defaultTopicId, defaultTags, subjects, dbSystems]);

  // When subject is changed manually by user, auto-select first available system
  const handleSubjectChange = (newSubId: string | number) => {
    setSubjectId(newSubId);
    sessionSubjectId = newSubId;
    const matching = dbSystems.filter(sys => String(sys.subjectId) === String(newSubId));
    if (matching.length > 0) {
      setSystemId(matching[0].id!);
      sessionSystemId = matching[0].id!;
    } else {
      setSystemId(0);
      sessionSystemId = 0;
    }
  };

  const handleSystemChange = (newSysId: string | number) => {
    setSystemId(newSysId);
    sessionSystemId = newSysId;
  };

  const handleTopicChange = (newTopic: string) => {
    setTopicId(newTopic);
    sessionTopicId = newTopic;
  };

  const handleSourceChange = (newSource: 'GT' | 'QBank' | 'Custom') => {
    setSource(newSource);
    sessionSource = newSource;
  };

  const handleErrorTypeChange = (newType: 'concept' | 'retrieval' | 'misread' | 'fomo') => {
    setErrorType(newType);
    sessionErrorType = newType;
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '');
      if (val && !selectedTags.includes(val)) {
        setSelectedTags(prev => [...prev, val]);
      }
      setTagInput('');
    }
  };

  const executeSave = async (closeAfterSave = false) => {
    if (!keyTakeaway.trim()) {
      toast.error('Please enter a clinical takeaway rule.');
      textareaRef.current?.focus();
      return;
    }
    if (!subjectId) {
      toast.error('Please select a subject.');
      return;
    }

    setIsSubmitting(true);
    try {
      await logMistake({
        subjectId,
        systemId: systemId || 0,
        curriculumSetId: curriculumSetId ? curriculumSetId.trim() : undefined,
        topicId: topicId ? topicId.trim() : undefined,
        title: title ? title.trim() : undefined,
        clinicalTrigger: clinicalTrigger ? clinicalTrigger.trim() : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        isVolatile,
        errorType,
        keyTakeaway: keyTakeaway.trim(),
        source,
        sourceExam: sourceExam.trim() || undefined
      });

      // Update session cache
      sessionSubjectId = subjectId;
      sessionSystemId = systemId;
      sessionTopicId = topicId;
      sessionSource = source;
      sessionSourceExam = sourceExam;
      sessionErrorType = errorType;

      const newBatchCount = savedBatchCount + 1;
      setSavedBatchCount(newBatchCount);
      setKeyTakeaway('');
      setTitle('');
      setClinicalTrigger('');
      setIsVolatile(false);

      if (closeAfterSave) {
        onOpenChange(false);
      } else {
        // Keep modal open, preserve path & tags, re-focus input immediately
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 50);
      }
    } catch (err: any) {
      console.error('Failed to log mistake:', err);
      toast.error(err?.message || 'Failed to save takeaway.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSave(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd+Enter or Ctrl+Enter saves & keeps open for the next takeaway
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      executeSave(false);
    }
  };

  const insertPromptShortcut = (prefix: string) => {
    setKeyTakeaway(prev => {
      const next = !prev 
        ? `${prefix} ` 
        : prev.endsWith(' ') || prev.endsWith('.') 
          ? `${prev} ${prefix} ` 
          : `${prev}. ${prefix} `;
      return next;
    });
    textareaRef.current?.focus();
  };

  const errorTypePills = [
    {
      id: 'concept' as const,
      label: 'Knowledge Gap',
      icon: Brain,
      color: 'border-rose-500/40 text-rose-500 bg-rose-500/10 dark:text-rose-400'
    },
    {
      id: 'misread' as const,
      label: 'Execution Slip',
      icon: Eye,
      color: 'border-amber-500/40 text-amber-500 bg-amber-500/10 dark:text-amber-400'
    },
    {
      id: 'retrieval' as const,
      label: 'Retrieval Failure',
      icon: RotateCcw,
      color: 'border-sky-500/40 text-sky-500 bg-sky-500/10 dark:text-sky-400'
    },
    {
      id: 'fomo' as const,
      label: 'Overthinking',
      icon: HelpCircle,
      color: 'border-purple-500/40 text-purple-500 bg-purple-500/10 dark:text-purple-400'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="quick-mistake-dialog" className="sm:max-w-xl rounded-3xl p-6 border-border/80 shadow-2xl bg-card text-foreground max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <DialogHeader className="space-y-1 pb-3 border-b border-border/40">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-2">
                  <span>Log 20th Notebook Rule</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    High Yield
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Distill your clinical mistake into a memorable golden takeaway.
                </DialogDescription>
              </div>
            </div>

            {/* Batch Counter Pill */}
            {savedBatchCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[11px] font-bold animate-in fade-in zoom-in-95 duration-150 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{savedBatchCount} logged</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          
          {/* Path Navigation Bar (Subject › System & Source) */}
          <div className="p-3 rounded-2xl bg-muted/20 border border-border/60 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Subject Notebook & System
              </span>
              
              {/* Volatile Fact Quick Toggle */}
              <button
                type="button"
                onClick={() => setIsVolatile(prev => !prev)}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                  isVolatile
                    ? "bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-xs"
                    : "bg-muted/40 text-muted-foreground border-border/40 hover:text-foreground"
                )}
                title="Mark volatile facts, tricky numbers, or high-confusion traps"
              >
                <Flame className="w-3 h-3" />
                <span>{isVolatile ? '⚡ Volatile Fact' : 'Mark Volatile'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                id="mistake-subject-select"
                value={String(subjectId)}
                onChange={e => handleSubjectChange(e.target.value)}
                className="w-full h-8.5 rounded-xl border border-border/70 bg-background px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer truncate"
              >
                {subjects.map(s => (
                  <option key={String(s.id)} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                id="mistake-system-select"
                value={String(systemId)}
                onChange={e => handleSystemChange(e.target.value)}
                className="w-full h-8.5 rounded-xl border border-border/70 bg-background px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer truncate"
              >
                {availableSystems.length === 0 ? (
                  <option value="0">General Chapter / System</option>
                ) : (
                  availableSystems.map(sys => (
                    <option key={String(sys.id)} value={String(sys.id)}>
                      {sys.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Hero Clinical Rule Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <span className="text-[11px] font-bold text-foreground tracking-tight">
                Golden Takeaway / Clinical Rule *
              </span>
              
              {/* Rapid Clinical Prefixes */}
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => insertPromptShortcut('DOC:')}
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-muted/40 hover:bg-primary/20 hover:text-primary text-muted-foreground border border-border/40 transition-colors cursor-pointer"
                >
                  + DOC
                </button>
                <button
                  type="button"
                  onClick={() => insertPromptShortcut('IOC:')}
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-muted/40 hover:bg-primary/20 hover:text-primary text-muted-foreground border border-border/40 transition-colors cursor-pointer"
                >
                  + IOC
                </button>
                <button
                  type="button"
                  onClick={() => insertPromptShortcut('Classic triad:')}
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-muted/40 hover:bg-primary/20 hover:text-primary text-muted-foreground border border-border/40 transition-colors cursor-pointer"
                >
                  + Triad
                </button>
                <button
                  type="button"
                  onClick={() => insertPromptShortcut('Contraindicated:')}
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-muted/40 hover:bg-primary/20 hover:text-primary text-muted-foreground border border-border/40 transition-colors cursor-pointer"
                >
                  + Contraindicated
                </button>
                <button
                  type="button"
                  onClick={() => insertPromptShortcut('Gold standard:')}
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-muted/40 hover:bg-primary/20 hover:text-primary text-muted-foreground border border-border/40 transition-colors cursor-pointer"
                >
                  + Gold Std
                </button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              id="mistake-takeaway-input"
              value={keyTakeaway}
              onChange={e => setKeyTakeaway(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. In Pheochromocytoma, ALWAYS start Alpha-blockers (Phenoxybenzamine) BEFORE Beta-blockers to prevent unopposed alpha-mediated hypertensive crisis."
              rows={3}
              required
              className="w-full rounded-2xl border border-border/80 bg-muted/20 p-3.5 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all leading-relaxed"
            />
            
            <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 px-1">
              <span>Pinned subject stays active for high-speed continuous logging</span>
              <span className="flex items-center gap-1 font-mono">
                <CornerDownLeft className="w-2.5 h-2.5" /> ⌘+Enter to save & add next
              </span>
            </div>
          </div>

          {/* Root Cause Chips */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Error Root Cause
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {errorTypePills.map(pill => {
                const Icon = pill.icon;
                const isSelected = errorType === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => handleErrorTypeChange(pill.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer text-[11px]",
                      isSelected
                        ? `${pill.color} font-bold shadow-xs`
                        : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{pill.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progressive Disclosure: Cross-Discipline Tags & Trigger Context */}
          <div className="border-t border-border/40 pt-2">
            <button
              type="button"
              onClick={() => setShowAdvancedDetails(prev => !prev)}
              className="flex items-center justify-between w-full py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5 text-[11px]">
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                <span>
                  {showAdvancedDetails ? 'Hide cross-tags & clinical context' : '+ Add cross-discipline tags, exam source, or trigger (optional)'}
                </span>
              </span>
              {showAdvancedDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showAdvancedDetails && (
              <div className="space-y-3.5 pt-2.5 pb-1 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* Cross-Discipline Tags */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Tag className="w-3 h-3 text-primary" /> Cross-Discipline Tags
                    </span>
                    <span className="text-[10px] text-muted-foreground">Select multiple</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {COMMON_CROSS_TAGS.map(t => {
                      const active = selectedTags.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTag(t)}
                          className={cn(
                            "px-2 py-0.5 text-[10px] font-semibold rounded-lg border transition-all cursor-pointer",
                            active
                              ? "bg-primary/20 text-primary border-primary/40 font-bold"
                              : "bg-muted/30 text-muted-foreground border-border/40 hover:border-border hover:text-foreground"
                          )}
                        >
                          {active ? `✓ ${t}` : `+ ${t}`}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom tag input */}
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={handleAddCustomTag}
                      placeholder="Add custom tag (e.g. Triad, Electrolytes, Imaging) and press Enter"
                      className="h-7.5 text-[11px] rounded-lg border-border/60 bg-muted/20 text-foreground"
                    />
                  </div>

                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <span className="text-[10px] text-muted-foreground mr-1">Active Tags:</span>
                      {selectedTags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
                          #{tag}
                          <button type="button" onClick={() => toggleTag(tag)} className="hover:text-destructive cursor-pointer">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Clinical Vignette Trigger / Scenario */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Clinical Scenario / Question Trigger (Optional)
                  </span>
                  <Input
                    id="mistake-trigger-input"
                    value={clinicalTrigger}
                    onChange={e => setClinicalTrigger(e.target.value)}
                    placeholder="e.g. 35yo with refractory hypokalemia, hypertension, low renin"
                    className="h-8.5 text-xs rounded-xl border-border/70 bg-muted/20 text-foreground"
                  />
                </div>

                {/* Specific Topic */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Specific Topic / Disease (Optional)
                  </span>
                  <Input
                    id="mistake-topic-input"
                    value={topicId}
                    onChange={e => handleTopicChange(e.target.value)}
                    placeholder="e.g. Primary Hyperaldosteronism (Conn Syndrome)"
                    className="h-8.5 text-xs rounded-xl border-border/70 bg-muted/20 text-foreground"
                  />
                </div>

                {/* Source & Source Exam Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Test Source Type
                    </span>
                    <div className="flex items-center gap-1 p-0.5 rounded-xl bg-muted/30 border border-border/60">
                      {(['QBank', 'GT', 'Custom'] as const).map(src => (
                        <button
                          key={src}
                          type="button"
                          onClick={() => handleSourceChange(src)}
                          className={cn(
                            "flex-1 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center",
                            source === src
                              ? "bg-background text-foreground shadow-xs border border-border/60"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {src === 'GT' ? 'Grand Test' : src === 'QBank' ? 'QBank' : 'Custom'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Exam Name / Test ID (Optional)
                    </span>
                    <Input
                      value={sourceExam}
                      onChange={e => setSourceExam(e.target.value)}
                      placeholder="e.g. Marrow GT-04, Pre-PG 2025"
                      className="h-8.5 text-xs rounded-xl border-border/70 bg-muted/20 text-foreground"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dialog Footer Actions */}
          <DialogFooter className="pt-2 border-t border-border/40 flex flex-row items-center justify-between gap-2">
            <Button
              id="btn-done-mistake"
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {savedBatchCount > 0 ? 'Done' : 'Cancel'}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                id="btn-save-close-mistake"
                type="button"
                variant="outline"
                disabled={isSubmitting || !keyTakeaway.trim() || !subjectId}
                onClick={() => executeSave(true)}
                className="rounded-xl text-xs font-semibold border-border/80 cursor-pointer hidden sm:inline-flex"
              >
                Save & Close
              </Button>
              <Button
                id="btn-save-mistake"
                type="submit"
                disabled={isSubmitting || !keyTakeaway.trim() || !subjectId}
                className="bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-xs cursor-pointer px-4 gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Saving...' : 'Save & Add Next'}</span>
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
