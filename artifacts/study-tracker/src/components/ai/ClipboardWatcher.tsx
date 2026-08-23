import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardPaste, 
  Sparkles, 
  X, 
  Brain, 
  Check, 
  ArrowRight,
  ShieldAlert,
  Loader2,
  Stethoscope
} from 'lucide-react';
import { useAISettings } from '@/lib/ai/aiSettingsStorage';
import { executeCognitiveCompiler, CognitiveExecutionResult } from '@/lib/ai/geminiClient';
import { ParsedAtlasAction, CognitiveDelta } from '@/lib/ai/types';
import { MorphingActionCard } from './MorphingActionCard';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Regex patterns to identify medical Q-Bank explanation stems
const MEDICAL_KEYWORDS_REGEX = /\b(explanation|correct option|incorrect option|most likely diagnosis|drug of choice|investigation of choice|classic triad|diagnostic criteria|management protocol|differential diagnosis|q-bank|marrow|uworld|pre-pg|first aid|pathognomonic|histopathology|gold standard|patient presents with|biopsy shows|treatment of choice)\b/i;

export const ClipboardWatcher: React.FC = () => {
  const { settings } = useAISettings();
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [isDistilling, setIsDistilling] = useState<boolean>(false);
  const [compiledResult, setCompiledResult] = useState<CognitiveExecutionResult | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  
  // Track last inspected clipboard hash to prevent duplicate popups
  const lastProcessedTextRef = useRef<string>('');

  const inspectClipboard = useCallback(async () => {
    // Only inspect if AI is enabled and user has configured API key or offline mode
    if (!settings.isAiEnabled || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    try {
      // Avoid interrupting if user already has an active distillation open
      if (isOpen || isDistilling || compiledResult) return;

      const text = await navigator.clipboard.readText();
      const clean = text?.trim();

      if (!clean || clean.length < 25 || clean.length > 5000) {
        return;
      }

      // Check if text is identical to last seen
      if (clean === lastProcessedTextRef.current) {
        return;
      }

      // Test against medical ontology keywords
      if (MEDICAL_KEYWORDS_REGEX.test(clean)) {
        lastProcessedTextRef.current = clean;
        setCopiedSnippet(clean);
        setIsOpen(true);
      }
    } catch {
      // Clipboard permission may be denied or document not focused; gracefully ignore
    }
  }, [settings.isAiEnabled, isOpen, isDistilling, compiledResult]);

  useEffect(() => {
    const handleFocus = () => {
      // Small timeout to allow clipboard buffer to stabilize
      setTimeout(inspectClipboard, 300);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(inspectClipboard, 300);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [inspectClipboard]);

  // Handle distillation request
  const handleDistill = async () => {
    if (!copiedSnippet || isDistilling) return;
    setIsDistilling(true);

    try {
      const prompt = `Analyze this clinical Q-Bank explanation or question stem and extract the high-yield 20th notebook takeaway rule:
${copiedSnippet}`;

      const res = await executeCognitiveCompiler(prompt, [], { bypassLocalTokenizer: false, cognitiveLoad: 'clinical' });
      setCompiledResult(res);
    } catch (err: any) {
      console.error('[ClipboardWatcher] Distillation failed:', err);
      toast.error('Could not distill clinical stem', {
        description: err.message || 'Please check your Gemini API key and network connection.',
      });
    } finally {
      setIsDistilling(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    setCopiedSnippet(null);
    setCompiledResult(null);
  };

  if (!isOpen || !copiedSnippet) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -60, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -60, opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="fixed top-3 sm:top-4 inset-x-3 sm:inset-x-auto sm:right-6 z-50 max-w-lg w-full"
      >
        <div className="rounded-2xl bg-card/98 dark:bg-card/95 border border-primary/25 shadow-2xl backdrop-blur-xl overflow-hidden text-foreground">
          {/* Header Strip */}
          <div className="px-4 py-2.5 bg-primary/10 border-b border-primary/15 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[11px] font-semibold tracking-wide uppercase text-primary flex items-center gap-1">
                <ClipboardPaste className="w-3.5 h-3.5" />
                Medical Q-Bank Stem Detected
              </span>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Snippet Preview & Actions */}
          <div className="p-4 space-y-3">
            {!compiledResult ? (
              <>
                <p className="text-xs text-muted-foreground line-clamp-2 italic leading-relaxed font-sans bg-muted/30 p-2.5 rounded-xl border border-border/40">
                  "{copiedSnippet}"
                </p>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[10px] text-muted-foreground">
                    Clipboard Ingestion Active
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      Ignore
                    </button>
                    <button
                      type="button"
                      disabled={isDistilling}
                      onClick={handleDistill}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs shadow-sm transition-all cursor-pointer active:scale-98"
                    >
                      {isDistilling ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Distilling Pearl...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Distill 20th Notebook Pearl</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Morphing Action Card populated with compiled clinical result */
              <MorphingActionCard
                action={compiledResult.action || {
                  action: 'ACTION_ADD_MISTAKE',
                  subjectId: 'SUB_11',
                  subjectName: compiledResult.delta.targetSubjectName || 'General Medicine',
                  systemName: compiledResult.delta.distillation?.tag || 'General Pearl',
                  tag: compiledResult.delta.distillation?.tag || 'General Pearl',
                  ruleText: compiledResult.delta.distillation?.twentyNotebookRule || compiledResult.delta.executiveSummary,
                  isUrgent: true,
                  errorType: 'concept',
                  keyTakeaway: compiledResult.delta.distillation?.twentyNotebookRule || compiledResult.delta.executiveSummary,
                  clinicalTrigger: compiledResult.delta.distillation?.clinicalTrigger || '',
                  source: 'QBank'
                }}
                cognitiveDelta={compiledResult.delta}
                onCommit={() => {
                  setTimeout(handleDismiss, 1000);
                }}
                onDismiss={handleDismiss}
                enableSwipe={true}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
