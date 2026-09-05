import React, { useState } from 'react';
import { useAnalyticsLogic } from './Analytics.hooks';
import { Activity, Sparkles, Target, BarChart3, TrendingUp, AlertCircle, Brain, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { generateCognitiveProfile } from '@/lib/ai/contextPackager';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { db } from '@/db';

export default function AuditorAnalytics() {
  const { mistakeLogs, subjects, curriculumSets } = useAnalyticsLogic();
  const [, setLocation] = useLocation();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const handleGenerateRescueBlock = async (subjectId: string | number) => {
    setIsGenerating(String(subjectId));
    try {
      const setId = "rescue_" + Date.now();
      await db.curriculumSets.add({
        id: setId,
        name: 'Rescue Block: SDSR Intervention',
        subjectId: subjectId,
        systemId: 0,
        color: 'amber',
        depth: 'rapid',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['#Rescue', '#Volatile']
      });
      toast.success("Rescue Block Generated", {
        description: "A temporary SDSR-driven intervention has been created."
      });
      setLocation('/subjects/' + subjectId);
    } catch (err) {
      toast.error("Failed to generate rescue block.");
    } finally {
      setIsGenerating(null);
    }
  };

  const profile = React.useMemo(() => {
    return generateCognitiveProfile(mistakeLogs, subjects, curriculumSets);
  }, [mistakeLogs, subjects, curriculumSets]);

  return (
    <div className="min-h-full w-full bg-background text-foreground px-4 sm:px-6 lg:px-8 pt-8 pb-28 md:pb-10 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 overflow-x-hidden">
      
      {/* Auditor Header */}
      <div className="pt-2">
        <div className="flex items-center gap-2 text-primary uppercase tracking-widest text-[11px] font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Atlas Clinical Intelligence — Cognitive Auditor
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Your Performance Diagnostics</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          The AI auditor has synthesized your data to identify core cognitive frictions and high-impact improvement vectors.
        </p>
      </div>

      {/* Auditor Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Readiness Confidence Widget */}
        <div className="bg-card border border-primary/20 rounded-3xl p-6 shadow-sm">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Error Profile</h3>
           </div>
           <div className="space-y-2">
            {Object.entries(profile.errorTypeDistribution).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground capitalize">{type}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
           </div>
        </div>

        {/* Forensic Subject Audit */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">High Friction Modules</h3>
           </div>
           <div className="space-y-3">
             {profile.highFrictionModules.map(m => (
               <div key={m.subjectId} className="flex justify-between items-center text-sm p-3 bg-muted/40 rounded-xl border border-border/60">
                 <div className="flex flex-col gap-1">
                   <span className="font-semibold">{m.subjectName}</span>
                   <div className="flex gap-2 items-center">
                     <Badge variant="destructive" className="text-[10px] uppercase tracking-wider">{m.mistakeCount} Critical Logs</Badge>
                     <span className="text-xs text-muted-foreground font-mono">Decay detected</span>
                   </div>
                 </div>
                 <Button 
                   size="sm" 
                   variant="outline" 
                   onClick={() => handleGenerateRescueBlock(m.subjectId)}
                   disabled={isGenerating === String(m.subjectId)}
                   className="shrink-0 font-bold border-amber-500/30 text-amber-600 hover:bg-amber-500/10 transition-colors rounded-full"
                 >
                   {isGenerating === String(m.subjectId) ? <Sparkles className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                   Rescue
                 </Button>
               </div>
             ))}
             {profile.highFrictionModules.length === 0 && (
               <p className="text-sm text-muted-foreground italic">No high friction modules detected.</p>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
