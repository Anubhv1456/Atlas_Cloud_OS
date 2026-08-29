import React, { useEffect, useState, useRef } from 'react';
import { 
  getFeatureFlags, setFeatureFlags, FeatureFlags,
  getAnnouncements, createAnnouncement, setAnnouncementActive, Announcement,
  getPaymentConfig, savePaymentConfig, PaymentConfig, DEFAULT_PAYMENT_CONFIG,
  getSocialLinks, setSocialLinks, SocialLinks
} from '@/lib/admin';
import {
  getReferralConfig, saveReferralConfig, ReferralConfig, DEFAULT_REFERRAL_CONFIG
} from '@/lib/referral';
import { 
  ToggleLeft, Megaphone, CreditCard, Share2, Save, Plus, Trash2, 
  RefreshCw, CheckCircle2, AlertCircle, Info, TriangleAlert, QrCode, Upload,
  Twitter, Github, Linkedin, Send, Youtube, Instagram, MessageSquare, ExternalLink, Sparkles, ShieldCheck,
  Users, Sliders, TrendingUp, Check, Layers, Eye
} from 'lucide-react';
import { RedditIcon } from '@/components/RedditIcon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

type SystemTab = 'flags' | 'announcements' | 'payments' | 'referrals' | 'socials';

export function SystemControlView() {
  const [activeTab, setActiveTab] = useState<SystemTab>('flags');
  const [loading, setLoading] = useState(true);

  // 1. Feature Flags State
  const [flags, setFlags] = useState<FeatureFlags>({
    communityMarkers: true,
    markerSubmission: true,
    markerVisibility: true,
    payments: false,
    aiInsights: true
  });
  const [savingFlags, setSavingFlags] = useState(false);

  // 2. Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState<'info' | 'warning' | 'error' | 'success'>('info');
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);

  // 3. Payment Pricing & QR Config
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [savingPaymentConfig, setSavingPaymentConfig] = useState(false);
  const [newBenefit, setNewBenefit] = useState('');
  const qrInputRef = useRef<HTMLInputElement>(null);

  // 4. Social Links State
  const [socials, setSocials] = useState<SocialLinks>({});
  const [savingSocials, setSavingSocials] = useState(false);

  // 5. Referral Engine State
  const [referralConfig, setReferralConfig] = useState<ReferralConfig>(DEFAULT_REFERRAL_CONFIG);
  const [savingReferralConfig, setSavingReferralConfig] = useState(false);

  const loadAllConfig = async () => {
    setLoading(true);
    try {
      const [f, a, p, s, r] = await Promise.all([
        getFeatureFlags(),
        getAnnouncements(),
        getPaymentConfig(),
        getSocialLinks(),
        getReferralConfig()
      ]);
      setFlags(f);
      setAnnouncements(a);
      setPaymentConfig(p);
      setSocials(s);
      setReferralConfig(r);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load system control config.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllConfig();
  }, []);

  // Handlers
  const handleSaveFlags = async () => {
    setSavingFlags(true);
    try {
      await setFeatureFlags(flags);
      toast.success('Feature flags updated successfully!');
    } catch (e) {
      toast.error('Failed to update feature flags');
    } finally {
      setSavingFlags(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;
    setSubmittingAnnouncement(true);
    try {
      await createAnnouncement({
        title: newTitle,
        message: newMessage,
        type: newType,
        active: true
      });
      toast.success('Announcement broadcast published!');
      setShowAnnouncementForm(false);
      setNewTitle('');
      setNewMessage('');
      const updated = await getAnnouncements();
      setAnnouncements(updated);
    } catch (e) {
      toast.error('Failed to publish announcement.');
    } finally {
      setSubmittingAnnouncement(false);
    }
  };

  const handleToggleAnnouncement = async (id: string, current: boolean) => {
    try {
      await setAnnouncementActive(id, !current);
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, active: !current } : a));
      toast.success('Announcement status updated.');
    } catch (e) {
      toast.error('Failed to update announcement status.');
    }
  };

  const handleSavePaymentConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingPaymentConfig(true);
    try {
      await savePaymentConfig(paymentConfig);
      toast.success('Payment pricing and QR settings saved!');
    } catch (e) {
      toast.error('Failed to save payment config.');
    } finally {
      setSavingPaymentConfig(false);
    }
  };

  const handleQrUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPaymentConfig(prev => ({ ...prev, upiQrUrl: result }));
      toast.success('Custom QR code image attached');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSocials = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingSocials(true);
    try {
      await setSocialLinks(socials);
      toast.success('Social media handles saved successfully!');
    } catch (e) {
      toast.error('Failed to save social handles.');
    } finally {
      setSavingSocials(false);
    }
  };

  const handleSaveReferralConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingReferralConfig(true);
    try {
      await saveReferralConfig(referralConfig);
      toast.success('Batchmate referral parameters updated successfully!');
    } catch (e) {
      toast.error('Failed to save referral configuration.');
    } finally {
      setSavingReferralConfig(false);
    }
  };

  const platforms = [
    { key: 'telegram' as const, label: 'Telegram Channel', icon: Send, placeholder: 'https://t.me/your_channel' },
    { key: 'reddit' as const, label: 'Subreddit / Reddit Community', icon: RedditIcon, placeholder: 'https://reddit.com/r/your_subreddit' },
    { key: 'twitter' as const, label: 'Twitter / X', icon: Twitter, placeholder: 'https://twitter.com/your_handle' },
    { key: 'discord' as const, label: 'Discord Community', icon: MessageSquare, placeholder: 'https://discord.gg/your_invite' },
    { key: 'github' as const, label: 'GitHub Repository', icon: Github, placeholder: 'https://github.com/your_org' },
    { key: 'linkedin' as const, label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/your_profile' },
    { key: 'youtube' as const, label: 'YouTube Channel', icon: Youtube, placeholder: 'https://youtube.com/@your_channel' },
    { key: 'instagram' as const, label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/your_handle' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 border border-purple-500/20 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                System Control Sheet
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Global platform feature toggles, announcements, payment pricing & QR, and social handles.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadAllConfig}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl border border-border/60 bg-card hover:bg-muted text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 self-start md:self-auto"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 text-primary", loading && "animate-spin")} />
          <span>Reload Config</span>
        </button>
      </div>

      {/* Segmented Control Navigation */}
      <div className="p-1 bg-card border border-border/60 rounded-xl flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('flags')}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap",
            activeTab === 'flags'
              ? "bg-purple-500 text-white shadow-sm font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ToggleLeft className="w-4 h-4" /> Feature Flags
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap",
            activeTab === 'announcements'
              ? "bg-purple-500 text-white shadow-sm font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Megaphone className="w-4 h-4" /> Broadcast Banners {announcements.filter(a => a.active).length > 0 && <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-black text-[10px] font-bold">{announcements.filter(a => a.active).length} Live</span>}
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap",
            activeTab === 'payments'
              ? "bg-purple-500 text-white shadow-sm font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CreditCard className="w-4 h-4" /> Cohort Capacity & Pricing
        </button>

        <button
          onClick={() => setActiveTab('referrals')}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap",
            activeTab === 'referrals'
              ? "bg-purple-500 text-white shadow-sm font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="w-4 h-4" /> Batchmate Referral Engine {referralConfig.enabled ? (
            <span className="px-1.5 py-0.2 rounded-full bg-teal-400 text-black text-[10px] font-bold">Active</span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-700 text-zinc-300 text-[10px]">Paused</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('socials')}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap",
            activeTab === 'socials'
              ? "bg-purple-500 text-white shadow-sm font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Share2 className="w-4 h-4" /> Social Handles
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Loading system configuration...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: FEATURE FLAGS */}
          {activeTab === 'flags' && (
            <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <div>
                  <h3 className="font-bold text-base">Real-time Platform Switches</h3>
                  <p className="text-xs text-muted-foreground">Turn features on or off instantly across the study OS.</p>
                </div>
                <button
                  onClick={handleSaveFlags}
                  disabled={savingFlags}
                  className="px-5 py-2 bg-purple-500 hover:bg-primary text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all"
                >
                  {savingFlags ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Switches
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => setFlags(f => ({ ...f, communityMarkers: !f.communityMarkers }))}
                  className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-background/60 hover:bg-muted/30 cursor-pointer transition-all"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm">Community Markers</div>
                    <div className="text-xs text-muted-foreground">Enable crowd-sourced high-yield mnemonics and clinical pearls.</div>
                  </div>
                  <Switch checked={flags.communityMarkers} />
                </div>

                <div 
                  onClick={() => setFlags(f => ({ ...f, markerSubmission: !f.markerSubmission }))}
                  className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-background/60 hover:bg-muted/30 cursor-pointer transition-all"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm">Marker Submission</div>
                    <div className="text-xs text-muted-foreground">Allow medical students to submit new markers for future candidates.</div>
                  </div>
                  <Switch checked={flags.markerSubmission} />
                </div>

                <div 
                  onClick={() => setFlags(f => ({ ...f, markerVisibility: !f.markerVisibility }))}
                  className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-background/60 hover:bg-muted/30 cursor-pointer transition-all"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm">Marker Visibility</div>
                    <div className="text-xs text-muted-foreground">Show approved markers in the study interface.</div>
                  </div>
                  <Switch checked={flags.markerVisibility} />
                </div>

                <div 
                  onClick={() => setFlags(f => ({ ...f, payments: !f.payments }))}
                  className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-background/60 hover:bg-muted/30 cursor-pointer transition-all"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm">Payments Gateway</div>
                    <div className="text-xs text-muted-foreground">Enable UPI payments for Closed Beta memberships.</div>
                  </div>
                  <Switch checked={flags.payments} />
                </div>

                <div 
                  onClick={() => setFlags(f => ({ ...f, aiInsights: !f.aiInsights }))}
                  className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-background/60 hover:bg-muted/30 cursor-pointer transition-all"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm">AI Intelligence Engine</div>
                    <div className="text-xs text-muted-foreground">Power spaced-repetition decay calibrations and AI recommendations.</div>
                  </div>
                  <Switch checked={flags.aiInsights} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base">Broadcast Messages</h3>
                  <p className="text-xs text-muted-foreground">Push announcement banners to all active medical students.</p>
                </div>
                <button
                  onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                  className="px-4 py-2 bg-purple-500 hover:bg-primary text-white font-bold rounded-xl text-xs flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Draft Broadcast
                </button>
              </div>

              {showAnnouncementForm && (
                <form onSubmit={handleCreateAnnouncement} className="bg-card border border-purple-500/40 rounded-2xl p-6 space-y-4 shadow-lg">
                  <h4 className="font-bold text-sm text-purple-300">New Broadcast Banner</h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Banner Severity</label>
                      <div className="flex gap-2">
                        {(['info', 'success', 'warning', 'error'] as const).map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setNewType(t)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-all",
                              newType === t
                                ? "border-purple-500 bg-purple-500/20 text-purple-300"
                                : "border-border/60 bg-background text-muted-foreground"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Title</label>
                      <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. INICET Mock Test Series Now Live"
                        className="text-xs rounded-xl"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Message Content</label>
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Details for medical candidates..."
                        className="w-full bg-background border border-border/60 rounded-xl p-3 text-xs focus:ring-2 focus:ring-primary/50 min-h-[80px]"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAnnouncementForm(false)}
                        className="px-4 py-2 border border-border/60 rounded-xl text-xs font-semibold hover:bg-muted"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingAnnouncement}
                        className="px-5 py-2 bg-purple-500 text-white font-bold rounded-xl text-xs hover:bg-primary"
                      >
                        Publish Broadcast
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {announcements.map(a => (
                  <div key={a.id} className="p-4 rounded-xl border border-border/60 bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{a.title}</span>
                        {a.active && (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] uppercase font-bold">
                            Live
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{a.message}</p>
                    </div>

                    <button
                      onClick={() => handleToggleAnnouncement(a.id, a.active)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 self-end md:self-auto",
                        a.active
                          ? "bg-muted text-muted-foreground hover:bg-muted/80"
                          : "bg-purple-500/20 text-purple-300 border border-primary/30 hover:bg-purple-500/30"
                      )}
                    >
                      {a.active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: COHORT CAPACITY & PAYMENTS CONFIG */}
          {activeTab === 'payments' && (
            <form onSubmit={handleSavePaymentConfig} className="bg-card border border-border/60 rounded-2xl p-6 space-y-8 shadow-xs">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">Cohort Capacity Tracker & Beta Pricing</h3>
                    <Badge variant="outline" className="text-[10px] font-mono font-bold bg-teal-500/10 text-teal-400 border-teal-500/30">
                      Live Dynamic Controls
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manually adjust cohort seat limits, claimed seats counter, banner titles, and UPI checkout pricing.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={savingPaymentConfig}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-teal-950/20 disabled:opacity-50 shrink-0 self-start sm:self-auto"
                >
                  {savingPaymentConfig ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save All Settings
                </button>
              </div>

              {/* SECTION 1: COHORT CAPACITY TRACKER */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5 text-teal-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">1. Cohort Capacity Tracker</h4>
                      <p className="text-[11px] text-muted-foreground">Controls the live seat counter and availability badges across Atlas.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Controls Column (7/12) */}
                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Total Seats Limit */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                        <span>Total Cohort Capacity (Seats)</span>
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={paymentConfig.totalSeats ?? 200}
                        onChange={(e) => setPaymentConfig(p => ({ ...p, totalSeats: Math.max(1, parseInt(e.target.value) || 0) }))}
                        className="text-xs font-mono font-semibold rounded-xl bg-background/60"
                      />
                      <p className="text-[10px] text-muted-foreground">e.g. 50, 200, 500 total available seats</p>
                    </div>

                    {/* Claimed / Displayed Seats */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          Claimed / Filled Seats
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPaymentConfig(p => ({ ...p, claimedSeats: Math.max(0, (p.claimedSeats ?? 38) - 1) }))}
                            className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-[10px] font-mono font-bold text-muted-foreground"
                            title="Decrease by 1"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentConfig(p => ({ ...p, claimedSeats: Math.min(p.totalSeats ?? 200, (p.claimedSeats ?? 38) + 1) }))}
                            className="px-1.5 py-0.5 rounded bg-teal-500/20 hover:bg-teal-500/30 text-[10px] font-mono font-bold text-teal-400"
                            title="Increase by 1"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentConfig(p => ({ ...p, claimedSeats: Math.min(p.totalSeats ?? 200, (p.claimedSeats ?? 38) + 5) }))}
                            className="px-1.5 py-0.5 rounded bg-teal-500/20 hover:bg-teal-500/30 text-[10px] font-mono font-bold text-teal-400"
                            title="Increase by 5"
                          >
                            +5
                          </button>
                        </div>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        value={paymentConfig.claimedSeats ?? 38}
                        onChange={(e) => setPaymentConfig(p => ({ ...p, claimedSeats: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className="text-xs font-mono font-semibold rounded-xl bg-background/60"
                      />
                      <p className="text-[10px] text-muted-foreground">Manually editable seat counter displayed on checkout</p>
                    </div>

                    {/* Cohort Header Banner Text */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Cohort Header Banner Text
                      </label>
                      <Input
                        value={paymentConfig.cohortHeaderTitle ?? 'CLOSED BETA • 2026 MEDICAL COHORT'}
                        onChange={(e) => setPaymentConfig(p => ({ ...p, cohortHeaderTitle: e.target.value }))}
                        placeholder="CLOSED BETA • 2026 MEDICAL COHORT"
                        className="text-xs rounded-xl bg-background/60"
                      />
                      <p className="text-[10px] text-muted-foreground">Badge text at the top of the Beta Checkout canvas</p>
                    </div>

                    {/* Invitation Badge Label */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Invitation Verification Badge Label
                      </label>
                      <Input
                        value={paymentConfig.cohortBadgeText ?? `${paymentConfig.totalSeats ?? 200} Closed Beta Seats`}
                        onChange={(e) => setPaymentConfig(p => ({ ...p, cohortBadgeText: e.target.value }))}
                        placeholder="200 Closed Beta Seats"
                        className="text-xs rounded-xl bg-background/60"
                      />
                      <p className="text-[10px] text-muted-foreground">Shown on the invitation confirmation screen (/accept-invitation)</p>
                    </div>
                  </div>

                  {/* Live Student Preview Column (5/12) */}
                  <div className="lg:col-span-5 p-4 rounded-2xl bg-black/50 border border-border/70 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
                        <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          Live Student Preview
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">Real-time Simulation</span>
                      </div>

                      {/* Preview Box: Invitation Badge */}
                      <div className="mt-3.5 space-y-3">
                        <div>
                          <span className="text-[10px] font-semibold text-zinc-500 uppercase block mb-1">Invitation Badge</span>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                            {paymentConfig.cohortBadgeText || `${paymentConfig.totalSeats ?? 200} Closed Beta Seats`}
                          </div>
                        </div>

                        {/* Preview Box: Checkout Seat Counter */}
                        <div className="pt-2">
                          <span className="text-[10px] font-semibold text-zinc-500 uppercase block mb-1">Checkout Header & Capacity</span>
                          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                              {paymentConfig.cohortHeaderTitle || 'CLOSED BETA • 2026 MEDICAL COHORT'}
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1">
                              <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                                <Users className="w-3.5 h-3.5 text-teal-400" />
                                <span>{paymentConfig.claimedSeats ?? 38} / {paymentConfig.totalSeats ?? 200} Seats Claimed</span>
                              </div>
                              <span className="text-[11px] font-mono text-teal-400 font-semibold">
                                {Math.round(((paymentConfig.claimedSeats ?? 38) / Math.max(1, paymentConfig.totalSeats ?? 200)) * 100)}%
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-teal-400 h-full rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${Math.min(100, Math.max(0, Math.round(((paymentConfig.claimedSeats ?? 38) / Math.max(1, paymentConfig.totalSeats ?? 200)) * 100)))}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-[11px] text-teal-300 flex items-center justify-between">
                      <span>Remaining available seats:</span>
                      <strong className="font-mono text-teal-200">
                        {Math.max(0, (paymentConfig.totalSeats ?? 200) - (paymentConfig.claimedSeats ?? 38))} Seats
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PLAN PRICING & DURATION */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <CreditCard className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">2. Membership Pricing & Access Details</h4>
                    <p className="text-[11px] text-muted-foreground">Adjust plan fees, currency, and duration granted upon manual approval.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Plan Title</label>
                    <Input
                      value={paymentConfig.planTitle}
                      onChange={(e) => setPaymentConfig(p => ({ ...p, planTitle: e.target.value }))}
                      className="text-xs rounded-xl bg-background/60"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Price (₹)</label>
                    <Input
                      type="number"
                      value={paymentConfig.price}
                      onChange={(e) => setPaymentConfig(p => ({ ...p, price: Number(e.target.value) }))}
                      className="text-xs rounded-xl bg-background/60 font-semibold text-teal-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">UPI VPA ID</label>
                    <Input
                      value={paymentConfig.upiId}
                      onChange={(e) => setPaymentConfig(p => ({ ...p, upiId: e.target.value }))}
                      placeholder="atlas@upi"
                      className="text-xs rounded-xl font-mono bg-background/60"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Duration Text</label>
                    <Input
                      value={paymentConfig.durationText}
                      onChange={(e) => setPaymentConfig(p => ({ ...p, durationText: e.target.value }))}
                      placeholder="3 Months"
                      className="text-xs rounded-xl bg-background/60"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: QR UPLOAD */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
                    <QrCode className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">3. Custom UPI QR Code Image</h4>
                    <p className="text-[11px] text-muted-foreground">Upload your account's UPI QR code image to display to students.</p>
                  </div>
                </div>

                <div className="p-4 border border-border/60 rounded-xl bg-background/50 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div className="flex items-center gap-4">
                    {paymentConfig.upiQrUrl ? (
                      <img src={paymentConfig.upiQrUrl} alt="UPI QR" className="w-20 h-20 object-contain rounded-lg border border-border/60 bg-black/40" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg border border-dashed border-border/60 flex items-center justify-center text-muted-foreground text-xs">
                        No QR Image
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-foreground">Custom UPI Payment QR</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Supports PNG, JPG, or WebP. Auto-compressed.</p>
                      {paymentConfig.upiQrUrl && (
                        <button
                          type="button"
                          onClick={() => setPaymentConfig(p => ({ ...p, upiQrUrl: '' }))}
                          className="text-[10px] text-rose-400 hover:underline mt-1 block"
                        >
                          Remove QR Image
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={qrInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleQrUpload(e.target.files[0])}
                  />
                  <button
                    type="button"
                    onClick={() => qrInputRef.current?.click()}
                    className="px-4 py-2 border border-border/60 rounded-xl text-xs font-semibold hover:bg-muted flex items-center gap-2 shrink-0 self-start sm:self-auto"
                  >
                    <Upload className="w-4 h-4 text-teal-400" /> Upload QR Image
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 4: BATCHMATE REFERRAL ENGINE */}
          {activeTab === 'referrals' && (
            <form onSubmit={handleSaveReferralConfig} className="bg-card border border-border/60 rounded-2xl p-6 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/50 gap-3">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-400" />
                    Peer Referral & Batchmate Pass Engine
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Configure pass durations, study qualification gates, and batchmate pass allocations.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={savingReferralConfig}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-black font-bold rounded-xl text-xs flex items-center gap-2 transition-all self-start sm:self-auto"
                >
                  {savingReferralConfig ? (
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Referral Rules
                </button>
              </div>

              {/* Master Global Program Switch */}
              <div className="p-4 rounded-xl border border-border/60 bg-background/50 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    <span>Master Referral Program Switch</span>
                    {referralConfig.enabled ? (
                      <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 text-[10px]">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-zinc-500 text-[10px]">Disabled</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    When enabled, eligible candidates can invite study partners and generate personal invite links.
                  </p>
                </div>
                <Switch
                  checked={referralConfig.enabled}
                  onCheckedChange={(checked) => setReferralConfig(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              {/* Parameter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Referee Trial Days */}
                <div className="p-4 rounded-xl border border-border/60 bg-background/50 space-y-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-xs text-foreground block">
                      Referee Pass Duration (Days)
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Free trial days provisioned to an invited medical peer upon claiming the pass.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      value={referralConfig.refereeTrialDays}
                      onChange={(e) => setReferralConfig(prev => ({ ...prev, refereeTrialDays: parseInt(e.target.value, 10) || 15 }))}
                      className="text-xs rounded-xl w-32 font-mono font-bold"
                    />
                    <span className="text-xs text-muted-foreground font-medium">Days of Candidate Access</span>
                  </div>
                </div>

                {/* 2. Referrer Extension Days */}
                <div className="p-4 rounded-xl border border-border/60 bg-background/50 space-y-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-xs text-foreground block">
                      Referrer Extension Reward (Days)
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Days added to the inviter's pass when their referee completes their first study milestone.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={referralConfig.referrerBonusDays}
                      onChange={(e) => setReferralConfig(prev => ({ ...prev, referrerBonusDays: parseInt(e.target.value, 10) || 14 }))}
                      className="text-xs rounded-xl w-32 font-mono font-bold text-teal-400"
                    />
                    <span className="text-xs text-muted-foreground font-medium">Days added per qualified batchmate</span>
                  </div>
                </div>

                {/* 3. Max Passes Quota */}
                <div className="p-4 rounded-xl border border-border/60 bg-background/50 space-y-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-xs text-foreground block">
                      Pass Quota Limit Per Student
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Maximum number of batchmate passes allocated to each candidate account.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={referralConfig.maxPassesPerUser}
                      onChange={(e) => setReferralConfig(prev => ({ ...prev, maxPassesPerUser: parseInt(e.target.value, 10) || 3 }))}
                      className="text-xs rounded-xl w-32 font-mono font-bold"
                    />
                    <span className="text-xs text-muted-foreground font-medium">Batchmate Passes max</span>
                  </div>
                </div>

                {/* 4. Qualification Threshold (Minutes) */}
                <div className="p-4 rounded-xl border border-border/60 bg-background/50 space-y-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-xs text-foreground block">
                      Qualification Study Gate (Minutes)
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Minimum active revision duration required by referee to prevent Sybil bot abuse.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={3}
                      max={60}
                      value={referralConfig.minStudyMinutesToQualify}
                      onChange={(e) => setReferralConfig(prev => ({ ...prev, minStudyMinutesToQualify: parseInt(e.target.value, 10) || 10 }))}
                      className="text-xs rounded-xl w-32 font-mono font-bold"
                    />
                    <span className="text-xs text-muted-foreground font-medium">Minutes minimum in 1 session</span>
                  </div>
                </div>
              </div>

              {/* Downstream Invites */}
              <div className="p-4 rounded-xl border border-border/60 bg-background/50 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-semibold text-xs block">Allow Downstream Invites</span>
                  <p className="text-[11px] text-muted-foreground">
                    Allow newly referred trial students to also invite their own batchmates.
                  </p>
                </div>
                <Switch
                  checked={referralConfig.allowDownstreamInvites}
                  onCheckedChange={(checked) => setReferralConfig(prev => ({ ...prev, allowDownstreamInvites: checked }))}
                />
              </div>

              {/* Policy Explanation */}
              <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/15 text-xs text-muted-foreground leading-relaxed flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block mb-0.5 font-semibold">Anti-Abuse Engagement Loop</strong>
                  Invited batchmates receive instant candidate access. Referral rewards (+14 days) are only disbursed to the referrer once the batchmate logs at least {referralConfig.minStudyMinutesToQualify} minutes of genuine curriculum revision or flashcard recall.
                </div>
              </div>
            </form>
          )}

          {/* TAB 5: SOCIAL HANDLES */}
          {activeTab === 'socials' && (
            <form onSubmit={handleSaveSocials} className="bg-card border border-border/60 rounded-2xl p-6 space-y-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <div>
                  <h3 className="font-bold text-base">Social Channels & Support Handles</h3>
                  <p className="text-xs text-muted-foreground">Manage Telegram, Twitter, Discord, and external links shown across Atlas.</p>
                </div>
                <button
                  type="submit"
                  disabled={savingSocials}
                  className="px-5 py-2 bg-purple-500 hover:bg-primary text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all"
                >
                  {savingSocials ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Handles
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platforms.map(({ key, label, icon: Icon, placeholder }) => (
                  <div key={key} className="p-4 rounded-xl border border-border/60 bg-background/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary" /> {label}
                      </span>
                      <Switch
                        checked={socials[key]?.enabled ?? false}
                        onCheckedChange={(checked) => setSocials({
                          ...socials,
                          [key]: { ...socials[key], enabled: checked, url: socials[key]?.url || '' }
                        })}
                      />
                    </div>
                    <Input
                      value={socials[key]?.url || ''}
                      onChange={(e) => setSocials({
                        ...socials,
                        [key]: { ...socials[key], url: e.target.value, enabled: socials[key]?.enabled ?? false }
                      })}
                      placeholder={placeholder}
                      className="text-xs rounded-xl"
                      disabled={!(socials[key]?.enabled ?? false)}
                    />
                  </div>
                ))}
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
