import React, { useState } from 'react';
import { useExamProfile } from '@/hooks/useExamProfile';
import { Button } from '@/components/ui/button';
import { Target, Calendar, Trophy, BookOpen, Edit3, CheckCircle2 } from 'lucide-react';
import { TargetExamModal } from '@/components/TargetExamModal';
import { Badge } from '@/components/ui/badge';

export function ExamProfileSection() {
  const { profile, isConfigured } = useExamProfile();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Examination</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setModalOpen(true)}
          className="h-7 text-xs text-primary font-semibold gap-1 hover:bg-primary/10 rounded-lg"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit Target
        </Button>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-4">
        {isConfigured ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Target Exam</div>
                  <div className="text-base font-bold text-foreground">{profile.targetExam}</div>
                </div>
              </div>
              {profile.targetScore && (
                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs px-2.5 py-1 rounded-xl self-start sm:self-auto font-semibold">
                  <Trophy className="w-3.5 h-3.5 mr-1" />
                  Goal: {profile.targetScore}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <span className="text-[10px] text-muted-foreground font-mono uppercase block">Exam Date</span>
                  <span className="font-semibold text-foreground">
                    {profile.targetExamDate 
                      ? new Date(profile.targetExamDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                      : 'Not set'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-muted-foreground">
                <BookOpen className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <span className="text-[10px] text-muted-foreground font-mono uppercase block">Curriculum</span>
                  <span className="font-semibold text-foreground truncate block max-w-[200px]" title={profile.curriculum}>
                    {profile.curriculum}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">No Target Exam Recorded</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select your target medical board exam to personalize your study timeline and goals.
              </p>
            </div>
            <Button
              onClick={() => setModalOpen(true)}
              size="sm"
              className="rounded-xl text-xs font-semibold gap-1.5"
            >
              <Target className="w-3.5 h-3.5" />
              Set Target Exam
            </Button>
          </div>
        )}
      </div>

      <TargetExamModal open={modalOpen} onOpenChange={setModalOpen} />
    </section>
  );
}
