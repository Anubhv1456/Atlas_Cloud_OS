import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardPaste, 
  Sparkles, 
  Check, 
  Layers,
} from 'lucide-react';
import { useAISettings } from '@/lib/ai/aiSettingsStorage';
import { executeCognitiveCompiler } from '@/lib/ai/geminiClient';
import { BatchTriageDrawer } from './BatchTriageDrawer';
import { ClinicalDistillation } from '@/lib/ai/types';
import { logMistake } from '@/db/mutations';
import { toast } from 'sonner';
import { db } from '@/db';

// Regex patterns to identify medical Q-Bank explanation stems
const MEDICAL_KEYWORDS_REGEX = /\b(explanation|correct option|incorrect option|most likely diagnosis|drug of choice|investigation of choice|classic triad|diagnostic criteria|management protocol|differential diagnosis|q-bank|marrow|uworld|pre-pg|first aid|pathognomonic|histopathology|gold standard|patient presents with|biopsy shows|treatment of choice)\b/i;

type IslandState = 'hidden' | 'ingesting' | 'docked' | 'processing' | 'ready';

export const ClipboardWatcher: React.FC = () => {
  const { settings } = useAISettings();
  
  const [islandState, setIslandState] = useState<IslandState>('hidden');
  const [rawClips, setRawClips] = useState<string[]>([]);
  const [triageQueue, setTriageQueue] = useState<ClinicalDistillation[]>([]);
  const [latestClip, setLatestClip] = useState<string | null>(null);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const lastProcessedTextRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const inspectClipboard = useCallback(async () => {
    if (!settings.isAiEnabled || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    try {
      if (islandState === 'processing') return;

      const text = await navigator.clipboard.readText();
      const clean = text?.trim();
      if (!clean || clean.length < 25 || clean.length > 5000) return;
      if (clean === lastProcessedTextRef.current) return;

      if (MEDICAL_KEYWORDS_REGEX.test(clean)) {
        lastProcessedTextRef.current = clean;
        
        setRawClips(prev => [...prev, clean]);
        setLatestClip(clean);
        setIslandState('ingesting');

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setIslandState(prev => prev === 'ingesting' ? 'docked' : prev);
        }, 3000);
      }
    } catch {
      // Clipboard permission may be denied or document not focused; gracefully ignore
    }
  }, [settings.isAiEnabled, islandState]);

  useEffect(() => {
    const handleFocus = () => setTimeout(inspectClipboard, 300);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') setTimeout(inspectClipboard, 300);
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [inspectClipboard]);

  const handleProcessBatch = async () => {
    if (rawClips.length === 0) return;
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIslandState('processing');

    try {
      const combinedPrompt = 'Analyze the following clipped Q-Bank explanations and extract distinct, high-yield 20th notebook pearls from ALL of them. Ensure you process every distinct topic presented:\n\n' + rawClips.map((c, i) => '--- CLIP ' + (i + 1) + ' ---\n' + c).join('\n\n');
      
      const res = await executeCognitiveCompiler(combinedPrompt, [], { bypassLocalTokenizer: false, cognitiveLoad: 'clinical' });
      
      if (res.delta.distillations && res.delta.distillations.length > 0) {
        const existingMistakes = await db.mistakes.toArray();
        const existingTexts = existingMistakes.map(m => (m.ruleText + " " + m.keyTakeaway).toLowerCase());
        
        const deduplicated = res.delta.distillations.filter(pearl => {
           const pearlText = (pearl.twentyNotebookRule || pearl.hingeConcept).toLowerCase();
           const isDuplicate = existingTexts.some(ext => 
             ext.includes(pearlText) || pearlText.includes(ext) ||
             (ext.length > 15 && pearlText.length > 15 && (
                ext.split(' ').filter(w => pearlText.includes(w)).length / ext.split(' ').length > 0.7
             ))
           );
           return !isDuplicate;
        });

        if (deduplicated.length > 0) {
           setTriageQueue(prev => [...prev, ...deduplicated]);
           setIslandState('ready');
        } else {
           toast.info("All captured pearls are already in your notebook.");
           handleDismiss();
        }
      } else {
        toast.info("No actionable pearls found in captured clips.");
        handleDismiss();
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to distill pearls.');
      handleDismiss();
    } finally {
      // Clear clips after processing attempt
      setRawClips([]);
    }
  };

  const handleCommitPearl = async (pearl: ClinicalDistillation) => {
    try {
      await logMistake({
        subjectId: pearl.subjectId || 'SUB_11',
        subjectName: pearl.subjectName || 'General Medicine',
        systemName: pearl.systemName || pearl.tag,
        tag: pearl.tag || 'General Pearl',
        ruleText: pearl.twentyNotebookRule || pearl.hingeConcept,
        isUrgent: pearl.isUrgent || false,
        errorType: 'concept',
        keyTakeaway: pearl.twentyNotebookRule || pearl.hingeConcept,
        clinicalTrigger: pearl.clinicalTrigger || '',
        source: 'QBank'
      });
      toast.success("Pearl committed");
      
      setTriageQueue(prev => {
        const updated = prev.filter(p => p !== pearl);
        if (updated.length === 0) handleDismiss();
        return updated;
      });
    } catch (e) {
      toast.error("Failed to commit pearl");
    }
  };

  const handleDiscardPearl = (index: number) => {
    setTriageQueue(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) handleDismiss();
      return updated;
    });
  };

  const handleDismiss = () => {
    setIslandState('hidden');
    setRawClips([]);
    setTriageQueue([]);
    setLatestClip(null);
    setIsDrawerOpen(false);
  };

  const handleDragEnd = (event: any, info: any) => {
    if (Math.abs(info.offset.x) > 100 || Math.abs(info.offset.y) > 50) {
       handleDismiss();
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {islandState !== 'hidden' && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', bounce: 0.25, visualDuration: 0.4 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-24 right-4 sm:right-8 z-50 cursor-pointer touch-none"
            onClick={() => {
              if (islandState === 'docked' || islandState === 'ingesting') handleProcessBatch();
              if (islandState === 'ready') setIsDrawerOpen(true);
            }}
          >
            <div className="bg-background/60 dark:bg-zinc-900/50 backdrop-blur-3xl ring-1 ring-black/5 dark:ring-white/10 shadow-2xl rounded-full overflow-hidden shadow-inner px-4 py-2 flex items-center gap-3">
              <AnimatePresence mode="popLayout">
                {islandState === 'ingesting' && (
                  <motion.div
                    key="ingesting"
                    initial={{ opacity: 0, filter: 'blur(4px)', x: -10 }}
                    animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
                    exit={{ opacity: 0, filter: 'blur(4px)', scale: 0.8 }}
                    className="flex items-center gap-2 max-w-[200px]"
                  >
                    <div className="bg-primary/20 text-primary p-1.5 rounded-full shrink-0">
                      <ClipboardPaste className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[11px] font-semibold text-foreground whitespace-nowrap">{rawClips.length} {rawClips.length === 1 ? 'Clip' : 'Clips'} Captured</span>
                      <span className="text-[10px] text-muted-foreground truncate">{latestClip}</span>
                    </div>
                  </motion.div>
                )}
                
                {islandState === 'docked' && (
                  <motion.div
                    key="docked"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-foreground whitespace-nowrap">
                      Distill {rawClips.length} {rawClips.length === 1 ? 'Clip' : 'Clips'}
                    </span>
                  </motion.div>
                )}

                {islandState === 'processing' && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-2 relative overflow-hidden"
                  >
                    <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap px-1">
                      Distilling...
                    </span>
                  </motion.div>
                )}

                {islandState === 'ready' && (
                  <motion.div
                    key="ready"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-foreground whitespace-nowrap pr-1">
                      {triageQueue.length} {triageQueue.length === 1 ? 'Pearl' : 'Pearls'} Ready
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BatchTriageDrawer 
        open={isDrawerOpen} 
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open && triageQueue.length === 0) {
            handleDismiss();
          }
        }}
        distillations={triageQueue}
        onCommit={handleCommitPearl}
        onDiscard={handleDiscardPearl}
      />
    </>
  );
};
