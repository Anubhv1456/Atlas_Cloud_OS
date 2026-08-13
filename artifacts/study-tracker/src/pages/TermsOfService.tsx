import React from 'react';
import { Link, useLocation } from 'wouter';
import { FileText, ArrowLeft, TriangleAlert, BookOpen, UserCheck, ShieldCheck, Scale, Compass, Sparkles, Activity, Layers, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsOfService() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.length > 1 ? window.history.back() : setLocation('/')}
              className="gap-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="h-4 w-px bg-border/60 hidden sm:block" />
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Compass className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold tracking-tight text-sm">Atlas OS</span>
            </Link>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div className="border-b border-border/40 bg-muted/15 py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            Operating System Terms
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Terms & Operating Principles</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
            Governing rules for candidate participation, trail marker wisdom, automated spaced decay calibration, and intelligent study direction within Atlas OS.
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground/80 font-mono pt-1">
            <span>Version 2.4</span>
            <span>•</span>
            <span>Tailored for MBBS, NEET PG, INICET, FMGE & USMLE Candidates</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Medical Education & Clinical Scope Notice */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 sm:p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Activity className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              Medical Education & Exam Prep Scope
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Atlas OS is engineered exclusively as an <strong className="text-foreground font-semibold">Intelligent Medical Study Operating System</strong> for medical students and residency aspirants preparing for competitive examinations (including MBBS Professional Exams, NEET PG, INI-CET, FMGE, NEXT, and USMLE). Atlas provides curriculum intelligence, spaced revision scheduling, and memory decay tracking. <strong className="text-foreground font-semibold">It does NOT provide clinical diagnosis, patient management guidelines, or real-time medical decision support.</strong> Never utilize Atlas for patient care.
            </p>
          </div>
        </div>

        {/* Operating Terms Grid / Sections */}
        <div className="space-y-6 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3 bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-primary font-bold text-base sm:text-lg">
              <BookOpen className="w-5 h-5 shrink-0" />
              1. Operating License & Purposeful Access
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              Atlas OS grants you a personal, non-exclusive, non-transferable, revocable license to access the operating system for medical examination preparation. Every feature within Atlas is built to answer one central question: <em className="text-foreground font-medium">"What should I study next?"</em>
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground pt-1">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                <span>You agree to use Atlas OS solely for personal academic advancement, structured revision, and self-directed study management.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                <span>System updates, memory decay algorithms (SDSR), and subject-system-topic ontology structures are continuously optimized to improve retention and study velocity.</span>
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-primary font-bold text-base sm:text-lg">
              <Sparkles className="w-5 h-5 shrink-0" />
              2. Trail Markers & Peer Verification Philosophy
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              Atlas includes candidate-contributed <strong className="text-foreground font-semibold">Trail Markers</strong> (Clinical Pearls, Mnemonics & Tricks, Exam Pitfalls, and High-Yield Resources). Trail Markers represent guidance left along a difficult learning path for future candidates.
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground pt-1">
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>No Vanity Metrics or Distractions:</strong> Atlas contains no endless social feeds, vanity karma, or speculative chatter. Markers must be high-yield medical insights.</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Peer Verification:</strong> Submissions undergo candidate verification ("Verify Pearl") and automated moderation. Markers flagged as inaccurate or low quality will be archived.</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Copyright & Patient Privacy Compliance:</strong> You warrant that your markers contain no copyrighted text, verbatim question bank stems, or confidential patient health information (PHI).</span>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-primary font-bold text-base sm:text-lg">
              <Layers className="w-5 h-5 shrink-0" />
              3. Curriculum Intelligence & Data Ownership
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              Atlas structures medical education across <strong className="text-foreground">Subjects → Systems → Topics → Content → QBanks → PYQs → Revisions</strong>.
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground pt-1">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                <span><strong>Your Study Logs:</strong> Your personal completion history, confidence ratings, revision timestamps, and custom notes belong entirely to you and can be exported at any time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                <span><strong>Atlas Core IP:</strong> The recommendation algorithms, Spaced Decay Study Routine engine, interface designs, software architecture, and ontology hierarchy are the exclusive intellectual property of Atlas OS.</span>
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-primary font-bold text-base sm:text-lg">
              <Lock className="w-5 h-5 shrink-0" />
              4. Third-Party Ecosystem & Non-Affiliation Disclaimer
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              Atlas OS operates as an independent, platform-agnostic study operating system that helps candidates schedule and direct their revision across their chosen study resources.
            </p>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed bg-muted/30 p-4 rounded-xl border border-border/50">
              Atlas OS is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Marrow®, PrepLadder®, UWorld LLC, First Aid® (McGraw Hill), Pathoma®, DAMS®, Bhatia®, DBPCI®, or any of their subsidiaries or affiliates. All product names, logos, and registered trademarks belong strictly to their respective trademark holders.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-primary font-bold text-base sm:text-lg">
              <Scale className="w-5 h-5 shrink-0" />
              5. Limitation of Liability & Exam Outcome Disclaimer
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              Atlas OS is provided on an "AS IS" and "AS AVAILABLE" basis. While our recommendation engine and Spaced Decay algorithms are mathematically designed to optimize memory retention and focus attention on weak subjects, examination results ultimately depend on individual effort and clinical preparation. Under no circumstances shall Atlas or its maintainers be liable for specific examination scores, rank outcomes, or local device data loss resulting from unbacked browser storage resets.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-primary font-bold text-base sm:text-lg">
              <UserCheck className="w-5 h-5 shrink-0" />
              6. Account Integrity & System Security
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              Candidates are responsible for maintaining the confidentiality of their account credentials and cloud synchronization states. Attempting automated scraping, server disruption, reverse engineering, or unauthorized API exploitation is strictly prohibited and will result in permanent account termination.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card py-8 px-4 sm:px-6 mt-12">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">Atlas Operating System</span>
            <span>© 2026. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-foreground font-semibold">Terms of Service</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

