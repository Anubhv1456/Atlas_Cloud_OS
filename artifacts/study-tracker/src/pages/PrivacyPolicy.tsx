import React from 'react';
import { Link, useLocation } from 'wouter';
import { Shield, ArrowLeft, Lock, Database, Eye, HardDrive, CheckCircle, Mail, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
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
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            Data Protection & Privacy
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
            Atlas OS is built with a local-first architecture. Your medical study logs, confidence ratings, and schedule data belong entirely to you.
          </p>
          <p className="text-xs text-muted-foreground/80 font-mono pt-1">
            Last Updated: August 5, 2026 • Version 1.0 (Closed Beta)
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Core Commitments Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm">Local-First Storage</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All your study records are stored directly on your device in IndexedDB. Offline mode is fully functional.
            </p>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm">End-to-End Firebase Security</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Cloud backups are isolated by user ID with strict Firestore Security Rules. Only authenticated accounts access their synced data.
            </p>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm">Zero Data Sales</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We never sell your personal information, test scores, or study habits to third-party data brokers or advertisers.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          <section className="space-y-3 bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-primary font-bold text-lg">
              <Database className="w-5 h-5" />
              1. Information We Collect
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              To provide a seamless spaced-repetition tracking experience, Atlas collects minimal data:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Account Credentials:</strong> Email address and authentication tokens provided when signing in via Google Auth or Email Login.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Study Progress & Metrics:</strong> Topic completion states, confidence ratings, system revision history, PYQ accuracy logs, and test score logs.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Community Contributions:</strong> Clinical pearls, high-yield markers, and helpful feedback votes submitted to the shared Atlas repository.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Technical Preferences:</strong> Theme configuration (dark/light), PWA installation flags, and notification preferences saved locally in browser storage.</span>
              </li>
            </ul>
          </section>

          <section className="space-y-3 bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-primary font-bold text-lg">
              <Shield className="w-5 h-5" />
              2. How Your Data Is Used
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              We process your data strictly to deliver core study-tracker functionalities:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                <span>Calculating optimal spaced-repetition schedules and priority recommendations for medical exam prep.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                <span>Synchronizing your study history across devices when you enable Firebase Cloud Sync.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                <span>Generating aggregated, anonymous analytics for system mastery trends and score progression.</span>
              </li>
            </ul>
          </section>

          <section className="space-y-3 bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-primary font-bold text-lg">
              <Lock className="w-5 h-5" />
              3. Data Control & Export Options
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              You retain total ownership over your data. In the <strong className="text-foreground">Settings</strong> tab, you can export your entire database as a JSON backup file at any time, import legacy study backups, or perform a total local data reset. You may also disconnect or delete cloud backups without losing local browser access.
            </p>
          </section>

          <section className="space-y-3 bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-primary font-bold text-lg">
              <Mail className="w-5 h-5" />
              4. Contact Us
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              If you have any questions regarding our privacy practices or data handling policies during the closed beta, please reach out via our{' '}
              <Link href="/contact" className="text-primary font-semibold underline underline-offset-4 hover:text-primary/80">
                Contact Page
              </Link>{' '}
              or email support directly.
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
            <span>© 2026. Medical Education Assistant.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-foreground font-semibold">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
