import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { useExamProfile } from '@/hooks/useExamProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Target, Edit2, Calendar, Sparkles, User as UserIcon } from 'lucide-react';
import { TargetExamModal } from '@/components/TargetExamModal';
import { differenceInDays, parseISO } from 'date-fns';

export function AccountSection() {
  const { user, logout } = useAuth();
  const { hasAccess } = useBetaAccess();
  const { profile, isConfigured } = useExamProfile();
  const [modalOpen, setModalOpen] = useState(false);

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'MD';
  };

  const daysRemaining = React.useMemo(() => {
    if (!profile.targetExamDate) return null;
    try {
      const examDate = parseISO(profile.targetExamDate);
      const diff = differenceInDays(examDate, new Date());
      return diff > 0 ? diff : 0;
    } catch {
      return null;
    }
  }, [profile.targetExamDate]);

  if (!user) {
    return (
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Guest Mode</p>
            <p className="text-xs text-muted-foreground">Sign in to sync medical study progress across devices.</p>
          </div>
        </div>
      </div>
    );
  }

  const name = user.displayName || 'Medical Student';
  const email = user.email || '';

  return (
    <>
      <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 relative overflow-hidden group">
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-extrabold text-sm tracking-wider shrink-0 shadow-xs">
              {getInitials(user.displayName, user.email)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-foreground truncate">{name}</p>
                {hasAccess && (
                  <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Beta Member
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={logout}
            className="h-8 text-xs font-semibold rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors self-end sm:self-center shrink-0 gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </Button>
        </div>

        {/* Target Exam Pill Header */}
        <div className="pt-3 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-500 border border-teal-500/20 shrink-0">
              <Target className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Target Horizon
              </span>
              <p className="text-xs font-bold text-foreground truncate">
                {isConfigured ? profile.targetExam : 'Target Exam Not Set'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {daysRemaining !== null && (
              <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60 text-muted-foreground flex items-center gap-1.5 shrink-0">
                <Calendar className="w-3 h-3 text-primary" />
                <span>{daysRemaining} days left</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-3 py-1 rounded-xl text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              <Edit2 className="w-3 h-3" />
              <span>{isConfigured ? 'Edit Target' : 'Configure'}</span>
            </button>
          </div>
        </div>
      </div>

      <TargetExamModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
