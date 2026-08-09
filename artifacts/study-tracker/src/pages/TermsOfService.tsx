import React from 'react';
import { Link, useLocation } from 'wouter';
import { FileText, ArrowLeft, TriangleAlert, BookOpen, UserCheck, ShieldCheck, Scale, Compass } from 'lucide-react';
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
              className="gap-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
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
          <div className="flex items-center gap-3 text-xs">
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-border/40 bg-muted/20 py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5" />
            Beta User Agreement
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
            Please read these terms carefully before participating in the Atlas OS Closed Beta for medical examination prep.
          </p>
          <p className="text-xs text-muted-foreground/80 font-mono pt-1">
            Effective Date: August 5, 2026 • Atlas Closed Beta
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Important Warning Alert Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 sm:p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <TriangleAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200">Medical Education Disclaimer</h3>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
              Atlas OS is designed exclusively as an educational study management and spaced-repetition tracking tool for medical students and healthcare professionals preparing for board examinations (such as USMLE, NEET-PG, INI-CET, or MBBS profs). <strong className="font-semibold">It does NOT provide clinical advice, medical diagnoses, or patient treatment guidelines.</strong> Never use Atlas content for real clinical decision-making.
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          <section className="space-y-3 bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-primary font-bold text-lg">
              <BookOpen className="w-5 h-5" />
              1. Closed Beta Program & License
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              By accessing or creating an account on Atlas OS, you are granted a limited, non-exclusive, non-transferable, revocable license to access the application for personal educational prep during our closed beta phase.
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground pt-1">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                <span>Feature availability, UI layout, and spaced repetition algorithms are subject to active refinement based on user feedback.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                <span>We reserve the right to limit account quotas or invite codes to maintain server stability and moderation quality.</span>
              </li>
            </ul>
          </section>

          <section className="space-y-3 bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-primary font-bold text-lg">
              <UserCheck className="w-5 h-5" />
              2. User Conduct & Community Markers
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Atlas includes community marker submission tools allowing users to share high-yield clinical pearls and mnemonics. When submitting content, you agree:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground pt-1">
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>To submit accurate, constructive, and relevant study notes without copyright infringement or confidential patient data.</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>That community markers undergo automated and peer moderation; inappropriate submissions may be rejected or removed.</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Not to attempt unauthorized API access, database manipulation, or service disruption.</span>
              </li>
            </ul>
          </section>

          <section className="space-y-3 bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-primary font-bold text-lg">
              <FileText className="w-5 h-5" />
              3. Intellectual Property Rights
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              The Atlas OS logo, platform architecture, custom recommendation engine, design interface, and proprietary software code are protected by intellectual property laws. Your personal study logs remain your data, which you can export freely.
            </p>
          </section>

          <section className="space-y-3 bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-primary font-bold text-lg">
              <Scale className="w-5 h-5" />
              4. Limitation of Liability
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Atlas OS is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind. Under no circumstances shall Atlas or its contributors be held liable for exam outcomes, data loss resulting from cleared browser storage without backups, or temporary cloud sync service interruptions.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card py-8 px-4 sm:px-6 mt-12">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">Atlas OS</span>
            <span>© 2026. Closed Beta Terms.</span>
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
