import React, { useMemo } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useExamProfile } from '@/hooks/useExamProfile';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { cn } from '@/lib/utils';
import { BookOpen, Layers, Lock, CheckCircle2 } from 'lucide-react';

interface Props {
  subjectId: string;
  onSubjectChange: (val: string) => void;
  blockId: string;
  onBlockChange: (val: string) => void;
}

export function AdaptiveLoggerSelector({ subjectId, onSubjectChange, blockId, onBlockChange }: Props) {
  const { profile } = useExamProfile();
  const isUSMLE = profile?.targetExam?.toLowerCase().includes('usmle');
  
  const activeSubjects = useLiveQuery(() => db.subjects.filter(s => !s.deletedAt).toArray(), []) || [];
  const activeSystems = useLiveQuery(() => db.systems.filter(s => !s.deletedAt).toArray(), []) || [];
  const scoreLogs = useLiveQuery(() => db.scoreLogs.orderBy('timestamp').reverse().limit(40).toArray(), []) || [];
  const customBlocks = useLiveQuery(() => (db.curriculumSets || db.revisionSets)?.toArray(), []) || [];

  const isGtMode = subjectId === 'gt-full';

  const selectedSubject = useMemo(() => {
    if (!subjectId || isGtMode) return null;
    return activeSubjects.find(s => String(s.id) === String(subjectId)) || null;
  }, [subjectId, isGtMode, activeSubjects]);

  // 1. Quick-Tap Memory Row for Recently Studied Subjects or Full Mocks
  const recentSubjects = useMemo(() => {
    const seen = new Set<string>();
    const recents: { id: string; name: string }[] = [];

    for (const log of scoreLogs) {
      // If user took a GT
      if (log.type === 'gt' || log.title?.toLowerCase().includes('mock') || log.title?.toLowerCase().includes('gt')) {
        if (!seen.has('gt-full')) {
          recents.push({ id: 'gt-full', name: '🏆 Full Mock / GT' });
          seen.add('gt-full');
        }
      }

      // Check subjectId directly
      const subId = log.subjectId ? String(log.subjectId) : null;
      if (subId && subId !== 'general' && subId !== 'mixed' && !seen.has(subId)) {
        const sub = activeSubjects.find(s => String(s.id) === subId);
        if (sub) {
          recents.push({ id: String(sub.id), name: sub.name });
          seen.add(subId);
        }
      } else if (log.systemId && !seen.has(String(log.systemId))) {
        // Find subject from systemId
        const sys = activeSystems.find(s => String(s.id) === String(log.systemId));
        if (sys && sys.subjectId) {
          const sub = activeSubjects.find(s => String(s.id) === String(sys.subjectId));
          if (sub && !seen.has(String(sub.id))) {
            recents.push({ id: String(sub.id), name: sub.name });
            seen.add(String(sub.id));
          }
        }
      }

      if (recents.length >= 4) break;
    }
    return recents;
  }, [scoreLogs, activeSubjects, activeSystems]);

  // 2. Categorized Subjects for Subject Selector
  const subjectGroups = useMemo(() => {
    if (isUSMLE) {
      const groups: Record<string, { label: string; items: { id: string; name: string }[] }> = {
        'Organ Systems': { label: 'Organ Systems', items: [] },
        'Foundational Disciplines': { label: 'Foundational Disciplines', items: [] },
        'Specialties & Other': { label: 'Specialties & Other', items: [] }
      };

      activeSubjects.forEach(sub => {
        const n = sub.name.toLowerCase();
        if (['cardio', 'respir', 'renal', 'nephro', 'gastro', 'gi', 'endo', 'repro', 'nervous', 'neuro', 'musculo', 'skelet', 'derm', 'skin', 'hemat', 'immune'].some(kw => n.includes(kw))) {
          groups['Organ Systems'].items.push({ id: String(sub.id), name: sub.name });
        } else if (['biochem', 'path', 'pharm', 'micro', 'psych', 'public health', 'epidemi', 'stat', 'genet', 'physio', 'anat', 'behavior'].some(kw => n.includes(kw))) {
          groups['Foundational Disciplines'].items.push({ id: String(sub.id), name: sub.name });
        } else {
          groups['Specialties & Other'].items.push({ id: String(sub.id), name: sub.name });
        }
      });
      return groups;
    } else {
      const groups: Record<string, { label: string; items: { id: string; name: string }[] }> = {
        'Pre-Clinical': { label: 'Pre-Clinical (Phase 1)', items: [] },
        'Para-Clinical': { label: 'Para-Clinical (Phase 2)', items: [] },
        'Clinical': { label: 'Clinical (Phase 3)', items: [] },
        'Specialties & Integrated': { label: 'Specialties & Integrated', items: [] }
      };

      activeSubjects.forEach(sub => {
        const n = sub.name.toLowerCase();
        if (['anat', 'physio', 'biochem'].some(kw => n.includes(kw))) {
          groups['Pre-Clinical'].items.push({ id: String(sub.id), name: sub.name });
        } else if (['path', 'pharm', 'micro', 'forensic', 'fmt'].some(kw => n.includes(kw))) {
          groups['Para-Clinical'].items.push({ id: String(sub.id), name: sub.name });
        } else if (['med', 'surg', 'obg', 'gyn', 'pedia', 'opht', 'ent', 'oto', 'psm', 'comm', 'ortho', 'derm', 'psych', 'radio', 'anaesth', 'anesth'].some(kw => n.includes(kw))) {
          groups['Clinical'].items.push({ id: String(sub.id), name: sub.name });
        } else {
          groups['Specialties & Integrated'].items.push({ id: String(sub.id), name: sub.name });
        }
      });
      return groups;
    }
  }, [isUSMLE, activeSubjects]);

  // 3. Filtered Study Blocks: ONLY those belonging to the selected subject
  const availableSystems = useMemo(() => {
    if (!subjectId || isGtMode) return [];
    
    const currentSubjectName = selectedSubject?.name?.toLowerCase() || '';

    return activeSystems.filter(sys => {
      // Direct subjectId match
      if (sys.subjectId !== undefined && sys.subjectId !== null) {
        if (String(sys.subjectId) === String(subjectId)) return true;
        if (selectedSubject?.id && String(sys.subjectId) === String(selectedSubject.id)) return true;
      }
      // Match in subjectIds array
      if (Array.isArray(sys.subjectIds)) {
        if (sys.subjectIds.some(id => String(id) === String(subjectId))) return true;
      }
      // Name fallback
      if (currentSubjectName && (sys as any).subjectName) {
        if (String((sys as any).subjectName).toLowerCase() === currentSubjectName) return true;
      }
      return false;
    });
  }, [subjectId, isGtMode, selectedSubject, activeSystems]);

  const availableCustomBlocks = useMemo(() => {
    if (!subjectId || isGtMode) return [];
    return customBlocks.filter(block => {
      if (block.subjectId && String(block.subjectId) === String(subjectId)) return true;
      if (selectedSubject?.id && String(block.subjectId) === String(selectedSubject.id)) return true;
      if (Array.isArray(block.subjectIds) && block.subjectIds.some(id => String(id) === String(subjectId))) return true;
      return false;
    });
  }, [subjectId, isGtMode, selectedSubject, customBlocks]);

  // When changing subject, automatically reset the block
  const handleSelectSubject = (val: string) => {
    onSubjectChange(val);
    if (val === 'gt-full') {
      onBlockChange('full-syllabus');
    } else {
      onBlockChange('ad-hoc');
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {/* ── 1. Subject / Exam Mode Selector (Primary Step) ───────────────────── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground/90 ml-0.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-primary/80" />
            <span>1. Subject / Exam Scope</span>
          </label>
          {isGtMode && (
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Full-Syllabus
            </span>
          )}
        </div>

        {/* Quick-Tap Memory Row */}
        {recentSubjects.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2 mt-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-1 mr-0.5">Recent:</span>
            {recentSubjects.map(sub => {
              const isSelected = subjectId === sub.id;
              return (
                <Button
                  key={sub.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  type="button"
                  className={cn(
                    "h-7 text-xs rounded-full transition-colors px-3",
                    isSelected 
                      ? "bg-primary text-primary-foreground font-medium" 
                      : "bg-background/60 hover:bg-muted border-border/60 text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => handleSelectSubject(sub.id)}
                >
                  {sub.name}
                </Button>
              );
            })}
          </div>
        )}

        <Select value={subjectId} onValueChange={handleSelectSubject}>
          <SelectTrigger className="w-full h-11 bg-background border-border/60 hover:border-border transition-colors rounded-xl shadow-sm">
            <SelectValue placeholder="-- Select Subject or GT / Mock Exam --" />
          </SelectTrigger>
          <SelectContent className="max-h-[320px]">
            {/* Dedicated Top-Level Option for GT / Full-Syllabus Mock */}
            <SelectItem 
              value="gt-full" 
              className="font-semibold text-emerald-600 dark:text-emerald-400 cursor-pointer border-b border-border/70 mb-1 pb-2 focus:bg-emerald-500/10"
            >
              🏆 Full-Syllabus Mock (GT / NBME Comprehensive)
            </SelectItem>

            {/* Categorized Syllabus Subjects */}
            {Object.entries(subjectGroups).map(([groupKey, group]) => {
              if (group.items.length === 0) return null;
              return (
                <SelectGroup key={groupKey}>
                  <SelectLabel className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-2.5 px-2">
                    {group.label}
                  </SelectLabel>
                  {group.items.sort((a, b) => a.name.localeCompare(b.name)).map(item => (
                    <SelectItem key={item.id} value={item.id} className="cursor-pointer text-sm">
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* ── 2. Study Block Selector (Dependent / Unlocked per Subject) ─────────── */}
      <div className={cn(
        "space-y-1.5 p-3.5 rounded-xl border transition-all duration-200",
        isGtMode 
          ? "bg-emerald-500/[0.03] border-emerald-500/20" 
          : !subjectId 
            ? "bg-muted/10 border-border/40 opacity-70" 
            : "bg-muted/25 border-border/60 shadow-sm"
      )}>
        <div className="flex items-center justify-between">
          <label className={cn(
            "text-xs font-semibold ml-0.5 flex items-center gap-1.5",
            !subjectId ? "text-muted-foreground/60" : "text-foreground/90"
          )}>
            <Layers className="w-3.5 h-3.5 text-primary/80" />
            <span>2. Study Block (Unit / Topic)</span>
          </label>
          {subjectId && !isGtMode && (
            <span className="text-[10px] text-muted-foreground">
              {availableSystems.length} {availableSystems.length === 1 ? 'block' : 'blocks'} available
            </span>
          )}
        </div>

        {/* State A: GT Mode - Block selector disabled */}
        {isGtMode ? (
          <div className="space-y-1.5">
            <div className="w-full h-11 px-3.5 rounded-xl bg-background/50 border border-emerald-500/30 flex items-center justify-between text-sm text-foreground/80 cursor-not-allowed">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-medium text-emerald-700 dark:text-emerald-300">Full-Syllabus Mock (All Topics Included)</span>
              </div>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                Auto-Scoped
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground ml-1">
              Grand Tests & NBME Mocks evaluate full curriculum retention; individual block selection is disabled.
            </p>
          </div>
        ) : !subjectId ? (
          /* State B: No Subject picked yet - Block selector disabled/locked */
          <div className="w-full h-11 px-3.5 rounded-xl bg-background/30 border border-dashed border-border/50 flex items-center gap-2 text-sm text-muted-foreground/60 cursor-not-allowed">
            <Lock className="w-3.5 h-3.5 opacity-50 shrink-0" />
            <span>Select a Subject above to unlock study blocks...</span>
          </div>
        ) : (
          /* State C: Subject picked - Block selector unlocked & filtered */
          <Select value={blockId} onValueChange={onBlockChange}>
            <SelectTrigger className="w-full h-11 bg-background border-border/60 hover:border-border transition-colors rounded-xl shadow-sm">
              <SelectValue placeholder="-- Select Study Block --" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {/* Option 1: General / Ad-Hoc Session */}
              <SelectItem value="ad-hoc" className="font-medium text-primary cursor-pointer border-b border-border/60 mb-1 pb-2">
                ⚡ General / Full Subject Practice (Uncategorized)
              </SelectItem>

              {/* Option 2: Default Curriculum Systems / Topics for this Subject */}
              {availableSystems.length > 0 && (
                <SelectGroup>
                  <SelectLabel className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-2 px-2">
                    {selectedSubject?.name} Study Blocks ({availableSystems.length})
                  </SelectLabel>
                  {availableSystems.sort((a, b) => a.name.localeCompare(b.name)).map(sys => (
                    <SelectItem key={sys.id} value={String(sys.id)} className="cursor-pointer text-sm">
                      {sys.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}

              {/* Option 3: Custom Study Blocks for this Subject */}
              {availableCustomBlocks.length > 0 && (
                <SelectGroup>
                  <SelectLabel className="text-[11px] font-bold text-amber-500 uppercase tracking-wider mt-2 px-2">
                    Custom Study Blocks ({availableCustomBlocks.length})
                  </SelectLabel>
                  {availableCustomBlocks.map(block => (
                    <SelectItem key={`custom-${block.id}`} value={String(block.systemId || block.id)} className="cursor-pointer text-sm">
                      {block.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
