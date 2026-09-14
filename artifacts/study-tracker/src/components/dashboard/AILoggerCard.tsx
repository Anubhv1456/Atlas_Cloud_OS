import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Brain, CheckCircle2, FileText, Check, Upload, X, Image as ImageIcon, Plus, Minus, Trash2, Calendar, ArrowRight, BookOpen } from 'lucide-react';
import { db } from '@/db';
import { useAISettings } from '@/lib/ai/aiSettingsStorage';
import { calibrateSystemSDSR } from '@/lib/sdsr-engine';
import { cn } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { useExamProfile } from '@/hooks/useExamProfile';
import { AdaptiveLoggerSelector } from './AdaptiveLoggerSelector';

interface StagedMistake {
  id: string;
  concept: string;
  errorTag: string;
  sourceReference?: string;
}

interface StagedData {
  score: number;
  total: number;
  mistakes: StagedMistake[];
  isGt: boolean;
  targetSubject: any;
  targetSystem: any;
  defaultTotal: number;
  calculatedOptimalDays: number;
  intervalChoice: 'soon' | 'optimal' | 'extended';
  subjectName: string;
}

export function AILoggerCard() {
  const { settings } = useAISettings();
  const { profile } = useExamProfile();
  const isUsmle = Boolean(profile.targetExam && (profile.targetExam.includes('USMLE') || profile.targetExam.includes('Step')));

  const [text, setText] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Subject-first state hierarchy
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('ad-hoc');
  
  const [loadingPhase, setLoadingPhase] = useState<number>(-1);
  const [stagedData, setStagedData] = useState<StagedData | null>(null);
  const [successData, setSuccessData] = useState<{ 
    name: string; 
    oldDate?: string; 
    newDate?: string;
    scoreText?: string;
    detailText?: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSystems = useLiveQuery(() => db.systems.filter(s => !s.deletedAt).toArray(), []) || [];
  const activeSubjects = useLiveQuery(() => db.subjects.filter(s => !s.deletedAt).toArray(), []) || [];

  const loadingMessages = [
    "Extracting metrics & mistakes...",
    "Calibrating decay intervals...",
    "Updating schedule..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loadingPhase >= 0 && loadingPhase < loadingMessages.length - 1) {
      interval = setTimeout(() => {
        setLoadingPhase(p => p + 1);
      }, 1200);
    }
    return () => clearTimeout(interval);
  }, [loadingPhase]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve((e.target?.result as string).split(',')[1]);
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl.split(',')[1]);
        };
        img.onerror = () => reject(new Error("Failed to process image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (validFiles.length > 0) {
      setImageFiles(prev => {
        const newTotal = prev.length + validFiles.length;
        if (newTotal > 10) {
          alert('Maximum 10 images allowed per batch to ensure accurate processing.');
        }
        return [...prev, ...validFiles].slice(0, 10);
      });
      
      setImagePreviews(prev => {
        const urls = validFiles.map(f => URL.createObjectURL(f));
        const combined = [...prev, ...urls];
        // Cleanup URLs that got sliced off
        if (combined.length > 10) {
          const removed = combined.slice(10);
          removed.forEach(url => URL.revokeObjectURL(url));
        }
        return combined.slice(0, 10);
      });
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleProcess = async () => {
    if (!text.trim() && imageFiles.length === 0) return;

    setLoadingPhase(0);

    try {
      const apiKey = settings.geminiApiKey;
      if (!apiKey) {
        throw new Error("Gemini API key is missing. Please configure it in Settings.");
      }

      const isGt = selectedSubjectId === 'gt-full';
      const targetSubject = !isGt && selectedSubjectId ? activeSubjects.find(s => String(s.id) === selectedSubjectId) : null;
      const targetSystem = (!isGt && selectedBlockId && selectedBlockId !== 'ad-hoc' && selectedBlockId !== 'full-syllabus') 
        ? activeSystems.find(s => String(s.id) === selectedBlockId) 
        : null;

      let contextDescription = '';
      let defaultTotal = 40;
      if (isGt) {
        contextDescription = 'Grand Test / Full-Syllabus Mock Exam (Comprehensive Assessment)';
        defaultTotal = 200;
      } else if (targetSystem) {
        contextDescription = `${targetSubject ? `${targetSubject.name} - ` : ''}${targetSystem.name} Study Block`;
        defaultTotal = 40;
      } else if (targetSubject) {
        contextDescription = `${targetSubject.name} General Practice`;
        defaultTotal = 50;
      } else {
        contextDescription = 'Uncategorized Practice Session. Auto-detect the most likely medical subject based on the content (e.g. "Cardiology", "Neurology"). If there are multiple disparate subjects, classify as "Grand Test".';
        defaultTotal = 40;
      }

      const prompt = `You are a precision medical extractor. Analyze this text or screenshot of a test result/score report for ${contextDescription}.
CRITICAL: Extract only the metrics related to this specific test/session performance. Ignore lifetime or cumulative statistics.

Format your output STRICTLY as a JSON object matching this schema exactly:
{
  "score": 28,
  "total": ${defaultTotal},
  "detectedSubject": "String. If a specific subject or context isn't explicitly provided, infer the medical subject (e.g. 'Cardiology', 'Neurology', 'Pathology'). Use 'Grand Test' if it mixes many subjects.",
  "mistakes": [
    {
      "concept": "Detailed description of specific medical concept they got incorrect (e.g. 'Atrial Fibrillation anticoagulation guidelines')",
      "sourceReference": "If a Question ID or specific source reference is visible (e.g. 'UWorld QID 12345', 'NBME 29', 'Amboss Q45'), extract it here. Otherwise, null."
    }
  ]
}
If max score is not mentioned, assume total is ${defaultTotal}. Keep concepts concise to avoid truncation.`;

      const parts: any[] = [{ text: prompt }];
      if (text.trim()) {
        parts.push({ text: `Input Data:\n${text}` });
      }
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const base64 = await fileToBase64(file);
          parts.push({
            inlineData: {
              data: base64,
              mimeType: file.type
            }
          });
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      let res;
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            generationConfig: { responseMimeType: 'application/json' }
          }),
          signal: controller.signal
        });
      } catch (e: any) {
        if (e.name === 'AbortError') {
          throw new Error("Atlas is taking too long to analyze this batch. Try uploading fewer images.");
        }
        throw e;
      } finally {
        clearTimeout(timeoutId);
      }

      if (!res.ok) throw new Error("Failed to reach Gemini API");

      const data = await res.json();
      let result;
      try {
        const textContent = data.candidates[0].content.parts[0].text;
        result = JSON.parse(textContent.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim());
      } catch (e) {
        throw new Error("Failed to parse AI output into JSON");
      }

      const now = new Date();
      const scoreNum = Number(result.score) || 0;
      const totalNum = Number(result.total) || defaultTotal;
      const scorePercent = totalNum > 0 ? scoreNum / totalNum : 0;

      let calculatedOptimalDays = 12;
      if (targetSystem) {
        const previewUpdate = calibrateSystemSDSR(targetSystem, scorePercent, targetSubject?.name || 'General', 0.70, now);
        if (previewUpdate.nextRevisionDate) {
          const diffMs = new Date(previewUpdate.nextRevisionDate).getTime() - now.getTime();
          calculatedOptimalDays = Math.max(2, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        }
      } else if (isGt) {
        calculatedOptimalDays = 14;
      } else {
        calculatedOptimalDays = 10;
      }

      const defaultTag = isUsmle ? 'mechanism' : 'silly';
      const stagedMistakes: StagedMistake[] = (result.mistakes && Array.isArray(result.mistakes))
        ? result.mistakes.map((m: any, idx: number) => {
            const conceptText = typeof m === 'string' ? m : (m.concept || '');
            const sourceRef = typeof m === 'object' && m.sourceReference ? m.sourceReference : undefined;
            return {
              id: `mistake-${Date.now()}-${idx}`,
              concept: String(conceptText).substring(0, 200),
              errorTag: defaultTag,
              sourceReference: sourceRef
            };
          })
        : [];

      setStagedData({
        score: scoreNum,
        total: totalNum,
        mistakes: stagedMistakes,
        isGt,
        targetSubject,
        targetSystem,
        defaultTotal,
        calculatedOptimalDays,
        intervalChoice: 'optimal',
        subjectName: targetSubject?.name || (isGt ? (isUsmle ? 'Full Mock Assessment' : 'Full Grand Test') : (result.detectedSubject || 'Curriculum'))
      });

    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Error processing AI log");
    } finally {
      setLoadingPhase(-1);
    }
  };

  const handleCommitStaged = async () => {
    if (!stagedData) return;
    const { score, total, mistakes, isGt, targetSubject, targetSystem, calculatedOptimalDays, intervalChoice } = stagedData;
    const scorePercent = total > 0 ? score / total : 0;
    const now = new Date();

    let finalDays = calculatedOptimalDays;
    if (intervalChoice === 'soon') {
      finalDays = Math.max(isUsmle ? 3 : 2, Math.round(calculatedOptimalDays * 0.5));
    } else if (intervalChoice === 'extended') {
      finalDays = Math.max(finalDays + 2, Math.round(calculatedOptimalDays * 1.6));
    }

    const calculatedNextDate = new Date(now.getTime() + finalDays * 24 * 60 * 60 * 1000);

    if (isGt) {
      await db.scoreLogs.add({
        title: isUsmle ? `Mock Exam: Full Comprehensive Assessment` : `Grand Test: Full-Syllabus Mock (GT)`,
        score,
        total,
        percentage: scorePercent * 100,
        type: 'gt',
        timestamp: now,
        createdAt: now
      } as any);

      if (mistakes.length > 0) {
        const mistakeEntries = mistakes.map(m => ({
          topic: m.concept,
          keyTakeaway: m.concept,
          tags: [m.errorTag],
          subjectId: 'general',
          systemId: 'gt',
          source: 'GT',
          sourceReference: m.sourceReference,
          errorType: 'concept',
          resolved: false,
          createdAt: now,
          updatedAt: now
        } as any));
        await db.mistakeLogs.bulkAdd(mistakeEntries);
      }

      setSuccessData({
        name: isUsmle ? 'Full Comprehensive Assessment' : 'Full Grand Test (GT)',
        scoreText: `${score}/${total} (${Math.round(scorePercent * 100)}%)`,
        detailText: `${mistakes.length} mistakes saved to your error notebook.`
      });
    } else if (targetSystem) {
      const updated = calibrateSystemSDSR(targetSystem, scorePercent, targetSubject?.name || 'General', 0.70, now);
      updated.nextRevisionDate = calculatedNextDate;
      await db.systems.update(targetSystem.id!, updated);

      await db.scoreLogs.add({
        title: `${targetSubject?.name ? `${targetSubject.name} - ` : ''}${targetSystem.name}`,
        score,
        total,
        percentage: scorePercent * 100,
        type: 'qbank',
        subjectId: targetSubject?.id || targetSystem.subjectId,
        systemId: targetSystem.id,
        timestamp: now,
        createdAt: now
      } as any);

      if (mistakes.length > 0) {
        const mistakeEntries = mistakes.map(m => ({
          topic: m.concept,
          keyTakeaway: m.concept,
          tags: [m.errorTag],
          subjectId: targetSubject?.id || targetSystem.subjectId || 'general',
          systemId: targetSystem.id!,
          source: 'QBank',
          sourceReference: m.sourceReference,
          errorType: 'concept',
          resolved: false,
          createdAt: now,
          updatedAt: now
        } as any));
        await db.mistakeLogs.bulkAdd(mistakeEntries);
      }

      const oldDate = targetSystem.nextRevisionDate 
        ? new Date(targetSystem.nextRevisionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) 
        : 'None';
      const newDate = calculatedNextDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

      setSuccessData({
        name: `${targetSubject?.name ? `${targetSubject.name}: ` : ''}${targetSystem.name}`,
        oldDate,
        newDate,
        scoreText: `${score}/${total} (${Math.round(scorePercent * 100)}%)`,
        detailText: `Review scheduled in ${finalDays} days.`
      });
    } else {
      await db.scoreLogs.add({
        title: `${targetSubject?.name || 'Subject'} Practice`,
        score,
        total,
        percentage: scorePercent * 100,
        type: 'qbank',
        subjectId: targetSubject?.id,
        timestamp: now,
        createdAt: now
      } as any);

      if (mistakes.length > 0) {
        const mistakeEntries = mistakes.map(m => ({
          topic: m.concept,
          keyTakeaway: m.concept,
          tags: [m.errorTag],
          subjectId: targetSubject?.id || 'general',
          source: 'QBank',
          sourceReference: m.sourceReference,
          errorType: 'concept',
          resolved: false,
          createdAt: now,
          updatedAt: now
        } as any));
        await db.mistakeLogs.bulkAdd(mistakeEntries);
      }

      setSuccessData({
        name: `${targetSubject?.name || 'Subject'} Practice Logged`,
        scoreText: `${score}/${total} (${Math.round(scorePercent * 100)}%)`,
        detailText: `${mistakes.length} mistakes saved to your notebook.`
      });
    }

    setStagedData(null);
    setText('');
    setImageFiles([]);
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setImagePreviews([]);
    setSelectedSubjectId('');
    setSelectedBlockId('ad-hoc');

    setTimeout(() => {
      setSuccessData(null);
    }, 4500);
  };

  if (stagedData) {
    const errorTags = isUsmle ? [
      { id: 'mechanism', label: '🧬 Missed Mechanism', color: 'bg-amber-950/20 text-amber-400 dark:text-amber-400 border-amber-500/30' },
      { id: 'distractor', label: '🎯 Distractor Trap', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' },
      { id: 'graph', label: '📊 Graph/Table Trap', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' },
      { id: 'timing', label: '⏳ Next Best Step', color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30' },
    ] : [
      { id: 'silly', label: '⚡ Silly Mistake', color: 'bg-amber-950/20 text-amber-400 dark:text-amber-400 border-amber-500/30' },
      { id: 'fact', label: '🧠 Forgot Fact', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' },
      { id: 'image', label: '🖼️ Image/ECG Trap', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' },
      { id: 'guess', label: '🔄 50-50 Guess', color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30' },
    ];
    const soonDays = Math.max(isUsmle ? 3 : 2, Math.round(stagedData.calculatedOptimalDays * 0.5));
    const optDays = stagedData.calculatedOptimalDays;
    const extDays = Math.round(stagedData.calculatedOptimalDays * 1.6);
    const scorePct = stagedData.total > 0 ? Math.round((stagedData.score / stagedData.total) * 100) : 0;

    return (
      <div className="bg-card border border-primary/30 shadow-lg rounded-xl p-6 sm:p-7 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300 relative overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/50">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800/40 border border-white/5 text-primary text-xs font-semibold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isUsmle ? "Review Your Block" : "Quick Check"}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {stagedData.subjectName}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {isUsmle
                ? "Double-check your score and mark what tripped you up."
                : "We spotted your score and mistakes. Tap an error tag so your future review targets the right gap."}
            </p>
          </div>

          {/* Interactive Score Input Pill */}
          <div className="flex items-center gap-1.5 bg-muted/40 border border-border/60 p-1.5 rounded-xl shrink-0 self-start sm:self-auto">
            <div className="flex items-center text-center">
              <input
                type="number"
                value={stagedData.score}
                onChange={(e) => setStagedData(prev => prev ? { ...prev, score: Math.max(0, parseInt(e.target.value) || 0) } : null)}
                className="w-12 h-9 text-center bg-background border border-border/70 rounded-lg text-base font-bold font-mono text-foreground focus:ring-2 focus:ring-primary/50 outline-none"
                title="Score"
              />
            </div>

            <div className="text-muted-foreground/50 text-xl font-light">/</div>

            <div className="flex items-center text-center">
              <input
                type="number"
                value={stagedData.total}
                onChange={(e) => setStagedData(prev => prev ? { ...prev, total: Math.max(1, parseInt(e.target.value) || 1) } : null)}
                className="w-12 h-9 text-center bg-background border border-border/70 rounded-lg text-base font-bold font-mono text-foreground focus:ring-2 focus:ring-primary/50 outline-none"
                title="Total"
              />
            </div>

            <div className={cn(
              "ml-2 px-2.5 py-1 rounded-lg font-mono text-xs font-bold shrink-0 border",
              scorePct >= 70
                ? "bg-emerald-950/20 text-emerald-400 dark:text-emerald-400 border-white/5"
                : scorePct >= 50
                ? "bg-amber-950/20 text-amber-400 dark:text-amber-400 border-white/5"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
            )}>
              {scorePct}%
            </div>
          </div>
        </div>

        {/* Unified Main Content Area */}
        <div className="py-4 grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 items-start">
          
          {/* Left Column: Image Thumbnails */}
          {imagePreviews.length > 0 && (
            <div className="space-y-3 shrink-0">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Source Material</h4>
              <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                {imagePreviews.map((url, idx) => (
                  <div key={idx} className="relative w-24 h-24 lg:w-full lg:h-auto border border-border/40 rounded-xl overflow-hidden bg-black/5 shadow-sm shrink-0">
                    <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover lg:object-contain mix-blend-luminosity opacity-90 transition-opacity hover:opacity-100" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right Column: Mistakes Section */}
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider text-foreground">
                {isUsmle ? "Extracted Missed Questions" : "Extracted Mistakes"} ({stagedData.mistakes.length})
              </span>
            </div>

            {stagedData.mistakes.length === 0 ? (
              <div className="p-4 rounded-xl bg-muted/20 border border-border/40 text-center text-xs text-muted-foreground">
                No specific mistakes detected in this report. Your overall score and mastery will be logged.
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {stagedData.mistakes.map((mistake) => (
                  <div
                    key={mistake.id}
                    className="p-3 rounded-xl bg-muted/20 border border-border/60 hover:border-border transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-start gap-2 min-w-0 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          setStagedData(prev => prev ? {
                            ...prev,
                            mistakes: prev.mistakes.filter(m => m.id !== mistake.id)
                          } : null);
                        }}
                        className="p-1 rounded-md text-muted-foreground/70 hover:text-rose-500 hover:bg-rose-500/10 transition-colors mt-0.5 cursor-pointer shrink-0"
                        title="Remove this mistake"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <span className="text-xs sm:text-sm font-medium text-foreground leading-snug">
                          {mistake.concept}
                        </span>
                        {mistake.sourceReference && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground border border-border/40 bg-background/50 px-1.5 py-0.5 rounded w-fit mt-1">
                            <BookOpen className="w-2.5 h-2.5" />
                            {mistake.sourceReference}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center pl-7">
                      <div className="relative">
                        <select
                          value={mistake.errorTag}
                          onChange={(e) => {
                            setStagedData(prev => prev ? {
                              ...prev,
                              mistakes: prev.mistakes.map(m => m.id === mistake.id ? { ...m, errorTag: e.target.value } : m)
                            } : null);
                          }}
                          className={cn(
                            "appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer outline-none",
                            errorTags.find(t => t.id === mistake.errorTag)?.color || "bg-muted text-foreground border-border/50"
                          )}
                        >
                          {errorTags.map(tag => (
                            <option key={tag.id} value={tag.id} className="bg-background text-foreground font-medium">
                              {tag.label}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-70">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SDSR Spacing Choice */}
        <div className="pt-3 pb-4 border-t border-border/50 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            {isUsmle
              ? `${stagedData.subjectName} concepts stick longer once understood. Choose your review pace:`
              : `${stagedData.subjectName} topics fade quickly without review. Choose your review pace:`}
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'soon' as const, days: soonDays, title: "Review Soon" },
              { key: 'optimal' as const, days: optDays, title: "Recommended" },
              { key: 'extended' as const, days: extDays, title: isUsmle ? "Solid Mastery" : "Know This Well" },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStagedData(prev => prev ? { ...prev, intervalChoice: opt.key } : null)}
                className={cn(
                  "p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 active:scale-95",
                  stagedData.intervalChoice === opt.key
                    ? "bg-primary/15 border-primary/50 text-primary ring-2 ring-primary/20 font-bold"
                    : "bg-muted/20 border-border/60 hover:bg-muted/40 text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                  <Calendar className="w-3 h-3 text-primary" />
                  <span>{opt.days} Days</span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate">{opt.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/50">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (window.confirm("Are you sure you want to discard these extracted mistakes? This cannot be undone.")) {
                setStagedData(null);
              }
            }}
            className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground hover:bg-rose-500/10 hover:text-rose-500 rounded-xl cursor-pointer transition-colors"
          >
            Discard & Re-upload
          </Button>

          <Button
            type="button"
            onClick={handleCommitStaged}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
          >
            <span>{isUsmle ? "Log Block & Save" : "Save & Update Schedule"}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (successData) {
    return (
      <div className="bg-card border border-border/40 rounded-xl p-8 mb-8 flex flex-col items-center justify-center text-center shadow-sm animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-emerald-950/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-white/5">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold tracking-tight mb-1 text-foreground">Study Session Logged</h3>
        <p className="text-muted-foreground mb-5 text-sm">Performance metrics and mistake concepts successfully recorded.</p>
        
        <div className="w-full max-w-lg space-y-3 text-sm text-left bg-muted/30 p-4 rounded-xl border border-border/50">
          <div className="flex items-start gap-3">
            <div className="mt-0.5"><Check className="w-4 h-4 text-emerald-400" /></div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground">{successData.name}</p>
                {successData.scoreText && (
                  <span className="text-xs font-bold text-emerald-400 dark:text-emerald-400 bg-emerald-950/20 border border-white/5 px-2 py-0.5 rounded-md shrink-0">
                    {successData.scoreText}
                  </span>
                )}
              </div>
              {successData.oldDate && successData.newDate ? (
                <p className="text-muted-foreground text-xs mt-1">
                  Decay calibrated. Next revision: <span className="line-through opacity-70 mr-1">{successData.oldDate}</span> 
                  <span className="font-semibold text-emerald-400 dark:text-emerald-400">➔ {successData.newDate}</span>
                </p>
              ) : (
                <p className="text-muted-foreground text-xs mt-1">
                  {successData.detailText || 'Performance successfully recorded.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-2 mb-8 transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-md focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10",
        isDragging && "border-primary ring-4 ring-primary/20 bg-primary/5 shadow-lg scale-[1.01]"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFiles(e.dataTransfer.files);
        }
      }}
    >
      <div className="flex items-center gap-3 w-full pl-3 pr-2 py-1">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center text-emerald-400 shrink-0">
          <Brain className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0 flex items-center">
          <input
            value={text} 
            onChange={e => setText(e.target.value)}
            onPaste={(e) => {
              if (e.clipboardData.files && e.clipboardData.files.length > 0) {
                handleFiles(e.clipboardData.files);
              }
            }}
            placeholder="Log a session, GT score, or drop screenshots here..."
            className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/60 border-none outline-none focus:ring-0 px-2"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <input 
            type="file" 
            accept="image/*" 
            multiple
            className="hidden" 
            ref={fileInputRef} 
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors cursor-pointer"
            title="Attach Screenshot"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          
          <Button 
            onClick={handleProcess} 
            disabled={loadingPhase >= 0 || (!text.trim() && imageFiles.length === 0)} 
            className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 transition-colors disabled:opacity-50 disabled:bg-emerald-600 cursor-pointer ml-1 shadow-sm"
          >
            {loadingPhase >= 0 ? <Brain className="w-4 h-4 animate-pulse" /> : <Sparkles className="w-4 h-4" />}
            <span className="hidden sm:inline">{loadingPhase >= 0 ? 'Analyzing...' : 'Analyze'}</span>
          </Button>
        </div>
      </div>

      {/* Expanded Area for Selection & Preview */}
      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        (text.trim() || imageFiles.length > 0 || isDragging) ? "grid-rows-[1fr] mt-3 pt-3 border-t border-border/40" : "grid-rows-[0fr]"
      )}>
        <div className="overflow-hidden">
          <div className="px-3 pb-3 space-y-4">
            
            <div className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between pl-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Context Routing (Optional)
                </label>
                <span className="text-[10px] text-muted-foreground/60 italic">Leave empty to auto-detect</span>
              </div>
              <AdaptiveLoggerSelector 
                subjectId={selectedSubjectId} 
                onSubjectChange={setSelectedSubjectId}
                blockId={selectedBlockId} 
                onBlockChange={setSelectedBlockId}
              />
            </div>

            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {imagePreviews.map((url, idx) => (
                  <div key={idx} className="relative inline-block border border-border/40 rounded-xl overflow-hidden bg-black/5 shadow-sm">
                    <img src={url} alt={`Screenshot preview ${idx}`} className="h-32 object-contain mix-blend-luminosity opacity-90 transition-opacity hover:opacity-100" />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-background/90 backdrop-blur-md rounded-full text-muted-foreground hover:text-foreground border border-border/50 shadow-sm hover:scale-105 transition-transform cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isDragging && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center z-50 rounded-2xl pointer-events-none border-2 border-dashed border-primary">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-primary animate-bounce" />
          </div>
          <p className="text-lg font-bold text-foreground tracking-tight">Drop screenshot to parse</p>
          <p className="text-sm text-muted-foreground font-medium">Atlas will analyze metrics and mistakes instantly</p>
        </div>
      )}
    </div>
  );
}
