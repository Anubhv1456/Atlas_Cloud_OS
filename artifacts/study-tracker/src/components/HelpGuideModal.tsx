import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { HelpCircle, BookOpen, Clock, Target, Rocket, Lightbulb, Map, Layout, Zap, BrainCircuit, Activity } from 'lucide-react';


export function HelpGuideModal({ open, onOpenChange }: { open: boolean, onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] p-0 overflow-hidden flex flex-col bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-card/30">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Atlas Study Guide
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Everything you need to know to get the most out of your medical study tracker.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 px-6 py-6 overflow-y-auto">
          <div className="space-y-8 pr-4">
            
            <section className="space-y-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Target className="w-5 h-5 text-emerald-500" />
                The Core Philosophy
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Atlas is designed to answer one crucial question: <strong>"What should I study next?"</strong>. 
                Instead of overwhelming you with content, Atlas acts as your strategic brain. You log what you study, and Atlas calculates your memory decay, building a precise daily schedule for you.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Map className="w-5 h-5 text-blue-500" />
                How Atlas is Structured
              </h3>
              <div className="grid gap-3">
                <div className="p-4 rounded-xl border border-border/50 bg-card/30 space-y-1.5">
                  <h4 className="font-semibold text-sm">1. Subjects</h4>
                  <p className="text-xs text-muted-foreground">The highest level (e.g., Pathology, Anatomy, Medicine). Add the subjects you are currently studying from the home screen.</p>
                </div>
                <div className="p-4 rounded-xl border border-border/50 bg-card/30 space-y-1.5">
                  <h4 className="font-semibold text-sm">2. Systems</h4>
                  <p className="text-xs text-muted-foreground">The sub-divisions (e.g., CVS, Respiratory, Endocrine). Track your completion and confidence for each system.</p>
                </div>
                <div className="p-4 rounded-xl border border-border/50 bg-card/30 space-y-1.5">
                  <h4 className="font-semibold text-sm">3. Topics & Study Blocks</h4>
                  <p className="text-xs text-muted-foreground">The specific chapters. You can group these into <strong>Study Blocks</strong> (previously Curriculum Sets) to organize what you want to revise together.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <BrainCircuit className="w-5 h-5 text-purple-500" />
                The Recommendation Engine (SDSR)
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our Spaced Repetition engine is invisible but powerful. When you finish a system or study block, log your confidence. Atlas will schedule your next revision:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li><strong>Weak:</strong> Reviewed very soon to reinforce memory.</li>
                <li><strong>Average:</strong> Reviewed in a standard interval.</li>
                <li><strong>Strong:</strong> Pushed further out to maximize efficiency.</li>
              </ul>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3 mt-2">
                <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-600/90 dark:text-amber-400/90">
                  <strong>Pro Tip:</strong> Trust the "Next Up" feed. If you fall behind, don't panic. Atlas will smoothly reorganize your pending reviews without making you feel guilty.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Activity className="w-5 h-5 text-rose-500" />
                Logging Mistakes
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When you do QBank or GTs on other platforms, bring your mistakes to Atlas. Use the <strong>Mistake Recovery Queue</strong> to log concepts you got wrong. Atlas will help you track these weaknesses until you master them before the exam.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Rocket className="w-5 h-5 text-teal-500" />
                Daily Workflow
              </h3>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-5">
                <li>Open Atlas to see your top recommended focus.</li>
                <li>Study the content (using Marrow, PrepLadder, etc.).</li>
                <li>Mark it as "Done" in Atlas and rate your confidence.</li>
                <li>Let Atlas schedule the next review date automatically.</li>
              </ol>
            </section>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
