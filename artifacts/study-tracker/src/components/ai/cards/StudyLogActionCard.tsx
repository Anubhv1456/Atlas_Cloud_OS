import React, { useState } from 'react';
import { ActionLogStudyPayload, AtlasClinicalAction } from '@/lib/ai/actionSchemas';
import { getOntologyForExam } from '@/data/ontology';
import { useExamProfile } from '@/hooks/useExamProfile';
import { Clock, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';

interface StudyLogActionCardProps {
  action: AtlasClinicalAction;
  onCommit: (action: AtlasClinicalAction) => void;
  onDismiss: () => void;
}

export const StudyLogActionCard: React.FC<StudyLogActionCardProps> = ({
  action,
  onCommit,
  onDismiss,
}) => {
  const initialPayload = action.payload as ActionLogStudyPayload;
  const { profile } = useExamProfile();
  const currentOntology = getOntologyForExam(profile.targetExam || 'NEET PG');
  const [duration, setDuration] = useState<number>(initialPayload.durationMinutes || 45);
  const [subjectName, setSubjectName] = useState<string>(initialPayload.subjectName || currentOntology[0]?.name || 'Pharmacology');
  const [systemName, setSystemName] = useState<string>(initialPayload.systemName || 'General Core');
  const [isCommitted, setIsCommitted] = useState<boolean>(false);

  const handleCommit = () => {
    setIsCommitted(true);
    const updatedAction: AtlasClinicalAction = {
      ...action,
      payload: {
        ...initialPayload,
        durationMinutes: duration,
        subjectName,
        systemName,
      },
      isConfirmed: true,
    };
    setTimeout(() => {
      onCommit(updatedAction);
    }, 350);
  };

  const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

  return (
    <div className="bg-card/95 backdrop-blur-xl border border-primary/20 rounded-2xl p-4 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Study Block Proposed
            </span>
            <h4 className="text-sm font-bold text-foreground leading-tight">
              {subjectName} • {systemName}
            </h4>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          <span>{duration}m</span>
        </div>
      </div>

      {/* Duration Slider & Quick Presets */}
      <div className="space-y-2 mb-4 bg-muted/30 p-2.5 rounded-xl border border-border/40">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Session Duration</span>
          <span className="font-semibold text-foreground">{duration} minutes</span>
        </div>
        <input
          type="range"
          min="10"
          max="180"
          step="5"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {DURATION_PRESETS.map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => setDuration(mins)}
              className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${
                duration === mins
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      {/* Subject Quick Selector dropdown if needed */}
      <div className="mb-4">
        <label className="text-xs text-muted-foreground block mb-1">Target Subject</label>
        <select
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          className="w-full bg-background/80 border border-border/60 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {currentOntology.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onDismiss}
          className="flex-1 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={handleCommit}
          disabled={isCommitted}
          className="flex-[2] bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-primary/25 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isCommitted ? 'Saved to Logs' : 'Confirm & Log Session'}</span>
        </button>
      </div>
    </div>
  );
};
