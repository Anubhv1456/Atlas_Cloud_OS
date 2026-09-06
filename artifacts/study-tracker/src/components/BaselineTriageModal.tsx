import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { db, StudySystem } from '@/db';
import { useExamProfile } from '@/hooks/useExamProfile';
import { Brain, ArrowRight, Loader2, Sparkles, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calibrateSystemSDSR } from '@/lib/sdsr-engine';

interface BaselineTriageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BaselineTriageModal({ open, onOpenChange }: BaselineTriageModalProps) {
  const [systems, setSystems] = useState<StudySystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confidences, setConfidences] = useState<Record<string, 'untouched' | 'weak' | 'average' | 'strong'>>({});
  const { profile, updateProfile } = useExamProfile();

  useEffect(() => {
    if (open) {
      loadSystems();
    }
  }, [open]);

  const loadSystems = async () => {
    setLoading(true);
    try {
      const allSystems = await db.studySystems.filter(s => !s.deletedAt).toArray();
      // Take up to top 15 systems for a quick triage
      const topSystems = allSystems.slice(0, 15);
      setSystems(topSystems);
      
      const initialConfidences: Record<string, 'untouched' | 'weak' | 'average' | 'strong'> = {};
      topSystems.forEach(s => {
        initialConfidences[String(s.id)] = 'untouched';
      });
      setConfidences(initialConfidences);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const setConfidence = (id: string, level: 'untouched' | 'weak' | 'average' | 'strong') => {
    setConfidences(prev => ({ ...prev, [id]: level }));
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const now = Date.now();
      const logs = [];
      
      for (const sys of systems) {
        const idStr = String(sys.id);
        const level = confidences[idStr];
        if (level === 'untouched') continue;

        let score = 0;
        let daysAgo = 0;
        
        if (level === 'weak') {
          score = 0.40;
          daysAgo = 3;
        } else if (level === 'average') {
          score = 0.65;
          daysAgo = 1;
        } else if (level === 'strong') {
          score = 0.85;
          daysAgo = 0;
        }
        
        const timestamp = new Date(now - daysAgo * 86400000);
        
        const updated = calibrateSystemSDSR(sys, score, 'General', 0.70, timestamp);
        await db.studySystems.update(sys.id!, updated);
        
        logs.push({
          title: `Baseline Triage: ${sys.name}`,
          score: Math.round(score * 40),
          total: 40,
          percentage: score * 100,
          type: 'qbank',
          systemId: sys.id,
          timestamp,
          createdAt: new Date(),
        });
      }
      
      if (logs.length > 0) {
        await db.scoreLogs.bulkAdd(logs as any);
      }
      
      await updateProfile({ hasCompletedTriage: true });
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val && !saving) onOpenChange(false) }}>
      <DialogContent className="sm:max-w-xl bg-background border-border p-0 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-6 pb-4 bg-muted/30 border-b border-border/40">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Baseline Calibration
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1.5 leading-relaxed">
              Before we schedule your revisions, let's calibrate the SDSR algorithm. How confident are you in these core systems right now?
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm font-medium">Loading syllabus...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {systems.map((sys) => {
                const idStr = String(sys.id);
                const current = confidences[idStr];
                return (
                  <div key={idStr} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-card">
                    <div className="font-medium text-sm pl-1">{sys.name}</div>
                    <div className="flex items-center gap-1.5 shrink-0 bg-muted/40 p-1 rounded-lg">
                      <button
                        onClick={() => setConfidence(idStr, 'untouched')}
                        className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", current === 'untouched' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                      >
                        Skip
                      </button>
                      <button
                        onClick={() => setConfidence(idStr, 'weak')}
                        className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", current === 'weak' ? "bg-red-500/15 text-red-600 dark:text-red-400 shadow-sm" : "text-muted-foreground hover:text-foreground")}
                      >
                        Weak
                      </button>
                      <button
                        onClick={() => setConfidence(idStr, 'average')}
                        className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", current === 'average' ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-sm" : "text-muted-foreground hover:text-foreground")}
                      >
                        Average
                      </button>
                      <button
                        onClick={() => setConfidence(idStr, 'strong')}
                        className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", current === 'strong' ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-muted-foreground hover:text-foreground")}
                      >
                        Strong
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-background border-t border-border/40 flex justify-between items-center">
          <Button variant="ghost" onClick={() => handleComplete()} disabled={saving} className="text-muted-foreground">
            Skip Calibration
          </Button>
          <Button onClick={handleComplete} disabled={saving} className="gap-2 px-6 rounded-xl shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
