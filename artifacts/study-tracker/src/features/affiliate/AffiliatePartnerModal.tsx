import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
  TrendingUp,
  CheckCircle2,
  HelpCircle,
  Building,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAffiliate } from '@/hooks/useAffiliate';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface AffiliatePartnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AffiliatePartnerModal({ open, onOpenChange }: AffiliatePartnerModalProps) {
  const {
    isAffiliate,
    affiliateCode,
    stats,
    referredCandidates,
    referralLinks,
    referralsLoading,
    refresh,
    config
  } = useAffiliate();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = async () => {
    if (!affiliateCode) return;
    try {
      await navigator.clipboard.writeText(affiliateCode);
      setCopiedCode(true);
      toast.success('Partner code copied to clipboard');
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
      toast.success('Affiliate invitation link copied');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Hey, prepare for USMLE / NEET PG with Atlas Medical OS. Here is my partner invitation link to test the smart curriculum & spaced repetition:\n${referralLinks.primaryLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = `Atlas Medical OS - Clinical Study Operating System. Check it out via my partner pass: ${referralLinks.primaryLink}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLinks.primaryLink)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = `Optimizing my medical exam revisions with Atlas Medical OS. Join via my partner link: ${referralLinks.primaryLink}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 space-y-6 bg-card border-border/50 shadow-2xl text-foreground">
        
        {/* ── Dialog Header ────────────────────────────────────────────── */}
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>Atlas Ambassador & Affiliate Partner</span>
            </div>
            {isAffiliate && (
              <Badge variant="outline" className="text-xs px-2.5 py-0.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Verified Partner
              </Badge>
            )}
          </div>

          <DialogTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Partner Revenue & Referral Hub
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Share Atlas with candidates and medical batchmates. Track live seat activations and accrued revenue commissions.
          </DialogDescription>
        </DialogHeader>

        {/* ── Metric Highlights Bento Grid ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Candidates */}
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Referrals</span>
              <Users className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              {stats.totalReferrals}
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5">Enrolled candidates</span>
          </div>

          {/* Active Seats */}
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Active Seats</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 tracking-tight">
              {stats.activeSeats}
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5">Qualified licenses</span>
          </div>

          {/* Accrued Commission */}
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Earned</span>
              <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-indigo-400 tracking-tight">
              ${stats.earnedCommission}
            </div>
            <span className="text-[10px] text-indigo-400/80 mt-0.5">${stats.commissionRate} / active seat</span>
          </div>

          {/* Pending Pipeline */}
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">In Trial</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-400 tracking-tight">
              {stats.pendingSeats}
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5">Pending qualification</span>
          </div>
        </div>

        {/* ── Partner Link & Code Distribution Box ───────────────────────── */}
        <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Your Dedicated Partner Attribution
            </h3>
            <span className="text-xs text-muted-foreground font-mono">Cookie Window: {config?.cookieWindowDays || 60} Days</span>
          </div>

          {/* Link Box */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 min-w-0 px-3.5 py-2 rounded-xl bg-background border border-border font-mono text-xs text-foreground truncate select-all">
              {referralLinks.primaryLink}
            </div>
            <Button
              onClick={handleCopyLink}
              size="sm"
              className={cn(
                "h-9 rounded-xl font-semibold gap-1.5 shrink-0 transition-all",
                copiedLink
                  ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white"
              )}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied' : 'Copy Partner Link'}</span>
            </Button>
          </div>

          {/* Partner Code Chip */}
          <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Partner Code:</span>
              <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {affiliateCode || 'Not Assigned'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyCode}
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? 'Code Copied' : 'Copy Code'}</span>
            </Button>
          </div>

          {/* Quick Share Buttons */}
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="rounded-xl h-8 text-xs gap-1.5 border-border hover:bg-muted/40"
            >
              <Share2 className="w-3 h-3 text-emerald-400" /> Share on WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareTelegram}
              className="rounded-xl h-8 text-xs gap-1.5 border-border hover:bg-muted/40"
            >
              <Share2 className="w-3 h-3 text-sky-400" /> Share on Telegram
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareTwitter}
              className="rounded-xl h-8 text-xs gap-1.5 border-border hover:bg-muted/40"
            >
              <ExternalLink className="w-3 h-3 text-zinc-400" /> Share on X
            </Button>
          </div>
        </div>

        {/* ── Referred Candidates Roster ────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Referred Candidate Roster
              </h3>
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
              <span>Refresh</span>
            </Button>
          </div>

          {referredCandidates.length === 0 ? (
            <div className="p-8 rounded-2xl bg-muted/20 border border-dashed border-border text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">No candidate referrals logged yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                When students register or activate study passes through your partner link, their anonymous enrollment status and earned commissions appear here automatically.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/40 bg-card">
              {referredCandidates.map((cand) => (
                <div
                  key={cand.id}
                  className="p-3.5 flex items-center justify-between hover:bg-muted/20 transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {cand.displayName}
                      </span>
                      {cand.status === 'active' && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          Active Seat
                        </Badge>
                      )}
                      {cand.status === 'trial' && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 bg-amber-500/10 text-amber-400 border-amber-500/30">
                          In Trial
                        </Badge>
                      )}
                      {cand.status === 'expired' && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 bg-zinc-500/10 text-zinc-400 border-zinc-500/30">
                          Expired
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {cand.emailMasked} • {cand.joinedAt ? formatDistanceToNow(cand.joinedAt, { addSuffix: true }) : 'Recently'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={cn(
                      "text-xs font-bold font-mono",
                      cand.commissionEarned > 0 ? "text-emerald-400" : "text-muted-foreground"
                    )}>
                      {cand.commissionEarned > 0 ? `+$${cand.commissionEarned}.00` : '$0.00'}
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      {cand.commissionEarned > 0 ? 'Accrued' : 'Awaiting'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Partner Payout & Operational Terms ─────────────────────────── */}
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Commission & Payout Policy</span>
          </div>
          <p>
            Commissions are accrued at <strong>${config?.commissionRateUsd || 50}.00 USD</strong> per candidate who secures an unexpired active beta license or annual pass. Balances are reconciled on the 1st of every month and disbursed via wire transfer.
          </p>
          <p className="text-[11px] text-muted-foreground/70">
            Self-referrals are strictly prohibited by Atlas cloud security rules. Questions regarding payouts can be directed to the administrator via Settings &gt; Contact.
          </p>
        </div>

      </DialogContent>
    </Dialog>
  );
}
