import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  FileText,
  ArrowLeft,
  BookOpen,
  UserCheck,
  ShieldCheck,
  Scale,
  Compass,
  Sparkles,
  Activity,
  Layers,
  Lock,
  Printer,
  Search,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Server,
  AlertTriangle,
  Mail,
  Shield,
  HelpCircle,
  Zap,
  Ban,
  Building2,
  Download,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Section {
  id: string;
  number: string;
  title: string;
  icon: React.ElementType;
  badge?: string;
}

const SECTIONS: Section[] = [
  { id: 'summary', number: '0.0', title: 'Executive Summary', icon: Sparkles, badge: 'TL;DR' },
  { id: 'scope-disclaimer', number: '1.0', title: 'Medical Education Scope & Non-Clinical Disclaimer', icon: Activity, badge: 'Crucial' },
  { id: 'license', number: '2.0', title: 'Operating License & Purposeful Access', icon: BookOpen },
  { id: 'trail-markers', number: '3.0', title: 'Trail Markers & Peer Wisdom Standards', icon: ShieldCheck },
  { id: 'ai-copilot', number: '4.0', title: 'AI Co-Pilot & Voice Assistant Usage Terms', icon: Zap },
  { id: 'curriculum-ip', number: '5.0', title: 'Curriculum Intelligence & Intellectual Property', icon: Layers },
  { id: 'trademarks', number: '6.0', title: 'Third-Party Ecosystem & Non-Affiliation', icon: Building2, badge: 'Disclaimers' },
  { id: 'cloud-sync', number: '7.0', title: 'Cloud Sync & Account Integrity', icon: Lock },
  { id: 'prohibited', number: '8.0', title: 'Prohibited Conduct & System Security', icon: Ban },
  { id: 'disclaimer-warranties', number: '9.0', title: 'Disclaimer of Warranties ("AS IS")', icon: AlertTriangle },
  { id: 'limitation-liability', number: '10.0', title: 'Limitation of Liability & Exam Outcomes', icon: Scale },
  { id: 'indemnification', number: '11.0', title: 'Indemnification Obligations', icon: Shield },
  { id: 'governing-law', number: '12.0', title: 'Governing Law & Dispute Resolution', icon: Globe },
  { id: 'modifications-contact', number: '13.0', title: 'Term Modifications & Legal Notice', icon: Mail },
];

export default function TermsOfService() {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<string>('summary');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const element = document.getElementById(SECTIONS[i].id);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 90;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const copySectionLink = (id: string, title: string) => {
    const url = `${window.location.origin}/terms#${id}`;
    navigator.clipboard.writeText(url);
    setCopiedSection(id);
    toast.success(`Copied link to "${title}"`, {
      description: 'URL copied to your clipboard.',
    });
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredSections = searchQuery.trim()
    ? SECTIONS.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.number.includes(searchQuery)
      )
    : SECTIONS;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 print:bg-white print:text-black">
      {/* Navigation Header */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-md sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
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
              <div className="w-7.5 h-7.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Compass className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold tracking-tight text-sm hidden xs:inline">Atlas OS</span>
            </Link>
          </div>

          {/* Quick Search & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-36 sm:w-64 hidden md:block">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs rounded-xl bg-muted/40 border-border/60 focus:bg-background"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 h-8 text-xs font-medium rounded-xl border-border/60 hover:bg-muted"
            >
              <Printer className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Print Document</span>
            </Button>

            <div className="h-4 w-px bg-border/60 hidden sm:block" />

            <div className="flex items-center gap-4 text-xs font-medium">
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
                Privacy Policy
              </Link>
              <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact Legal
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="border-b border-border/40 bg-gradient-to-b from-muted/30 via-muted/10 to-background py-10 sm:py-14 px-4 sm:px-6 print:py-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              Medical Operating Agreement
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-mono font-medium">
              Enterprise Terms v2.4
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Terms & Operating Principles
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base max-w-3xl leading-relaxed">
            Governing rules for medical candidate participation, trail marker wisdom, automated spaced decay calibration, AI co-pilot usage, and intelligent study direction within Atlas OS.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-mono pt-2 border-t border-border/40 max-w-3xl">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Effective Date: January 1, 2026</span>
            </div>
            <span>•</span>
            <div>Last Updated: August 22, 2026</div>
            <span>•</span>
            <div>Tailored for MBBS, NEET PG, INICET, FMGE & USMLE Candidates</div>
          </div>
        </div>
      </div>

      {/* Main Container with Sidebar + Content */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* Sticky Left Navigation Sidebar (Desktop) */}
          <aside className="lg:w-64 shrink-0 hidden lg:block print:hidden">
            <div className="sticky top-24 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  Table of Contents
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">14 Clauses</span>
              </div>

              <nav className="space-y-0.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 text-xs">
                {filteredSections.map((s) => {
                  const Icon = s.icon;
                  const isActive = activeSection === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => scrollToSection(s.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all group cursor-pointer ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`font-mono text-[10px] shrink-0 ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground/70'}`}>
                          {s.number}
                        </span>
                        <span className="truncate">{s.title}</span>
                      </div>
                      {s.badge && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono shrink-0 ml-1 ${
                          isActive
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                          {s.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Sidebar Action Buttons */}
              <div className="pt-4 border-t border-border/60 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/privacy')}
                  className="w-full justify-start gap-2 h-8 text-xs font-medium rounded-xl border-border/60 hover:bg-muted"
                >
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  View Privacy Policy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/contact')}
                  className="w-full justify-start gap-2 h-8 text-xs font-medium rounded-xl border-border/60 hover:bg-muted"
                >
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  Contact Legal Support
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Legal Content Column */}
          <main className="flex-1 min-w-0 space-y-10">
            
            {/* Mobile Table of Contents Bar */}
            <div className="lg:hidden bg-card border border-border/80 rounded-2xl p-4 shadow-xs space-y-3 print:hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  Jump to Section
                </span>
                <span className="text-xs font-mono text-muted-foreground">Scroll to view</span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search terms keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs rounded-xl bg-muted/40 border-border/60"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                {filteredSections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-xl border text-xs font-medium shrink-0 cursor-pointer ${
                      activeSection === s.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/30 border-border/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s.number} {s.title}
                  </button>
                ))}
              </div>
            </div>

            {/* SECTION 0.0: EXECUTIVE SUMMARY */}
            <section id="summary" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">0.0</span>
                    <h2 className="text-xl font-bold text-foreground">Executive Summary (TL;DR)</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('summary', 'Executive Summary')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'summary' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Atlas OS is an intelligent medical study operating system built to streamline revision, memory decay tracking, and exam preparation. By accessing or using Atlas OS, you agree to these fundamental operating terms:
              </p>

              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-2.5 shadow-xs hover:border-border transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">1. Strictly Non-Clinical Study Tool</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Atlas OS is strictly engineered for academic examination preparation. It is NOT a clinical decision support system, diagnostic guide, or medical therapy protocol. Never use Atlas OS for real patient care.
                  </p>
                </div>

                <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-2.5 shadow-xs hover:border-border transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">2. High-Yield Peer Wisdom Standards</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Trail Markers (Clinical Pearls, Mnemonics & High-Yield Notes) contributed by candidates must be high-yield and original. Copyrighted QBank stems and real patient health information (PHI) are strictly banned.
                  </p>
                </div>

                <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-2.5 shadow-xs hover:border-border transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">3. Total Data Ownership</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You own 100% of your notes, custom schedules, and study logs. You can export a complete JSON backup or purge your account records at any time.
                  </p>
                </div>

                <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-2.5 shadow-xs hover:border-border transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-purple-600 dark:text-primary flex items-center justify-center border border-purple-500/20">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">4. Fully Independent Platform</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Atlas OS is an independent study operating system and is not affiliated with, endorsed by, or connected to any third-party question banks, medical review courses, or examination boards.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 1.0: MEDICAL EDUCATION & NON-CLINICAL DISCLAIMER */}
            <section id="scope-disclaimer" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">1.0</span>
                    <h2 className="text-xl font-bold text-foreground">Medical Education Scope & Non-Clinical Disclaimer</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('scope-disclaimer', 'Medical Scope & Disclaimer')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'scope-disclaimer' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              {/* CRITICAL WARNING BANNER */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 sm:p-6 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-base">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  Mandatory Non-Clinical Medical Disclaimer
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Atlas OS is engineered exclusively as an <strong className="text-foreground font-semibold">Intelligent Study Operating System</strong> for medical students, residency aspirants, and doctors preparing for competitive professional examinations (including MBBS Professional Exams, NEET PG, INI-CET, FMGE, NEXT, USMLE, and PLAB).
                </p>
                <div className="bg-background border border-border/80 rounded-xl p-4 text-xs sm:text-sm font-medium text-foreground space-y-1.5">
                  <div className="text-destructive font-bold flex items-center gap-1.5">
                    <Ban className="w-4 h-4 shrink-0" />
                    ABSOLUTE CLINICAL PROHIBITION:
                  </div>
                  <p className="text-muted-foreground leading-relaxed font-normal">
                    Atlas OS, its AI Co-Pilot, memory decay algorithms, and community Trail Markers do NOT provide medical diagnosis, clinical decision support, dosage calculations, or direct patient care advice. Under no circumstances should any information within Atlas OS be used to diagnose, manage, or treat real patients in a clinical setting.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 2.0: OPERATING LICENSE */}
            <section id="license" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">2.0</span>
                    <h2 className="text-xl font-bold text-foreground">Operating License & Purposeful Access</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('license', 'Operating License')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'license' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <div className="prose prose-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  Subject to your compliance with these Terms, Atlas OS grants you a personal, non-exclusive, non-transferable, revocable, worldwide license to access and use the software for personal academic revision and medical exam preparation.
                </p>
                <p>
                  Every feature inside Atlas OS is constructed to answer one central candidate question: <em className="text-foreground font-medium">"What should I study next?"</em> You agree not to use the operating system for commercial syndication, automated scraping, or unauthorized resale.
                </p>
              </div>
            </section>

            {/* SECTION 3.0: TRAIL MARKERS & PEER WISDOM */}
            <section id="trail-markers" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">3.0</span>
                    <h2 className="text-xl font-bold text-foreground">Trail Markers & Peer Wisdom Standards</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('trail-markers', 'Trail Markers Standards')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'trail-markers' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Atlas OS includes a collaborative candidate wisdom repository named <strong className="text-foreground font-semibold">Trail Markers</strong> (Clinical Pearls, High-Yield Mnemonics, Exam Pitfalls, and High-Yield Resource notes).
              </p>

              <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-3 text-xs sm:text-sm">
                <div className="font-bold text-foreground flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  Community Content Mandate:
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                    <span><strong className="text-foreground">Originality & Non-Infringement:</strong> Candidates warrant that all submitted Trail Markers are original summaries, open clinical pearls, or high-yield memory devices. Verbatim posting of copyrighted question bank stems or propriety material from third-party educational providers is strictly prohibited.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                    <span><strong className="text-foreground">Zero Protected Health Information (PHI):</strong> You agree never to submit real patient clinical details, medical record numbers, or identifiable hospital case histories.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                    <span><strong className="text-foreground">Peer Verification & Moderation:</strong> Submissions are subject to candidate verification ("Verify Pearl") and automated moderation. Inaccurate, low-yield, or spam markers will be removed.</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* SECTION 4.0: AI CO-PILOT & VOICE TERMS */}
            <section id="ai-copilot" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">4.0</span>
                    <h2 className="text-xl font-bold text-foreground">AI Co-Pilot & Voice Assistant Usage Terms</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('ai-copilot', 'AI Co-Pilot Usage Terms')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'ai-copilot' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <div className="prose prose-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  Atlas OS incorporates generative AI capabilities (powered by Google Gemini models) for real-time study query answering, voice command transcription, and concept summarization.
                </p>
                <div className="bg-card border border-border/80 rounded-2xl p-4 text-xs sm:text-sm space-y-2">
                  <div className="font-bold text-foreground flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    AI Model Response Verification Notice:
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    While generative AI models are continuously optimized for medical accuracy, artificial intelligence can occasionally produce incorrect facts, outdated clinical references, or plausible hallucinations. <strong className="text-foreground">Candidates must always verify high-stakes medical concepts against standard primary medical textbooks</strong> (e.g., Harrison's Principles of Internal Medicine, Robbins Pathology, Bailey & Love's Surgery, First Aid) or official examination syllabi.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 5.0: CURRICULUM INTELLIGENCE & IP */}
            <section id="curriculum-ip" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">5.0</span>
                    <h2 className="text-xl font-bold text-foreground">Curriculum Intelligence & Intellectual Property</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('curriculum-ip', 'Curriculum IP')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'curriculum-ip' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <div className="prose prose-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  Atlas OS structures medical curricula across <strong className="text-foreground font-semibold">Subjects → Systems → Topics → Content → QBanks → PYQs → Revisions</strong>.
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                  <li><strong className="text-foreground font-semibold">Your User Content:</strong> You retain 100% intellectual property ownership over all personal study notes, flashcards, and custom schedules created inside Atlas OS.</li>
                  <li><strong className="text-foreground font-semibold">Atlas Core IP:</strong> The Spaced Decay Study Routine (SDSR) recommendation algorithms, software codebase, medical ontology structure, UI layout, and brand trademarks remain the exclusive intellectual property of Atlas OS.</li>
                </ul>
              </div>
            </section>

            {/* SECTION 6.0: TRADEMARKS & NON-AFFILIATION */}
            <section id="trademarks" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">6.0</span>
                    <h2 className="text-xl font-bold text-foreground">Third-Party Ecosystem & Non-Affiliation Disclaimers</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('trademarks', 'Third-Party Disclaimers')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'trademarks' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Atlas OS operates as an independent, platform-agnostic study operating system designed to help candidates organize, track, and schedule their revision across their own educational materials.
              </p>

              {/* Generic Non-Affiliation Box */}
              <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-3 text-xs leading-relaxed">
                <div className="font-bold text-foreground text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  General Non-Affiliation & Trademark Statement
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                  Atlas OS is an independent software tool and is NOT affiliated, associated, authorized, endorsed by, or in any way officially connected with any third-party question banks, medical review platforms, educational test-prep providers, publishers, or official examination boards.
                </p>
                <p className="text-muted-foreground/80 text-[11px] pt-2 border-t border-border/50 italic">
                  All third-party product names, logos, brands, trademarks, and registered trademarks referenced by candidates or within study materials belong strictly to their respective owners. Mention of any study resources or examination types within Atlas OS is solely for descriptive or organization purposes within candidates' individual study schedules.
                </p>
              </div>
            </section>

            {/* SECTION 7.0: CLOUD SYNC & ACCOUNT INTEGRITY */}
            <section id="cloud-sync" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">7.0</span>
                    <h2 className="text-xl font-bold text-foreground">Cloud Synchronization & Account Security</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('cloud-sync', 'Cloud Sync & Account Security')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'cloud-sync' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <div className="prose prose-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  When Cloud Sync is enabled, your study data synchronizes across your authorized devices using Google Firebase Cloud Firestore. Candidates are responsible for maintaining the confidentiality of their authentication credentials and restricting access to their personal devices.
                </p>
              </div>
            </section>

            {/* SECTION 8.0: PROHIBITED CONDUCT */}
            <section id="prohibited" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Ban className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">8.0</span>
                    <h2 className="text-xl font-bold text-foreground">Prohibited Conduct & System Security</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('prohibited', 'Prohibited Conduct')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'prohibited' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
                <p className="font-bold text-foreground">You agree NOT to engage in any of the following prohibited activities:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Automated scraping, bulk data extraction, or bot traffic targeting Atlas OS endpoints.</li>
                  <li>Attempting to bypass Firebase Security Rules or access another user's encrypted cloud records.</li>
                  <li>Reverse engineering, decompiling, or attempting to extract proprietary SDSR algorithm source code.</li>
                  <li>Submitting spam, copyrighted question bank stems, or Protected Health Information (PHI) in Trail Markers.</li>
                </ul>
              </div>
            </section>

            {/* SECTION 9.0: DISCLAIMER OF WARRANTIES */}
            <section id="disclaimer-warranties" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">9.0</span>
                    <h2 className="text-xl font-bold text-foreground">Disclaimer of Warranties ("AS IS" & "AS AVAILABLE")</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('disclaimer-warranties', 'Disclaimer of Warranties')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'disclaimer-warranties' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <div className="prose prose-sm text-muted-foreground leading-relaxed space-y-3 uppercase text-xs font-mono">
                <p className="bg-muted/30 p-4 rounded-xl border border-border/60">
                  ATLAS OS IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
                </p>
              </div>
            </section>

            {/* SECTION 10.0: LIMITATION OF LIABILITY */}
            <section id="limitation-liability" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">10.0</span>
                    <h2 className="text-xl font-bold text-foreground">Limitation of Liability & Exam Outcome Disclaimer</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('limitation-liability', 'Limitation of Liability')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'limitation-liability' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <div className="prose prose-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  To the maximum extent permitted by applicable law, Atlas OS, its creators, developers, and maintainers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or academic opportunities resulting from your use of or inability to use the service.
                </p>
                <div className="bg-card border border-border/80 rounded-2xl p-4 text-xs sm:text-sm space-y-2">
                  <div className="font-bold text-foreground">Examination Performance & Rank Disclaimer:</div>
                  <p className="text-muted-foreground leading-relaxed">
                    While Atlas OS recommendation algorithms are mathematically designed to optimize memory retention, final examination performance, ranks, percentiles, and medical licensing outcomes depend entirely on individual student preparation, effort, and exam day execution. Atlas OS makes no warranty or guarantee regarding specific exam pass rates or rank achievements.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 11.0: INDEMNIFICATION */}
            <section id="indemnification" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">11.0</span>
                    <h2 className="text-xl font-bold text-foreground">Indemnification Obligations</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('indemnification', 'Indemnification')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'indemnification' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                You agree to defend, indemnify, and hold harmless Atlas OS, its operators, and affiliates from and against any claims, liabilities, damages, judgments, awards, losses, costs, or expenses (including reasonable legal fees) arising out of or relating to your violation of these Terms or your submission of illegal PHI or copyrighted content.
              </p>
            </section>

            {/* SECTION 12.0: GOVERNING LAW & ARBITRATION */}
            <section id="governing-law" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">12.0</span>
                    <h2 className="text-xl font-bold text-foreground">Governing Law & Dispute Resolution</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('governing-law', 'Governing Law')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'governing-law' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the applicable operating jurisdiction, without regard to its conflict of law principles. Any dispute or claim arising out of or in connection with these Terms shall be resolved through binding confidential arbitration or competent local courts.
              </p>
            </section>

            {/* SECTION 13.0: MODIFICATIONS & CONTACT */}
            <section id="modifications-contact" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">13.0</span>
                    <h2 className="text-xl font-bold text-foreground">Term Modifications & Legal Notice Channel</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('modifications-contact', 'Term Modifications & Contact')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'modifications-contact' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-4">
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  We reserve the right to modify these Operating Terms at any time. Material updates will be published on this page with a revised "Last Updated" timestamp. Continued use of Atlas OS after any modifications constitutes acceptance of the updated Terms.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-border/60">
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-foreground">Need legal clarification or want to report content?</div>
                    <div className="text-muted-foreground">Contact our legal support team for assistance.</div>
                  </div>
                  <Button
                    onClick={() => setLocation('/contact')}
                    className="gap-2 rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Contact Legal Team
                  </Button>
                </div>
              </div>
            </section>

          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card py-8 px-4 sm:px-6 mt-16 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">Atlas Operating System</span>
            <span>© 2026. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-foreground font-semibold">Terms of Service</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact Legal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
