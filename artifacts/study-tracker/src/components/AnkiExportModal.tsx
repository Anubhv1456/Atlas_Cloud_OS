import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, CheckCircle2, Download, RefreshCcw, FileBox, GripVertical } from 'lucide-react';
import { generateAnkiDeck, downloadAnkiTSV, generateAnkiPreview, AnkiCard } from '@/lib/ankiExport';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Settings2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface AnkiExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allMistakes: any[];
  visibleMistakes: any[];
  selectedMistakes?: any[];
  onMarkExported?: (ids: (string|number)[]) => Promise<void>;
}

type Step = 'select' | 'preview_loading' | 'preview_ready' | 'generating' | 'complete';

const PRESETS = [
  { id: 'vignettes', type: 'vignette', label: 'Clinical Vignettes', desc: 'Short, one-sentence clinical scenarios.', prompt: 'Format as short, one-sentence clinical vignettes.' },
  { id: 'cloze', type: 'cloze', label: 'Cloze Deletion', desc: 'Fill-in-the-blank cards for high-yield terms.', prompt: 'Create Cloze Deletion (fill-in-the-blank) cards for high-yield terms.' },
  { id: 'qa', type: 'strict_qa', label: 'Strict Q&A', desc: 'Keep answers under 5 words.', prompt: 'Strict Q&A format. Keep answers under 5 words.' }
];

export function AnkiExportModal({ isOpen, onClose, allMistakes, visibleMistakes, selectedMistakes = [], onMarkExported }: AnkiExportModalProps) {
  const [scope, setScope] = useState<'smart' | 'visible' | 'all' | 'selected'>(
    selectedMistakes.length > 0 ? 'selected' : 'smart'
  );
  const [step, setStep] = useState<Step>('select');
  const [prompt, setPrompt] = useState("");
  const [formatType, setFormatType] = useState("custom");
  const [isCustom, setIsCustom] = useState(false);
  const [previewCard, setPreviewCard] = useState<AnkiCard | null>(null);
  const [generatedCards, setGeneratedCards] = useState<AnkiCard[]>([]);
  const subjects = useLiveQuery(() => db.subjects?.filter(s => !s.deletedAt).toArray(), []) || [];
  const [exportSubjectId, setExportSubjectId] = useState<string>('all');
  const [targetDeck, setTargetDeck] = useState<string>("");
  const [customTags, setCustomTags] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasManuallyEditedDeck, setHasManuallyEditedDeck] = useState(false);

  const targetMistakes = useMemo(() => {
    let baseMistakes = [];
    if (scope === 'selected') baseMistakes = selectedMistakes;
    else if (scope === 'visible') baseMistakes = visibleMistakes;
    else if (scope === 'all') baseMistakes = allMistakes;
    else baseMistakes = visibleMistakes.filter(m => !m.ankiExportedAt);
    
    if (exportSubjectId !== 'all') {
      return baseMistakes.filter(m => String(m.subjectId) === String(exportSubjectId));
    }
    return baseMistakes;
  }, [scope, selectedMistakes, visibleMistakes, allMistakes, exportSubjectId]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [failedCount, setFailedCount] = useState(0);

  useEffect(() => {
    if (!hasManuallyEditedDeck && exportSubjectId !== 'all') {
      const subject = subjects.find(s => String(s.id) === String(exportSubjectId));
      if (subject) {
        setTargetDeck(`Atlas::${subject.name}`);
      }
    } else if (!hasManuallyEditedDeck && exportSubjectId === 'all') {
      setTargetDeck("");
    }
  }, [exportSubjectId, subjects, hasManuallyEditedDeck]);
  const [deckUrl, setDeckUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setPrompt("");
      setFormatType("custom");
      setIsCustom(false);
      setPreviewCard(null);
      setGeneratedCards([]);
      setProgress({ current: 0, total: 0 });
      setFailedCount(0);
      setDeckUrl(null);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (deckUrl) URL.revokeObjectURL(deckUrl);
    };
  }, [deckUrl]);

  const handleSelectPreset = async (preset: typeof PRESETS[0]) => {
    setPrompt(preset.prompt);
    setFormatType(preset.type);
    generatePreview(preset.prompt, preset.type);
  };

  const generatePreview = async (currentPrompt: string, currentFormatType: string) => {
    if (targetMistakes.length === 0) return;
    setStep('preview_loading');
    try {
      const card = await generateAnkiPreview(targetMistakes[0], currentPrompt, currentFormatType);
      if (card) {
        setPreviewCard(card);
        setStep('preview_ready');
      } else {
        toast.error('Failed to generate preview. Trying again might help.');
        setStep('select');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate preview.');
      setStep('select');
    }
  };

  const handleStartGeneration = async () => {
    setStep('generating');
    setProgress({ current: 0, total: targetMistakes.length });
    
    try {
      const result = await generateAnkiDeck(targetMistakes, prompt, formatType, (current, total) => {
        setProgress({ current, total });
      });
      
      setGeneratedCards(result.cards);
      setFailedCount(result.failed);
      
      if (result.cards.length > 0) {
        const rows = result.cards.map(c => {
          const front = (c.front || "").replace(/\n/g, "<br>");
          const back = (c.back || "").replace(/\n/g, "<br>");
          if (targetDeck.trim()) {
            return `${front}\t${back}\t${customTags}\t${targetDeck}`;
          } else if (customTags.trim()) {
            return `${front}\t${back}\t${customTags}`;
          } else {
            return `${front}\t${back}`;
          }
        });
        const tsvContent = rows.join("\n");
        const blob = new Blob([tsvContent], { type: 'text/plain;charset=utf-8;' });
        setDeckUrl(URL.createObjectURL(blob));
      }
      
      
      setStep('complete');
    } catch (e: any) {
      toast.error(e.message || 'Generation failed.');
      setStep('select');
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (deckUrl) {
      const subjectName = exportSubjectId !== 'all' ? subjects.find(s => String(s.id) === String(exportSubjectId))?.name || "AI" : "AI";
      const filename = `Atlas_${subjectName.replace(/\s+/g, '_')}_Deck.txt`;
      e.dataTransfer.setData("DownloadURL", `text/plain:${filename}:${deckUrl}`);
    }
  };
return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && step !== 'generating' && step !== 'preview_loading') {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[550px] bg-card border-border overflow-hidden p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Sparkles className="w-5 h-5 text-primary" />
            Atlas Intelligence Anki Engine
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Transform your logged mistakes into highly optimized active-recall flashcards using AI.
          </p>
        </DialogHeader>

        <div className="p-6 relative min-h-[300px]">
          <AnimatePresence mode="wait">
            
            {step === 'select' && (
              <motion.div 
                key="select"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-3">Export Scope</h3>
                  <div className="flex bg-muted/50 p-1 rounded-lg">
                    {selectedMistakes.length > 0 ? (
                      <button className="flex-1 text-xs py-2 font-medium bg-background shadow-sm rounded-md border text-foreground">
                        Selected ({selectedMistakes.length} Rules)
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => setScope('smart')}
                          className={`flex-1 text-xs py-2 font-medium rounded-md transition-all ${scope === 'smart' ? 'bg-background shadow-sm border text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                          Smart Delta ({visibleMistakes.filter(m => !m.ankiExportedAt).length} New)
                        </button>
                        <button 
                          onClick={() => setScope('visible')}
                          className={`flex-1 text-xs py-2 font-medium rounded-md transition-all ${scope === 'visible' ? 'bg-background shadow-sm border text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                          Visible ({visibleMistakes.length})
                        </button>
                        <button 
                          onClick={() => setScope('all')}
                          className={`flex-1 text-xs py-2 font-medium rounded-md transition-all ${scope === 'all' ? 'bg-background shadow-sm border text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                          Everything ({allMistakes.length})
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Select Format</h3>
                  <div className="flex flex-wrap gap-2 mb-4 bg-muted/30 p-1.5 rounded-xl border">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setIsCustom(false);
                          handleSelectPreset(preset);
                        }}
                        className={`flex-1 min-w-[100px] text-xs py-2 px-3 rounded-lg font-medium transition-all cursor-pointer ${!isCustom && prompt === preset.prompt ? 'bg-background shadow-sm border text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {preset.label}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setIsCustom(true);
                        setPrompt("");
                        setFormatType("custom");
                      }}
                      className={`flex-1 min-w-[100px] text-xs py-2 px-3 rounded-lg font-medium transition-all cursor-pointer ${isCustom ? 'bg-background shadow-sm border text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Custom
                    </button>
                  </div>
                  
                  <div className="min-h-[120px]">
                    {!isCustom ? (
                      <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
                        <p className="text-sm text-muted-foreground mb-4">
                          {PRESETS.find(p => p.prompt === prompt)?.desc || 'Select a format to preview'}
                        </p>
                        <div className="flex justify-end">
                          <Button 
                            size="sm" 
                            onClick={() => {
                              const preset = PRESETS.find(p => p.prompt === prompt);
                              if (preset) generatePreview(preset.prompt, preset.type);
                            }}
                            disabled={!prompt}
                            className="bg-primary hover:bg-primary/90 text-white shadow-md cursor-pointer"
                          >
                            Preview Format
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                        <div className="text-muted-foreground text-[10px] mb-2 leading-tight">
                          <span className="font-semibold text-primary">💡 Format Advice:</span> The AI will follow your exact instructions. If you want fill-in-the-blank cards, explicitly tell the AI to use Anki's syntax (e.g., <code className="text-emerald-400">{"{{c1::hidden text}}"}</code>) instead of standard brackets like <code className="text-rose-400">[...]</code>.
                        </div>
                        <Textarea 
                          placeholder="e.g., Format these as clinical vignettes..."
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="resize-none h-20 font-mono text-xs bg-background/50"
                        />
                        <div className="flex justify-end">
                          <Button 
                            size="sm" 
                            onClick={() => { setFormatType('custom'); generatePreview(prompt, 'custom'); }}
                            disabled={!prompt.trim()}
                            className="bg-primary hover:bg-primary/90 text-white shadow-md cursor-pointer"
                          >
                            Preview Format
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Advanced Routing */}
                <div className="pt-2 border-t">
                  <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer w-full"
                  >
                    <Settings2 className="w-4 h-4" />
                    <span>Advanced Routing (Optional)</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground ml-auto transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 pb-2">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Target Deck</label>
                            <input 
                              type="text" 
                              value={targetDeck}
                              onChange={(e) => {
                                setTargetDeck(e.target.value);
                                setHasManuallyEditedDeck(true);
                              }}
                              placeholder="e.g. Atlas::Cardiology"
                              className="w-full h-9 px-3 rounded-xl bg-muted/40 border border-border/80 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Custom Tags</label>
                            <input 
                              type="text" 
                              value={customTags}
                              onChange={(e) => setCustomTags(e.target.value)}
                              placeholder="e.g. step1, incorrects"
                              className="w-full h-9 px-3 rounded-xl bg-muted/40 border border-border/80 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </motion.div>
            )}
            {(step === 'preview_loading' || step === 'preview_ready') && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <h3 className="text-sm font-semibold text-foreground flex items-center justify-between">
                  <span>Live Preview</span>
                  <Button variant="ghost" size="sm" onClick={() => setStep('select')} className="h-7 text-xs cursor-pointer">Change Format</Button>
                </h3>
                
                <div className="relative min-h-[150px] w-full rounded-xl border bg-muted/30 p-5 flex flex-col items-center justify-center">
                  {step === 'preview_loading' ? (
                     <div className="flex flex-col items-center gap-3 text-primary">
                       <RefreshCcw className="w-6 h-6 animate-spin" />
                       <span className="text-xs font-medium">Generating preview from your topmost rule...</span>
                     </div>
                  ) : previewCard ? (
                    <div className="w-full space-y-4">
                      <div className="bg-background rounded-lg p-4 border shadow-sm">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Front</div>
                        <div className="text-sm" dangerouslySetInnerHTML={{ __html: previewCard.front }} />
                      </div>
                      <div className="bg-background rounded-lg p-4 border shadow-sm relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                         <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-2 pl-2">Back</div>
                         <div className="text-sm pl-2" dangerouslySetInnerHTML={{ __html: previewCard.back }} />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="ghost" onClick={() => setStep('select')} className="cursor-pointer">Cancel</Button>
                  <Button 
                    onClick={handleStartGeneration} 
                    disabled={step === 'preview_loading'}
                    className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md cursor-pointer"
                  >
                    Looks good? Generate Full Deck
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'generating' && (
              <motion.div
                key="generating"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
              >
                <RefreshCcw className="w-10 h-10 text-primary animate-spin mb-6" />
                <h3 className="text-lg font-semibold mb-2">Synthesizing Deck...</h3>
                <p className="text-sm text-muted-foreground mb-8">
                  Processing your rules in intelligent batches to maintain high-yield formatting.
                </p>
                
                <div className="w-full max-w-sm space-y-2">
                  <div className="flex justify-between text-xs font-medium text-muted-foreground px-1">
                    <span>{progress.current} of {progress.total} rules</span>
                    <span>{Math.round((progress.current / Math.max(1, progress.total)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden shadow-inner relative">
                    <motion.div 
                      className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-primary to-primary/80 rounded-full"
                      initial={{ width: '5%' }}
                      animate={{ width: `${Math.max(5, (progress.current / Math.max(1, progress.total)) * 100)}%` }}
                      transition={{ ease: "linear", duration: 0.5 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center pt-4 pb-8 space-y-6"
              >
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold">Atlas Deck Ready</h3>
                  <p className="text-sm text-muted-foreground">
                    Successfully generated {generatedCards.length} highly optimized flashcards.
                    {failedCount > 0 && ` (${failedCount} rules skipped due to network errors).`}
                  </p>
                </div>

                <div 
                  className="mt-6 w-full max-w-xs relative group cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={handleDragStart}
                  onClick={async () => {
                    const subjectName = exportSubjectId !== 'all' ? subjects.find(s => String(s.id) === String(exportSubjectId))?.name || "AI" : "AI";
                    const filename = `Atlas_${subjectName.replace(/\s+/g, '_')}_Deck.txt`;
                    downloadAnkiTSV(generatedCards, filename, customTags, targetDeck);
                    if (onMarkExported && generatedCards.length > 0) {
                      const ids = targetMistakes.map(m => m.id).filter(id => id !== undefined);
                      await onMarkExported(ids as (string|number)[]);
                    }
                  }}
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                  <div className="relative flex items-center gap-4 bg-card border shadow-xl rounded-xl p-4 transition-transform group-hover:-translate-y-1 group-active:translate-y-0 group-active:shadow-md">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                      <FileBox className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{exportSubjectId !== 'all' ? `Atlas_${subjects.find(s => String(s.id) === String(exportSubjectId))?.name || 'AI'}_Deck.txt`.replace(/\s+/g, '_') : 'Atlas_AI_Deck.txt'}</div>
                      <div className="text-xs text-muted-foreground">TSV Format • {generatedCards.length} cards</div>
                    </div>
                    <GripVertical className="w-5 h-5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest pt-2">
                  {targetDeck.trim() ? "Import into Anki. Map Field 3 to Tags and Field 4 to Deck." : "Double-click the downloaded file to instantly open in Anki"}
                </p>

                <div className="absolute top-4 right-4">
                  <Button variant="ghost" size="sm" onClick={onClose} className="cursor-pointer">Close</Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
