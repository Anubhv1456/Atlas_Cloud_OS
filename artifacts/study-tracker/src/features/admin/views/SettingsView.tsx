import React, { useEffect, useState } from 'react';
import { 
  Sliders, ToggleLeft, Megaphone, CreditCard, Share2, 
  Save, CheckCircle2, ShieldCheck, CreditCard as PaymentIcon
} from 'lucide-react';
import { 
  getFeatureFlags, setFeatureFlags, FeatureFlags,
  getAnnouncements, createAnnouncement, setAnnouncementActive, Announcement,
  getPaymentConfig, savePaymentConfig, PaymentConfig, DEFAULT_PAYMENT_CONFIG,
  getSocialLinks, setSocialLinks, SocialLinks
} from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export function SettingsView() {
  const [loading, setLoading] = useState(true);

  // States
  const [flags, setFlags] = useState<FeatureFlags>({
    communityMarkers: true, markerSubmission: true, markerVisibility: true, payments: false, aiInsights: true
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [socials, setSocials] = useState<SocialLinks>({});

  // Forms
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', type: 'info' as const });
  const [newBenefit, setNewBenefit] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [f, a, p, s] = await Promise.all([
          getFeatureFlags(), getAnnouncements(), getPaymentConfig(), getSocialLinks()
        ]);
        setFlags(f);
        setAnnouncements(a);
        setPaymentConfig(p || DEFAULT_PAYMENT_CONFIG);
        setSocials(s || {});
      } catch (e) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveFlags = async () => {
    try {
      await setFeatureFlags(flags);
      toast.success('Feature flags saved');
    } catch { toast.error('Failed to save flags'); }
  };

  const handlePostAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) return;
    try {
      await createAnnouncement(newAnnouncement);
      setAnnouncements(await getAnnouncements());
      setNewAnnouncement({ title: '', message: '', type: 'info' });
      toast.success('Announcement posted');
    } catch { toast.error('Failed to post'); }
  };

  const handleToggleAnnouncement = async (id: string, active: boolean) => {
    try {
      await setAnnouncementActive(id, active);
      setAnnouncements(await getAnnouncements());
    } catch { toast.error('Failed to update announcement'); }
  };

  const handleSavePayments = async () => {
    try {
      await savePaymentConfig(paymentConfig);
      toast.success('Payment config saved');
    } catch { toast.error('Failed to save payment config'); }
  };

  const handleSaveSocials = async () => {
    try {
      await setSocialLinks(socials);
      toast.success('Social links saved');
    } catch { toast.error('Failed to save socials'); }
  };

  if (loading) return <div className="p-24 text-center text-muted-foreground animate-pulse">Loading settings...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-300 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sliders className="w-6 h-6 text-teal-500" />
          System Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Global configurations, pricing, and feature flags.</p>
      </div>

      {/* 1. Feature Flags */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <ToggleLeft className="w-4 h-4 text-emerald-400" /> Feature Flags
        </h2>
        <div className="bg-card border border-border/50 rounded-2xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/30">
              <div>
                <div className="font-bold text-sm">AI Insights Engine</div>
                <div className="text-xs text-muted-foreground">Master toggle for Gemini LLM.</div>
              </div>
              <Switch checked={flags.aiInsights} onCheckedChange={(v) => setFlags({...flags, aiInsights: v})} />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/30">
              <div>
                <div className="font-bold text-sm">Payment Gateways</div>
                <div className="text-xs text-muted-foreground">Enable active checkouts.</div>
              </div>
              <Switch checked={flags.payments} onCheckedChange={(v) => setFlags({...flags, payments: v})} />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/30">
              <div>
                <div className="font-bold text-sm">Marker Submission</div>
                <div className="text-xs text-muted-foreground">Allow students to report content.</div>
              </div>
              <Switch checked={flags.markerSubmission} onCheckedChange={(v) => setFlags({...flags, markerSubmission: v})} />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveFlags} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
              <Save className="w-4 h-4 mr-2"/> Save Flags
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Pricing & Cohort Engine */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <PaymentIcon className="w-4 h-4 text-amber-400" /> Pricing & Cohort Settings
        </h2>
        <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Plan Title</label>
              <Input 
                value={paymentConfig.planTitle || ''} 
                onChange={e => setPaymentConfig({...paymentConfig, planTitle: e.target.value})} 
                className="bg-background" 
                placeholder="e.g. Closed Beta Membership"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Price ({paymentConfig.currencySymbol || '₹'})</label>
              <Input 
                type="number" 
                value={paymentConfig.price ?? 499} 
                onChange={e => setPaymentConfig({...paymentConfig, price: Number(e.target.value)})} 
                className="bg-background" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Duration Text</label>
              <Input 
                value={paymentConfig.durationText || ''} 
                onChange={e => setPaymentConfig({...paymentConfig, durationText: e.target.value})} 
                className="bg-background" 
                placeholder="e.g. 3 Months"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Duration (Days)</label>
              <Input 
                type="number" 
                value={paymentConfig.durationDays ?? 90} 
                onChange={e => setPaymentConfig({...paymentConfig, durationDays: Number(e.target.value)})} 
                className="bg-background" 
              />
            </div>
          </div>

          {/* Cohort & Urgency Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border-t border-border/30 pt-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Cohort Header</label>
              <Input 
                value={paymentConfig.cohortHeaderTitle || ''} 
                onChange={e => setPaymentConfig({...paymentConfig, cohortHeaderTitle: e.target.value})} 
                className="bg-background" 
                placeholder="e.g. CLOSED BETA • 2026 MEDICAL COHORT"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Cohort Badge Text</label>
              <Input 
                value={paymentConfig.cohortBadgeText || ''} 
                onChange={e => setPaymentConfig({...paymentConfig, cohortBadgeText: e.target.value})} 
                className="bg-background" 
                placeholder="e.g. 200 Closed Beta Seats"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Total Cohort Seats</label>
              <Input 
                type="number" 
                value={paymentConfig.totalSeats ?? 200} 
                onChange={e => setPaymentConfig({...paymentConfig, totalSeats: Number(e.target.value)})} 
                className="bg-background" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Claimed Seats</label>
              <Input 
                type="number" 
                value={paymentConfig.claimedSeats ?? 38} 
                onChange={e => setPaymentConfig({...paymentConfig, claimedSeats: Number(e.target.value)})} 
                className="bg-background" 
              />
            </div>
          </div>

          {/* UPI & Payment Gateway Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border/30 pt-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">UPI ID (VPA)</label>
              <Input 
                value={paymentConfig.upiId || ''} 
                onChange={e => setPaymentConfig({...paymentConfig, upiId: e.target.value})} 
                className="bg-background font-mono text-xs" 
                placeholder="e.g. yourname@upi"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">UPI QR Image URL (Optional)</label>
              <Input 
                value={paymentConfig.upiQrUrl || ''} 
                onChange={e => setPaymentConfig({...paymentConfig, upiQrUrl: e.target.value})} 
                className="bg-background text-xs" 
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">External Payment Link (Optional)</label>
              <Input 
                value={paymentConfig.paymentLinkUrl || ''} 
                onChange={e => setPaymentConfig({...paymentConfig, paymentLinkUrl: e.target.value})} 
                className="bg-background text-xs" 
                placeholder="https://rzp.io/..."
              />
            </div>
          </div>

          {/* Tab Visibility Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border/30 pt-4">
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border/30">
              <span className="text-xs font-medium">Show UPI ID Tab</span>
              <Switch checked={paymentConfig.enableUpiTab ?? true} onCheckedChange={(v) => setPaymentConfig({...paymentConfig, enableUpiTab: v})} />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border/30">
              <span className="text-xs font-medium">Show QR Code Tab</span>
              <Switch checked={paymentConfig.enableQrTab ?? true} onCheckedChange={(v) => setPaymentConfig({...paymentConfig, enableQrTab: v})} />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border/30">
              <span className="text-xs font-medium">Show External Link Tab</span>
              <Switch checked={paymentConfig.enableLinkTab ?? true} onCheckedChange={(v) => setPaymentConfig({...paymentConfig, enableLinkTab: v})} />
            </div>
          </div>

          <div className="space-y-2 border-t border-border/30 pt-6">
            <label className="text-xs font-semibold text-muted-foreground">Benefits (Bullet Points)</label>
            <div className="space-y-2">
              {(paymentConfig.benefits || []).map((b, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={b} onChange={e => {
                    const newB = [...(paymentConfig.benefits || [])]; newB[i] = e.target.value;
                    setPaymentConfig({...paymentConfig, benefits: newB});
                  }} className="bg-background" />
                  <Button variant="ghost" onClick={() => setPaymentConfig({...paymentConfig, benefits: (paymentConfig.benefits || []).filter((_, idx) => idx !== i)})} className="text-rose-400">X</Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input value={newBenefit} onChange={e => setNewBenefit(e.target.value)} placeholder="Add new benefit..." className="bg-background" />
                <Button onClick={() => { if(newBenefit) { setPaymentConfig({...paymentConfig, benefits: [...(paymentConfig.benefits || []), newBenefit]}); setNewBenefit(''); } }} className="bg-muted text-foreground">Add</Button>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSavePayments} className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">
              <Save className="w-4 h-4 mr-2"/> Save Pricing & Cohort
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Global Announcements */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-rose-400" /> Announcements
        </h2>
        <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-6">
          <div className="flex gap-4">
            <Input placeholder="Banner Title..." value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} className="bg-background w-1/3" />
            <Input placeholder="Message content..." value={newAnnouncement.message} onChange={e => setNewAnnouncement({...newAnnouncement, message: e.target.value})} className="bg-background flex-1" />
            <Button onClick={handlePostAnnouncement} className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30">Post</Button>
          </div>
          <div className="space-y-2">
            {announcements.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-muted/20 border border-border/30 rounded-lg">
                <div>
                  <div className="font-bold text-sm">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.message}</div>
                </div>
                <Switch checked={a.isActive} onCheckedChange={(v) => handleToggleAnnouncement(a.id!, v)} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Social Links */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Share2 className="w-4 h-4 text-indigo-400" /> Social Links
        </h2>
        <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4">
          {['twitter', 'github', 'linkedin', 'instagram', 'youtube'].map(network => (
            <div key={network} className="flex items-center gap-4">
              <label className="w-24 text-xs font-semibold text-muted-foreground capitalize">{network}</label>
              <Input 
                value={(socials as any)[network] || ''} 
                onChange={e => setSocials({...socials, [network]: e.target.value})}
                placeholder={`https://${network}.com/...`} 
                className="bg-background flex-1" 
              />
            </div>
          ))}
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveSocials} className="bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30">
              <Save className="w-4 h-4 mr-2"/> Save Socials
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
