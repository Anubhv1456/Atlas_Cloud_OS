
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Layers, CheckCircle2, Trash2, ArrowRight } from 'lucide-react';
import { ClinicalDistillation } from '@/lib/ai/types';

export interface BatchTriageDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distillations: ClinicalDistillation[];
  onCommit: (pearl: ClinicalDistillation) => void;
  onDiscard: (index: number) => void;
}

export function BatchTriageDrawer({
  open,
  onOpenChange,
  distillations,
  onCommit,
  onDiscard
}: BatchTriageDrawerProps) {
  if (!distillations || distillations.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col bg-background/95 backdrop-blur-xl border-border/50 rounded-2xl">
        <DialogHeader className="p-4 md:p-6 pb-4 border-b border-border/50 bg-card/30 flex-shrink-0">
          <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            Batch Triage Inbox
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            Review and commit these extracted clinical pearls to your 20th Notebook.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          <AnimatePresence>
            {distillations.map((pearl, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden', padding: 0, margin: 0 }}
                className="p-4 rounded-xl border border-border bg-card/60 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 text-left flex-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-primary/80">
                      {pearl.subjectName || 'Pearl'} • {pearl.systemName || pearl.tag}
                    </span>
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      {pearl.twentyNotebookRule || pearl.hingeConcept}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                  <Button variant="ghost" size="sm" onClick={() => onDiscard(i)} className="text-muted-foreground hover:text-destructive text-xs">
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Discard
                  </Button>
                  <Button variant="default" size="sm" onClick={() => onCommit(pearl)} className="text-xs bg-primary/10 text-primary hover:bg-primary/20 shadow-none border border-primary/20">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Commit to Notebook
                  </Button>
                </div>
              </motion.div>
            ))}
            {distillations.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>All pearls reviewed!</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
