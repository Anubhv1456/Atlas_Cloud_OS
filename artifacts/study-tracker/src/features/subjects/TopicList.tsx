import { OntologyTopic } from '@/data/ontology';
import { TopicProgress } from '@/db/types';
import { db } from '@/db/schema';
import { useLiveQuery } from 'dexie-react-hooks';
import { createDefaultTopicProgress } from '@/lib/status-engine';
import { CheckCircle2, MessageSquarePlus, MessageCircle, Circle, TriangleAlert, Plus, FolderPlus, ChevronDown, Target } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { CurriculumSetForm } from './CurriculumSetForm';
import { updateCurriculumSet } from '@/db/mutations';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { generateHLC } from '@/lib/hlc';

interface TopicListProps {
  topics: OntologyTopic[];
  subjectId: number;
  systemId: number;
  subjectName: string;
  systemName: string;
  onViewMarkers?: (topicId: string, topicName: string) => void;
  onLeaveMarker?: (topicId: string, topicName: string) => void;
  onLogScore?: (topicId: string, topicName: string) => void;
}

export function TopicList({ topics, subjectId, systemId, subjectName, systemName, onViewMarkers, onLeaveMarker, onLogScore }: TopicListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: topics.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [addTopicToSet, setAddTopicToSet] = useState<OntologyTopic | undefined>();

  const revisionSets = useLiveQuery(
    () => (db.curriculumSets || db.revisionSets).where('systemId').equals(systemId).filter(s => !s.deletedAt).toArray(),
    [systemId]
  ) || [];

  const handleAddToSet = async (setId: string, topicId: string) => {
    const set = revisionSets.find(s => s.id === setId);
    if (set && !set.topicIds.includes(topicId)) {
      await updateCurriculumSet(setId, { topicIds: [...set.topicIds, topicId] });
      toast.success('Added to Curriculum Set');
    } else {
      toast.info('Already in this Curriculum Set');
    }
  };

  const progresses = useLiveQuery(
    () => db.topicProgress.where('topicId').anyOf(topics.map(t => t.id)).toArray(),
    [topics]
  );

  const getProgress = (topicId: string) => {
    return progresses?.find(p => p.topicId === topicId) || createDefaultTopicProgress(topicId);
  };

  const toggleContent = async (topicId: string) => {
    const p = getProgress(topicId);
    const newStatus = p.contentStatus === 'completed' ? 'not_started' : 'completed';
    await db.topicProgress.put({ ...p, contentStatus: newStatus, updatedAt: new Date(), hlc: generateHLC() });
    
    if (newStatus === 'completed') {
      const topic = topics.find(t => t.id === topicId);
      await db.history.add({
        subjectId,
        subjectName,
        systemId,
        systemName,
        taskKey: 'topicMastered',
        taskLabel: `Mastered ${topic?.name} Content`,
        completedAt: new Date()
      });
    }
  };

  const toggleQBank = async (topicId: string) => {
    const p = getProgress(topicId);
    const newStatus = p.qbankStatus === 'completed' ? 'not_started' : 'completed';
    await db.topicProgress.put({ ...p, qbankStatus: newStatus, updatedAt: new Date(), hlc: generateHLC() });
    
    if (newStatus === 'completed') {
      const topic = topics.find(t => t.id === topicId);
      await db.history.add({
        subjectId,
        subjectName,
        systemId,
        systemName,
        taskKey: 'topicMastered',
        taskLabel: `Mastered ${topic?.name} QBank`,
        completedAt: new Date()
      });
    }
  };

  const toggleWeak = async (topicId: string) => {
    const p = getProgress(topicId);
    const newConf = p.confidence === 'low' ? 'average' : 'low';
    await db.topicProgress.put({ ...p, confidence: newConf, updatedAt: new Date(), hlc: generateHLC() });
    
    if (newConf === 'low') {
      const topic = topics.find(t => t.id === topicId);
      await db.history.add({
        subjectId,
        subjectName,
        systemId,
        systemName,
        taskKey: 'topicWeak',
        taskLabel: `Marked ${topic?.name} as Weak`,
        completedAt: new Date()
      });
    }
  };

  if (!topics.length) {
    return <div className="p-4 text-sm text-muted-foreground text-center">No topics available.</div>;
  }

  return (
    <div ref={parentRef} className="flex flex-col gap-1 p-2 max-h-[400px] overflow-auto">
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map(virtualRow => {
          const topic = topics[virtualRow.index];
          const p = getProgress(topic.id);
          const isContentDone = p.contentStatus === 'completed';
          const isQBankDone = p.qbankStatus === 'completed';
          const isWeak = p.confidence === 'low';

          return (
            <div
              key={topic.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="flex items-center gap-3 p-2 hover:bg-muted/30 rounded-lg transition-colors group h-full">
                <div className="flex-1 min-w-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-left w-full focus:outline-none flex items-center justify-between group-hover:text-primary transition-colors">
                        <div>
                        <span className={cn("text-sm font-medium transition-colors", (isContentDone && isQBankDone) ? "text-muted-foreground line-through" : "text-foreground")}>
                          {topic.name}
                        </span>
                        {(() => {
                          const setsCount = revisionSets.filter(rs => rs.topicIds.includes(topic.id)).length;
                          if (setsCount > 0) {
                            return <div className="text-[10px] text-muted-foreground/80 mt-0.5">In {setsCount} set{setsCount > 1 ? 's' : ''}</div>;
                          }
                          return null;
                        })()}
                      </div>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mr-2" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuLabel>Topic Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">Add to Curriculum Set</DropdownMenuLabel>
                      {revisionSets.map(rs => (
                        <DropdownMenuItem key={rs.id} onClick={() => handleAddToSet(rs.id!, topic.id)}>
                          <FolderPlus className="w-4 h-4 mr-2" /> {rs.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem onClick={() => { setAddTopicToSet(topic); setFormOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" /> Create New Set...
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  
                  <button 
                    onClick={() => onLogScore && onLogScore(topic.id, topic.name)}
                    className={cn(
                      "p-1.5 sm:px-2 sm:py-1 text-xs font-medium rounded-md border transition-colors flex items-center gap-1",
                      "bg-transparent border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                    )}
                    title="Log Test Score"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Score</span>
                  </button>
                  <button 
                    onClick={() => toggleContent(topic.id)}
                    className={cn(
                      "p-1.5 sm:px-2 sm:py-1 text-xs font-medium rounded-md border transition-colors flex items-center gap-1",
                      isContentDone ? "bg-primary/10 border-primary/30 text-primary" : "bg-transparent border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                    )}
                    title="Toggle Content Completion"
                  >
                    {isContentDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">Content</span>
                  </button>

                  <button 
                    onClick={() => toggleQBank(topic.id)}
                    className={cn(
                      "p-1.5 sm:px-2 sm:py-1 text-xs font-medium rounded-md border transition-colors flex items-center gap-1",
                      isQBankDone ? "bg-primary/10 border-primary/30 text-primary" : "bg-transparent border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                    )}
                    title="Toggle QBank Completion"
                  >
                    {isQBankDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">QBank</span>
                  </button>

                  <div className="flex items-center gap-1 border-l border-border/50 pl-1.5 ml-0.5">
                    <button 
                      onClick={() => onViewMarkers?.(topic.id, topic.name)}
                      className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10"
                      title="View Markers"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => onLeaveMarker?.(topic.id, topic.name)}
                      className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10"
                      title="Leave Marker"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button 
                    onClick={() => toggleWeak(topic.id)}
                    className={cn(
                      "p-1.5 rounded-md border transition-colors",
                      isWeak ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-transparent border-border text-muted-foreground hover:border-destructive/50"
                    )}
                    title="Mark as Weak"
                  >
                    <TriangleAlert className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <CurriculumSetForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        systemId={systemId}
        subjectId={subjectId}
        allTopics={topics}
        initialData={
          addTopicToSet ? {
            id: '',
            subjectId,
            systemId,
            name: '',
            topicIds: [addTopicToSet.id],
            createdAt: new Date(),
            updatedAt: new Date(),
          } : undefined
        }
      />
    </div>
  );
}