import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, Compass, Zap, BookOpen, BrainCircuit, Award, Sparkles, Star, ChevronDown, HelpCircle, ShieldAlert, Bot, Layers, Database, Orbit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const CHAPTERS = [
  {
    id: 'philosophy',
    title: 'The Atlas Philosophy',
    icon: Compass,
    searchTerms: 'mission sdsr engine algorithm sky progress bar memory curriculum tracker offline first',
    content: (
      <div className="space-y-8">
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">The Mission</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Atlas is not a content player, flashcard deck, or question bank. It is your <strong>Strategic Revision OS</strong>, engineered to answer one critical daily question: <strong>"What should I revise next to prevent memory decay?"</strong>
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">The SDSR Engine</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Our <strong>Spaced Decay Study Routine</strong> mathematically models the Ebbinghaus forgetting curve. You learn on your primary clinical platforms (Marrow, Pre-PG, DAMS, Bhatia, First Aid, Q-banks, or video lectures), and Atlas schedules the exact day and depth to revise.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Atlas Sky</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Atlas Sky is not a linear progress bar. It is an ambient visualization of your 19-subject medical mastery. As your systems solidify through spaced retention, constellations connect.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Guilt-Free Dynamic Triage</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Life, rotations, and exam burnout happen. If you miss days, Atlas never guilt-trips you with overdue backlogs. It automatically triggers <strong>Triage Mode</strong>, reprioritizing high-yield topics without penalizing your stats.
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
            <span className="bg-primary/20 text-primary w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold">1</span> 
            The Next Action Card
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">Start your session with the hero recommendation card on the Home Screen. It combines spaced decay math, exam question weighting, and your confidence history.</p>
        </section>
        <section className="space-y-3">
          <h4 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="bg-primary/20 text-primary w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold">2</span> 
            Due Revisions First
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">Always clear your due or decaying revisions before starting brand new curriculum systems. This locks in long-term memory consolidation.</p>
        </section>
        <section className="space-y-3">
          <h4 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="bg-primary/20 text-primary w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold">3</span> 
            External Study
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">Review the recommended topic on your chosen resource (textbook, Q-bank explanation, or lecture notes).</p>
        </section>
        <section className="space-y-3">
          <h4 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="bg-primary/20 text-primary w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold">4</span> 
            Log & Evaluate
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">Tap <strong>"Log Session"</strong> or tick the system checkboxes in Atlas. Rate your confidence honestly (Weak, Average, Strong) to recalibrate the next revision interval.</p>
        </section>
      </div>
    )
  },
  {
    id: 'atlas-sky',
    title: 'Atlas Sky: Visual Constellation',
    icon: Orbit,
    searchTerms: 'atlas sky constellation stars orbital lines decay fog polaris peak share milestone phases',
    content: (
      <div className="space-y-8">
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">The Antidote to Progress Bar Fatigue</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Traditional progress bars induce anxiety and guilt during long medical exam preparation. <strong>Atlas Sky</strong> replaces linear percentages with an ambient, generative constellation that maps your 19-subject retention in real time.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">How Your Sky Evolves</h4>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p><strong className="text-foreground">✨ Stars & Cores:</strong> Each organ system represents a celestial star. When you complete modules, the stars ignite with subject color.</p>
            <p><strong className="text-foreground">🌌 Orbital Gravitational Links:</strong> As you complete spaced revisions and maintain high retention over time, orbital lines connect systems across subjects into constellations.</p>
            <p><strong className="text-foreground">🌫️ Decay Fog:</strong> When a system suffers severe memory decay, its luminosity dims gently, alerting you to touch upon it without shame or panic.</p>
          </div>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">The 4 Mastery Phases</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
            <div className="p-3 rounded-xl bg-card border border-border/70 text-xs space-y-1">
              <strong className="text-primary font-semibold block">Phase I: Foundation</strong>
              <p className="text-muted-foreground">Igniting initial subject stars across foundational sciences.</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/70 text-xs space-y-1">
              <strong className="text-primary font-semibold block">Phase II: Clinical Consolidation</strong>
              <p className="text-muted-foreground">Connecting high-yield organ systems and clinical disciplines.</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/70 text-xs space-y-1">
              <strong className="text-primary font-semibold block">Phase III: Revision Orbit</strong>
              <p className="text-muted-foreground">Maintaining retention stability across all 19 subjects simultaneously.</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/70 text-xs space-y-1">
              <strong className="text-primary font-semibold block">Phase IV: Polaris Peak</strong>
              <p className="text-muted-foreground">Exam-ready peak retention across the entire curriculum.</p>
            </div>
          </div>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Fullscreen Immersion & Milestone Sharing</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tap the <strong>Atlas Sky card</strong> on the Home dashboard to enter fullscreen interactive mode. You can pan, zoom, and inspect individual star clusters. Tap <strong>"Share Constellation"</strong> to generate high-resolution, exportable visual storycards celebrating your preparation milestones.
          </p>
        </section>
      </div>
    )
  },
  {
    id: 'curriculum',
    title: 'Curriculum & Radar',
    icon: BookOpen,
    searchTerms: 'hierarchy subject system topic high-yield star study blocks radar 19 subjects modules',
    content: (
      <div className="space-y-8">
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Hierarchy: Subject ➔ System ➔ Topic</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Atlas organizes the medical curriculum into <strong>19 Subjects</strong>, broken down into organ systems and high-yield topics.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground flex items-center gap-2">
            The 19-Subject Medical Radar
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tap the <strong>Curriculum</strong> tab in the navigation bar to open the full macro-level <strong>Subject Radar</strong>. It displays completion rings, revision health, and systems needing attention across all 19 subjects simultaneously.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground flex items-center gap-2">
            High-Yield Star Tagging <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Starring a system as <strong>High-Yield</strong> applies a priority multiplier in the recommendation engine, ensuring essential topics surface frequently during exam sprints.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Custom Curriculum Blocks & Study Sets</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Group related topics (e.g., "Valvular Heart Disease + Infective Endocarditis") into custom study blocks with defined study depths (Rapid, Standard, or Deep).
          </p>
        </section>
      </div>
    )
  },
  {
    id: 'retention',
    title: 'Mastering Retention & Calibration',
    icon: BrainCircuit,
    searchTerms: 'confidence ratings memory decay calibration speed rapid standard deep module depth retrievability',
    content: (
      <div className="space-y-8">
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Honest Confidence Ratings</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When logging completion, rate your recall strictly. Guessing correctly on a Q-bank question without solid foundation should be logged as <strong>Weak</strong> to schedule an early review.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Per-System Retention Calibration</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Expand any system card in a subject to adjust its <strong>Retention Calibration</strong> dropdown:
          </p>
          <div className="bg-muted/40 border border-border/70 rounded-xl p-4 text-sm space-y-3 mt-3">
            <p className="flex items-start gap-2 text-foreground/90">
              <span className="text-primary font-bold">1.5x / 1.2x (Fast Decay):</span> 
              <span>Ideal for memory-volatile topics requiring frequent recall (e.g., Inborn Errors of Metabolism, Antimicrobial Spectra).</span>
            </p>
            <p className="flex items-start gap-2 text-foreground/90">
              <span className="text-primary font-bold">0.8x (Slow Decay):</span> 
              <span>Ideal for deeply conceptual, stable systems you retain effortlessly (e.g., General Pathology, Renal Physiology).</span>
            </p>
          </div>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Module Study Depth (Rapid / Standard / Deep)</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Curriculum sets can be configured with distinct study depths: <strong>Rapid Drill (~15m)</strong>, <strong>Standard (~30m)</strong>, or <strong>Deep Block (~60m)</strong>. The Knapsack recommendation engine automatically factors depth into your daily schedule.
          </p>
        </section>
      </div>
    )
  },
  {
    id: 'notebook',
    title: 'The 20th Notebook & Error Traps',
    icon: Award,
    searchTerms: '20th notebook mistake recovery queue clinical lenses DOC IOC triad criteria imaging histopath contraindicated twin distinction anki export',
    content: (
      <div className="space-y-8">
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">The 20th Notebook Philosophy</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            In Indian medical PG preparation, the legendary "20th Notebook" is where you distill high-yield volatile facts, repetitive traps, and clinical pearls across all 19 subjects. Atlas digitizes this into an actionable, searchable ledger.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">The 8 Clinical Lenses</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every logged mistake or pearl can be categorized with specialized medical lenses for high-yield filtering:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
            <div className="p-2.5 rounded-lg bg-card border border-border/70 text-xs">
              <strong className="text-emerald-500 font-semibold block mb-0.5">💊 DOC</strong>
              Drug of Choice & First-Line Regimens
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border/70 text-xs">
              <strong className="text-blue-500 font-semibold block mb-0.5">🔍 IOC</strong>
              Investigation of Choice & Gold Standards
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border/70 text-xs">
              <strong className="text-amber-500 font-semibold block mb-0.5">⚠️ Triad</strong>
              Classic Triads & Pathognomonic Signs
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border/70 text-xs">
              <strong className="text-purple-500 font-semibold block mb-0.5">📊 Criteria</strong>
              Diagnostic Criteria & Staging Systems
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border/70 text-xs">
              <strong className="text-cyan-500 font-semibold block mb-0.5">🩻 Imaging</strong>
              X-ray, CT, MRI & Ultrasound Findings
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border/70 text-xs">
              <strong className="text-pink-500 font-semibold block mb-0.5">🔬 Histopath</strong>
              Biopsy, Microscopy & Special Stains
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border/70 text-xs">
              <strong className="text-rose-500 font-semibold block mb-0.5">🚫 Contraindicated</strong>
              Absolute & Relative Clinical Contraindications
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border/70 text-xs">
              <strong className="text-indigo-500 font-semibold block mb-0.5">🔄 Twin Distinction</strong>
              High-yield look-alike & sound-alike differentials
            </div>
          </div>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">AI Flashcard Deck Synthesis (.tsv format)</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Turn your mistake logs into high-yield active-recall cards in one tap. Atlas uses clinical AI to synthesize raw question explanations and 20th Notebook pearls into crisp prompt-and-answer flashcard decks, complete with clinical lens tags, ready for export into any external spaced-repetition app.
          </p>
        </section>
      </div>
    )
  },
  {
    id: 'ai-copilot',
    title: 'Atlas Clinical AI & Voice Co-Pilot',
    icon: Bot,
    searchTerms: 'ai voice copilot dictation gemini byok clinical stem triage parser error traps socratic',
    content: (
      <div className="space-y-8">
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">The Ambient Medical Co-Pilot</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tap the floating emerald AI button on the Home Screen to open the <strong>Atlas Clinical AI Drawer</strong>. It functions as an interactive study partner, clinical stem extractor, and hands-free voice scribe.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">1-Tap Clinical Stem / Q-Bank Parser</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tap the <strong>Clipboard</strong> icon inside the AI drawer to paste complex question stems or explanations from your Q-bank. The AI automatically isolates the core diagnostic trap and generates a 1-tap card to log straight into your 20th Notebook.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Voice Dictation & Ambient Triage</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Switch to the <strong>Voice Co-Pilot</strong> tab or hold the microphone button to dictate notes, log mistake pearls verbally during post-test reviews, or query clinical differentials hands-free.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Privacy & Bring Your Own Key (BYOK)</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Connect your free Google AI Studio API Key in <strong>Settings ➔ Clinical AI & Voice</strong> to unlock Gemini 2.5 Flash / Pro intelligence with direct or Socratic clinical mentorship styles.
          </p>
        </section>
      </div>
    )
  },
  {
    id: 'power',
    title: 'Power User Features & Vault',
    icon: Sparkles,
    searchTerms: 'algorithm override pinning target icon focus mode exam profile horizon countdown json backup restore data vault',
    content: (
      <div className="space-y-8">
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Exam Profile & Horizon Countdown</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Set your target exam (NEET PG, INI-CET, FMGE, USMLE Step 1/2, or MBBS Proff) and exam date in <strong>Settings ➔ Target Exam & Horizon</strong>. The dashboard automatically calculates your daily question pace and revision velocity.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Focus Mode & Manual Pinning</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Need to prepare for a department posting or university internal exam? Click the <strong>Focus Mode</strong> (Target icon) to pin any subject or system as Primary or Secondary, temporarily overriding the automated algorithm.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Storage & Data Vault (Full JSON Backups)</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            In <strong>Settings ➔ Storage & Data Vault</strong>, you can export a full offline JSON backup of your entire curriculum progress, 20th notebook pearls, and revision history, or restore it onto any device with one tap.
          </p>
        </section>
      </div>
    )
  },
  {
    id: 'faq',
    title: 'Frequently Asked Questions',
    icon: HelpCircle,
    searchTerms: 'faq question answer help backup firebase recommendations decay retrievability focus mode triage text size',
    content: (
      <div className="space-y-6">
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Do I need to log every single flashcard I do?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            No! Atlas tracks macro-level mastery (Subjects & Systems), not micro-facts. Use it alongside your favorite Q-Banks and flashcards. Just rate your high-level retention for the entire system after your study block.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Does Atlas provide question banks or video lectures?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            No. Atlas is strictly a <strong>Curriculum Tracking & Spaced Revision OS</strong>. You use your preferred primary content sources (Marrow, Pre-PG, DAMS, Bhatia, First Aid, UWorld, Pathoma), and Atlas schedules your revision timings and mistake ledgers.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">How do I adjust text size or UI scaling?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Atlas fully supports native browser and OS scaling. Press <kbd className="font-mono bg-muted/60 px-1 py-0.5 rounded text-xs text-foreground font-semibold">⌘ +</kbd> / <kbd className="font-mono bg-muted/60 px-1 py-0.5 rounded text-xs text-foreground font-semibold">⌘ -</kbd> (or <kbd className="font-mono bg-muted/60 px-1 py-0.5 rounded text-xs text-foreground font-semibold">Ctrl +</kbd> / <kbd className="font-mono bg-muted/60 px-1 py-0.5 rounded text-xs text-foreground font-semibold">Ctrl -</kbd> on Windows), or pinch-to-zoom on mobile and tablet screens. All curriculum grids, medical charts, and clinical ledgers adapt smoothly.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Is my study data backed up?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Yes. Atlas features a <strong>dual-layer architecture</strong>: all data is stored with zero-latency in local IndexedDB and automatically synced to the cloud via Firebase when online. You can also generate complete JSON vault exports in Settings anytime.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">What is the "20th Notebook"?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            It is your unified mistake repository and high-yield pearl ledger across all 19 subjects, categorized with 8 clinical lenses (DOC, IOC, Triads, Diagnostic Criteria, Imaging, Histopath, Contraindications, and Twin Distinctions).
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">Can I export my mistakes as flashcards using AI?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Yes. In the 20th Notebook, use <strong>AI Flashcard Synthesis</strong> to automatically distill your logged errors and clinical pearls into structured, tag-preserved flashcard decks ready for download and offline spaced-repetition practice.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="text-base font-bold text-foreground">What happens if I miss several days of study?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Atlas automatically triggers <strong>Triage Mode</strong> after prolonged inactivity, reorganizing overdue reviews by yield and urgency without overwhelming you or punishing your stats.
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


