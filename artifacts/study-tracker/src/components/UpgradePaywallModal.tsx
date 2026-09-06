import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Key, CreditCard, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { useLocation } from 'wouter';

export function UpgradePaywallModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [affiliateId, setAffiliateId] = useState<string>('');

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-paywall-modal', handleOpen);
    
    // Affiliate Tracking: Read ?via= parameter from URL on load
    const urlParams = new URLSearchParams(window.location.search);
    const via = urlParams.get('via');
    if (via) {
      setAffiliateId(via);
      localStorage.setItem('atlas_affiliate_id', via);
    } else {
      const storedVia = localStorage.getItem('atlas_affiliate_id');
      if (storedVia) setAffiliateId(storedVia);
    }

    return () => window.removeEventListener('open-paywall-modal', handleOpen);
  }, []);

  const handleStripeCheckout = () => {
    // Generate Stripe payment URL with affiliate tracking
    let paymentUrl = 'https://buy.stripe.com/test_dummy_link_for_atlas';
    if (affiliateId) {
      paymentUrl += `?client_reference_id=${encodeURIComponent(affiliateId)}`;
    }
    window.open(paymentUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] border-amber-500/20 shadow-2xl shadow-amber-900/10 p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/5 p-6 border-b border-border/50 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-4 border border-amber-200 dark:border-amber-500/30">
            <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-2xl font-bold text-foreground mb-2">Unlock Atlas Intelligence</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground max-w-sm mx-auto">
            Atlas runs on a BYOK (Bring Your Own Key) model to give you absolute privacy and zero recurring AI compute markups.
          </DialogDescription>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <CreditCard className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">1. One-Time Software License</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Pay a single <strong>$69 lifetime fee</strong> for the Atlas interface. No monthly subscriptions, no hidden software fees. You own the software forever.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Key className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">2. Bring Your Own Key (BYOK)</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Enter your own Gemini API key in Settings. You pay Google directly for exactly what you use (typically ~$2-5/month during intense study periods).
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">3. Absolute Privacy</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Your API key never leaves your browser. All your study data, mistakes, and AI context remain 100% local on your device.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Atlas Lifetime Pass</span>
              <span className="text-lg font-bold">$69.00</span>
            </div>
            <Button 
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-md"
              onClick={handleStripeCheckout}
            >
              <Zap className="w-4 h-4 mr-2" />
              Get Lifetime Access
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Secure checkout via Stripe. Includes all future Atlas UI updates.
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
