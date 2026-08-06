import React from 'react';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { Sparkles, ShieldCheck, Clock, KeyRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ClosedBetaSection() {
  const { hasAccess, expiresAt } = useBetaAccess();

  const daysRemaining = expiresAt
    ? Math.max(0, Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          Atlas Membership
        </h2>
        <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/20 text-[11px] px-2.5 py-0.5 rounded-full font-medium">
          Closed Beta Member
        </Badge>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground flex items-center gap-2">
                Closed Beta Membership
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Includes full access to study engine, curriculum intelligence & all updates.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/40 flex items-center gap-3">
            <Clock className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <div className="text-[10px] text-muted-foreground font-mono uppercase">Valid Until</div>
              <div className="text-xs font-semibold text-foreground mt-0.5">
                {daysRemaining !== null 
                  ? `${daysRemaining} Days Remaining` 
                  : 'Lifetime Beta Access'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/40 flex items-center gap-3">
            <KeyRound className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <div className="text-[10px] text-muted-foreground font-mono uppercase">Member Tier</div>
              <div className="text-xs font-semibold text-foreground mt-0.5">
                Closed Beta Member
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

