import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Brain, CheckCircle2, FileText, Check, Upload, X, Image as ImageIcon } from 'lucide-react';
import { db } from '@/db';
import { useAISettings } from '@/lib/ai/aiSettingsStorage';
import { calibrateSystemSDSR } from '@/lib/sdsr-engine';
import { cn } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { AdaptiveLoggerSelector } from './AdaptiveLoggerSelector';

export function AILoggerCard() {
  const { settings } = useAISettings();
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Subject-first state hierarchy
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('ad-hoc');
  
  const [loadingPhase, setLoadingPhase] = useState<number>(-1);
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

      // 1. Full-Syllabus Mock (GT / NBME)
      if (isGt) {
        await db.scoreLogs.add({
          title: `AI Log: Full-Syllabus Mock (GT / NBME)`,
          score: scoreNum,
          total: totalNum,
          percentage: scorePercent * 100,
          type: 'gt',
          timestamp: now,
          createdAt: now
        } as any);

        if (result.mistakes && Array.isArray(result.mistakes)) {
          for (const mistake of result.mistakes) {
            await db.mistakeLogs.add({
              topic: String(mistake).substring(0, 200),
              subjectId: 'general',
              systemId: 'gt',
              source: 'GT',
              errorType: 'concept',
              createdAt: now,
              updatedAt: now
            } as any);
          }
        }

        setSuccessData({
          name: 'Full-Syllabus Mock (GT / NBME)',
          scoreText: `${scoreNum}/${totalNum} (${Math.round(scorePercent * 100)}%)`,
          detailText: `Full curriculum mock logged. ${result.mistakes?.length || 0} concept mistakes routed to Recovery Queue.`
        });

      // 2. Specific Study Block / System in Subject
      } else if (targetSystem) {
        const updated = calibrateSystemSDSR(targetSystem, scorePercent, targetSubject?.name || 'General', 0.70, now);
        await db.systems.update(targetSystem.id!, updated);

        await db.scoreLogs.add({
          title: `AI Log: ${targetSubject?.name ? `${targetSubject.name} - ` : ''}${targetSystem.name}`,
          score: scoreNum,
          total: totalNum,
          percentage: scorePercent * 100,
          type: 'qbank',
          subjectId: targetSubject?.id || targetSystem.subjectId,
          systemId: targetSystem.id,
          timestamp: now,
          createdAt: now
        } as any);

        if (result.mistakes && Array.isArray(result.mistakes)) {
          for (const mistake of result.mistakes) {
            await db.mistakeLogs.add({
              topic: String(mistake).substring(0, 200),
              subjectId: targetSubject?.id || targetSystem.subjectId || 'general',
              systemId: targetSystem.id!,
              source: 'QBank',
              errorType: 'concept',
              createdAt: now,
              updatedAt: now
            } as any);
          }
        }

        const oldDate = targetSystem.nextRevisionDate 
          ? new Date(targetSystem.nextRevisionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) 
          : 'None';
        const newDate = updated.nextRevisionDate 
          ? new Date(updated.nextRevisionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) 
          : 'None';

        setSuccessData({
          name: `${targetSubject?.name ? `${targetSubject.name}: ` : ''}${targetSystem.name}`,
          oldDate,
          newDate,
          scoreText: `${scoreNum}/${totalNum} (${Math.round(scorePercent * 100)}%)`,
          detailText: `SDSR decay calibrated. Next revision scheduled.`
        });

      // 3. General Subject Practice (Uncategorized)
      } else {
        await db.scoreLogs.add({
          title: `AI Log: ${targetSubject?.name || 'Subject'} Practice`,
          score: scoreNum,
          total: totalNum,
          percentage: scorePercent * 100,
          type: 'qbank',
          subjectId: targetSubject?.id,
          timestamp: now,
          createdAt: now
        } as any);

        if (result.mistakes && Array.isArray(result.mistakes)) {
          for (const mistake of result.mistakes) {
            await db.mistakeLogs.add({
              topic: String(mistake).substring(0, 200),
              subjectId: targetSubject?.id || 'general',
              source: 'QBank',
              errorType: 'concept',
              createdAt: now,
              updatedAt: now
            } as any);
          }
        }

        setSuccessData({
          name: `${targetSubject?.name || 'Subject'} Practice Logged`,
          scoreText: `${scoreNum}/${totalNum} (${Math.round(scorePercent * 100)}%)`,
          detailText: `Recorded to subject study history. ${result.mistakes?.length || 0} mistakes saved to Recovery Queue.`
        });
      }

      setTimeout(() => {
        setSuccessData(null);
        setText('');
        removeImage();
        setSelectedSubjectId('');
        setSelectedBlockId('ad-hoc');
      }, 4500);

    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Error processing AI log");
    } finally {
      setLoadingPhase(-1);
    }
  };

  if (successData) {
    return (
      <div className="bg-card border border-border/40 rounded-2xl p-8 mb-8 flex flex-col items-center justify-center text-center shadow-sm animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20 shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold tracking-tight mb-1 text-foreground">Study Session Logged</h3>
        <p className="text-muted-foreground mb-5 text-sm">Performance metrics and mistake concepts successfully recorded.</p>
        
        <div className="w-full max-w-lg space-y-3 text-sm text-left bg-muted/30 p-4 rounded-xl border border-border/50">
          <div className="flex items-start gap-3">
            <div className="mt-0.5"><Check className="w-4 h-4 text-emerald-500" /></div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground">{successData.name}</p>
                {successData.scoreText && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md shrink-0">
                    {successData.scoreText}
                  </span>
                )}
              </div>
              {successData.oldDate && successData.newDate ? (
                <p className="text-muted-foreground text-xs mt-1">
                  Decay calibrated. Next revision: <span className="line-through opacity-70 mr-1">{successData.oldDate}</span> 
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">➔ {successData.newDate}</span>
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
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner flex-shrink-0">
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
