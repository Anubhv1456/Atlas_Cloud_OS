import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardPaste, 
  Sparkles, 
  X, 
  Check, 
  Loader2,
  ArrowDown
} from 'lucide-react';
import { useAISettings } from '@/lib/ai/aiSettingsStorage';
import { executeCognitiveCompiler } from '@/lib/ai/geminiClient';
import { executeAtlasAction } from '@/lib/ai/atlasActionExecutor';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Regex patterns to identify medical Q-Bank explanation stems
const MEDICAL_KEYWORDS_REGEX = /\b(explanation|correct option|incorrect option|most likely diagnosis|drug of choice|investigation of choice|classic triad|diagnostic criteria|management protocol|differential diagnosis|q-bank|marrow|uworld|pre-pg|first aid|pathognomonic|histopathology|gold standard|patient presents with|biopsy shows|treatment of choice)\b/i;

export const DynamicIslandCapsule: React.FC = () => {
  const { settings } = useAISettings();
  
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [isDistilling, setIsDistilling] = useState<boolean>(false);
  const [distilledPearl, setDistilledPearl] = useState<{ rule: string; subject: string; tag: string } | null>(null);
  const [islandState, setIslandState] = useState<'idle' | 'detected' | 'distilled'>('idle');

  // Track last inspected clipboard hash across component mounts using sessionStorage
  const lastProcessedTextRef = useRef<string>(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return sessionStorage.getItem('atlas_last_clipboard_stem') || '';
    }
    return '';
  });

  const inspectClipboard = useCallback(async () => {
    if (!settings.isAiEnabled || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    try {
      if (islandState !== 'idle' || isDistilling) return;

      const text = await navigator.clipboard.readText();
      const clean = text?.trim();

      if (!clean || clean.length < 25 || clean.length > 5000) {
        return;
      }

      const storedLast = typeof window !== 'undefined' ? sessionStorage.getItem('atlas_last_clipboard_stem') : '';
      if (clean === lastProcessedTextRef.current || clean === storedLast) {
        return;
      }

      if (MEDICAL_KEYWORDS_REGEX.test(clean)) {
        lastProcessedTextRef.current = clean;
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.setItem('atlas_last_clipboard_stem', clean);
        }
        setCopiedSnippet(clean);
        setIslandState('detected');
      }
    } catch {
      // Ignore background clipboard permission boundaries
    }
  }, [settings.isAiEnabled, islandState, isDistilling]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleFocus = () => {
      clearTimeout(timer);
      timer = setTimeout(inspectClipboard, 800);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timer);
        timer = setTimeout(inspectClipboard, 800);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [inspectClipboard]);

  // Auto-distill when medical stem is ingested
  const handleDistill = async () => {
    if (!copiedSnippet || isDistilling) return;
    setIsDistilling(true);

    try {
      const prompt = `Analyze this clinical Q-Bank explanation or question stem and extract the high-yield 20th notebook takeaway rule:\n${copiedSnippet}`;

      const res = await executeCognitiveCompiler(prompt, [], { bypassLocalTokenizer: false, cognitiveLoad: 'routine' });
      const rule = res.delta.distillations?.[0]?.twentyNotebookRule || res.delta.executiveSummary || 'High-Yield Clinical Concept';
      const subject = res.delta.targetSubjectName || 'General Medicine';
      const tag = res.delta.distillations?.[0]?.tag || 'Drug of Choice';

      setDistilledPearl({ rule, subject, tag });
      setIslandState('distilled');
    } catch (err: any) {
      console.error('[DynamicIslandCapsule] Distillation failed:', err);
      toast.error('Distillation fallback to local parser', {
        description: 'Using rapid offline lexical rules.'
      });
      setDistilledPearl({
        rule: copiedSnippet.slice(0, 120) + '...',
        subject: 'General Medicine',
        tag: 'General Pearl'
      });
      setIslandState('distilled');
    } finally {
      setIsDistilling(false);
    }
  };

  const handleQuickCommit = async () => {
    if (!distilledPearl) return;
    
    try {
      await executeAtlasAction({
        action: 'ACTION_ADD_MISTAKE',
        subjectName: distilledPearl.subject,
        systemName: distilledPearl.tag,
        tag: (distilledPearl.tag as any) || 'General Pearl',
        ruleText: distilledPearl.rule,
        isUrgent: true,
        errorType: 'concept',
        keyTakeaway: distilledPearl.rule,
        source: 'QBank'
      });

      toast.success('Committed to 20th Notebook', {
        description: `Saved under ${distilledPearl.subject} • ${distilledPearl.tag}`,
        icon: <Sparkles className="w-4 h-4 text-amber-500" />
      });

      handleDismiss();
    } catch (err: any) {
      if(err.message !== 'AI_PAYWALL_REQUIRED') toast.error('Could not save note', { description: err.message });
    }
  };

  const handleDismiss = () => {
    setIslandState('idle');
    setCopiedSnippet(null);
    setDistilledPearl(null);
  };

  // If AI is disabled or island is in idle resting state, stay completely invisible (0px footprint)
  if (!settings.isAiEnabled) return null;

  return (
    <AnimatePresence>
      {islandState !== 'idle' && (
        <div className="fixed top-2.5 sm:top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex flex-col items-center select-none">
          <motion.div
            layout
            initial={{ opacity: 0, y: -40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            drag="y"
            dragConstraints={{ top: -40, bottom: 60 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.y > 35 && islandState === 'distilled') {
                handleQuickCommit();
              } else if (info.offset.y < -25) {
                handleDismiss();
              }
            }}
            className={cn(
              "rounded-3xl p-4 sm:p-4.5 max-w-md w-[92vw] sm:w-[420px] shadow-2xl backdrop-blur-2xl border",
              "bg-zinc-950/95 dark:bg-zinc-900/98 text-zinc-100 border-zinc-700/80 shadow-black/60 relative overflow-hidden"
            )}
          >
            {/* Ambient subtle glow backdrop */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-teal-500/10 opacity-70 pointer-events-none" />

            {/* ── DETECTED Q-BANK STEM INGESTION ──────────────────────────────────────────────── */}
            {islandState === 'detected' && (
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <ClipboardPaste className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-100">Medical Q-Bank Stem Detected</h4>
                      <p className="text-[10px] text-zinc-400">Ready for 20th Notebook distillation</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="w-6 h-6 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-zinc-100 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <p className="text-xs text-zinc-300 line-clamp-2 italic leading-relaxed bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80 font-sans">
                  "{copiedSnippet}"
                </p>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    disabled={isDistilling}
                    onClick={handleDistill}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    {isDistilling ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Distilling Pearl...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Distill 20th Notebook Rule</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── DISTILLED 20TH NOTEBOOK PEARL (GESTURE-DRIVEN SWIPE DOWN TO COMMIT) ─────────── */}
            {islandState === 'distilled' && distilledPearl && (
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                        <span>{distilledPearl.subject}</span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono">
                          {distilledPearl.tag}
                        </span>
                      </h4>
                      <p className="text-[10px] text-zinc-400">Distilled Clinical Takeaway Rule</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="w-6 h-6 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-zinc-100 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 text-zinc-100 text-xs font-medium leading-relaxed">
                  "{distilledPearl.rule}"
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 animate-bounce">
                    <ArrowDown className="w-3 h-3 text-emerald-400" />
                    <span>Swipe down or tap save</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="px-2.5 py-1 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      Ignore
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickCommit}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save to 20th Notebook</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
