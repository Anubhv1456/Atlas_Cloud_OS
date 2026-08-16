import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Copy, 
  Check, 
  Share2, 
  Users, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { getUserReferralStatus, UserReferralStatus, DEFAULT_REFERRAL_CONFIG } from '@/lib/referral';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ReferralModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReferralModal({ open, onOpenChange }: ReferralModalProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<UserReferralStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchStatus = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserReferralStatus(user);
      setStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && user) {
      fetchStatus();
    }
  }, [open, user]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteCode = status?.referralCode || '';
  const inviteUrl = `${origin}/accept-invitation?ref=${inviteCode}`;

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Study pass link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      toast.error('Failed to copy link');
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Hey, I've been using Atlas to organize my NEET PG / INICET revision schedule and high-yield weak spots. Here's a 15-day study pass: ${inviteUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const passesRemaining = status ? status.passesRemaining : 3;
  const maxPasses = status ? status.maxPasses : 3;
  const history = status?.history || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg rounded-3xl p-6 sm:p-8 space-y-6 bg-card border-border/40 shadow-2xl">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Study Circle</span>
            </div>
            <Badge variant="outline" className="text-xs px-2.5 py-0.5 border-teal-500/30 text-teal-400 font-mono">
              {passesRemaining} of {maxPasses} Passes Left
            </Badge>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Batchmate Study Passes
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Invite batchmates from your library, reading room, or study circle. When an invited peer joins and completes their first study block (≥10 mins), both of your accounts receive <strong className="text-foreground">+14 days</strong> automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Invite Code & Link Box */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Your Batchmate Invite Link</span>
            {inviteCode && <span className="font-mono text-teal-400 font-bold">{inviteCode}</span>}
          </div>

          <div className="flex items-center gap-2">
            <input 
              readOnly 
              value={inviteUrl} 
              className="flex-1 bg-background/80 border border-border/70 rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none select-all truncate"
            />
            <Button 
              size="sm" 
              onClick={handleCopyLink}
              className={cn(
                "h-9 px-3 rounded-xl gap-1.5 text-xs font-semibold transition-all",
                copied ? "bg-teal-600 hover:bg-teal-600 text-white" : "bg-primary text-primary-foreground"
              )}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>

          <div className="pt-1 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="w-full h-8 text-xs rounded-xl border-border/80 hover:bg-teal-500/10 hover:text-teal-400 hover:border-teal-500/30 gap-1.5 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share to WhatsApp Study Group</span>
            </Button>
          </div>
        </div>

        {/* Batchmate List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Invited Batchmates ({history.length})
            </span>
            <button 
              onClick={fetchStatus} 
              disabled={loading}
              className="text-[11px] text-muted-foreground hover:text-teal-400 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
              <span>Refresh</span>
            </button>
          </div>

          {history.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-border/60 text-center bg-muted/20">
              <p className="text-xs text-muted-foreground">
                No batchmates invited yet. Share your pass link with peers in your reading room to unlock mutual study extensions.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {history.map((record) => {
                const isQualified = record.status === 'qualified';
                const dateStr = record.claimedAt?.toDate
                  ? formatDistanceToNow(record.claimedAt.toDate(), { addSuffix: true })
                  : 'recently';

                return (
                  <div 
                    key={record.id}
                    className="p-3 rounded-xl bg-card border border-border/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground truncate">
                        {record.refereeEmail || record.refereeName || 'Doctor'}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Joined {dateStr}
                      </div>
                    </div>

                    <div>
                      {isQualified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-400 text-[11px] font-semibold border border-teal-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          +14d Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-medium border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          First Session Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Academic Note */}
        <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/10 text-[11.5px] text-muted-foreground leading-relaxed flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <span>
            Passes are designed for medical peers preparing for NEET PG, INICET, NEXT, FMGE, or USMLE. Bonus days apply automatically upon completed study sessions.
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
