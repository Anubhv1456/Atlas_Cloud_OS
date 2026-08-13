import React, { useState } from 'react';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { MistakeLog } from '@/db/types';
import { deleteMistakeLog } from '@/db/mutations';
import { QuickMistakeModal } from './QuickMistakeModal';
import { 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Folder,
  BookOpen,
  Brain,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ALL_SUBJECTS } from '@/data/ontology';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MistakeRecoveryQueue() {
  const [modalOpen, setModalOpen] = useState(false);
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [filterSystemId, setFilterSystemId] = useState<string>('all');
  
  const mistakeLogs = useLiveQuery(() => db.mistakeLogs?.orderBy('createdAt').reverse().toArray()) || [];
  const subjects = useLiveQuery(() => db.subjects?.toArray()) || [];
  const systems = useLiveQuery(() => db.systems?.toArray()) || [];
  
  const subjectMap = new Map(subjects.map(s => [s.id!, s.name]));
  const systemMap = new Map(systems.map(sys => [sys.id!, sys.name]));

  // Filter logs by subject and system
  const filteredLogs = mistakeLogs.filter(log => {
    if (filterSubjectId !== 'all' && String(log.subjectId) !== filterSubjectId) return false;
    if (filterSystemId !== 'all' && String(log.systemId) !== filterSystemId) return false;
    return true;
  });

  // Group by Concept (topicId) or System if no topic
  const groupedMap = new Map<string, MistakeLog[]>();
  for (const log of filteredLogs) {
    const systemName = systemMap.get(log.systemId) || `System`;
    const groupKey = log.topicId ? `${systemName} > ${log.topicId}` : systemName;
    const existing = groupedMap.get(groupKey) || [];
    existing.push(log);
    groupedMap.set(groupKey, existing);
  }

  // Available systems for the selected subject filter
  const availableSystems = filterSubjectId === 'all' 
    ? systems 
    : systems.filter(sys => String(sys.subjectId) === filterSubjectId);

  return (
    <div className="min-h-full bg-background px-4 sm:px-6 lg:px-8 pt-8 pb-28 md:pb-10 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold tracking-wider uppercase text-[10px]">
            <Brain className="w-3.5 h-3.5" /> Journal
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Mistake Recovery</h2>
          <p className="text-sm text-muted-foreground">Log your QBank mistakes to retain critical concepts.</p>
        </div>
        <Button 
          onClick={() => setModalOpen(true)}
          className="rounded-full shadow-lg gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Log Mistake
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-3 rounded-2xl border border-border/60 shadow-sm w-full">
        <div className="flex items-center gap-2 text-muted-foreground px-2">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-semibold">Filter:</span>
        </div>
        <div className="flex-1 flex gap-3 w-full">
          <Select 
            value={filterSubjectId} 
            onValueChange={(val) => {
              setFilterSubjectId(val);
              setFilterSystemId('all');
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-xl bg-background border-border/80">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(s => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={filterSystemId} 
            onValueChange={setFilterSystemId}
            disabled={filterSubjectId === 'all'}
          >
            <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-xl bg-background border-border/80">
              <SelectValue placeholder="All Systems" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Systems</SelectItem>
              {availableSystems.map(s => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {Array.from(groupedMap.entries()).length > 0 ? (
        <div className="space-y-5">
          {Array.from(groupedMap.entries()).map(([groupKey, logs]) => {
            const firstLog = logs[0];
            const subjectName = subjectMap.get(firstLog.subjectId) || 
              ALL_SUBJECTS.find(s => String(s.id) === String(firstLog.subjectId))?.name || 'Subject';

            return (
              <div key={groupKey} className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-border/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {subjectName}
                    </div>
                    <div className="font-bold text-base text-foreground leading-tight">
                      {groupKey}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {logs.map(log => (
                    <div 
                      key={log.id} 
                      className="p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background border-border/80"
                    >
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium text-foreground">
                          {log.keyTakeaway}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border text-muted-foreground">
                            {log.errorType === 'concept' ? 'Knowledge Gap' : 'Silly Mistake'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-row items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-border/50 pt-3 sm:pt-0 sm:pl-3">
                        <button
                          type="button"
                          onClick={() => log.id && deleteMistakeLog(log.id)}
                          className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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
            No Mistakes Found
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            {filterSubjectId === 'all' 
              ? 'Great job! Log your mistakes here to track concepts needing remediation before exam day.'
              : 'No mistakes found for this filter.'}
          </p>
        </div>
      )}

      <QuickMistakeModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
