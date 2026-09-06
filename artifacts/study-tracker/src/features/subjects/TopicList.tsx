import React, { useState } from 'react';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { OntologyTopic } from '@/data/ontology';
import { TopicProgress } from '@/db/types';
import { 
  CheckCircle2, 
  Circle, 
  CircleDashed, 
  Compass, 
  TriangleAlert, 
  FolderPlus, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  RotateCcw, 
  MoreHorizontal,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateHLC } from '@/lib/hlc';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  onResetTopics?: () => void;
  hasCustomEdits?: boolean;
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
  onResetTopics,
  hasCustomEdits
}: TopicListProps) {
  const [addTopicToSet, setAddTopicToSet] = useState<OntologyTopic | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  
  // Single Topic Rename Modal State
  const [renameTopicTarget, setRenameTopicTarget] = useState<OntologyTopic | null>(null);
  const [renameInputValue, setRenameInputValue] = useState('');
  
  // Inline row editing
  const [inlineEditingTopicId, setInlineEditingTopicId] = useState<string | null>(null);
  const [inlineEditingValue, setInlineEditingValue] = useState('');

  // Deletion modal state
  const [topicToDelete, setTopicToDelete] = useState<OntologyTopic | null>(null);
  
  // Reset confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Quick add state
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');

  // Search filter state for fast navigation
  const [topicSearch, setTopicSearch] = useState('');

  const filteredTopics = topics.filter(t => 
    !topicSearch.trim() || t.name.toLowerCase().includes(topicSearch.trim().toLowerCase())
  );

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

  const submitNewTopic = () => {
    if (newTopicName.trim() && onAddTopic) {
      onAddTopic(newTopicName.trim());
      setNewTopicName('');
      setIsAddingTopic(false);
    }
  };

  const startInlineEdit = (topic: OntologyTopic) => {
    setInlineEditingTopicId(topic.id);
    setInlineEditingValue(topic.name);
  };

  const saveInlineEdit = (topicId: string) => {
    const clean = inlineEditingValue.trim();
    if (clean && onRenameTopic) {
      onRenameTopic(topicId, clean);
    }
    setInlineEditingTopicId(null);
  };

  const saveModalRename = () => {
    if (renameTopicTarget && renameInputValue.trim() && onRenameTopic) {
      onRenameTopic(renameTopicTarget.id, renameInputValue.trim());
      setRenameTopicTarget(null);
      setRenameInputValue('');
    }
  };

  return (
    <div className="flex flex-col bg-card/60 border border-border/50 rounded-2xl overflow-hidden shadow-xs">
      {/* Topics Header & Management Bar */}
      <div className="px-3.5 py-2.5 border-b border-border/40 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Curriculum Topics
          </span>
          <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
            {topics.length}
          </span>
          {hasCustomEdits && (
            <span className="text-xs text-teal-600 dark:text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded font-medium">
              Modified
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {hasCustomEdits && onResetTopics && (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              title="Reset to default medical curriculum"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          {onAddTopic && !isAddingTopic && (
            <button
              type="button"
              onClick={() => setIsAddingTopic(true)}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/15 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Inline Add Topic Input */}
      {isAddingTopic && (
        <div className="p-2.5 bg-muted/30 border-b border-border/40 flex items-center gap-2 animate-in fade-in duration-150">
          <Input
            autoFocus
            value={newTopicName}
            onChange={e => setNewTopicName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitNewTopic();
              } else if (e.key === 'Escape') {
                setIsAddingTopic(false);
                setNewTopicName('');
              }
            }}
            placeholder="Topic title (e.g. Brachial Plexus Anatomy)..."
            className="h-8 text-xs bg-background rounded-lg flex-1 border-border/60 focus-visible:ring-primary/40"
          />
          <Button 
            size="sm" 
            className="h-8 px-3 text-xs font-semibold rounded-lg shrink-0 cursor-pointer" 
            onClick={submitNewTopic}
            disabled={!newTopicName.trim()}
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 px-2 text-xs rounded-lg text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            onClick={() => {
              setIsAddingTopic(false);
              setNewTopicName('');
            }}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Quick Search / Filter Bar */}
      {topics.length > 4 && (
        <div className="px-3 py-1.5 border-b border-border/30 bg-muted/10 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
            <input
              type="text"
              value={topicSearch}
              onChange={(e) => setTopicSearch(e.target.value)}
              placeholder={`Filter ${topics.length} topics...`}
              className="w-full pl-8 pr-7 py-1 text-xs bg-background/80 hover:bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground transition-all placeholder:text-muted-foreground/50"
            />
            {topicSearch && (
              <button
                type="button"
                onClick={() => setTopicSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                title="Clear filter"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          {topicSearch && (
            <span className="text-xs font-mono text-muted-foreground shrink-0 bg-muted px-1.5 py-0.5 rounded-md border border-border/40">
              {filteredTopics.length}/{topics.length}
            </span>
          )}
        </div>
      )}

      {/* Topics Scrollable List */}
      <div 
        className="flex flex-col divide-y divide-border/25 max-h-[360px] sm:max-h-[480px] overflow-y-auto overscroll-y-contain p-1 touch-pan-y scrollbar-thin select-text"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
      >
        {topics.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            No topics configured for this system.
            {onAddTopic && (
              <div className="mt-2.5">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsAddingTopic(true)}
                  className="h-7 text-xs rounded-lg gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Add First Topic
                </Button>
              </div>
            )}
          </div>
        ) : filteredTopics.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            No topics match &quot;<span className="text-foreground font-medium">{topicSearch}</span>&quot;
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setTopicSearch('')}
                className="text-primary hover:underline text-xs font-medium cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>
          </div>
        ) : (
          filteredTopics.map(topic => {
            const p = getProgress(topic.id);
            const isWeak = p.isWeak;
            const sets = revisionSets.filter(rs => rs.topicIds.includes(topic.id));
            const isCompleted = sets.length > 0 && sets.some(rs => rs.contentCompleted && rs.qbankCompleted);
            const isPartiallyDone = sets.length > 0 && !isCompleted && sets.some(rs => rs.contentCompleted || rs.qbankCompleted);
            const isInlineEditing = inlineEditingTopicId === topic.id;

            return (
              <div
                key={topic.id}
                className={cn(
                  "flex items-center justify-between gap-2.5 px-3 py-2 hover:bg-muted/30 rounded-xl transition-colors group text-xs",
                  isInlineEditing && "bg-muted/40 ring-1 ring-primary/30",
                  isWeak && "bg-rose-500/5 hover:bg-rose-500/10"
                )}
              >
                {/* Status Indicator Icon */}
                <div className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : isPartiallyDone ? (
                    <CircleDashed className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground/30" />
                  )}
                </div>

                {/* Main Topic Name Area */}
                <div className="flex-1 min-w-0">
                  {isInlineEditing ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        autoFocus
                        value={inlineEditingValue}
                        onChange={e => setInlineEditingValue(e.target.value)}
                        onKeyDown={e => {
                          e.stopPropagation();
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            saveInlineEdit(topic.id);
                          } else if (e.key === 'Escape') {
                            setInlineEditingTopicId(null);
                          }
                        }}
                        onBlur={() => saveInlineEdit(topic.id)}
                        className="h-7 text-xs px-2 py-0 bg-background rounded-md border-border/60"
                        onClick={e => e.stopPropagation()}
                      />
                      <button
                        type="button"
                        onClick={() => saveInlineEdit(topic.id)}
                        className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-md cursor-pointer shrink-0"
                        title="Save"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setInlineEditingTopicId(null)}
                        className="p-1 text-muted-foreground hover:bg-muted rounded-md cursor-pointer shrink-0"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">
                        {topic.name}
                      </span>
                      {sets.length > 0 && (
                        <span className="text-xs text-muted-foreground/60 shrink-0 hidden sm:inline-block">
                          ({sets.map(s => s.name).join(', ')})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Actions Cluster */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Trail Markers Action */}
                  <button 
                    type="button"
                    onClick={() => onViewMarkers?.(topic.id, topic.name)}
                    className="p-1.5 text-muted-foreground/60 hover:text-primary transition-colors rounded-lg hover:bg-primary/10 cursor-pointer"
                    title={`Trail Markers for ${topic.name}`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                  </button>

                  {/* Weak Concept Toggle */}
                  <button 
                    type="button"
                    onClick={() => toggleWeak(topic.id)}
                    className={cn(
                      "p-1.5 rounded-lg border transition-colors cursor-pointer",
                      isWeak 
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20" 
                        : "bg-transparent border-transparent text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted"
                    )}
                    title={isWeak ? "Weak concept (flagged for review)" : "Mark as weak concept"}
                  >
                    <TriangleAlert className="w-3.5 h-3.5" />
                  </button>

                  {/* Contextual More Options Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        type="button"
                        className="p-1.5 text-muted-foreground/40 hover:text-foreground transition-colors rounded-lg hover:bg-muted cursor-pointer focus:outline-none"
                        title="More options"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border border-border/60">
                      <DropdownMenuItem 
                        onClick={() => startInlineEdit(topic)}
                        className="text-xs cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-2 text-foreground" /> 
                        <span>Rename Topic</span>
                      </DropdownMenuItem>

                      {revisionSets.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Add to Study Block
                          </DropdownMenuLabel>
                          {revisionSets.map(rs => (
                            <DropdownMenuItem 
                              key={rs.id} 
                              onClick={() => handleAddToSet(rs.id!, topic.id)}
                              className="text-xs cursor-pointer"
                            >
                              <FolderPlus className="w-3.5 h-3.5 mr-2 text-primary" /> 
                              <span className="truncate">{rs.name}</span>
                            </DropdownMenuItem>
                          ))}
                        </>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => { setAddTopicToSet(topic); setFormOpen(true); }}
                        className="text-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 mr-2 text-primary" /> 
                        <span>New Study Block...</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        className="text-destructive focus:bg-destructive/10 text-xs cursor-pointer" 
                        onClick={() => setTopicToDelete(topic)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> 
                        <span>Delete Topic</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Scroll Footer Indicator */}
      {topics.length > 5 && !topicSearch && (
        <div className="px-3 py-1.5 bg-muted/20 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground/80 font-medium shrink-0">
          <span>Scroll or search to view all {topics.length} topics</span>
          <span className="font-mono text-[9px] bg-muted/60 px-1.5 py-0.5 rounded border border-border/30">{topics.length} items</span>
        </div>
      )}

      {/* Rename Topic Modal */}
      {renameTopicTarget && (
        <Dialog open={!!renameTopicTarget} onOpenChange={(open) => !open && setRenameTopicTarget(null)}>
          <DialogContent className="sm:max-w-[380px] rounded-2xl mx-4 w-[calc(100%-2rem)]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Rename Topic</DialogTitle>
            </DialogHeader>
            <div className="py-3 space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Topic Title
              </label>
              <Input
                autoFocus
                type="text"
                value={renameInputValue}
                onChange={e => setRenameInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    saveModalRename();
                  }
                }}
                placeholder="e.g. Brachial Plexus Anatomy"
                className="text-sm py-2 px-3 bg-muted/40 rounded-xl"
              />
            </div>
            <DialogFooter className="flex-row gap-2 sm:justify-end mt-2">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl" 
                onClick={() => setRenameTopicTarget(null)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 rounded-xl font-semibold shadow-xs" 
                onClick={saveModalRename} 
                disabled={!renameInputValue.trim() || renameInputValue.trim() === renameTopicTarget.name}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Topic Confirmation Alert */}
      <AlertDialog open={!!topicToDelete} onOpenChange={(open) => !open && setTopicToDelete(null)}>
        <AlertDialogContent className="rounded-2xl mx-4 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Delete Topic</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              Are you sure you want to delete <strong className="text-foreground">{topicToDelete?.name}</strong>? 
              This will remove it from the system and any associated study blocks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-end mt-3">
            <AlertDialogCancel className="flex-1 rounded-xl mt-0 cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold cursor-pointer"
              onClick={() => {
                if (topicToDelete && onDeleteTopic) {
                  onDeleteTopic(topicToDelete.id);
                  setTopicToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Topics Confirmation Alert */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent className="rounded-2xl mx-4 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Reset Topics</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              Restore this system's topic catalog back to the standard high-yield medical ontology curriculum? Any custom additions or renames will be reverted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-end mt-3">
            <AlertDialogCancel className="flex-1 rounded-xl mt-0 cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 rounded-xl bg-primary text-primary-foreground font-semibold cursor-pointer"
              onClick={() => {
                if (onResetTopics) {
                  onResetTopics();
                  setShowResetConfirm(false);
                }
              }}
            >
              Restore Defaults
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add to New Study Block Modal */}
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
