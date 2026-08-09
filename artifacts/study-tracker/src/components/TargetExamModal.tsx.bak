import React, { useState, useEffect } from 'react';
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
import { 
  Target, 
  Calendar, 
  BookOpen, 
  Trophy, 
  CheckCircle2, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { 
  useExamProfile 
} from '@/hooks/useExamProfile';
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
  const [targetScore, setTargetScore] = useState(profile.targetScore || '');
  const [dailyQuestionGoal, setDailyQuestionGoal] = useState<number>(profile.dailyQuestionGoal || 40);
  const [currentYear, setCurrentYear] = useState<string>(profile.currentYear || 'Final MBBS');

  useEffect(() => {
    if (open) {
      if (DEFAULT_EXAM_OPTIONS.includes(profile.targetExam)) {
        setTargetExam(profile.targetExam);
        setCustomExam('');
      } else if (profile.targetExam) {
        setTargetExam('Other Medical Board');
        setCustomExam(profile.targetExam);
      } else {
        setTargetExam('');
        setCustomExam('');
      }
      setTargetExamDate(profile.targetExamDate || '');
      setCurriculum(profile.curriculum || DEFAULT_CURRICULUM_OPTIONS[0]);
      setTargetScore(profile.targetScore || '');
      setDailyQuestionGoal(profile.dailyQuestionGoal || 40);
      setCurrentYear(profile.currentYear || 'Final MBBS');
    }
  }, [open, profile]);

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
        targetScore,
        dailyQuestionGoal: Number(dailyQuestionGoal) || 40,
        currentYear,
      });
      toast.success('Target Examination & Curriculum updated successfully!');
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to save exam target.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg rounded-2xl p-6 sm:p-8 space-y-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Target Examination & Curriculum
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Record the exam you are preparing for to customize your study schedule.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-1">
          {/* Target Exam Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-primary" />
              Target Examination *
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEFAULT_EXAM_OPTIONS.map(exam => (
                <button
                  key={exam}
                  type="button"
                  onClick={() => setTargetExam(exam)}
                  className={`px-3 py-2 rounded-xl border text-xs text-left font-medium transition-all ${
                    targetExam === exam
                      ? 'bg-primary/10 border-primary text-primary shadow-xs'
                      : 'border-border/60 hover:border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {exam}
                </button>
              ))}
            </div>
          </div>

          {targetExam === 'Other Medical Board' && (
            <div className="space-y-1.5">
              <Label htmlFor="customExam" className="text-xs font-semibold">Specify Exam Name *</Label>
              <Input
                id="customExam"
                placeholder="e.g. Royal College Exam, FCPS Part 1..."
                value={customExam}
                onChange={e => setCustomExam(e.target.value)}
                required
                className="rounded-xl text-xs"
              />
            </div>
          )}

          {/* Exam Date & Score Goal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="examDate" className="text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Target Exam Date
              </Label>
              <Input
                id="examDate"
                type="date"
                value={targetExamDate}
                onChange={e => setTargetExamDate(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="scoreGoal" className="text-xs font-semibold flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                Target Score / Rank Goal
              </Label>
              <Input
                id="scoreGoal"
                placeholder="e.g. 260+ or Top 500 Rank"
                value={targetScore}
                onChange={e => setTargetScore(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Current Academic Level / Year */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              Current Academic Level / Year
            </Label>
            <Select value={currentYear} onValueChange={setCurrentYear}>
              <SelectTrigger className="rounded-xl text-xs h-10">
                <SelectValue placeholder="Select current year" />
              </SelectTrigger>
              <SelectContent className="rounded-xl text-xs">
                {[
                  '1st Year MBBS',
                  '2nd Year MBBS',
                  '3rd Year MBBS',
                  'Final MBBS',
                  'Intern',
                  'Postgraduate Resident',
                  'Other'
                ].map(yr => (
                  <SelectItem key={yr} value={yr} className="text-xs">
                    {yr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Curriculum Structure */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              Curriculum Structure
            </Label>
            <Select value={curriculum} onValueChange={setCurriculum}>
              <SelectTrigger className="rounded-xl text-xs h-10">
                <SelectValue placeholder="Select curriculum type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl text-xs">
                {DEFAULT_CURRICULUM_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={opt} className="text-xs">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Daily Question Target */}
          <div className="space-y-1.5">
            <Label htmlFor="dailyGoal" className="text-xs font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Daily Question Target (QBank)
            </Label>
            <Input
              id="dailyGoal"
              type="number"
              min={5}
              max={300}
              value={dailyQuestionGoal}
              onChange={e => setDailyQuestionGoal(Number(e.target.value))}
              className="rounded-xl text-xs"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-border/50 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-xl text-xs font-semibold gap-1.5 px-5"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save Exam Target
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
