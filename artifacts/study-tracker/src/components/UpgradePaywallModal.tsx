import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Key, CreditCard, Sparkles, Zap, ShieldCheck, Brain, Layers, RotateCcw, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { toast } from 'sonner';

export interface PaywallTriggerDetail {
  trigger?: 'trial_expired' | 'recalibration_relief_cap' | 'default';
}

export function UpgradePaywallModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<PaywallTriggerDetail>({ trigger: 'default' });
  const [, setLocation] = useLocation();
  const [affiliateId, setAffiliateId] = useState<string>('');
  const { user, signInWithGoogle } = useAuth();
  const { hasAccess } = useBetaAccess();

  // Automatically dismiss paywall trap whenever paid access is confirmed
  useEffect(() => {
    if (hasAccess && isOpen) {
      setIsOpen(false);
    }
  }, [hasAccess, isOpen]);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<PaywallTriggerDetail>;
      if (customEvent.detail) {
        setPayload(customEvent.detail);
      } else {
        setPayload({ trigger: 'default' });
      }
      setIsOpen(true);
    };

    window.addEventListener('open-paywall-modal', handleOpen as EventListener);
    
    // Affiliate Tracking: Read ?via= or ?ref= parameter from URL on load
    const urlParams = new URLSearchParams(window.location.search);
    const via = urlParams.get('via') || urlParams.get('ref');
    if (via) {
      setAffiliateId(via);
      localStorage.setItem('atlas_affiliate_id', via);
    } else {
      const storedVia = localStorage.getItem('atlas_affiliate_id') || sessionStorage.getItem('atlas_pending_ref_code');
      if (storedVia) setAffiliateId(storedVia);
    }

    return () => window.removeEventListener('open-paywall-modal', handleOpen as EventListener);
  }, []);

  const handleCheckout = async () => {
    if (!user) {
      toast.info('Please sign in with Google to associate your lifetime license.');
      try {
        await signInWithGoogle();
      } catch (err) {
        toast.error('Sign-in is required to continue to checkout.');
      }
      return;
    }

    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const currentAffiliate = affiliateId || localStorage.getItem('atlas_affiliate_id') || sessionStorage.getItem('atlas_pending_ref_code') || '';

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ affiliateId: currentAffiliate }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Checkout session creation failed (${response.status})`);
      }

      const { checkout_url } = await response.json();

      if (!checkout_url) {
        throw new Error('Payment gateway did not return a valid checkout URL');
      }

      // Redirect to Dodo hosted checkout page
      window.location.href = checkout_url;
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'Failed to initialize secure checkout. Please try again.');
      setLoading(false);
    }
  };

  // ── Dynamic Headline & Context Mapping ─────────────────────────────────────
  const getContextualContent = () => {
    switch (payload.trigger) {
      case 'trial_expired':
        return {
          icon: <Lock className="w-8 h-8 text-amber-400" />,
          badge: `Trial Expired`,
          title: "Your 14-Day Free Trial Has Ended",
          description: `To continue logging study blocks, recovering mistakes, and using the Spaced Repetition engine, upgrade your vault access.`,
        };
      case 'recalibration_relief_cap':
        return {
          icon: <RotateCcw className="w-8 h-8 text-amber-400" />,
          badge: "Soft Recalibration Protection",
          title: "Protect Against Rotation Backlogs",
          description: "You've experienced zero-debt schedule smoothing. Unlock continuous Soft Recalibrations to protect your schedule after every clinical duty shift, hospital call, or rest break.",
        };
      default:
        return {
          icon: <Lock className="w-8 h-8 text-amber-400" />,
          badge: "Atlas Intelligence",
          title: "Unlock Full Atlas Study Vault",
          description: "One-time lifetime software license for USMLE Step 1 & Step 2 CK. No monthly subscriptions, no recurring compute markups.",
        };
    }
  };

  const contextInfo = getContextualContent();

  const isTrialExpiredTrap = payload.trigger === 'trial_expired' && !hasAccess;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Prevent closing if it's a trial expiration trap
      if (isTrialExpiredTrap && !open) return;
      setIsOpen(open);
    }}>
      <DialogContent 
        className="sm:max-w-[500px] border-white/5 border-l-2 border-l-amber-500/30 shadow-2xl shadow-amber-900/10 p-0 overflow-hidden"
        onInteractOutside={(e) => {
          if (isTrialExpiredTrap) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isTrialExpiredTrap) e.preventDefault();
        }}
        hideCloseButton={isTrialExpiredTrap}
      >
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/5 p-6 border-b border-border/50 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-3 border border-amber-200 dark:border-amber-500/30 shadow-inner">
            {contextInfo.icon}
          </div>
          <span className="text-[11px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
            {contextInfo.badge}
          </span>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground mb-1.5">{contextInfo.title}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {contextInfo.description}
          </DialogDescription>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-3.5">
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-lg bg-zinc-800/40 flex items-center justify-center shrink-0 mt-0.5 border border-white/5">
                <CreditCard className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-foreground">One-Time Software License</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Single purchase grants permanent access to all 19 organ systems, unlimited mistake logs, and lifetime UI updates.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/20">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-foreground">Bring Your Own Key (BYOK)</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Plug in your own Gemini key for AI flashcard deck generation. You pay Google directly with zero markups.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-lg bg-emerald-950/20 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-foreground">100% Local-First & Private</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Your notes, test autopsies, and memory decay states remain securely encrypted in your browser's IndexedDB.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/40 rounded-xl p-4 border border-border/80">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-semibold text-foreground block">Atlas Lifetime Pass</span>
                <span className="text-[10px] text-muted-foreground">All Organ Systems & Unlimited Autopsies</span>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground">Calculated at Checkout</span>
            </div>
            <Button 
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs py-2 shadow-md cursor-pointer transition-all"
              onClick={handleCheckout}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Connecting to Secure Checkout...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 mr-1.5" />
                  Unlock Lifetime Access
                </>
              )}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground mt-2">
              Instant activation via Dodo Payments • Merchant of Record
            </p>
          </div>
          
          <div className="text-center">
            <Button 
              variant="link" 
              className="text-xs text-muted-foreground hover:text-primary"
              onClick={() => {
                setIsOpen(false);
                setLocation('/settings');
              }}
            >
              I already have a License / Enter API Key
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

