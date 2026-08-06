import React, { useState } from 'react';
import { Link } from 'wouter';
import { Info, Compass, ShieldCheck, FileText, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function AboutSection() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-teal-400" />
          Legal & About
        </h2>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm p-2 divide-y divide-border/40">
        <div className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">About Atlas</div>
              <div className="text-[11px] text-muted-foreground">Intelligent Medical Study OS</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAboutOpen(true)}
            className="text-xs font-semibold h-7 px-2.5 rounded-lg text-primary hover:bg-primary/10"
          >
            View Info
          </Button>
        </div>

        <div className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">Privacy Policy</div>
              <div className="text-[11px] text-muted-foreground">Data collection and usage terms</div>
            </div>
          </div>
          <Link href="/privacy" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors p-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">Terms of Service</div>
              <div className="text-[11px] text-muted-foreground">User agreement & beta conditions</div>
            </div>
          </div>
          <Link href="/terms" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors p-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-zinc-800 text-zinc-100 rounded-3xl p-6">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-2">
              <Compass className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-extrabold text-white">Atlas Medical OS</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Version 1.0.0 — Closed Beta Edition
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs text-zinc-300 leading-relaxed">
            <p>
              Atlas is an Intelligent Medical Study Operating System designed exclusively for MBBS students preparing for high-stakes examinations including NEET PG, INICET, FMGE, NEXT, and USMLE.
            </p>
            <p>
              Its primary mission is answering one continuous question: <span className="font-semibold text-teal-400">"What should I study next?"</span> by integrating syllabus completion, confidence levels, revision intervals, and exam proximity into clean recommendations.
            </p>
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
              <span>Build Environment</span>
              <span className="font-mono text-zinc-300">Cloud Run / React / TS</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => setAboutOpen(false)}
              className="text-xs font-semibold rounded-xl bg-teal-500 hover:bg-teal-400 text-black"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
