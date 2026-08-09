const fs = require('fs');
const file = 'artifacts/study-tracker/src/components/TargetExamModal.tsx';

const content = `import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExamProfile } from '@/hooks/useExamProfile';
import { 
  DEFAULT_EXAM_OPTIONS, 
  DEFAULT_CURRICULUM_OPTIONS 
} from '@/lib/examProfile';
import { toast } from 'sonner';

interface TargetExamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TargetExamModal({ open, onOpenChange }: TargetExamModalProps) {
  const { profile, updateProfile } = useExamProfile();
  const [saving, setSaving] = useState(false);

  const [targetExam, setTargetExam] = useState(profile.targetExam || '');
  const [customExam, setCustomExam] = useState('');
  const [targetExamDate, setTargetExamDate] = useState(profile.targetExamDate || '');
  const [curriculum, setCurriculum] = useState(profile.curriculum || DEFAULT_CURRICULUM_OPTIONS[0]);
  const [dailyQuestionGoal, setDailyQuestionGoal] = useState<number>(profile.dailyQuestionGoal || 40);
  const [currentYear, setCurrentYear] = useState<string>(profile.currentYear || 'Final MBBS');

  useEffect(() => {
    if (open) {
      if (profile.targetExam && !DEFAULT_EXAM_OPTIONS.includes(profile.targetExam)) {
        setTargetExam('Other Medical Board');
        setCustomExam(profile.targetExam);
      } else {
        setTargetExam(profile.targetExam || '');
        setCustomExam('');
      }
      setTargetExamDate(profile.targetExamDate || '');
      setCurriculum(profile.curriculum || DEFAULT_CURRICULUM_OPTIONS[0]);
      setDailyQuestionGoal(profile.dailyQuestionGoal || 40);
      setCurrentYear(profile.currentYear || 'Final MBBS');
    }
  }, [open, profile]);

  useEffect(() => {
    // Smart default for Daily Question Target based on days remaining
    if (targetExamDate && targetExam && targetExam !== 'Other Medical Board') {
      const today = new Date();
      const exam = new Date(targetExamDate);
      const diffTime = exam.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays > 0) {
          // Assume ~4000 QBank average for standard medical exams
          const defaultDaily = Math.max(10, Math.ceil(4000 / diffDays));
          setDailyQuestionGoal(defaultDaily > 300 ? 300 : defaultDaily);
      }
    }
  }, [targetExamDate, targetExam]);

  useEffect(() => {
    // Auto-select curriculum based on known exam structures
    if (targetExam === 'NEET PG' || targetExam === 'INICET' || targetExam === 'NEXT' || targetExam === 'INI-CET') {
      setCurriculum('System-Wise (e.g. CVS, RS, CNS)');
    } else if (targetExam.includes('USMLE') || targetExam.includes('PLAB') || targetExam.includes('AMC') || targetExam.includes('MCCQE')) {
      setCurriculum('System-Wise (e.g. CVS, RS, CNS)');
    } else if (targetExam === 'MBBS Professional Exams') {
       setCurriculum('Subject-Wise (e.g. Anatomy, Physiology)');
    }
  }, [targetExam]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalExam = targetExam === 'Other Medical Board' ? customExam.trim() : targetExam;
    
    if (!finalExam) {
      toast.error('Please select or specify your target examination.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        targetExam: finalExam,
        targetExamDate,
        curriculum,
        targetScore: profile.targetScore || '',
        dailyQuestionGoal: Number(dailyQuestionGoal) || 40,
        currentYear,
      });
      toast.success('Exam profile updated.');
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to save exam target.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg rounded-3xl p-6 sm:p-8 space-y-8 bg-card border-border/40 shadow-2xl">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-2xl font-medium tracking-tight">
            Exam Profile
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground/80">
            Set your target to calibrate your timeline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-8">
          
          <div className="space-y-4">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Target Examination
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEFAULT_EXAM_OPTIONS.map(exam => (
                <button
                  key={exam}
                  type="button"
                  onClick={() => setTargetExam(exam)}
                  className={\`px-4 py-3 rounded-2xl border text-sm text-left transition-all duration-200 \${
                    targetExam === exam
                      ? 'bg-primary/10 border-primary/50 text-primary font-medium'
                      : 'border-border/60 hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }\`}
                >
                  {exam}
                </button>
              ))}
            </div>
            
            {targetExam === 'Other Medical Board' && (
              <div className="space-y-2 mt-4">
                <Label htmlFor="customExam" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Specify Exam Name</Label>
                <Input
                  id="customExam"
                  placeholder="e.g. Royal College Exam, FCPS Part 1..."
                  value={customExam}
                  onChange={e => setCustomExam(e.target.value)}
                  required
                  className="rounded-2xl h-11 px-4 border-border/60 bg-transparent focus-visible:ring-primary/20"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-muted/20 p-5 rounded-3xl border border-border/40">
            <div className="space-y-2.5">
              <Label htmlFor="examDate" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Target Exam Date
              </Label>
              <Input
                id="examDate"
                type="date"
                value={targetExamDate}
                onChange={e => setTargetExamDate(e.target.value)}
                className="rounded-2xl h-11 px-4 bg-background border-border/60 focus-visible:ring-primary/20"
                required
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="dailyGoal" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Daily QBank Target
              </Label>
              <Input
                id="dailyGoal"
                type="number"
                min={5}
                max={300}
                value={dailyQuestionGoal}
                onChange={e => setDailyQuestionGoal(Number(e.target.value))}
                className="rounded-2xl h-11 px-4 bg-background border-border/60 focus-visible:ring-primary/20"
                required
              />
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Current Academic Level
              </Label>
              <Select value={currentYear} onValueChange={setCurrentYear}>
                <SelectTrigger className="rounded-2xl h-11 px-4 border-border/60 focus:ring-primary/20">
                  <SelectValue placeholder="Select current year" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/60">
                  {[
                    '1st Year MBBS',
                    '2nd Year MBBS',
                    '3rd Year MBBS',
                    'Final MBBS',
                    'Intern',
                    'Postgraduate Resident',
                    'Other'
                  ].map(yr => (
                    <SelectItem key={yr} value={yr} className="rounded-xl">
                      {yr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {targetExam === 'Other Medical Board' && (
              <div className="space-y-2.5 animate-in fade-in slide-in-from-top-1">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Curriculum Structure
                </Label>
                <Select value={curriculum} onValueChange={setCurriculum}>
                  <SelectTrigger className="rounded-2xl h-11 px-4 border-border/60 focus:ring-primary/20">
                    <SelectValue placeholder="Select curriculum type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/60">
                    {DEFAULT_CURRICULUM_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt} className="rounded-xl">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 flex items-center justify-between gap-3 sm:justify-end border-t border-border/40">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-full h-11 px-6 text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-full h-11 px-8 font-medium shadow-sm"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                'Save Profile'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
`;
fs.writeFileSync(file, content);
