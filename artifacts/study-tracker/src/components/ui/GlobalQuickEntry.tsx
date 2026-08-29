import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Sparkles, Hash, CornerDownLeft } from 'lucide-react';
import { db } from '@/db';
import { toast } from 'sonner';

export function GlobalQuickEntry() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setInputValue('');
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      await processQuickEntry(inputValue.trim());
    }
  };

  const processQuickEntry = async (text: string) => {
    try {
      // Extract tags
      const tagRegex = /#\w+/g;
      const tags = text.match(tagRegex) || [];
      const content = text.replace(tagRegex, '').trim();

      if (!content) {
         toast.error("Please enter a note alongside your tags.");
         return;
      }

      // We just write to MistakeLogs with these tags. The SDSR and NextAction engine
      // will pick this up automatically.
      await db.mistakeLogs.add({
        clinicalTrigger: content,
        notes: '',
        gravity: 3, // High gravity by default for friction
        tags: tags,
        status: 'Open',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      toast.success("Cognitive friction logged globally.", {
        description: "The Friction Engine has scheduled this for review."
      });
      setOpen(false);
      setInputValue('');
    } catch (err) {
      console.error(err);
      toast.error("Failed to log entry.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-background border-primary/20 shadow-2xl rounded-2xl">
        <DialogTitle className="sr-only">Global Quick Entry</DialogTitle>
        <DialogDescription className="sr-only">Enter clinical friction and tags to log to the knowledge graph</DialogDescription>
        <div className="flex items-center px-4 border-b">
          <Sparkles className="w-5 h-5 text-primary mr-3 opacity-70" />
          <Input
            ref={inputRef}
            placeholder="Type friction... e.g. Forgot MOA of Heparin #Pharma #Cardio #Volatile"
            className="flex-1 border-0 shadow-none focus-visible:ring-0 text-lg px-0 py-6 placeholder:text-muted-foreground/60 h-auto"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <kbd className="hidden sm:inline-flex ml-2 items-center gap-1 rounded border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <CornerDownLeft className="w-3 h-3" /> RET
          </kbd>
        </div>
        {inputValue && (
           <div className="bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <Hash className="w-4 h-4" />
              <span>Will map {inputValue.match(/#\w+/g)?.length || 0} tags into N-to-N Knowledge Graph.</span>
           </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
