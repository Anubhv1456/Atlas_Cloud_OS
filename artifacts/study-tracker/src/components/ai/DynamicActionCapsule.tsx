import React from 'react';
import { cn } from '@/lib/utils';
import { AtlasClinicalAction } from '@/lib/ai/actionSchemas';
import { executeOptimisticMutation } from '@/lib/ai/optimisticMutations';
import { StudyLogActionCard } from './cards/StudyLogActionCard';
import { MistakePearlActionCard } from './cards/MistakePearlActionCard';
import { Mic, Volume2, Sparkles, X, ChevronDown, CheckCircle2 } from 'lucide-react';

interface DynamicActionCapsuleProps {
  isActive: boolean;
  isListening: boolean;
  isThinking: boolean;
  isSpeakingAI: boolean;
  energyLevel: number;
  liveTranscript: string;
  actions: AtlasClinicalAction[];
  onDismissAction: (actionId: string) => void;
  onCommitAction: (action: AtlasClinicalAction) => void;
  onCloseSession: () => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
}

export const DynamicActionCapsule: React.FC<DynamicActionCapsuleProps> = ({
  isActive,
  isListening,
  isThinking,
  isSpeakingAI,
  energyLevel,
  liveTranscript,
  actions,
  onDismissAction,
  onCommitAction,
  onCloseSession,
  onStartRecording,
  onStopRecording,
}) => {
  const [isExpanded, setIsExpanded] = React.useState<boolean>(true);

  if (!isActive && actions.length === 0) {
    return null;
  }

  const handleCommit = async (action: AtlasClinicalAction) => {
    await executeOptimisticMutation(action);
    onCommitAction(action);
  };

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg transition-all duration-300 pointer-events-auto">
      {/* Morphing Capsule Container */}
      <div className="bg-background/85 backdrop-blur-2xl border border-primary/20 rounded-3xl p-3 shadow-2xl shadow-primary/10 overflow-hidden ring-1 ring-white/10">
        
        {/* Dynamic Header Pill */}
        <div className="flex items-center justify-between gap-2 px-1 mb-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <button
              type="button"
              onPointerDown={onStartRecording}
              onPointerUp={onStopRecording}
              onPointerLeave={onStopRecording}
              onTouchStart={onStartRecording}
              onTouchEnd={onStopRecording}
              title="Hold to Speak"
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer select-none shadow-md",
                isSpeakingAI
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/40 animate-pulse'
                  : isListening
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105 ring-2 ring-emerald-400'
                  : 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30'
              )}
            >
              {isSpeakingAI ? (
                <Volume2 className="w-4 h-4 animate-bounce" />
              ) : (
                <Mic className={cn("w-4 h-4", isListening && "animate-pulse")} />
              )}
            </button>

            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5 leading-none">
                {isSpeakingAI ? 'Atlas Speaking...' : isThinking ? 'Synthesizing...' : isListening ? 'Listening (Release to Submit)...' : 'Hold Mic to Speak'}
                {isListening && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                )}
              </span>
              <span className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                {liveTranscript || (isListening ? 'Speak your thoughts or revision requests...' : isSpeakingAI ? 'Explaining high-yield pearl' : 'Hold button above to talk')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {actions.length > 0 && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors text-xs font-semibold px-2 bg-muted/40"
              >
                {actions.length} Action{actions.length > 1 ? 's' : ''}
              </button>
            )}
            <button
              type="button"
              onClick={onCloseSession}
              className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Ambient Voice Visualizer Waveform Bar */}
        {isActive && (
          <div className="w-full h-1 bg-muted/40 rounded-full overflow-hidden mb-2 relative">
            <div
              className="h-full bg-gradient-to-r from-primary via-indigo-500 to-emerald-400 transition-all duration-75"
              style={{
                width: `${Math.max(8, Math.min(100, energyLevel * 100))}%`,
              }}
            />
          </div>
        )}

        {/* Dynamic Action Cards Carousel / Stack */}
        {isExpanded && actions.length > 0 && (
          <div className="space-y-2 mt-2 pt-1 border-t border-border/40 max-h-[380px] overflow-y-auto no-scrollbar">
            {actions.map((act) => {
              if (act.actionType === 'ACTION_LOG_STUDY') {
                return (
                  <StudyLogActionCard
                    key={act.id}
                    action={act}
                    onCommit={() => handleCommit(act)}
                    onDismiss={() => onDismissAction(act.id)}
                  />
                );
              }
              if (act.actionType === 'ACTION_UPSERT_MISTAKE') {
                return (
                  <MistakePearlActionCard
                    key={act.id}
                    action={act}
                    onCommit={() => handleCommit(act)}
                    onDismiss={() => onDismissAction(act.id)}
                  />
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
};
