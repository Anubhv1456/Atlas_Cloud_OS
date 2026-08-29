import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { useExamProfile } from '@/hooks/useExamProfile';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Sparkles, User as UserIcon } from 'lucide-react';
import { TargetExamModal } from '@/components/TargetExamModal';
import { differenceInDays, parseISO } from 'date-fns';

export function AccountSection() {
  const { user } = useAuth();
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

  const name = user?.displayName || 'Medical Student';
  const email = user?.email || 'Guest Session (Local Storage)';

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setModalOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setModalOpen(true); } }}
        className="flex items-center justify-between p-4 bg-card hover:bg-muted/30 active:bg-muted/50 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-3.5 min-w-0 pr-2">
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-primary/20 via-primary/10 to-teal-500/20 text-primary border border-primary/25 flex items-center justify-center font-extrabold text-base tracking-wider shrink-0 shadow-xs">
            {user ? getInitials(user.displayName, user.email) : <UserIcon className="w-6 h-6 text-muted-foreground" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-foreground tracking-tight truncate">{name}</h2>
              {hasAccess && (
                <Badge className="bg-primary/10 text-primary border border-primary/25 text-[10px] px-1.5 py-0 rounded-md font-semibold shrink-0 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Beta
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-medium text-teal-600 dark:text-teal-400">
                {isConfigured ? profile.targetExam : 'Set Target Exam'}
              </span>
              {daysRemaining !== null && (
                <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.2 rounded font-mono">
                  {daysRemaining}d left
                </span>
              )}
            </div>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground/50 shrink-0" />
      </div>

      <TargetExamModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
