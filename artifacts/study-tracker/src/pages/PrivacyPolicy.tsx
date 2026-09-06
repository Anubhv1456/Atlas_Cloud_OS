import React, { useState, useEffect } from 'react';

declare const __APP_VERSION__: string;
import { Link, useLocation } from 'wouter';
import {
  Shield,
  ArrowLeft,
  Lock,
  Database,
  Eye,
  HardDrive,
  CheckCircle2,
  Mail,
  Compass,
  Key,
  Cpu,
  Sparkles,
  Activity,
  Printer,
  Search,
  Copy,
  Check,
  ExternalLink,
  Globe,
  FileText,
  Server,
  UserCheck,
  HelpCircle,
  AlertTriangle,
  Download,
  Info,
  ChevronRight,
  ChevronDown
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
  { id: 'controller', number: '1.0', title: 'Scope & Data Controller', icon: Shield },
  { id: 'data-collected', number: '2.0', title: 'Categories of Data Collected', icon: Database },
  { id: 'legal-basis', number: '3.0', title: 'Purposes & Legal Basis', icon: FileText },
  { id: 'ai-voice', number: '4.0', title: 'AI & Voice Processing Protocols', icon: Cpu, badge: 'Zero-Training' },
  { id: 'subprocessors', number: '5.0', title: 'Subprocessors & Infrastructure', icon: Server },
  { id: 'local-first', number: '6.0', title: 'Local-First Storage & Cloud Sync', icon: HardDrive },
  { id: 'data-sharing', number: '7.0', title: 'Data Sharing & Non-Sale Pledge', icon: Lock },
  { id: 'regional-rights', number: '8.0', title: 'Regional Privacy Rights (GDPR/CCPA/DPDP)', icon: Globe, badge: 'Updated' },
  { id: 'retention-erasure', number: '9.0', title: 'Data Retention & 1-Click Erasure', icon: Key },
  { id: 'security', number: '10.0', title: 'Security Measures & Encryption', icon: CheckCircle2 },
  { id: 'children-students', number: '11.0', title: 'Student & Youth Privacy', icon: UserCheck },
  { id: 'cookies-telemetry', number: '12.0', title: 'Cookies & Browser Storage', icon: Info },
  { id: 'updates-contact', number: '13.0', title: 'Policy Updates & DPO Contact', icon: Mail },
];

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<string>('summary');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeRegionTab, setActiveRegionTab] = useState<'gdpr' | 'ccpa' | 'dpdp' | 'hipaa'>('gdpr');

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
    const url = `${window.location.origin}/privacy#${id}`;
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
                placeholder="Search policy..."
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

            <div className="flex items-center gap-3 text-xs font-medium">
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact DPO
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
              <Shield className="w-3.5 h-3.5" />
              Data Sovereignty & Privacy Protocol
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-medium">
              GDPR, CCPA & DPDP Compliant
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Privacy Policy
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base max-w-3xl leading-relaxed">
            Atlas OS operates on a local-first, zero-monetization paradigm. Your revision logs, memory decay calibration, clinical notes, and voice queries belong strictly to you.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-mono pt-2 border-t border-border/40 max-w-3xl">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Effective Date: January 1, 2026</span>
            </div>
            <span>•</span>
            <div>Last Updated: August 22, 2026</div>
            <span>•</span>
            <div>Version {typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.1.0"} (Enterprise Medical Edition)</div>
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
                <span className="text-xs font-mono text-muted-foreground">14 Clauses</span>
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
                        <span className={`font-mono text-xs shrink-0 ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground/70'}`}>
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
                  onClick={() => setLocation('/settings')}
                  className="w-full justify-start gap-2 h-8 text-xs font-medium rounded-xl border-border/60 hover:bg-muted"
                >
                  <Download className="w-3.5 h-3.5 text-primary" />
                  Export My Data (JSON)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/contact')}
                  className="w-full justify-start gap-2 h-8 text-xs font-medium rounded-xl border-border/60 hover:bg-muted"
                >
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  Contact Privacy Officer
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
                  placeholder="Search policy keywords..."
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

            {/* SECTION 0.0: EXECUTIVE SUMMARY / AT A GLANCE */}
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
                  title="Copy direct section link"
                >
                  {copiedSection === 'summary' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                For medical students, residency candidates, and doctors preparing for high-stakes examinations (MBBS, NEET PG, INICET, FMGE, NEXT, USMLE), study privacy and data control are paramount. Here is a plain-English overview of our privacy commitments:
              </p>

              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-2.5 shadow-xs hover:border-border transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">1. Local-First & Offline First</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your study records, topic status, QBank logs, and memory decay curves are stored natively on your local device. Full app functionality remains accessible offline without requiring an active internet connection.
                  </p>
                </div>

                <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-2.5 shadow-xs hover:border-border transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-purple-600 dark:text-primary flex items-center justify-center border border-purple-500/20">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">2. Zero Commercial Data Sales</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We never sell, rent, or trade your exam scores, study habits, confidence ratings, or personal metadata to third-party advertisers, data brokers, QBank vendors, or test preparation institutes.
                  </p>
                </div>

                <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-2.5 shadow-xs hover:border-border transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">3. Voice & AI Privacy Safeguards</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Audio input processed by the Voice Co-Pilot and Scribe is used purely for real-time transcription and study commands. Voice recordings are never stored on permanent servers or used to train foundational AI models.
                  </p>
                </div>

                <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-2.5 shadow-xs hover:border-border transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <Key className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">4. 1-Click Data Portability & Purge</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You maintain total ownership. At any time inside the Settings tab, you can download a complete structured JSON backup of your database or execute an immediate full wipe of local and cloud sync data.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 1.0: SCOPE & DATA CONTROLLER */}
            <section id="controller" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">1.0</span>
                    <h2 className="text-xl font-bold text-foreground">Scope & Data Controller Information</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('controller', 'Scope & Data Controller')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'controller' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <div className="prose prose-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  This Privacy Policy applies to all services, web applications, progressive web applications (PWA), APIs, and intelligent study modules provided under the brand <strong className="text-foreground font-semibold">Atlas Operating System ("Atlas OS", "we", "us", or "our")</strong>.
                </p>
                <p>
                  For the purpose of global data protection legislation (including the EU/UK General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA/CPRA), and the Digital Personal Data Protection Act 2023 (DPDP, India)), the Data Controller responsible for processing your personal data is:
                </p>
                <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-2 text-xs font-mono text-foreground">
                  <div><strong>Data Controller:</strong> Atlas OS Operating Team</div>
                  <div><strong>Specialized Domain:</strong> Medical Education & Exam Revision Intelligence</div>
                  <div><strong>Data Protection & Privacy Inquiries:</strong> Submit inquiries directly via our <Link href="/contact" className="text-primary font-semibold underline underline-offset-2">Contact Page</Link>.</div>
                </div>
              </div>
            </section>

            {/* SECTION 2.0: CATEGORIES OF DATA COLLECTED */}
            <section id="data-collected" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">2.0</span>
                    <h2 className="text-xl font-bold text-foreground">Categories of Data Collected & Processed</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('data-collected', 'Categories of Data Collected')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'data-collected' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Atlas OS collects only the minimal necessary data required to deliver intelligent study scheduling and answer <em className="text-foreground font-medium">"What should I study next?"</em> accurately:
              </p>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-2">
                  <div className="font-bold text-foreground flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-primary" />
                    A. Account & Authentication Credentials
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    When you create an account or authenticate using Google Single Sign-On (SSO) or Firebase Auth, we receive your email address, display name, profile avatar URL, and an encrypted authentication token. Password credentials are managed securely by Firebase Authentication and are never visible to or stored on Atlas OS servers.
                  </p>
                </div>

                <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-2">
                  <div className="font-bold text-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    B. Educational Metrics & Memory Decay Logs
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Topic completion timestamps, confidence ratings (1–5 scale), revision logs, QBank completion tallies, Previous Year Question (PYQ) tracking states, custom flashcards, study schedules, and target exam dates (e.g., NEET PG / INICET / USMLE test dates).
                  </p>
                </div>

                <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-2">
                  <div className="font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    C. Trail Markers & Peer Wisdom Contributions
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Voluntary candidate submissions of Clinical Pearls, High-Yield Mnemonics & Memory Tricks, Exam Pitfalls, and Resource Notes. When submitted to the public community, markers are tied to your pseudonymous display name or marked anonymous based on your selection.
                  </p>
                </div>

                <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-2">
                  <div className="font-bold text-foreground flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-primary" />
                    D. Audio Streams & Voice Input Data
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    When you activate the Voice Co-Pilot or Voice Scribe feature, your device's microphone captures real-time speech. Audio is processed via WebAudio API DSP (Digital Signal Processing) buffers and standard browser SpeechRecognition or server-side Gemini API endpoints. Speech audio streams are processed in-memory solely during active voice sessions and are discarded immediately upon session completion.
                  </p>
                </div>

                <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-2">
                  <div className="font-bold text-foreground flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    E. Technical Diagnostics & Device Information
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Browser type, operating system version, screen resolution, local storage health status, network connection type (offline/online state), and error logs necessary for system stability debugging.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 3.0: PURPOSES & LEGAL BASIS */}
            <section id="legal-basis" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">3.0</span>
                    <h2 className="text-xl font-bold text-foreground">Purposes & Legal Basis for Processing</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('legal-basis', 'Purposes & Legal Basis')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'legal-basis' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                <p>
                  Under international privacy frameworks (GDPR Art. 6), we process your personal data under the following recognized legal bases:
                </p>

                <div className="border border-border/60 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 font-bold text-foreground border-b border-border/60">
                      <tr>
                        <th className="p-3">Processing Purpose</th>
                        <th className="p-3">Data Categories</th>
                        <th className="p-3">GDPR Legal Basis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      <tr>
                        <td className="p-3 font-semibold text-foreground">Calibrating Memory Decay (SDSR Algorithm)</td>
                        <td className="p-3">Topic Confidence, Revision Logs</td>
                        <td className="p-3 text-primary font-mono">Contractual Necessity (Art. 6(1)(b))</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-foreground">Cross-Device Firebase Cloud Sync</td>
                        <td className="p-3">Account Credentials, Study Progress</td>
                        <td className="p-3 text-primary font-mono">User Consent (Art. 6(1)(a))</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-foreground">Voice Co-Pilot & Speech Command Execution</td>
                        <td className="p-3">In-Memory Audio Buffers, Transcripts</td>
                        <td className="p-3 text-primary font-mono">Explicit User Action / Consent</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-foreground">Trail Marker Peer Verification & Community Wisdom</td>
                        <td className="p-3">Submitted Pearls, Mnemonics, Flags</td>
                        <td className="p-3 text-primary font-mono">Legitimate Interests (Art. 6(1)(f))</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-foreground">Preventing System Abuse & Reverse Engineering</td>
                        <td className="p-3">Device Diagnostics, IP Logs</td>
                        <td className="p-3 text-primary font-mono">Legitimate Interests (Art. 6(1)(f))</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* SECTION 4.0: AI & VOICE PROCESSING PROTOCOLS */}
            <section id="ai-voice" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">4.0</span>
                    <h2 className="text-xl font-bold text-foreground">AI & Voice Processing Safeguards</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('ai-voice', 'AI & Voice Processing Safeguards')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'ai-voice' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  Strict Zero-Training Pledge for AI & Voice Streams
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Atlas OS integrates server-side Google Gemini API instances to power the Medical Study Co-Pilot, voice query understanding, and automated subject summarization.
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong className="text-foreground">No Foundational Model Training:</strong> Your private study notes, voice transcripts, chat queries, and performance metrics are NEVER used by Google or Atlas OS to train or fine-tune public foundation AI models.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong className="text-foreground">Transient Voice Buffers:</strong> Audio captured during voice co-pilot interaction is processed in volatile memory for acoustic noise reduction (DSP) and real-time intent parsing. Voice audio files are never stored permanently on disk.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong className="text-foreground">Encrypted Transport:</strong> All interactions with AI services occur over HTTPS/TLS 1.3 encrypted pipelines.</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* SECTION 5.0: SUBPROCESSORS & INFRASTRUCTURE */}
            <section id="subprocessors" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">5.0</span>
                    <h2 className="text-xl font-bold text-foreground">Subprocessors & Infrastructure Matrix</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('subprocessors', 'Subprocessors & Infrastructure')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'subprocessors' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                To provide high-availability infrastructure and cloud synchronization, Atlas OS utilizes vetted subprocessor services adhering to ISO 27001, SOC 2 Type II, and GDPR standards:
              </p>

              <div className="border border-border/60 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 font-bold text-foreground border-b border-border/60">
                    <tr>
                      <th className="p-3">Subprocessor</th>
                      <th className="p-3">Service Provided</th>
                      <th className="p-3">Data Location</th>
                      <th className="p-3">Compliance Guarantee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    <tr>
                      <td className="p-3 font-semibold text-foreground flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-primary" />
                        Google Cloud / Firebase
                      </td>
                      <td className="p-3">Cloud Firestore Sync, Authentication, Security Rules</td>
                      <td className="p-3 font-mono">United States / Global Regions</td>
                      <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">SOC 2, ISO 27001, GDPR DPA</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-foreground flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-primary" />
                        Google Gemini API
                      </td>
                      <td className="p-3">AI Co-Pilot Reasoning, Clinical Summaries</td>
                      <td className="p-3 font-mono">United States (Serverless)</td>
                      <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">Zero Data Retention Agreement</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-foreground flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-primary" />
                        Vercel Inc.
                      </td>
                      <td className="p-3">Edge Application Hosting & CDN Distribution</td>
                      <td className="p-3 font-mono">Global Edge Network</td>
                      <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">SOC 2 Type II, ISO 27001</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 6.0: LOCAL-FIRST STORAGE & CLOUD SYNC */}
            <section id="local-first" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">6.0</span>
                    <h2 className="text-xl font-bold text-foreground">Local-First Storage & Cloud Sync Security</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('local-first', 'Local-First Storage & Cloud Sync')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'local-first' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <div className="prose prose-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  Atlas OS is engineered around a <strong className="text-foreground font-semibold">Local-First Architecture</strong>. All revision schedules, subject progress logs, custom cards, and memory decay statistics are stored locally inside your browser's IndexedDB and localStorage storage engine.
                </p>
                <p>
                  When optional Firebase Cloud Sync is enabled:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                  <li>Data synced to Cloud Firestore is governed by strictly enforced <strong className="text-foreground">Firebase Security Rules</strong> (`request.auth.uid == userId`), preventing any unauthorized user or cross-tenant access.</li>
                  <li>Disabling Cloud Sync immediately severs cloud transmission, retaining your database exclusively on your local hardware.</li>
                </ul>
              </div>
            </section>

            {/* SECTION 7.0: DATA SHARING & NON-SALE PLEDGE */}
            <section id="data-sharing" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">7.0</span>
                    <h2 className="text-xl font-bold text-foreground">Data Sharing & Non-Sale Pledge</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('data-sharing', 'Data Sharing & Non-Sale Pledge')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'data-sharing' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-3">
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground font-semibold">Absolute Non-Sale Pledge:</strong> We do NOT sell, rent, lease, or monetize your personal information, exam target dates, study habits, confidence scores, or voice input.
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  We disclose personal data only under the following strict conditions:
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                    <span><strong className="text-foreground">Legal Obligations:</strong> If required by enforceable law, court order, subpoena, or government regulation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                    <span><strong className="text-foreground">Protection of Rights:</strong> To enforce our Terms of Service, prevent malicious bot attacks, or defend system integrity.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                    <span><strong className="text-foreground">Public Trail Markers:</strong> Content explicitly submitted to the community Trail Marker database is visible to other authenticated candidates.</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* SECTION 8.0: REGIONAL PRIVACY RIGHTS */}
            <section id="regional-rights" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">8.0</span>
                    <h2 className="text-xl font-bold text-foreground">Regional Privacy Rights & Global Standards</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('regional-rights', 'Regional Privacy Rights')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'regional-rights' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              {/* Regional Tabs */}
              <div className="space-y-4">
                <div className="flex gap-2 border-b border-border/60 pb-2 overflow-x-auto text-xs">
                  <button
                    onClick={() => setActiveRegionTab('gdpr')}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 cursor-pointer ${
                      activeRegionTab === 'gdpr'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    EU / UK GDPR Rights
                  </button>
                  <button
                    onClick={() => setActiveRegionTab('ccpa')}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 cursor-pointer ${
                      activeRegionTab === 'ccpa'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    California CCPA / CPRA
                  </button>
                  <button
                    onClick={() => setActiveRegionTab('dpdp')}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 cursor-pointer ${
                      activeRegionTab === 'dpdp'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    India DPDP Act 2023
                  </button>
                  <button
                    onClick={() => setActiveRegionTab('hipaa')}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 cursor-pointer ${
                      activeRegionTab === 'hipaa'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    HIPAA Non-PHI Notice
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="bg-card border border-border/80 rounded-2xl p-5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {activeRegionTab === 'gdpr' && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-foreground text-sm">EU & UK GDPR Candidate Rights</h4>
                      <p>Under Articles 15–22 of the GDPR, European and British users enjoy:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Right to Access (Art. 15):</strong> Request a copy of all personal data held about you.</li>
                        <li><strong>Right to Rectification (Art. 16):</strong> Correct inaccurate profile or study details.</li>
                        <li><strong>Right to Erasure ("Right to be Forgotten", Art. 17):</strong> Execute 1-click total data deletion in Settings.</li>
                        <li><strong>Right to Data Portability (Art. 20):</strong> Export your study database as a structured JSON file.</li>
                        <li><strong>Right to Object & Restrict Processing (Art. 18/21):</strong> Withdraw consent for cloud sync at any time.</li>
                      </ul>
                    </div>
                  )}

                  {activeRegionTab === 'ccpa' && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-foreground text-sm">California Consumer Privacy Act (CCPA / CPRA)</h4>
                      <p>California residents have specific statutory rights under California law:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Right to Know & Access:</strong> Access categories and specific pieces of personal information collected.</li>
                        <li><strong>Right to Opt-Out of Sale / Sharing:</strong> We do NOT sell or share personal information; no opt-out is necessary.</li>
                        <li><strong>Right to Non-Discrimination:</strong> Equal service and pricing regardless of privacy choice exercises.</li>
                        <li><strong>Shine the Light Law:</strong> We do not disclose personal information to third parties for direct marketing.</li>
                      </ul>
                    </div>
                  )}

                  {activeRegionTab === 'dpdp' && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-foreground text-sm">India Digital Personal Data Protection Act 2023 (DPDP)</h4>
                      <p>Tailored for Indian MBBS, NEET PG, INICET, FMGE & NEXT candidates:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Right to Summary of Data:</strong> View all synced study progress and account details.</li>
                        <li><strong>Right to Correction & Erasure:</strong> Clear local database and remove cloud synchronization records instantly.</li>
                        <li><strong>Grievance Redressal Mechanism:</strong> Submit requests directly through our <Link href="/contact" className="text-primary font-semibold underline underline-offset-2">Contact Page</Link> with guaranteed 48-hour acknowledgment.</li>
                      </ul>
                    </div>
                  )}

                  {activeRegionTab === 'hipaa' && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-foreground text-sm">HIPAA & Protected Health Information (PHI) Non-Applicability</h4>
                      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-3 rounded-xl">
                        <strong>Important Mandate:</strong> Atlas OS is an educational examination preparation application. It is NOT a Covered Entity or Business Associate under the Health Insurance Portability and Accountability Act (HIPAA). Users are strictly forbidden from uploading or including real patient health information (PHI), clinical medical records, or identifiable patient case details anywhere inside Atlas OS notes or Trail Markers.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* SECTION 9.0: RETENTION & ERASURE */}
            <section id="retention-erasure" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">9.0</span>
                    <h2 className="text-xl font-bold text-foreground">Data Retention & 1-Click Erasure Rights</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('retention-erasure', 'Data Retention & 1-Click Erasure')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'retention-erasure' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <div className="prose prose-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  We retain personal data only as long as necessary to fulfill your active study requirements and maintain cloud synchronization.
                </p>
                <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-3">
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Download className="w-4 h-4 text-primary" />
                    How to Export or Erase Your Data
                  </h4>
                  <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm">
                    <li>Navigate to the <strong className="text-foreground font-semibold">Settings</strong> tab inside Atlas OS.</li>
                    <li>Under <strong className="text-foreground">Data Management</strong>, click <strong className="text-primary font-semibold">Export JSON Backup</strong> to save an offline copy of your entire study database.</li>
                    <li>To delete your account and clear all local & cloud data, click <strong className="text-destructive font-semibold">Purge Local & Cloud Sync Data</strong>. This action permanently deletes your cloud records in Firebase Firestore within 24 hours.</li>
                  </ol>
                </div>
              </div>
            </section>

            {/* SECTION 10.0: SECURITY MEASURES */}
            <section id="security" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">10.0</span>
                    <h2 className="text-xl font-bold text-foreground">Technical & Organizational Security Measures</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('security', 'Technical & Organizational Security')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'security' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-1.5">
                  <div className="font-bold text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Encryption in Transit & At Rest
                  </div>
                  <p className="text-muted-foreground">
                    TLS 1.3 encryption enforced for all API traffic. Firebase Firestore cloud backups are encrypted at rest using AES-256.
                  </p>
                </div>

                <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-1.5">
                  <div className="font-bold text-foreground flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Strict Firebase Access Control
                  </div>
                  <p className="text-muted-foreground">
                    Zero-Trust Firestore Security Rules guarantee that no user can query or view another user's private study logs or schedules.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 11.0: STUDENT & YOUTH PRIVACY */}
            <section id="children-students" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">11.0</span>
                    <h2 className="text-xl font-bold text-foreground">Student & Youth Privacy Protections</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('children-students', 'Student & Youth Privacy')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'children-students' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Atlas OS is designed exclusively for medical students, healthcare professionals, and adult candidates (18 years or older). We do not knowingly collect or solicit personal data from children under 16 years of age (COPPA compliance). If we learn that personal information from a minor has been collected without parental verification, we will promptly delete that data.
              </p>
            </section>

            {/* SECTION 12.0: COOKIES & BROWSER STORAGE */}
            <section id="cookies-telemetry" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">12.0</span>
                    <h2 className="text-xl font-bold text-foreground">Cookies & Local Browser Storage</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('cookies-telemetry', 'Cookies & Local Browser Storage')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'cookies-telemetry' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <div className="prose prose-sm text-muted-foreground leading-relaxed space-y-2">
                <p>
                  Atlas OS does <strong className="text-foreground">NOT</strong> use third-party advertising tracking cookies, cross-site pixel trackers, or commercial marketing beacons.
                </p>
                <p>
                  We utilize essential browser storage mechanisms (`localStorage`, `sessionStorage`, and `IndexedDB`) strictly for operational purposes:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                  <li><strong>Essential Theme & UI Preference:</strong> Storing dark/light mode preference and active tab state.</li>
                  <li><strong>Local Database Engine:</strong> Storing offline revision logs and memory decay curves.</li>
                  <li><strong>Authentication Session:</strong> Storing secure Firebase Auth tokens to maintain your login session.</li>
                </ul>
              </div>
            </section>

            {/* SECTION 13.0: UPDATES & CONTACT */}
            <section id="updates-contact" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-primary">13.0</span>
                    <h2 className="text-xl font-bold text-foreground">Policy Updates & Data Protection Contact</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copySectionLink('updates-contact', 'Policy Updates & Contact')}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === 'updates-contact' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-4">
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy periodically to reflect technological advancements, algorithm optimizations, or statutory legal requirements. Significant modifications will be announced via an in-app system notification or banner.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-border/60">
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-foreground">Have questions regarding your privacy rights?</div>
                    <div className="text-muted-foreground">Our Data Protection Officer reviews all inquiries within 48 hours.</div>
                  </div>
                  <Button
                    onClick={() => setLocation('/contact')}
                    className="gap-2 rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Contact Privacy Team
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
            <Link href="/privacy" className="text-foreground font-semibold">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact DPO</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
