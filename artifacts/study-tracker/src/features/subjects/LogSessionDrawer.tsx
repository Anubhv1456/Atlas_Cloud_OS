import React, { useState, useMemo } from 'react';
import { StudySystem, Topic, CurriculumSet, db } from '@/db';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';


import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export interface LogSessionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  system: StudySystem;
  subjectId: number;
  topics: Topic[];
}

export function LogSessionDialog({ isOpen, onOpenChange, system, subjectId, topics }: LogSessionDialogProps) {
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const filteredTopics = useMemo(() => {
    if (!search.trim()) return topics;
    return topics.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  }, [topics, search]);

  const toggleTopic = (id: string) => {
    const next = new Set(selectedTopicIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedTopicIds(next);
  };

  const handleSave = async () => {
    if (selectedTopicIds.size === 0) return;
    
    try {
      const now = new Date();
      await db.curriculumSets.add({
        id: `set-${Date.now()}`,
        name: `${system.name} Session`,
        subjectId,
        systemId: system.id!,
        topicIds: Array.from(selectedTopicIds),
        contentCompleted: true,
        qbankCompleted: true, // We assume logged session implies qbank coverage for those topics
        completionDate: now,
        lastRevisionDate: now,
        nextRevisionDate: new Date(now.getTime() + 1000 * 60 * 60 * 24), // 1 day interval initially
        currentRevisionInterval: 1,
        revisionCount: 1,
        createdAt: now,
        updatedAt: now,
      });
      
      toast.success('Study Session Logged', {
        description: `Logged ${selectedTopicIds.size} topics for ${system.name}.`
      });
      
      onOpenChange(false);
      setSelectedTopicIds(new Set());
      setSearch('');
    } catch (e) {
      console.error('Failed to log session', e);
      toast.error('Failed to log session');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col rounded-t-[20px]">
        <DialogHeader className="px-6 py-4 border-b border-border/40 text-left">
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <span>Log Study Session</span>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
              {system.name}
            </span>
          </DialogTitle>
          <div className="pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Find topics you just studied..." 
                className="pl-9 bg-muted/40 border-transparent focus-visible:bg-background rounded-xl"
              />
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 px-6">
          <div className="py-4 space-y-1">
            {filteredTopics.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No topics found.
              </div>
            ) : (
              filteredTopics.map(topic => (
                <div 
                  key={topic.id} 
                  className="flex items-start gap-3 py-3 px-2 hover:bg-muted/30 rounded-xl transition-colors cursor-pointer group"
                  onClick={() => toggleTopic(topic.id)}
                >
                  <input type="checkbox" 
                    checked={selectedTopicIds.has(topic.id)} onChange={() => toggleTopic(topic.id)} 
                    
                    className="mt-1 w-5 h-5 rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight text-foreground group-hover:text-primary transition-colors">
                      {topic.name}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <DialogFooter className="px-6 py-4 border-t border-border/40 bg-background/80 backdrop-blur-md">
          <Button 
            className="w-full rounded-xl font-bold shadow-sm" 
            size="lg"
            disabled={selectedTopicIds.size === 0}
            onClick={handleSave}
          >
            <Plus className="w-4 h-4 mr-2" />
            Log {selectedTopicIds.size > 0 ? selectedTopicIds.size : ''} Topics
          </Button>
          <DialogClose asChild>
            <Button variant="ghost" className="w-full rounded-xl">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
