import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NextActionRecommendation } from '@/lib/recommendations/nextActionEngine';
import { Brain, Target, Clock, AlertTriangle, Sparkles, CheckCircle2, TrendingDown, Sun, Moon, Zap, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WhyRecommendationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendation: NextActionRecommendation | null;
}

export function WhyRecommendationSheet({
  open,
  onOpenChange,
  recommendation
}: WhyRecommendationSheetProps) {
  if (!recommendation) return null;

  const { whyBreakdown, title, subjectName, systemName, archetype, rationaleBadges } = recommendation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl p-5 sm:p-7 border-border/80 shadow-2xl bg-card">
        <DialogHeader className="space-y-2 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/25">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Algorithmic Decision Transparency
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Deterministic mathematical reasoning behind this recommendation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Target Focus Summary */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              {subjectName} • {systemName}
            </div>
            <h4 className="text-base font-bold text-foreground">
              {title}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {whyBreakdown.rationaleNarrative}
            </p>
          </div>

          {/* Primary Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Priority Score */}
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/25 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-primary">
                <span>Priority</span>
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-black font-mono text-primary">
                {whyBreakdown.priorityScore}
                <span className="text-[10px] text-muted-foreground font-normal"> / 100</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Ranked #1 Candidate
              </div>
            </div>

            {/* Exam Yield */}
            <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/25 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-sky-400">
                <span>NEET Yield</span>
                <Target className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-black font-mono text-sky-400">
                {whyBreakdown.examWeightage}%
              </div>
              <div className="text-[10px] text-muted-foreground">
                High Exam ROI
              </div>
            </div>

            {/* Retrievability */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-amber-500">
                <span>Retention</span>
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-black font-mono text-amber-500">
                {whyBreakdown.retrievabilityPercent}%
              </div>
              <div className="text-[10px] text-muted-foreground">
                Decay: {whyBreakdown.memoryDecayPercent}%
              </div>
            </div>

            {/* Cognitive Depth */}
            <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/25 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-teal-400">
                <span>Depth</span>
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-bold font-mono text-teal-400 truncate">
                {whyBreakdown.depthLabel || (recommendation.depth === 'rapid' ? 'Rapid Recall' : recommendation.depth === 'deep' ? 'Deep Focus' : 'Standard')}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Pass #{whyBreakdown.revisionPass}
              </div>
            </div>
          </div>

          {/* Mathematical Formula Explanation */}
          <div className="p-4 rounded-2xl bg-muted/50 border border-border/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-primary" />
                Deterministic Scoring Formula
              </span>
              <Badge variant="outline" className="text-[9px] font-mono bg-background/80">
                CDSS Math Engine
              </Badge>
            </div>
            <div className="p-2.5 rounded-xl bg-background/90 border border-border/50 font-mono text-xs text-primary leading-relaxed break-all">
              {whyBreakdown.formulaString}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Calculates marginal recall yield per minute of active retrieval, factoring in subject exam weightage, memory decay, and friction penalties.
            </p>
          </div>

          {/* Session Budget & Depth Filtering Impact */}
          {whyBreakdown.budgetInfluence && (
            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <Clock className="w-3.5 h-3.5" />
                <span>Session Budget & Filtering Impact</span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                {whyBreakdown.budgetInfluence}
              </p>
            </div>
          )}

          {/* Diagnostic & Friction Factors */}
          {(whyBreakdown.activeMistakes > 0 || whyBreakdown.weakTopicsCount > 0) && (
            <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/25 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span>Diagnostic Friction Factors</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                {whyBreakdown.activeMistakes > 0 && (
                  <div className="bg-background/60 p-2 rounded-xl border border-destructive/20">
                    <span className="font-bold text-destructive">{whyBreakdown.activeMistakes}</span> active test mistake(s) pending remediation.
                  </div>
                )}
                {whyBreakdown.weakTopicsCount > 0 && (
                  <div className="bg-background/60 p-2 rounded-xl border border-destructive/20">
                    <span className="font-bold text-destructive">{whyBreakdown.weakTopicsCount}</span> topic(s) flagged for weak retrievability.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Circadian Chronobiology Factor */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground font-medium">
              <Sun className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Circadian Affinity:</span>
            </div>
            <span className="font-bold text-foreground font-mono text-[11px]">
              {whyBreakdown.circadianAffinity}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-border/60 flex justify-end">
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-5 font-semibold text-xs bg-primary text-primary-foreground cursor-pointer"
          >
            Understood
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
