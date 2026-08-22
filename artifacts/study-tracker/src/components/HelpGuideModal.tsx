import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, Compass, Zap, BookOpen, BrainCircuit, Award, Sparkles, Star, ChevronDown, HelpCircle, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const CHAPTERS = [
  {
    id: 'philosophy',
    title: 'The Atlas Philosophy',
    icon: Compass,
    searchTerms: 'mission sdsr engine algorithm sky progress bar memory',
    content: (
      <div className="space-y-8">
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">The Mission</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Atlas is not a simple checklist; it is your strategic brain, designed to answer one question: <strong>"What should I study next?"</strong>
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">The SDSR Engine</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Our <strong>Spaced Decay Study Routine</strong> calculates memory decay over time. You study on your platform of choice (Primary QBank, Standard Video Course), and Atlas schedules the exact day you should revise it.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Atlas Sky</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Atlas Sky is not a progress bar. It is a visual memory of your medical journey. As subjects strengthen, the sky becomes more connected. The pattern is unique to your order of mastery, making it a personal signature of your preparation rather than a score.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Trust the Algorithm</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Do not panic if you fall behind. The dynamic queue automatically reorganizes pending reviews without guilt-tripping, ensuring you always focus on what matters most today.
          </p>
        </section>
      </div>
    )
  },
  {
    id: 'workflow',
    title: 'The Daily Workflow',
    icon: Zap,
    searchTerms: 'next action card active revisions external study log evaluate 4-step loop',
    content: (
      <div className="space-y-8">
        <section className="space-y-3">
          <h4 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="bg-primary/20 text-primary w-5 h-5 rounded-md flex items-center justify-center text-[11px]">1</span> 
            The Next Action Card
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">Always start your day by checking the top recommendation on the Home Screen. It is precisely calculated based on your decay profile.</p>
        </section>
        <section className="space-y-3">
          <h4 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="bg-primary/20 text-primary w-5 h-5 rounded-md flex items-center justify-center text-[11px]">2</span> 
            Active Revisions
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">Clear your "Due Revisions" queue before learning new content to lock in memory.</p>
        </section>
        <section className="space-y-3">
          <h4 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="bg-primary/20 text-primary w-5 h-5 rounded-md flex items-center justify-center text-[11px]">3</span> 
            External Study
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">Use your primary content sources (like your core QBank or video lectures) to study the recommended topic.</p>
        </section>
        <section className="space-y-3">
          <h4 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="bg-primary/20 text-primary w-5 h-5 rounded-md flex items-center justify-center text-[11px]">4</span> 
            Log & Evaluate
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">Mark Content/QBank as complete in Atlas and rate your confidence honestly. This feeds the engine.</p>
        </section>
      </div>
    )
  },
  {
    id: 'curriculum',
    title: 'Managing Curriculum',
    icon: BookOpen,
    searchTerms: 'hierarchy subject system topic high-yield star study blocks study blocks progress tracking content units',
    content: (
      <div className="space-y-8">
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Hierarchy</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Everything flows from <strong>Subject ➔ System ➔ Topic</strong>. Master the systems, and the subject takes care of itself.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground flex items-center gap-2">
            High-Yield Tagging <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tagging a system as High-Yield gives it a massive priority boost in the recommendation engine, ensuring it surfaces more frequently during crucial study phases.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Study Blocks</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Group granular topics (e.g., "ECG + Heart Failure") into custom blocks for highly focused revision sessions.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Progress Tracking</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Atlas distinguishes between incremental <strong>Content Units</strong> (e.g., 12 videos left) and binary <strong>QBank</strong> completion. Track both for true mastery.
          </p>
        </section>
      </div>
    )
  },
  {
    id: 'retention',
    title: 'Mastering Retention',
    icon: BrainCircuit,
    searchTerms: 'confidence ratings brutal memory decay calibration speed lengthy topics massive systems',
    content: (
      <div className="space-y-8">
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Confidence Ratings</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Be brutal. Guessing correctly during a QBank means you should rate it as <strong>Weak</strong> to ensure early revision. Don't lie to the algorithm.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Memory Decay Calibration</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Use the gear icon on systems to tweak your memory decay speed.
          </p>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm space-y-3 mt-3">
            <p className="flex items-start gap-2 text-foreground/90">
              <span className="text-primary font-bold">Pro Tip:</span> 
              <span>Use <strong>1.5x (Fast Decay)</strong> for volatile topics like Biochemistry.</span>
            </p>
            <p className="flex items-start gap-2 text-foreground/90">
              <span className="text-primary font-bold">Pro Tip:</span> 
              <span>Use <strong>0.8x (Slow Decay)</strong> for deeply conceptual topics you retain easily.</span>
            </p>
          </div>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Lengthy Topics</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Use <strong>Mark as Lengthy</strong> in the system dropdown for massive systems (like CNS). This allows revisions to spread across multiple days without breaking your streak.
          </p>
        </section>
      </div>
    )
  },
  {
    id: 'exam',
    title: 'Exam Strategy',
    icon: Award,
    searchTerms: 'mistake recovery queue concept retrieval misread fomo markers community wisdom analytics trailing subjects',
    content: (
      <div className="space-y-8">
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Mistake Recovery Queue</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Don't just read GT/QBank explanations. Log wrong answers in the Mistake Log and categorize them strictly (Concept, Retrieval, Misread, FOMO). Review this queue the week before an exam.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Markers (Community Wisdom)</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Leave "breadcrumbs" (mnemonics, clinical pearls, traps) on specific topics to instantly recall nuances during your next revision.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Analytics</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Use the performance charts to spot trailing subjects and realign your study time proactively.
          </p>
        </section>
      </div>
    )
  },
  {
    id: 'power',
    title: 'Power User Secrets',
    icon: Sparkles,
    searchTerms: 'algorithm override pinning target icon focus mode managing interruptions illness exams travel burnout triage mode custom topics',
    content: (
      <div className="space-y-8">
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Algorithm Override (Pinning)</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Need to cram for a college internal exam? Use the <strong>Focus Mode</strong> (Target icon) to pin a Subject/System as Primary or Secondary, temporarily overriding the AI recommendations.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Managing Interruptions</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Illness, college exams, travel, or burnout happen. Atlas will automatically enter <strong>Triage Mode</strong> after several days of inactivity, prioritizing high-yield overdue topics first without punishing your stats.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Custom Topics</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Add personalized topics into systems if the default ontology misses something specific to your university syllabus.
          </p>
        </section>
      </div>
    )
  },
  {
    id: 'faq',
    title: 'Frequently Asked Questions',
    icon: HelpCircle,
    searchTerms: 'faq question answer help backup firebase recommendations decay retrievability focus mode triage zoom text size font scaling display shortcuts',
    content: (
      <div className="space-y-6">
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">How do I adjust text size or UI scaling?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Atlas fully supports native browser and OS scaling. Press <kbd className="font-mono bg-muted/60 px-1 py-0.5 rounded text-xs text-foreground font-semibold">⌘ +</kbd> / <kbd className="font-mono bg-muted/60 px-1 py-0.5 rounded text-xs text-foreground font-semibold">⌘ -</kbd> (or <kbd className="font-mono bg-muted/60 px-1 py-0.5 rounded text-xs text-foreground font-semibold">Ctrl +</kbd> / <kbd className="font-mono bg-muted/60 px-1 py-0.5 rounded text-xs text-foreground font-semibold">Ctrl -</kbd> on Windows) to adjust UI scale, or pinch-to-zoom on tablets and mobile devices. All medical charts, flashcards, and layouts adapt smoothly.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">How do recommendations work?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Atlas uses an intelligent algorithm based on spaced memory decay, past confidence ratings, PYQ weighting, and exam yield to calculate what system or topic deserves your attention next.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Is my study data backed up?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Yes. Your progress, custom study blocks, and mistake recovery logs are saved locally and synced securely to the cloud via Firebase when connected.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Can I override the recommendation engine?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Absolutely. Click the Target icon (Focus Mode) on the home screen or inside any subject to pin a primary or secondary focus area for upcoming college internal exams or targeted study sprints.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">What happens if I miss several days of study?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Atlas automatically triggers <strong>Triage Mode</strong> after prolonged inactivity, reorganizing overdue reviews by yield and urgency without overwhelming you or punishing your stats.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">How do High-Yield tags work?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tagging a system as High-Yield gives it a massive priority multiplier in the recommendation queue, ensuring high-yield exam concepts surface more frequently.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">How can I renew or maintain beta access?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            As Atlas transitions to official releases, early cohort members will be seamlessly migrated to full production tiers.
          </p>
        </section>
      </div>
    )
  },
  {
    id: 'disclaimer',
    title: 'Statutory Medical Disclaimer',
    icon: ShieldAlert,
    searchTerms: 'medical disclaimer legal clinical patient care doctor device liability terms education exam',
    content: (
      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 space-y-1.5">
          <h4 className="font-bold text-sm uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" /> Strictly an Educational Revision Aid
          </h4>
          <p className="text-xs sm:text-sm leading-relaxed text-foreground/90 font-medium">
            Atlas is designed exclusively for medical examination preparation (NEET PG, INI-CET, FMGE, USMLE, and MBBS). It is <strong>NOT</strong> a certified medical device and must never be used for patient diagnosis, clinical management, or direct healthcare decision-making.
          </p>
        </div>

        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">1. Academic Context Only</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All algorithms, memory decay models, high-yield mistake ledgers, drug of choice heuristics, and clinical quiz interactions are curated solely to assist medical students in passing licensing and competitive entrance exams.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">2. No Clinical Decision Support</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Medical knowledge, clinical guidelines, and drug protocols change continuously. While Atlas references established textbook and board-examination consensus, healthcare practitioners and students must always consult peer-reviewed primary literature, institutional protocols, and official pharmacopoeias for real-world patient care.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">3. Limitation of Liability</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Atlas and its developers assume no liability or responsibility for any clinical errors, diagnosis mistakes, or treatment decisions undertaken in real-world clinical settings.
          </p>
        </section>
      </div>
    )
  }
];

export function HelpGuideModal({ open, onOpenChange }: { open: boolean, onOpenChange: (o: boolean) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabId, setActiveTabId] = useState('philosophy'); // Desktop active tab
  const [expandedMobileId, setExpandedMobileId] = useState<string | null>('philosophy'); // Mobile expanded accordion

  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return CHAPTERS;
    const q = searchQuery.toLowerCase();
    return CHAPTERS.filter(c => 
      c.title.toLowerCase().includes(q) || 
      c.searchTerms.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Sync desktop tab if filtered chapters change and active isn't in it
  React.useEffect(() => {
    if (filteredChapters.length > 0 && !filteredChapters.find(c => c.id === activeTabId)) {
      setActiveTabId(filteredChapters[0].id);
    }
  }, [filteredChapters, activeTabId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] md:h-[80vh] p-0 overflow-hidden flex flex-col bg-background/95 backdrop-blur-xl border-border/50 rounded-2xl">
        <DialogHeader className="p-4 md:p-6 pb-4 border-b border-border/50 bg-card/30 flex-shrink-0">
          <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            User Manual & FAQs
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            The complete operating guide, philosophy, and reference manual for Atlas.
          </DialogDescription>
          <div className="mt-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search guide, features, or tips..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-border/50 rounded-xl focus-visible:ring-primary/50"
            />
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* ── DESKTOP SIDEBAR ── */}
          <div className="hidden md:block w-64 border-r border-border/50 bg-muted/10 overflow-y-auto py-4">
            {filteredChapters.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No matches found.</div>
            ) : (
              <div className="px-2 space-y-1">
                {filteredChapters.map(chapter => {
                  const isActive = activeTabId === chapter.id;
                  const Icon = chapter.icon;
                  return (
                    <button
                      key={chapter.id}
                      onClick={() => setActiveTabId(chapter.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-md" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-muted-foreground/70")} />
                      {chapter.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── DESKTOP CONTENT AREA ── */}
          <div className="hidden md:block flex-1 overflow-y-auto p-8 bg-card/10">
             {(() => {
                const activeChapter = filteredChapters.find(c => c.id === activeTabId);
                if (!activeChapter) return null;
                const Icon = activeChapter.icon;
                return (
                  <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/20">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">{activeChapter.title}</h2>
                    </div>
                    {activeChapter.content}
                  </div>
                );
             })()}
          </div>

          {/* ── MOBILE ACCORDION ── */}
          <div className="flex-1 md:hidden overflow-y-auto p-4 space-y-3 bg-card/10">
            {filteredChapters.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No matches found.</div>
            ) : (
              filteredChapters.map(chapter => {
                const isExpanded = expandedMobileId === chapter.id;
                const Icon = chapter.icon;
                return (
                  <div key={chapter.id} className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm transition-all">
                    <button
                      onClick={() => setExpandedMobileId(isExpanded ? null : chapter.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 text-left transition-colors focus:outline-none cursor-pointer",
                        isExpanded ? "bg-muted/30" : "hover:bg-muted/10"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-xl transition-colors", isExpanded ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className="font-semibold text-foreground text-sm">{chapter.title}</h3>
                      </div>
                      <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", isExpanded && "rotate-180")} />
                    </button>
                    {isExpanded && (
                      <div className="p-4 pt-2 border-t border-border/30 bg-background/50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {chapter.content}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

