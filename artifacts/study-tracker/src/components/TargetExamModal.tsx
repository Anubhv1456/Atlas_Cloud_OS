import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExamProfile } from '@/hooks/useExamProfile';
import { loadUniversalOntology } from '@/lib/exam-presets';
import { 
  DEFAULT_EXAM_OPTIONS, 
  DEFAULT_CURRICULUM_OPTIONS 
} from '@/lib/examProfile';
import { toast } from 'sonner';
import { Target, Calendar, HelpCircle, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        setTargetExam(profile.targetExam || 'NEET PG');
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
      setCurriculum('Organ-System Based (Cardiology, Neurology, etc.)');
    } else if (targetExam.includes('USMLE') || targetExam.includes('PLAB') || targetExam.includes('AMC') || targetExam.includes('MCCQE')) {
      setCurriculum('Organ-System Based (Cardiology, Neurology, etc.)');
    } else if (targetExam === 'MBBS Professional Exams') {
      setCurriculum('Subject-Based (Anatomy, Pharmacology, Pathology, etc.)');
    }
  }, [targetExam]);

  // Calculate days remaining badge
  const daysRemaining = React.useMemo(() => {
    if (!targetExamDate) return null;
    const today = new Date();
    const exam = new Date(targetExamDate);
    const diff = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [targetExamDate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalExam = targetExam === 'Other Medical Board' ? customExam.trim() : targetExam;
    
    if (!finalExam) {
      toast.error('Please select or specify your target examination.');
      return;
    }

    const isCurriculumShift = profile.targetExam && profile.targetExam !== finalExam;

    try {
      setSaving(true);
      await updateProfile({
        targetExam: finalExam,
        targetExamDate,
        curriculum,
        targetScore: profile.targetScore || '',
        dailyQuestionGoal: Number(dailyQuestionGoal) || 40,
        currentYear,
      });

      if (isCurriculumShift) {
        localStorage.removeItem(`atlas_initialized_${finalExam.replace(/\s+/g, '_').toLowerCase()}`);
        await loadUniversalOntology({ targetExam: finalExam, force: true, showToast: true });
      }

      toast.success('Exam profile updated successfully.');
      onOpenChange(false);
    } catch (err) { console.error(err);
      toast.error('Failed to save exam target.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1.5rem)] sm:w-[calc(100%-2.5rem)] max-w-xl max-h-[86dvh] p-0 overflow-hidden rounded-3xl bg-card/95 dark:bg-card/95 backdrop-blur-2xl border-border/60 shadow-2xl flex flex-col">
        {/* ── Fixed Apple-Style Header ────────────────────────────────────────── */}
        <DialogHeader className="px-5 sm:px-6 pt-5 pb-3 border-b border-border/40 shrink-0 text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-primary/15 text-primary border border-primary/25 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Exam Profile
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Calibrate your clinical curriculum, timeline, and daily question targets
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Scrollable Body ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-5 overscroll-contain">
            
            {/* Target Exam Selection Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Target Examination
                </Label>
                <span className="text-xs text-muted-foreground/80 font-medium">
                  {targetExam ? targetExam : 'Select one'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                {DEFAULT_EXAM_OPTIONS.map((exam) => {
                  const isSelected = targetExam === exam;
                  return (
                    <button
                      key={exam}
                      type="button"
                      onClick={() => setTargetExam(exam)}
                      className={cn(
                        "relative px-2.5 py-2 sm:py-2.5 rounded-xl border text-xs font-semibold text-center transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-[0.98]",
                        isSelected
                          ? "bg-primary/15 border-primary/60 text-primary font-bold shadow-xs ring-1 ring-primary/30"
                          : "border-border/60 hover:border-border/90 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      )}
                    >
                      <span className="truncate">{exam}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {targetExam === 'Other Medical Board' && (
                <div className="space-y-1.5 mt-2 animate-in fade-in slide-in-from-top-1">
                  <Label htmlFor="customExam" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Specify Examination Name
                  </Label>
                  <Input
                    id="customExam"
                    placeholder="e.g. Royal College Exam, FCPS, AMC..."
                    value={customExam}
                    onChange={(e) => setCustomExam(e.target.value)}
                    required
                    className="rounded-xl h-10 px-3.5 text-xs sm:text-sm border-border/60 bg-background/50 focus-visible:ring-primary/20"
                  />
                </div>
              )}
            </div>

            {/* Target Date & Daily Target (2-Column Tablet Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/25 dark:bg-muted/15 p-3.5 rounded-2xl border border-border/50">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="examDate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-primary" />
                    Target Exam Date
                  </Label>
                  {daysRemaining !== null && (
                    <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                      {daysRemaining}d left
                    </span>
                  )}
                </div>
                <Input
                  id="examDate"
                  type="date"
                  value={targetExamDate}
                  onChange={(e) => setTargetExamDate(e.target.value)}
                  className="rounded-xl h-10 px-3 text-xs sm:text-sm bg-background border-border/60 focus-visible:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dailyGoal" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    Daily QBank Target
                  </Label>
                  <span className="text-xs text-muted-foreground font-medium">MCQs/day</span>
                </div>
                <Input
                  id="dailyGoal"
                  type="number"
                  min={5}
                  max={300}
                  value={dailyQuestionGoal}
                  onChange={(e) => setDailyQuestionGoal(Number(e.target.value))}
                  className="rounded-xl h-10 px-3 text-xs sm:text-sm bg-background border-border/60 focus-visible:ring-primary/20 font-medium"
                  required
                />
              </div>
            </div>

            {/* Academic Level & Curriculum */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {targetExam === 'MBBS Professional Exams'
                      ? 'MBBS Professional Phase'
                      : 'Current Academic Level'}
                  </Label>
                  {targetExam === 'MBBS Professional Exams' && (
                    <span className="text-xs text-primary font-semibold">
                      Filters Active Prof Syllabus
                    </span>
                  )}
                </div>
                <Select value={currentYear} onValueChange={setCurrentYear}>
                  <SelectTrigger className="rounded-xl h-10 px-3 text-xs sm:text-sm border-border/60 bg-background/50 focus:ring-primary/20">
                    <SelectValue placeholder="Select academic level" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/60 max-h-60">
                    {[
                      { value: '1st Year MBBS', label: '1st Professional (Phase I: Anatomy, Physio, Biochem)' },
                      { value: '2nd Year MBBS', label: '2nd Professional (Phase II: Path, Micro, Pharma)' },
                      { value: '3rd Year MBBS', label: '3rd Professional Part 1 (FMT, PSM, Ophtha, ENT)' },
                      { value: 'Final MBBS', label: 'Final Professional Part 2 (Med, Surg, OBGY, Peds)' },
                      { value: 'Intern', label: 'Intern / CRMI (All 19 Subjects)' },
                      { value: 'Postgraduate Resident', label: 'Postgraduate Resident / Board Review' },
                      { value: 'Other', label: 'Other Academic Stage' },
                    ].map((yr) => (
                      <SelectItem key={yr.value} value={yr.value} className="rounded-xl text-xs sm:text-sm">
                        {yr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {targetExam === 'Other Medical Board' && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-muted-foreground" />
                    Curriculum Structure
                  </Label>
                  <Select value={curriculum} onValueChange={setCurriculum}>
                    <SelectTrigger className="rounded-xl h-10 px-3 text-xs sm:text-sm border-border/60 bg-background/50 focus:ring-primary/20">
                      <SelectValue placeholder="Select curriculum format" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/60">
                      {DEFAULT_CURRICULUM_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt} className="rounded-xl text-xs sm:text-sm">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* ── Sticky Apple-Style Footer ───────────────────────────────────────── */}
          <div className="px-5 sm:px-6 py-3 border-t border-border/40 bg-card/90 dark:bg-card/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-full h-9 sm:h-10 px-4 text-xs sm:text-sm text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-full h-9 sm:h-10 px-6 font-semibold text-xs sm:text-sm shadow-md bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer disabled:opacity-70"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Profile'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
