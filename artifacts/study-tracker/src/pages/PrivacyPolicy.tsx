import React from 'react';
import { Link, useLocation } from 'wouter';
import { Shield, ArrowLeft, Lock, Database, Eye, HardDrive, CheckCircle, Mail, Compass, Key, Cpu, Sparkles, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Navigation Header */}
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
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="border-b border-border/40 bg-muted/15 py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            Data Sovereignty & Security
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
            Atlas OS is built on a local-first architecture. Your revision logs, memory decay calibration, and study progress belong strictly to you.
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
        {/* Core Sovereignty Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Local-First Storage</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your study schedule, memory decay curves, and topic completion logs live natively on your device. Offline study is completely supported.
            </p>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">User-Isolated Cloud Sync</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Optional cloud synchronization uses strict Firebase Security Rules. Cloud backups are encrypted and accessible only by your authenticated user ID.
            </p>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Zero Commercial Data Sales</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We never sell your exam performance, study habits, or confidence scores to third-party data brokers, QBank vendors, or advertisers.
            </p>
          </div>
        </div>

        {/* Detailed Policy Sections */}
        <div className="space-y-6 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3 bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-primary font-bold text-base sm:text-lg">
              <Database className="w-5 h-5 shrink-0" />
              1. Information Collected & Processed
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              To answer <em className="text-foreground font-medium">"What should I study next?"</em> accurately, Atlas processes minimal educational metrics:
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground pt-1">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Authentication Credentials:</strong> Basic account email and unique authentication token provided via Google Auth or Firebase Auth upon login.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Study Progress & Memory Decay Metrics:</strong> Topic completion states, confidence scores, revision dates, QBank/PYQ tracking logs, and exam target timelines.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Trail Markers (Community Intelligence):</strong> Voluntary submissions of Clinical Pearls, Mnemonics & Tricks, Exam Pitfalls, and High-Yield Resource notes contributed to the community.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Technical Preferences:</strong> Theme choices (dark/light) and notification toggles saved locally in browser storage.</span>
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-primary font-bold text-base sm:text-lg">
              <Cpu className="w-5 h-5 shrink-0" />
              2. How Your Data Powers Intelligent Direction
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              Your study data is processed strictly to drive Atlas's core intelligent study algorithms:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground pt-1">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                <span>Calibrating the <strong className="text-foreground">Spaced Decay Study Routine (SDSR)</strong> engine to calculate real-time memory decay and highlight weak subjects before exam day.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                <span>Synchronizing your study progress across desktop, tablet, and mobile browsers when Firebase Cloud Sync is enabled.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                <span>Aggregating anonymized trail marker verification signals ("Verify Pearl") to highlight high-yield wisdom for candidates.</span>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-primary font-bold text-base sm:text-lg">
              <Key className="w-5 h-5 shrink-0" />
              3. Data Ownership & Total Export Rights
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              You maintain total sovereignty over your study data. Inside the <strong className="text-foreground">Settings</strong> tab, candidates can export their entire database as a structured JSON backup file at any time, restore backups from prior sessions, or perform a total local data wipe. You can disconnect cloud synchronization whenever desired without losing your local database.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-primary font-bold text-base sm:text-lg">
              <Mail className="w-5 h-5 shrink-0" />
              4. Privacy Enquiries & Support
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              For questions regarding privacy practices, account deletion, or data management in Atlas OS, visit our{' '}
              <Link href="/contact" className="text-primary font-semibold underline underline-offset-4 hover:text-primary/80">
                Contact Page
              </Link>{' '}
              to reach our technical team directly.
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
            <Link href="/privacy" className="text-foreground font-semibold">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

