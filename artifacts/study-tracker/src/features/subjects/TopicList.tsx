import React from 'react';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { OntologyTopic } from '@/data/ontology';
import { TopicProgress } from '@/db/types';
import { CheckCircle2, Circle, CircleDashed, Target, MessageSquarePlus, Compass, TriangleAlert, ChevronDown, FolderPlus, Plus, GripVertical, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { generateHLC } from '@/lib/hlc';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2 } from 'lucide-react';
import { CurriculumSetForm } from './CurriculumSetForm';
import { toast } from 'sonner';

interface TopicListProps {
  topics: OntologyTopic[];
  subjectId: number;
  subjectName: string;
  systemId: number;
  systemName: string;
  onLogScore?: (topicId: string, topicName: string) => void;
  onViewMarkers?: (topicId: string, topicName: string) => void;
  onLeaveMarker?: (topicId: string, topicName: string) => void;
  onRenameTopic?: (topicId: string, newName: string) => void;
  onDeleteTopic?: (topicId: string) => void;
  onAddTopic?: (name: string) => void;
}

export function TopicList({
  topics,
  subjectId,
  subjectName,
  systemId,
  systemName,
  onLogScore,
  onViewMarkers,
  onLeaveMarker,
  onRenameTopic,
  onDeleteTopic,
  onAddTopic,
}: TopicListProps) {
  const [addTopicToSet, setAddTopicToSet] = React.useState<OntologyTopic | undefined>();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingTopicId, setEditingTopicId] = React.useState<string | null>(null);
  const [topicToDelete, setTopicToDelete] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const [isAddingTopic, setIsAddingTopic] = React.useState(false);
  const [newTopicName, setNewTopicName] = React.useState('');

  const topicProgresses = useLiveQuery(
    () => {
      if (!topics || topics.length === 0) return [];
      return db.topicProgress.where('topicId').anyOf(topics.map(t => t.id)).toArray();
    },
    [topics]
  ) || [];

  const revisionSets = useLiveQuery(
    () => {
      if (!systemId) return [];
      return (db.curriculumSets || db.revisionSets)
        .where('systemId')
        .equals(systemId)
        .filter(s => !s.deletedAt)
        .toArray();
    },
    [systemId]
  ) || [];

  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: topics.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56, // approx height of one row
    overscan: 10,
  });

  const getProgress = (topicId: string): TopicProgress => {
    return topicProgresses.find(p => p.topicId === topicId) || {
      topicId,
      isWeak: false,
      updatedAt: new Date()
    };
  };

  const handleAddToSet = async (setId: string, topicId: string) => {
    const targetDbTable = db.curriculumSets || db.revisionSets;
    const rs = await targetDbTable.get(setId);
    if (rs && !rs.topicIds.includes(topicId)) {
      await targetDbTable.update(setId, {
        topicIds: [...rs.topicIds, topicId],
        updatedAt: new Date(),
        hlc: generateHLC()
      });
      toast.success('Added to Study Block');
    } else {
      toast.info('Topic already in set');
    }
  };

  const toggleWeak = async (topicId: string) => {
    const p = getProgress(topicId);
    const newWeak = !p.isWeak;
    await db.topicProgress.put({ ...p, isWeak: newWeak, updatedAt: new Date(), hlc: generateHLC() });
    
    if (newWeak) {
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

  if (!topics.length && !onAddTopic) {
    return <div className="p-4 text-sm text-muted-foreground text-center">No topics available.</div>;
  }

  return (
    <div className="flex flex-col">
      {onAddTopic && (
        <div className="p-2 border-b border-border/50 flex items-center justify-between bg-muted/20">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-2">Topics</span>
          {!isAddingTopic ? (
            <button onClick={() => setIsAddingTopic(true)} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded hover:bg-primary/10">
              <Plus className="w-3.5 h-3.5" /> Add Topic
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                value={newTopicName}
                onChange={e => setNewTopicName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newTopicName.trim()) {
                    onAddTopic(newTopicName.trim());
                    setIsAddingTopic(false);
                    setNewTopicName('');
                  } else if (e.key === 'Escape') {
                    setIsAddingTopic(false);
                    setNewTopicName('');
                  }
                }}
                placeholder="Topic name..."
                className="h-6 text-xs w-[150px] px-2 py-0"
              />
              <button onClick={() => { setIsAddingTopic(false); setNewTopicName(''); }} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
          )}
        </div>
      )}
      <div ref={parentRef} className="flex flex-col gap-1 p-2 max-h-[400px] overflow-auto">
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map(virtualRow => {
          const topic = topics[virtualRow.index];
          const p = getProgress(topic.id);
          const isWeak = p.isWeak;

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
                  {editingTopicId === topic.id ? (
                    <div className="flex-1 px-2">
                      <Input
                        autoFocus
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => {
                          e.stopPropagation();
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (editingName.trim()) {
                              onRenameTopic?.(topic.id, editingName.trim());
                              setEditingTopicId(null);
                            }
                          } else if (e.key === 'Escape') {
                            setEditingTopicId(null);
                          }
                        }}
                        onBlur={() => {
                          if (editingName.trim() && editingName !== topic.name) {
                            onRenameTopic?.(topic.id, editingName.trim());
                          }
                          setEditingTopicId(null);
                        }}
                        className="h-7 text-sm py-0 px-2 my-0.5"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                  ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-left w-full focus:outline-none flex items-center justify-between group-hover:text-primary transition-colors">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const sets = revisionSets.filter(rs => rs.topicIds.includes(topic.id));
                                let status = 'empty';
                                if (sets.length > 0) {
                                  if (sets.some(rs => (rs.contentCompleted && rs.qbankCompleted))) status = 'checked';
                                  
                                }
                                if (status === 'checked') return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
                                if (status === 'half') return <CircleDashed className="w-4 h-4 text-amber-500 shrink-0" />;
                                return <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />;
                              })()}
                              <span className={cn("text-sm font-medium transition-colors", "text-foreground truncate")}>
                                {topic.name}
                              </span>
                            </div>
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
                      <DropdownMenuLabel className="text-xs text-muted-foreground">Add to Study Block</DropdownMenuLabel>
                      {revisionSets.map(rs => (
                        <DropdownMenuItem key={rs.id} onClick={() => handleAddToSet(rs.id!, topic.id)}>
                          <FolderPlus className="w-4 h-4 mr-2" /> {rs.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem onClick={() => { setAddTopicToSet(topic); setFormOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" /> Create New Set...
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => { setEditingTopicId(topic.id); setEditingName(topic.name); }}>
                        <Edit2 className="w-4 h-4 mr-2" /> Rename Topic
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => {
                        setTopicToDelete(topic.id);
                      }}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Topic
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  )}
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 border-r border-border/50 pr-1.5 mr-0.5">
                    <button 
                      onClick={() => onViewMarkers?.(topic.id, topic.name)}
                      className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10 cursor-pointer"
                      title="Trail Markers"
                    >
                      <Compass className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => onLeaveMarker?.(topic.id, topic.name)}
                      className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10 cursor-pointer"
                      title="Leave Trail Marker"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button 
                    onClick={() => toggleWeak(topic.id)}
                    className={cn(
                      "p-1.5 rounded-md border transition-colors flex items-center gap-1.5",
                      isWeak ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-transparent border-border text-muted-foreground hover:border-destructive/50"
                    )}
                    title={isWeak ? "Marked as Weak" : "Mark as Weak"}
                  >
                    <TriangleAlert className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!topicToDelete} onOpenChange={(open) => !open && setTopicToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this topic? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (topicToDelete) {
                  onDeleteTopic?.(topicToDelete);
                  setTopicToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    </div>
  );
}
