import React from 'react';
import { useLocation } from 'wouter';
import {
  Award,
  DollarSign,
  Users,
  Copy,
  Check,
  Share2,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAffiliate } from '@/hooks/useAffiliate';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function AffiliatePartnerPage() {
  const [, setLocation] = useLocation();
  const {
    isAffiliate,
    affiliateCode,
    stats,
    referredCandidates,
    referralLinks,
    referralsLoading,
    refresh,
    loading,
    config
  } = useAffiliate();

  const [copiedCode, setCopiedCode] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  const handleCopyCode = async () => {
    if (!affiliateCode) return;
    try {
      await navigator.clipboard.writeText(affiliateCode);
      setCopiedCode(true);
      toast.success('Partner code copied');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  const handleCopyLink = async () => {
    if (!referralLinks.primaryLink) return;
    try {
      await navigator.clipboard.writeText(referralLinks.primaryLink);
      setCopiedLink(true);
      toast.success('Partner invitation link copied');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Hey, prepare for USMLE / NEET PG with Atlas Medical OS. Here is my partner invitation pass:\n${referralLinks.primaryLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = `Atlas Medical OS - Clinical Study Operating System. Check it out via my partner pass: ${referralLinks.primaryLink}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLinks.primaryLink)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-dvh flex items-center justify-center bg-background text-muted-foreground text-sm">
        Loading Partner Portal...
      </div>
    );
  }

  if (!isAffiliate) {
    return (
      <div className="flex-1 min-h-dvh flex flex-col items-center justify-center bg-background px-4 text-center max-w-md mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
          <Award className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Partner Status Required</h1>
        <p className="text-sm text-muted-foreground">
          This portal is reserved for designated Atlas Medical Ambassadors and Affiliate Partners. If you are a campus representative, please contact administration.
        </p>
        <div className="pt-2 flex gap-3">
          <Button variant="outline" onClick={() => setLocation('/')} className="rounded-xl">
            Return to Dashboard
          </Button>
          <Button onClick={() => setLocation('/settings')} className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white">
            Open Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 min-h-dvh bg-background px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 max-w-4xl mx-auto flex flex-col relative space-y-6">
      
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/settings')}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5 -ml-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Settings</span>
        </Button>

        <Badge variant="outline" className="text-xs px-2.5 py-0.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Verified Partner ({affiliateCode})
        </Badge>
      </div>

      {/* ── Title Header ─────────────────────────────────────────────── */}
      <header className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
          <Award className="w-3.5 h-3.5" />
          <span>Ambassador Guild</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Partner & Ambassador Hub
        </h1>
        <p className="text-sm text-muted-foreground">
          Distribute your unique clinical study pass. 
        </p>
      </header>

      {/* ── Metric Highlights Bento Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Referrals</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-foreground">{stats.totalReferrals}</div>
          <span className="text-xs text-muted-foreground mt-1">Enrolled candidates</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Seats</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">{stats.activeSeats}</div>
          <span className="text-xs text-muted-foreground mt-1">Qualified passes</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">In Trial</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">{stats.pendingSeats}</div>
          <span className="text-xs text-muted-foreground mt-1">Pending qualification</span>
        </div>
      </div>

      {/* ── Partner Link & Code Distribution Box ───────────────────────── */}
      <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Dedicated Referral Link
          </h2>
          <span className="text-xs text-muted-foreground font-mono">Cookie Attribution: {config?.cookieWindowDays || 60} Days</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-background border border-border font-mono text-xs text-foreground truncate select-all">
            {referralLinks.primaryLink}
          </div>
          <Button
            onClick={handleCopyLink}
            className={cn(
              "h-10 rounded-xl font-semibold gap-1.5 shrink-0 transition-all text-white",
              copiedLink
                ? "bg-emerald-600 hover:bg-emerald-600"
                : "bg-indigo-600 hover:bg-indigo-500"
            )}
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copied' : 'Copy Partner Link'}</span>
          </Button>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Partner Code:</span>
            <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20">
              {affiliateCode}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyCode}
            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Code Copied' : 'Copy Code'}</span>
          </Button>
        </div>

        <div className="pt-2 flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareWhatsApp}
            className="rounded-xl h-9 text-xs gap-1.5 border-border hover:bg-muted/40"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareTelegram}
            className="rounded-xl h-9 text-xs gap-1.5 border-border hover:bg-muted/40"
          >
            <Share2 className="w-3.5 h-3.5 text-sky-400" /> Telegram
          </Button>
        </div>
      </div>

      {/* ── Candidate Roster ───────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Candidate Enrollees
            </h2>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-mono">
              {referredCandidates.length}
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refresh()}
            disabled={referralsLoading}
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <RefreshCw className={cn("w-3 h-3", referralsLoading && "animate-spin")} />
            <span>Sync</span>
          </Button>
        </div>

        {referredCandidates.length === 0 ? (
          <div className="p-8 rounded-3xl bg-card border border-dashed border-border text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">No candidate referrals logged yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Share your link with colleagues. As soon as a candidate creates an account or accepts a pass, their telemetry appears here.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-border/60 overflow-hidden divide-y divide-border/40 bg-card">
            {referredCandidates.map((cand) => (
              <div
                key={cand.id}
                className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {cand.displayName}
                    </span>
                    {cand.status === 'active' && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                        Active Seat
                      </Badge>
                    )}
                    {cand.status === 'trial' && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-amber-500/10 text-amber-400 border-amber-500/30">
                        In Trial
                      </Badge>
                    )}
                    {cand.status === 'expired' && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-zinc-500/10 text-zinc-400 border-zinc-500/30">
                        Expired
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {cand.emailMasked} • {cand.joinedAt ? formatDistanceToNow(cand.joinedAt, { addSuffix: true }) : 'Recently'}
                  </p>
                </div>

                </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Policy Footer ──────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>Operational Guidelines</span>
        </div>
        <p>
          Self-referrals are strictly prohibited by Atlas cloud security rules. Questions regarding enrollment tracking can be directed to the administrator via Settings &gt; Contact.
        </p>
      </div>
    </div>
  );
}
