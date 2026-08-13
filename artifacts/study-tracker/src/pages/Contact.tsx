import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  ArrowLeft, 
  Send as SendIcon, 
  CheckCircle2, 
  MessageSquare, 
  HelpCircle, 
  Compass, 
  Sparkles, 
  Bug, 
  Lightbulb, 
  Clock, 
  Twitter, 
  Github, 
  Linkedin, 
  Youtube, 
  Instagram, 
  ExternalLink,
  Share2,
  Brain,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { sendContactMessage, getSocialLinks, SocialLinks } from '@/lib/admin';
import { useAuth } from '@/hooks/useAuth';

export default function Contact() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [socials, setSocials] = useState<SocialLinks>({});
  const [socialsLoading, setSocialsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'Algorithm & Direction',
    subject: '',
    message: '',
  });

  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        name: user.displayName || prev.name,
      }));
    }
  }, [user]);

  useEffect(() => {
    getSocialLinks().then(data => {
      setSocials(data);
      setSocialsLoading(false);
    }).catch(err => {
      console.error(err);
      setSocialsLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error('Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      await sendContactMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        category: formData.category,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        userId: user?.uid,
      });
      setSubmitted(true);
      toast.success('Your message has been transmitted to the Atlas Engineering team.');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to deliver message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const socialChannels = [
    { key: 'twitter' as const, label: 'Twitter / X', icon: Twitter, ...socials.twitter, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    { key: 'discord' as const, label: 'Discord Community', icon: MessageSquare, ...socials.discord, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { key: 'github' as const, label: 'GitHub', icon: Github, ...socials.github, color: 'text-slate-300 bg-slate-500/10 border-slate-500/20' },
    { key: 'linkedin' as const, label: 'LinkedIn', icon: Linkedin, ...socials.linkedin, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { key: 'telegram' as const, label: 'Telegram Broadcast', icon: SendIcon, ...socials.telegram, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    { key: 'youtube' as const, label: 'YouTube', icon: Youtube, ...socials.youtube, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    { key: 'instagram' as const, label: 'Instagram', icon: Instagram, ...socials.instagram, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  ].filter(c => c.enabled && c.url);

  const categories = [
    { id: 'algo', label: 'Algorithm & Direction', icon: Brain, description: 'Spaced decay & recommendations' },
    { id: 'curriculum', label: 'Syllabus Mapping', icon: BookOpen, description: 'Subject/system hierarchy' },
    { id: 'bug', label: 'Bug Report', icon: Bug, description: 'System performance or errors' },
    { id: 'feature', label: 'Feature Request', icon: Lightbulb, description: 'Ideas to sharpen study OS' },
  ];

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
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div className="border-b border-border/40 bg-muted/15 py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5" />
            Product & Engineering Support
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Direct Line to Atlas Engineers</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
            Building the Intelligent Medical Study Operating System requires continuous feedback from medical candidates. Share your insights on recommendation accuracy, subject mapping, or system UX.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Direct Channels */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-lg tracking-tight">Verified Channels</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect with our product leads and medical engineering team across verified platforms:
              </p>
            </div>

            {socialsLoading ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <span className="text-xs text-muted-foreground">Loading channels...</span>
              </div>
            ) : socialChannels.length === 0 ? (
              <p className="text-xs text-muted-foreground">No social handles configured yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                {socialChannels.map(({ key, label, icon: Icon, url, color }) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-card border border-border/80 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs hover:border-primary/50 transition-all hover:scale-[1.01] group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${color}`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          {label}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate font-mono">
                          {url!.replace(/^https?:\/\/(www\.)?/, '')}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                  </a>
                ))}
              </div>
            )}

            <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Clock className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">Direct Engineering Sync</div>
                <div className="text-[11px] text-muted-foreground">Submissions route live to Founder Console</div>
              </div>
            </div>

            {/* Quick FAQ Box */}
            <div className="bg-muted/30 border border-border/60 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <HelpCircle className="w-4 h-4 text-primary" />
                Frequently Asked Questions
              </div>
              <div className="space-y-3 text-xs text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground block mb-0.5">What feedback is most valuable?</span>
                  Insights on recommendation relevance, Spaced Decay calibration, or curriculum mapping for MBBS, NEET PG, INICET, FMGE, and USMLE exams.
                </div>
                <div>
                  <span className="font-semibold text-foreground block mb-0.5">How is my study data protected?</span>
                  All study progress is stored locally on your device in IndexedDB. Local data exports (JSON) can be generated at any time in Settings.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="font-bold text-xl tracking-tight">Transmit Feedback</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Reaches the Atlas product team directly.
                </p>
              </div>

              {submitted ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground">Message Delivered</h3>
                    <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                      Thank you for helping refine Atlas OS. Your message has been logged in the engineering queue.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData(prev => ({ ...prev, subject: '', message: '' }));
                    }}
                    className="mt-2 rounded-xl text-xs cursor-pointer"
                  >
                    Send Another Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-name" className="text-xs font-semibold">Your Name *</Label>
                      <Input
                        id="contact-name"
                        placeholder="Dr. Alex Rivera"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="contact-email" className="text-xs font-semibold">Email Address *</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="alex@med.edu"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Inquiry Focus</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {categories.map(({ id, label, icon: Icon, description }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: label })}
                          className={`flex items-start gap-3 p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                            formData.category === label
                              ? 'bg-primary/10 border-primary text-primary shadow-xs'
                              : 'border-border/60 hover:border-border text-muted-foreground hover:text-foreground bg-muted/20'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                          <div>
                            <div className="font-semibold text-foreground">{label}</div>
                            <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-subject" className="text-xs font-semibold">Subject</Label>
                    <Input
                      id="contact-subject"
                      placeholder="e.g. NEET PG System weights or recommendation feedback"
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-message" className="text-xs font-semibold">Message *</Label>
                    <Textarea
                      id="contact-message"
                      rows={5}
                      placeholder="Share your thoughts on study algorithms, subject hierarchy mapping, memory decay calibration, or report a technical issue..."
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      required
                      className="rounded-xl text-xs resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl gap-2 font-semibold text-xs py-5 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <SendIcon className="w-4 h-4" />
                        Send to Engineering Team
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
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
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/contact" className="text-foreground font-semibold">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
