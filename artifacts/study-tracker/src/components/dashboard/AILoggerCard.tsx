import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Brain, CheckCircle2, FileText, Check, Upload, X, Image as ImageIcon } from 'lucide-react';
import { db } from '@/db';
import { useAISettings } from '@/lib/ai/aiSettingsStorage';
import { calibrateSystemSDSR } from '@/lib/sdsr-engine';
import { cn } from '@/lib/utils';

export function AILoggerCard() {
  const { settings } = useAISettings();
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [loadingPhase, setLoadingPhase] = useState<number>(-1);
  const [successData, setSuccessData] = useState<{ name: string; oldDate: string; newDate: string }[] | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingMessages = [
    "Scanning diagnostic data...",
    "Mapping to curriculum ontology...",
    "Calibrating decay intervals..."
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
    if (!text.trim() && !imageFile) return;
    setLoadingPhase(0);
    
    try {
      const apiKey = settings.geminiApiKey;
      if (!apiKey) {
        throw new Error("Gemini API key is missing. Please configure it in Settings.");
      }

      const allSystems = await db.studySystems.filter(s => !s.deletedAt).toArray();
      const systemNamesList = allSystems.map(s => s.name).join(', ');

      const prompt = `You are a high-precision medical data extractor.
Extract study data from the provided text or image of a question bank score report or practice exam.
CRITICAL: Distinguish between the user's cumulative/lifetime metrics and THIS specific recent block's scores. ONLY extract the recent block scores.

Map the extracted systems to the closest match from this allowed list of system names: [${systemNamesList}].
If the max score is not explicitly mentioned, assume the total is 40.

Format your output STRICTLY as a JSON object matching this schema:
{
  "confidence_score": 95,
  "systems": [
    { "name": "Exact Name from allowed list", "score": 25, "total": 40 }
  ],
  "mistakes": [
    "Specific topic they got wrong"
  ]
}`;

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
        result = JSON.parse(textContent);
      } catch (e) {
        throw new Error("Failed to parse AI output into JSON");
      }

      const pushedSystems: { name: string; oldDate: string; newDate: string }[] = [];
      const now = new Date();

      if (result.systems && Array.isArray(result.systems)) {
        for (const sysLog of result.systems) {
          if (!sysLog || typeof sysLog.name !== 'string') continue;
          const matchedSys = allSystems.find(s => s.name && s.name.toLowerCase() === sysLog.name.toLowerCase());
          
          if (matchedSys) {
            const scoreNum = Number(sysLog.score);
            const totalNum = Number(sysLog.total) || 40;
            const scorePercent = scoreNum / totalNum;
            
            const updated = calibrateSystemSDSR(matchedSys, scorePercent, 'General', 0.70, now);
            await db.studySystems.update(matchedSys.id!, updated);
            
            await db.scoreLogs.add({
              title: `AI Log: ${matchedSys.name}`,
              score: scoreNum,
              total: totalNum,
              percentage: scorePercent * 100,
              type: 'qbank',
              systemId: matchedSys.id,
              timestamp: now,
              createdAt: now
            } as any);
            
            const oldDate = matchedSys.nextRevisionDate 
              ? new Date(matchedSys.nextRevisionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) 
              : 'None';
            const newDate = updated.nextRevisionDate 
              ? new Date(updated.nextRevisionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) 
              : 'None';
              
            pushedSystems.push({ name: matchedSys.name, oldDate, newDate });
          }
        }
      }

      if (result.mistakes && Array.isArray(result.mistakes)) {
        for (const mistake of result.mistakes) {
          await db.mistakeLogs.add({
            topic: String(mistake).substring(0, 200),
            subjectId: 'general',
            errorType: 'Concept Gap',
            createdAt: now,
            updatedAt: now
          } as any);
        }
      }

      setSuccessData(pushedSystems);
      setTimeout(() => {
        setSuccessData(null);
        setText('');
        removeImage();
      }, 4000);

    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Error processing AI log");
    } finally {
      setLoadingPhase(-1);
    }
  };

  if (successData) {
    return (
      <div className="bg-card border border-border/60 rounded-xl p-8 mb-8 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20 shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold tracking-tight mb-2">Block Parsed & Logged</h3>
        <p className="text-muted-foreground mb-6 text-sm">Your SDSR schedule has been updated.</p>
        
        <div className="w-full max-w-lg space-y-3 text-sm text-left bg-muted/30 p-4 rounded-xl border border-border/50">
          {successData.length > 0 ? (
            successData.map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5"><Check className="w-4 h-4 text-emerald-500" /></div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{s.name}</p>
                  <p className="text-muted-foreground text-xs">
                    Decay slowed. Next revision: <span className="line-through opacity-70 mr-1">{s.oldDate}</span> 
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">➔ {s.newDate}</span>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">Logged general block. No specific system decay adjusted.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "bg-card border rounded-xl p-6 mb-8 transition-all duration-300 relative overflow-hidden",
        isDragging ? "border-primary bg-primary/5 shadow-md scale-[1.01]" : "border-border/60 shadow-sm"
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
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Brain className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold tracking-tight text-foreground">Log Study Session</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Paste text or drop a screenshot of your score report to update SDSR.</p>
        </div>
      </div>

      <div className="relative mb-4">
        {imagePreview ? (
          <div className="relative w-full h-32 rounded-xl border border-border/60 bg-muted/20 overflow-hidden flex items-center justify-center">
            <img src={imagePreview} alt="Screenshot preview" className="h-full object-contain mix-blend-luminosity opacity-80" />
            <button 
              onClick={removeImage}
              className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-md rounded-full text-muted-foreground hover:text-foreground border border-border/50 shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <FileText className="absolute top-3 left-3 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
            <Textarea 
              value={text} 
              onChange={e => setText(e.target.value)}
              onPaste={(e) => {
                if (e.clipboardData.files && e.clipboardData.files.length > 0) {
                  handleFile(e.clipboardData.files[0]);
                }
              }}
              placeholder="Paste text or `Ctrl+V` a screenshot... (e.g. Cardiology: 28/40)"
              className="min-h-[120px] font-mono text-xs pl-9 pt-2.5 rounded-xl border-border/60 bg-muted/20 resize-none focus-visible:ring-primary/30"
            />
          </>
        )}
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          />
          {!imagePreview && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Upload Image
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {loadingPhase >= 0 && (
            <span className="text-xs text-muted-foreground animate-pulse font-medium">
              {loadingMessages[Math.min(loadingPhase, loadingMessages.length - 1)]}
            </span>
          )}
          <Button onClick={handleProcess} disabled={loadingPhase >= 0 || (!text.trim() && !imageFile)} className="gap-2 rounded-xl shadow-sm h-9">
            {loadingPhase >= 0 ? <Brain className="w-4 h-4 animate-pulse" /> : <Sparkles className="w-4 h-4" />}
            Parse & Log
          </Button>
        </div>
      </div>
      
      {isDragging && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-primary border-dashed rounded-xl z-50">
          <Upload className="w-8 h-8 text-primary mb-2 animate-bounce" />
          <p className="font-semibold text-primary">Drop screenshot to parse</p>
        </div>
      )}
    </div>
  );
}
