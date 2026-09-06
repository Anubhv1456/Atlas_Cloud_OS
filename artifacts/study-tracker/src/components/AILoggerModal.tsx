import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Brain, CheckCircle2, FileText, Check, Upload, X, Image as ImageIcon } from 'lucide-react';
import { db } from '@/db';
import { useAISettings } from '@/lib/ai/aiSettingsStorage';
import { calibrateSystemSDSR } from '@/lib/sdsr-engine';
import { cn } from '@/lib/utils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { Subject, StudySystem } from '@/db/types';

interface AILoggerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AILoggerModal({ open, onOpenChange }: AILoggerModalProps) {
  const { settings } = useAISettings();
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  
  const [loadingPhase, setLoadingPhase] = useState<number>(-1);
  const [successData, setSuccessData] = useState<{ name: string; oldDate: string; newDate: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSystems = useLiveQuery(() => db.systems.filter(s => !s.deletedAt).toArray(), []) || [];
  const activeSubjects = useLiveQuery(() => db.subjects.filter(s => !s.deletedAt).toArray(), []) || [];

  // Group systems by subject for the dropdown
  const groupedSystems = useMemo(() => {
    const groups: Record<string, { subject: Subject | null, systems: StudySystem[] }> = {
      ungrouped: { subject: null, systems: [] }
    };
    
    activeSubjects.forEach(sub => {
      groups[String(sub.id)] = { subject: sub, systems: [] };
    });

    activeSystems.forEach(sys => {
      const subId = String(sys.subjectId);
      if (sys.subjectId && groups[subId]) {
        groups[subId].systems.push(sys);
      } else {
        groups.ungrouped.systems.push(sys);
      }
    });

    // Sort systems within groups
    Object.values(groups).forEach(g => {
      g.systems.sort((a, b) => a.name.localeCompare(b.name));
    });

    return groups;
  }, [activeSystems, activeSubjects]);

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
    if (!selectedBlockId) {
      alert("Please select a target study block first.");
      return;
    }
    if (!text.trim() && !imageFile) return;
    
    const targetSystem = activeSystems.find(s => String(s.id) === selectedBlockId);
    if (!targetSystem) return;

    setLoadingPhase(0);
    
    try {
      const apiKey = settings.geminiApiKey;
      if (!apiKey) {
        throw new Error("Gemini API key is missing. Please configure it in Settings.");
      }

      const prompt = `You are a precision medical extractor. Analyze this text or screenshot of a test result/score report.
CRITICAL: Only extract the metrics related to this specific block performance. Ignore lifetime/cumulative metrics.

Format your output STRICTLY as a JSON object matching this schema exactly:
{
  "score": 28,
  "total": 40,
  "mistakes": [
    "Detailed description of specific medical concept they got incorrect (e.g. 'Atrial Fibrillation anticoagulation guidelines')"
  ]
}
If max score is not mentioned, assume total is 40.`;

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
      const totalNum = Number(result.total) || 40;
      const scorePercent = scoreNum / totalNum;
      
      const updated = calibrateSystemSDSR(targetSystem, scorePercent, 'General', 0.70, now);
      await db.systems.update(targetSystem.id!, updated);
      
      await db.scoreLogs.add({
        title: `AI Log: ${targetSystem.name}`,
        score: scoreNum,
        total: totalNum,
        percentage: scorePercent * 100,
        type: 'qbank',
        systemId: targetSystem.id,
        timestamp: now,
        createdAt: now
      } as any);

      if (result.mistakes && Array.isArray(result.mistakes)) {
        for (const mistake of result.mistakes) {
          await db.mistakeLogs.add({
            topic: String(mistake).substring(0, 200),
            subjectId: targetSystem.subjectId || 'general',
            systemId: targetSystem.id!,
            errorType: 'Concept Gap',
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

      setSuccessData({ name: targetSystem.name, oldDate, newDate });
      setTimeout(() => {
        setSuccessData(null);
        setText('');
        removeImage();
        setSelectedBlockId('');
        onOpenChange(false);
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-background border-border p-8 flex flex-col items-center justify-center text-center shadow-2xl rounded-2xl">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight mb-2">Block Parsed & Logged</h3>
          <p className="text-muted-foreground mb-6">Your schedule has been updated.</p>
          
          <div className="w-full space-y-3 text-sm text-left bg-muted/30 p-4 rounded-xl border border-border/50">
            <div className="flex items-start gap-3">
              <div className="mt-0.5"><Check className="w-4 h-4 text-emerald-500" /></div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{successData.name}</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Decay slowed. Next revision: <span className="line-through opacity-70 mr-1">{successData.oldDate}</span> 
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">➔ {successData.newDate}</span>
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val && loadingPhase < 0) onOpenChange(false); }}>
      <DialogContent 
        className={cn(
          "sm:max-w-xl bg-background border-border p-0 overflow-hidden shadow-2xl rounded-2xl transition-all duration-300",
          isDragging ? "border-primary shadow-lg scale-[1.01]" : ""
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
        <div className="p-6 pb-4 bg-muted/30 border-b border-border/40">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner flex-shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              Log Study Session
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2 leading-relaxed">
              Select a block, then paste text or drop a screenshot of your score report.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="p-6 relative">
          <div className="mb-5">
            <Select value={selectedBlockId} onValueChange={setSelectedBlockId}>
              <SelectTrigger className="w-full h-11 bg-background border-border/60 hover:border-border transition-colors rounded-xl shadow-sm">
                <SelectValue placeholder="-- Select the target Study Block --" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {Object.entries(groupedSystems).map(([subId, group]) => {
                  if (group.systems.length === 0) return null;
                  return (
                    <SelectGroup key={subId}>
                      {group.subject && <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.subject.name}</SelectLabel>}
                      {!group.subject && subId === 'ungrouped' && <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Other</SelectLabel>}
                      {group.systems.map(sys => (
                        <SelectItem key={sys.id} value={String(sys.id)} className="cursor-pointer">
                          {sys.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className={cn(
            "relative mb-2 rounded-xl border-2 border-dashed transition-colors duration-200 overflow-hidden group bg-muted/10",
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
                  className="min-h-[160px] font-mono text-sm pl-12 pt-4 pb-4 pr-4 border-0 bg-transparent resize-none focus-visible:ring-0 placeholder:text-muted-foreground/50 shadow-none"
                />
              </>
            )}
          </div>
          
          {isDragging && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-2xl pointer-events-none border-2 border-primary border-dashed">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-primary animate-bounce" />
              </div>
              <p className="text-lg font-semibold text-foreground">Drop screenshot to parse</p>
              <p className="text-sm text-muted-foreground">Release to upload the image instantly</p>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-muted/20 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-4">
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
                size="sm" 
                className="w-full sm:w-auto text-muted-foreground hover:text-foreground border-border/60 rounded-xl h-10 px-4 bg-background"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
            )}
          </div>
          
          <div className="flex items-center justify-end gap-4 w-full sm:w-auto">
            {loadingPhase >= 0 && (
              <span className="text-xs text-primary/80 animate-pulse font-medium whitespace-nowrap">
                {loadingMessages[Math.min(loadingPhase, loadingMessages.length - 1)]}
              </span>
            )}
            <Button 
              onClick={handleProcess} 
              disabled={loadingPhase >= 0 || !selectedBlockId || (!text.trim() && !imageFile)} 
              className="w-full sm:w-auto gap-2 px-6 rounded-xl shadow-md h-10 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 disabled:bg-emerald-600"
            >
              {loadingPhase >= 0 ? <Brain className="w-4 h-4 animate-pulse" /> : <Sparkles className="w-4 h-4" />}
              Parse & Log
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
