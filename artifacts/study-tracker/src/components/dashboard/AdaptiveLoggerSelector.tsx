import React, { useMemo } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useExamProfile } from '@/hooks/useExamProfile';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { cn } from '@/lib/utils';

interface Props {
  blockId: string;
  onBlockChange: (val: string) => void;
  systemId: string;
  onSystemChange: (val: string) => void;
}

export function AdaptiveLoggerSelector({ blockId, onBlockChange, systemId, onSystemChange }: Props) {
  const { profile } = useExamProfile();
  const isUSMLE = profile?.targetExam?.toLowerCase().includes('usmle');
  
  const activeSystems = useLiveQuery(() => db.systems.filter(s => !s.deletedAt).toArray(), []) || [];
  const activeSubjects = useLiveQuery(() => db.subjects.filter(s => !s.deletedAt).toArray(), []) || [];
  const scoreLogs = useLiveQuery(() => db.scoreLogs.orderBy('timestamp').reverse().limit(30).toArray(), []) || [];
  const customBlocks = useLiveQuery(() => (db.curriculumSets || db.revisionSets)?.toArray(), []) || [];
  
  // 1. Universal "Quick-Tap" Memory Row (Content)
  const recentSystems = useMemo(() => {
    const sysIds = new Set<string>();
    const recents: { id: string; name: string }[] = [];
    for (const log of scoreLogs) {
      const targetId = log.systemId ? String(log.systemId) : (log.subjectId ? String(log.subjectId) : null);
      if (targetId && targetId !== 'mixed' && targetId !== 'ad-hoc' && !sysIds.has(targetId)) {
        const sys = activeSystems.find(s => String(s.id) === targetId);
        if (sys) {
          recents.push({ id: String(sys.id), name: sys.name });
          sysIds.add(targetId);
        } else {
          const sub = activeSubjects.find(s => String(s.id) === targetId);
          if (sub) {
            recents.push({ id: String(sub.id), name: sub.name });
            sysIds.add(targetId);
          }
        }
      }
      if (recents.length >= 3) break;
    }
    return recents;
  }, [scoreLogs, activeSystems, activeSubjects]);

  // 2. Polymorphic Subject Selector (Content)
  const systemOptions = useMemo(() => {
    if (isUSMLE) {
       const groups: Record<string, { label: string, items: { id: string, name: string }[] }> = {
         'Organ Systems': { label: 'Organ Systems', items: [] },
         'Foundational Disciplines': { label: 'Foundational Disciplines', items: [] },
         'Other': { label: 'Other', items: [] }
       };
       activeSystems.forEach(sys => {
          const sub = activeSubjects.find(s => s.id === sys.subjectId);
          const nameToCheck = `${sub?.name || ''} ${sys.name || ''}`.toLowerCase();
          
          if (['cardio', 'respir', 'renal', 'nephro', 'gastro', 'gi', 'endo', 'repro', 'nervous', 'neuro', 'musculo', 'skelet', 'derm', 'skin', 'hemat', 'immune'].some(kw => nameToCheck.includes(kw))) {
            groups['Organ Systems'].items.push({ id: String(sys.id), name: sys.name });
          } else if (['biochem', 'path', 'pharm', 'micro', 'psych', 'public health', 'epidemi', 'stat', 'genet', 'physio', 'anat', 'behavior'].some(kw => nameToCheck.includes(kw))) {
            groups['Foundational Disciplines'].items.push({ id: String(sys.id), name: sys.name });
          } else {
            groups['Other'].items.push({ id: String(sys.id), name: sys.name });
          }
       });
       return groups;
    } else {
       const groups: Record<string, { label: string, items: { id: string, name: string }[] }> = {
         'Pre-Clinical': { label: 'Pre-Clinical (Phase 1)', items: [] },
         'Para-Clinical': { label: 'Para-Clinical (Phase 2)', items: [] },
         'Clinical': { label: 'Clinical (Phase 3)', items: [] },
         'Other': { label: 'Other', items: [] }
       };
       activeSystems.forEach(sys => {
          const sub = activeSubjects.find(s => s.id === sys.subjectId);
          const nameToCheck = `${sub?.name || ''} ${sys.name || ''}`.toLowerCase();
          
          if (['anat', 'physio', 'biochem'].some(kw => nameToCheck.includes(kw))) {
            groups['Pre-Clinical'].items.push({ id: String(sys.id), name: sys.name });
          } else if (['path', 'pharm', 'micro', 'forensic', 'fmt'].some(kw => nameToCheck.includes(kw))) {
            groups['Para-Clinical'].items.push({ id: String(sys.id), name: sys.name });
          } else if (['med', 'surg', 'obg', 'gyn', 'pedia', 'opht', 'ent', 'oto', 'psm', 'comm', 'ortho', 'derm', 'psych', 'radio', 'anaesth', 'anesth'].some(kw => nameToCheck.includes(kw))) {
            groups['Clinical'].items.push({ id: String(sys.id), name: sys.name });
          } else {
            groups['Other'].items.push({ id: String(sys.id), name: sys.name });
          }
       });
       return groups;
    }
  }, [isUSMLE, activeSystems, activeSubjects]);

  return (
    <div className="space-y-5 mb-6">
      {/* Context Selector (Study Blocks) */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground/80 ml-1">Context</label>
        <Select value={blockId} onValueChange={onBlockChange}>
          <SelectTrigger className="w-full h-10 bg-background/50 border-border/60 hover:border-border transition-colors rounded-xl shadow-sm">
            <SelectValue placeholder="-- Select Study Block --" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="ad-hoc" className="font-medium">
              ⚡ Ad-Hoc / Uncategorized Session
            </SelectItem>
            {customBlocks.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-xs font-bold text-amber-500 uppercase tracking-wider mt-2">Your Custom Blocks</SelectLabel>
                {customBlocks.map(block => (
                  <SelectItem key={`custom-${block.id}`} value={String(block.systemId || block.id)} className="cursor-pointer">
                    {block.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Content Selector (Subjects) */}
      <div className="space-y-1.5 bg-muted/20 p-3 rounded-xl border border-border/50">
        <label className="text-xs font-semibold text-foreground/80 ml-1">Subject</label>
        
        {/* Universal "Quick-Tap" Memory Row */}
        {recentSystems.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 mt-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-1.5 mr-1">Recent:</span>
            {recentSystems.map(sys => (
              <Button
                key={sys.id}
                variant={systemId === String(sys.id) ? "default" : "outline"}
                size="sm"
                className={cn("h-7 text-xs rounded-full transition-colors", systemId === String(sys.id) ? "bg-primary text-primary-foreground" : "bg-background/50 hover:bg-muted border-border/60")}
                onClick={() => onSystemChange(String(sys.id))}
              >
                {sys.name}
              </Button>
            ))}
          </div>
        )}

        <Select value={systemId} onValueChange={onSystemChange}>
          <SelectTrigger className="w-full h-11 bg-background border-border/60 hover:border-border transition-colors rounded-xl shadow-sm">
            <SelectValue placeholder="-- Select Subject Content --" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {/* Unified "Mixed/Comprehensive" Top-Level Node */}
            <SelectItem value="mixed" className="font-semibold text-primary cursor-pointer border-b border-border mb-1 pb-2">
              ✨ Mixed / Comprehensive Block
            </SelectItem>

            {/* Polymorphic Syllabus Groups */}
            {Object.entries(systemOptions).map(([key, group]) => {
              if (group.items.length === 0) return null;
              return (
                <SelectGroup key={key}>
                  <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">{group.label}</SelectLabel>
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
    </div>
  );
}
