import React, { useState } from 'react';
import { ActionUpsertMistakePayload, AtlasClinicalAction } from '@/lib/ai/actionSchemas';
import { ALL_SUBJECTS } from '@/data/ontology';
import { Flame, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

interface MistakePearlActionCardProps {
  action: AtlasClinicalAction;
  onCommit: (action: AtlasClinicalAction) => void;
  onDismiss: () => void;
}

export const MistakePearlActionCard: React.FC<MistakePearlActionCardProps> = ({
  action,
  onCommit,
  onDismiss,
}) => {
  const initialPayload = action.payload as ActionUpsertMistakePayload;
  const [pearlRule, setPearlRule] = useState<string>(initialPayload.pearlRule || '');
  const [pitfallTrap, setPitfallTrap] = useState<string>(initialPayload.pitfallTrap || '');
  const [isVolatile, setIsVolatile] = useState<boolean>(!!initialPayload.isVolatile);
  const [subjectName, setSubjectName] = useState<string>(initialPayload.subjectName || 'Clinical Core');
  const [errorType, setErrorType] = useState<string>(initialPayload.errorType || 'CONCEPTUAL_CONFUSION');
  const [isCommitted, setIsCommitted] = useState<boolean>(false);

  const ERROR_TYPES = [
    { id: 'CONCEPTUAL_CONFUSION', label: 'Conceptual Trap' },
    { id: 'FACTUAL_RECALL', label: 'Factual Recall' },
    { id: 'TRICK_QUESTION', label: 'Trick Stem' },
    { id: 'SPEED_ERROR', label: 'Speed Error' },
  ];

  const handleCommit = () => {
    setIsCommitted(true);
    const updatedAction: AtlasClinicalAction = {
      ...action,
      payload: {
        ...initialPayload,
        pearlRule,
        pitfallTrap,
        isVolatile,
        subjectName,
        errorType: errorType as any,
      },
      isConfirmed: true,
    };
    setTimeout(() => {
      onCommit(updatedAction);
    }, 350);
  };

  return (
    <div className="bg-card/95 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-4 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
              20th Notebook Pearl
            </span>
            <h4 className="text-sm font-bold text-foreground leading-tight">{subjectName}</h4>
          </div>
        </div>

        {/* Volatile Toggle Chip */}
        <button
          type="button"
          onClick={() => setIsVolatile(!isVolatile)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
            isVolatile
              ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>{isVolatile ? 'Volatile 🔥' : 'Standard'}</span>
        </button>
      </div>

      {/* Editable Rule Box */}
      <div className="space-y-2 mb-3">
        <div className="bg-background/90 border border-border/60 rounded-xl p-2.5 focus-within:ring-1 focus-within:ring-amber-500/50">
          <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">
            Core High-Yield Rule
          </label>
          <textarea
            rows={2}
            value={pearlRule}
            onChange={(e) => setPearlRule(e.target.value)}
            className="w-full bg-transparent text-xs text-foreground font-medium focus:outline-none resize-none"
            placeholder="Clinical rule (e.g. DOC for Trigeminal Neuralgia is Carbamazepine)..."
          />
        </div>

        {/* Pitfall Trap Box */}
        <div className="bg-background/90 border border-border/60 rounded-xl p-2.5 focus-within:ring-1 focus-within:ring-amber-500/50">
          <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-500/90 mb-0.5">
            <ShieldAlert className="w-3 h-3" />
            <span>Common Trap / Pitfall</span>
          </div>
          <input
            type="text"
            value={pitfallTrap}
            onChange={(e) => setPitfallTrap(e.target.value)}
            className="w-full bg-transparent text-xs text-foreground font-medium focus:outline-none"
            placeholder="e.g. Oximes are ineffective after AChE aging..."
          />
        </div>
      </div>

      {/* Error Type Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mb-4">
        {ERROR_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setErrorType(t.id)}
            className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors whitespace-nowrap ${
              errorType === t.id
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/30'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
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
          disabled={isCommitted || !pearlRule.trim()}
          className="flex-[2] bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/25 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isCommitted ? 'Saved to 20th Notebook' : 'Save to 20th Notebook'}</span>
        </button>
      </div>
    </div>
  );
};
