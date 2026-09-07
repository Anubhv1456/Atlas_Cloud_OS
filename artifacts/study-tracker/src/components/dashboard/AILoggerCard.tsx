import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Brain, CheckCircle2, FileText, Check, Upload, X, Image as ImageIcon, Plus, Minus, Trash2, Calendar, ArrowRight } from 'lucide-react';
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleProcess = async () => {
    if (!selectedSubjectId) {
      alert("Please select a subject or Full-Syllabus Mock first.");
      return;
    }
    if (!text.trim() && !imageFile) return;

    setLoadingPhase(0);

    try {
      const apiKey = settings.geminiApiKey;
      if (!apiKey) {
        throw new Error("Gemini API key is missing. Please configure it in Settings.");
      }

      const isGt = selectedSubjectId === 'gt-full';
      const targetSubject = !isGt ? activeSubjects.find(s => String(s.id) === selectedSubjectId) : null;
      const targetSystem = (!isGt && selectedBlockId && selectedBlockId !== 'ad-hoc' && selectedBlockId !== 'full-syllabus') 
        ? activeSystems.find(s => String(s.id) === selectedBlockId) 
        : null;

      let contextDescription = '';
      let defaultTotal = 40;
      if (isGt) {
        contextDescription = 'Grand Test / Full-Syllabus Mock Exam (GT/NBME Comprehensive)';
        defaultTotal = 200;
      } else if (targetSystem) {
        contextDescription = `${targetSubject ? `${targetSubject.name} - ` : ''}${targetSystem.name} Study Block`;
        defaultTotal = 40;
      } else if (targetSubject) {
        contextDescription = `${targetSubject.name} General Practice`;
        defaultTotal = 50;
      } else {
        contextDescription = 'Study Practice Session';
      }

      const prompt = `You are a precision medical extractor. Analyze this text or screenshot of a test result/score report for ${contextDescription}.
CRITICAL: Extract only the metrics related to this specific test/session performance. Ignore lifetime or cumulative statistics.

Format your output STRICTLY as a JSON object matching this schema exactly:
{
  "score": 28,
  "total": ${defaultTotal},
  "mistakes": [
    "Detailed description of specific medical concept they got incorrect (e.g. 'Atrial Fibrillation anticoagulation guidelines')"
  ]
}
If max score is not mentioned, assume total is ${defaultTotal}.`;

      const parts: any[] = [{ text: prompt }];
      if (text.trim()) {
        parts.push({ text: `Input Data:\n${text}` });
      }
      if (imageFile) {
        const base64 = await fileToBase64(imageFile);
        parts.push({
          inlineData: {
            data: base64,
            mimeType: imageFile.type
          }
        });
      }

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

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
        ? result.mistakes.map((m: any, idx: number) => ({
            id: `mistake-${Date.now()}-${idx}`,
            concept: String(m).substring(0, 200),
            errorTag: defaultTag
          }))
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
        subjectName: targetSubject?.name || (isGt ? (isUsmle ? 'Full NBME Mock' : 'Full Grand Test') : 'Curriculum')
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
        title: isUsmle ? `Mock Exam: Full NBME Comprehensive` : `Grand Test: Full-Syllabus Mock (GT)`,
        score,
        total,
        percentage: scorePercent * 100,
        type: 'gt',
        timestamp: now,
        createdAt: now
      } as any);

      for (const m of mistakes) {
        await db.mistakeLogs.add({
          topic: m.concept,
          keyTakeaway: m.concept,
          tags: [m.errorTag],
          subjectId: 'general',
          systemId: 'gt',
          source: 'GT',
          errorType: 'concept',
          resolved: false,
          createdAt: now,
          updatedAt: now
        } as any);
      }

      setSuccessData({
        name: isUsmle ? 'Full NBME Comprehensive' : 'Full Grand Test (GT)',
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

      for (const m of mistakes) {
        await db.mistakeLogs.add({
          topic: m.concept,
          keyTakeaway: m.concept,
          tags: [m.errorTag],
          subjectId: targetSubject?.id || targetSystem.subjectId || 'general',
          systemId: targetSystem.id!,
          source: 'QBank',
          errorType: 'concept',
          resolved: false,
          createdAt: now,
          updatedAt: now
        } as any);
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

      for (const m of mistakes) {
        await db.mistakeLogs.add({
          topic: m.concept,
          keyTakeaway: m.concept,
          tags: [m.errorTag],
          subjectId: targetSubject?.id || 'general',
          source: 'QBank',
          errorType: 'concept',
          resolved: false,
          createdAt: now,
          updatedAt: now
        } as any);
      }

      setSuccessData({
        name: `${targetSubject?.name || 'Subject'} Practice Logged`,
        scoreText: `${score}/${total} (${Math.round(scorePercent * 100)}%)`,
        detailText: `${mistakes.length} mistakes saved to your notebook.`
      });
    }

    setStagedData(null);
    setText('');
    removeImage();
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
      <div className="bg-card border border-primary/30 shadow-lg rounded-2xl p-6 sm:p-7 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300 relative overflow-hidden">
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

          {/* Interactive Score Stepper Pill */}
          <div className="flex items-center gap-2 bg-muted/40 border border-border/60 p-2 rounded-2xl shrink-0 self-start sm:self-auto">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setStagedData(prev => prev ? { ...prev, score: Math.max(0, prev.score - 1) } : null)}
                className="w-7 h-7 rounded-lg bg-background border border-border/70 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
                title="Decrease score"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <div className="px-2.5 py-0.5 text-center min-w-[54px]">
                <div className="text-base font-bold font-mono text-foreground leading-tight">
                  {stagedData.score}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">Score</div>
              </div>
              <button
                type="button"
                onClick={() => setStagedData(prev => prev ? { ...prev, score: Math.min(prev.total, prev.score + 1) } : null)}
                className="w-7 h-7 rounded-lg bg-background border border-border/70 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
                title="Increase score"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-muted-foreground/50 text-sm font-light">/</div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setStagedData(prev => prev ? { ...prev, total: Math.max(1, prev.total - 1) } : null)}
                className="w-7 h-7 rounded-lg bg-background border border-border/70 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
                title="Decrease total questions"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <div className="px-2 py-0.5 text-center min-w-[44px]">
                <div className="text-base font-bold font-mono text-foreground leading-tight">
                  {stagedData.total}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">Total</div>
              </div>
              <button
                type="button"
                onClick={() => setStagedData(prev => prev ? { ...prev, total: prev.total + 1 } : null)}
                className="w-7 h-7 rounded-lg bg-background border border-border/70 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
                title="Increase total questions"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className={cn(
              "ml-1 px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold shrink-0 border",
              scorePct >= 70
                ? "bg-emerald-950/20 text-emerald-400 dark:text-emerald-400 border-white/5 border-l-2 border-l-emerald-500/30"
                : scorePct >= 50
                ? "bg-amber-950/20 text-amber-400 dark:text-amber-400 border-white/5 border-l-2 border-l-amber-500/30"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
            )}>
              {scorePct}%
            </div>
          </div>
        </div>

        {/* Mistakes Section */}
        <div className="py-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-foreground">
              {isUsmle ? "Extracted Missed Questions" : "Extracted Mistakes"} ({stagedData.mistakes.length})
            </span>
            <span>Tap tag to classify error</span>
          </div>

          {stagedData.mistakes.length === 0 ? (
            <div className="p-4 rounded-xl bg-muted/20 border border-border/40 text-center text-xs text-muted-foreground">
              No specific mistakes detected in this report. Your overall score and mastery will be logged.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {stagedData.mistakes.map((mistake) => (
                <div
                  key={mistake.id}
                  className="p-3 rounded-xl bg-muted/20 border border-border/60 hover:border-border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStagedData(prev => prev ? {
                          ...prev,
                          mistakes: prev.mistakes.filter(m => m.id !== mistake.id)
                        } : null);
                      }}
                      className="p-1 rounded-md text-muted-foreground/70 hover:text-rose-500 hover:bg-rose-500/10 transition-colors mt-0.5 cursor-pointer"
                      title="Remove this mistake"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs sm:text-sm font-medium text-foreground leading-snug">
                      {mistake.concept}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap shrink-0 pl-6 sm:pl-0">
                    {errorTags.map((tag) => {
                      const isSelected = mistake.errorTag === tag.id;
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            setStagedData(prev => prev ? {
                              ...prev,
                              mistakes: prev.mistakes.map(m => m.id === mistake.id ? { ...m, errorTag: tag.id } : m)
                            } : null);
                          }}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer select-none active:scale-95",
                            isSelected
                              ? cn(tag.color, "ring-2 ring-primary/20 shadow-xs font-bold")
                              : "bg-background/60 hover:bg-background text-muted-foreground border-border/50"
                          )}
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
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
              setStagedData(null);
            }}
            className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground rounded-xl cursor-pointer"
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
      <div className="bg-card border border-border/40 rounded-2xl p-8 mb-8 flex flex-col items-center justify-center text-center shadow-sm animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-emerald-950/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-white/5 border-l-2 border-l-emerald-500/30 shadow-inner">
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
                  <span className="text-xs font-bold text-emerald-400 dark:text-emerald-400 bg-emerald-950/20 border border-white/5 border-l-2 border-l-emerald-500/30 px-2 py-0.5 rounded-md shrink-0">
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
        "bg-card/50 backdrop-blur-xl border rounded-2xl p-6 sm:p-8 mb-8 transition-all duration-300 relative overflow-hidden",
        isDragging ? "border-primary bg-primary/5 shadow-lg scale-[1.01]" : "border-border/50 shadow-sm hover:shadow-md"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFile(e.dataTransfer.files[0]);
        }
      }}
    >
      <div className="flex items-start sm:items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center text-emerald-400 border border-white/5 border-l-2 border-l-emerald-500/30 shadow-inner flex-shrink-0">
          <Brain className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">Log Study Session</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Select a subject, choose a study block, then paste text or drop a screenshot of your score report.</p>
        </div>
      </div>

      <AdaptiveLoggerSelector 
        subjectId={selectedSubjectId} 
        onSubjectChange={setSelectedSubjectId}
        blockId={selectedBlockId} 
        onBlockChange={setSelectedBlockId}
      />

      <div className={cn(
        "relative mb-6 rounded-xl border-2 border-dashed transition-colors duration-200 overflow-hidden group bg-muted/10",
        imagePreview ? "border-transparent" : "border-border/60 hover:border-primary/40",
        isDragging && "border-primary/70 bg-primary/5"
      )}>
        {imagePreview ? (
          <div className="relative w-full h-48 bg-black/5 flex items-center justify-center">
            <img src={imagePreview} alt="Screenshot preview" className="h-full object-contain mix-blend-luminosity opacity-90 transition-opacity hover:opacity-100" />
            <button 
              onClick={removeImage}
              className="absolute top-3 right-3 p-2 bg-background/90 backdrop-blur-md rounded-full text-muted-foreground hover:text-foreground border border-border/50 shadow-sm hover:scale-105 transition-transform"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="absolute top-4 left-4 text-muted-foreground/40 group-focus-within:text-primary/50 transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <Textarea 
              value={text} 
              onChange={e => setText(e.target.value)}
              onPaste={(e) => {
                if (e.clipboardData.files && e.clipboardData.files.length > 0) {
                  handleFile(e.clipboardData.files[0]);
                }
              }}
              placeholder="Paste text or `Ctrl+V` a screenshot... (e.g. Cardiology: 28/40)"
              className="min-h-[140px] font-mono text-sm pl-12 pt-4 pb-4 pr-4 border-0 bg-transparent resize-none focus-visible:ring-0 placeholder:text-muted-foreground/50 shadow-none"
            />
          </>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-auto">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          />
          {!imagePreview && (
            <Button 
              variant="outline" 
              className="w-full sm:w-auto text-muted-foreground hover:text-foreground border-border/60 rounded-xl h-10 px-4 bg-background/50"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Upload Image
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          {loadingPhase >= 0 && (
            <span className="text-xs text-primary/80 animate-pulse font-medium whitespace-nowrap">
              {loadingMessages[Math.min(loadingPhase, loadingMessages.length - 1)]}
            </span>
          )}
          <Button 
            onClick={handleProcess} 
            disabled={loadingPhase >= 0 || !selectedSubjectId || (!text.trim() && !imageFile)} 
            className="w-full sm:w-auto gap-2 rounded-xl shadow-md h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 disabled:bg-emerald-600"
          >
            {loadingPhase >= 0 ? <Brain className="w-4 h-4 animate-pulse" /> : <Sparkles className="w-4 h-4" />}
            Parse & Log
          </Button>
        </div>
      </div>
      
      {isDragging && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-2xl pointer-events-none">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-primary animate-bounce" />
          </div>
          <p className="text-lg font-semibold text-foreground">Drop screenshot to parse</p>
          <p className="text-sm text-muted-foreground">Release to upload the image instantly</p>
        </div>
      )}
    </div>
  );
}
