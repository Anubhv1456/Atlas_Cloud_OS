import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mic, Command, X, Check, ArrowRight, Loader2, Lightbulb, MessageSquare, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { executeCognitiveCompiler } from '@/lib/ai/geminiClient';
import { executeAtlasAction } from '@/lib/ai/atlasActionExecutor';
import { userVoiceLexicon } from '@/lib/ai/userVoiceLexicon';
import { toast } from 'sonner';
import { CognitiveDelta } from '@/lib/ai/types';
import { useAmbientVoiceSession } from '@/lib/ai/useAmbientVoiceSession';
import { DynamicActionCapsule } from '@/components/ai/DynamicActionCapsule';
import { extractClinicalActionsFromDelta } from '@/lib/ai/streamActionParser';
import { AtlasClinicalAction } from '@/lib/ai/actionSchemas';

export interface HomeFloatingCommandBarProps {
  onOpenChat?: (mode: 'text' | 'voice') => void;
  className?: string;
}

export const HomeFloatingCommandBar: React.FC<HomeFloatingCommandBarProps> = ({
  onOpenChat,
  className
}) => {
  const [hudState, setHudState] = useState<'idle' | 'menu' | 'listening' | 'compiling' | 'preview'>('idle');
  const [compiledDelta, setCompiledDelta] = useState<CognitiveDelta | null>(null);
  const [compiledAction, setCompiledAction] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingClinicalActions, setPendingClinicalActions] = useState<AtlasClinicalAction[]>([]);

  // Ambient Full-Duplex Voice Session
  const ambientSession = useAmbientVoiceSession({
    autoSpeakResponse: true,
    onDeltaReceived: (delta) => {
      const extracted = extractClinicalActionsFromDelta(delta);
      if (extracted.length > 0) {
        setPendingClinicalActions((prev) => [...prev, ...extracted]);
      }
    },
  });



  // 3-Second Auto-Commit Countdown Timer
  const [countdown, setCountdown] = useState<number>(3);
  const [isPausedCountdown, setIsPausedCountdown] = useState<boolean>(false);
  const autoCommitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rawSpokenTextRef = useRef<string>('');

  const {
    isListening,
    isSpeaking,
    energyLevel,
    transcript,
    interimTranscript,
    finalTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput({
    continuous: true,
    interimResults: true,
    onSpeechAutoEnd: () => {
      // Auto-transition to process when thoughtful pause ends speech
      handleProcessSpeech();
    }
  });

  // Handle Voice Mode Activation
  const handleStartVoiceHUD = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setErrorMessage(null);
    setCompiledDelta(null);
    setCompiledAction(null);
    resetTranscript();
    setCountdown(3);
    setIsPausedCountdown(false);
    setHudState('listening');
    startListening();
  };

  const handleCancelVoiceHUD = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (autoCommitTimerRef.current) {
      clearInterval(autoCommitTimerRef.current);
      autoCommitTimerRef.current = null;
    }
    stopListening();
    resetTranscript();
    setHudState('idle');
    setCompiledDelta(null);
    setCompiledAction(null);
    setErrorMessage(null);
  };

  // Compile speech when user finishes or clicks Done
  const handleProcessSpeech = async () => {
    stopListening();
    const cleanText = (finalTranscript || transcript).trim();
    if (!cleanText || cleanText.length < 3) {
      handleCancelVoiceHUD();
      return;
    }

    rawSpokenTextRef.current = cleanText;
    setHudState('compiling');
    try {
      const result = await executeCognitiveCompiler(cleanText, [], {
        bypassLocalTokenizer: false,
        cognitiveLoad: 'routine',
      });

      setCompiledDelta(result.delta);
      setCompiledAction(result.action);
      setCountdown(3);
      setIsPausedCountdown(false);
      setHudState('preview');
    } catch (err: any) {
      console.error('[VoiceHUD] Compilation failed:', err);
      if(err.message !== 'AI_PAYWALL_REQUIRED') setErrorMessage(err.message || 'Could not understand audio. Try again.');
      setHudState('preview');
    }
  };

  // Commit extracted action directly into database & learn personal lexicon
  const handleCommitAction = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (autoCommitTimerRef.current) {
      clearInterval(autoCommitTimerRef.current);
      autoCommitTimerRef.current = null;
    }

    if (!compiledAction && !compiledDelta) {
      handleCancelVoiceHUD();
      return;
    }

    try {
      if (compiledAction) {
        await executeAtlasAction(compiledAction);
      }

      // Learn phonetic alias into local IndexedDB user_voice_lexicon
      if (compiledDelta?.targetSubjectName && rawSpokenTextRef.current) {
        const words = rawSpokenTextRef.current.toLowerCase().split(/\s+/);
        for (const w of words) {
          if (w.length >= 3 && !['study', 'studied', 'mins', 'hours', 'minutes', 'missed', 'test'].includes(w)) {
            userVoiceLexicon.learnAlias(w, compiledDelta.targetSubjectName);
          }
        }
      }

      toast.success(compiledDelta?.executiveSummary || 'Study session logged!', {
        description: 'Updated your Atlas revision tracker.',
        icon: <Check className="w-4 h-4 text-emerald-400" />,
      });
      handleCancelVoiceHUD();
    } catch (err: any) {
      if(err.message !== 'AI_PAYWALL_REQUIRED') toast.error('Could not save note', { description: err.message });
    }
  };

  // 3-Second Auto-Commit Effect in Preview State
  useEffect(() => {
    if (hudState === 'preview' && compiledDelta && !errorMessage && !isPausedCountdown) {
      setCountdown(3);
      autoCommitTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (autoCommitTimerRef.current) clearInterval(autoCommitTimerRef.current);
            handleCommitAction();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (autoCommitTimerRef.current) {
          clearInterval(autoCommitTimerRef.current);
          autoCommitTimerRef.current = null;
        }
      };
    }
  }, [hudState, compiledDelta, errorMessage, isPausedCountdown]);

  return (
    <>
      {/* ── RESTING / MENU FLOATING ACTION BUTTON (FAB) ─────────────────────────── */}
      {hudState === 'idle' && (
        <div className={cn(
          "fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-8 right-4 sm:right-6 md:right-8 z-40 pointer-events-auto",
          className
        )}>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 450, damping: 26 }}
            className="relative flex items-center"
          >
            {/* Quick Action FAB Trigger */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => onOpenChat?.('text')}
              className={cn(
                "w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center relative cursor-pointer select-none",
                "bg-primary text-primary-foreground shadow-lg shadow-primary/30 border border-primary-border/80",
                "hover:shadow-xl hover:shadow-primary/40 hover:brightness-105",
                "active:scale-95 transition-all duration-200",
                "group focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background"
              )}
              title="Open Atlas Clinical AI Co-Pilot"
            >
              {/* Subtle ambient pulse ring */}
              <span className="absolute -inset-1 rounded-full bg-primary/25 animate-ping opacity-75 pointer-events-none duration-1000" />
              <Sparkles className="w-5 h-5 text-primary-foreground group-hover:rotate-12 transition-transform duration-200 relative z-10" />
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* ── EXPANDED ACOUSTIC FLUID HUD (CENTERED COMMAND PILL) ────────────────────── */}
      <AnimatePresence mode="wait">
        {hudState !== 'idle' && hudState !== 'menu' && (
          <div className={cn(
            "fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94vw] max-w-lg pointer-events-auto",
            className
          )}>
            {/* ── STATE 2: ACTIVE ACOUSTIC FLUID HUD (LISTENING & DSP VAD) ────────────────── */}
            {hudState === 'listening' && (
              <motion.div
                key="listening-hud"
                layout
                initial={{ opacity: 0, y: 20, scale: 0.93 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.93 }}
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className={cn(
                  "p-4 rounded-3xl backdrop-blur-2xl border select-none relative overflow-hidden shadow-2xl",
                  "bg-zinc-950/95 dark:bg-zinc-900/98 text-zinc-100 border-zinc-700/90 shadow-black/70"
                )}
              >
                {/* Ambient acoustic breathing glow */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 via-emerald-500/15 to-teal-500/20 pointer-events-none transition-opacity duration-300"
                  style={{ opacity: 0.3 + energyLevel * 0.7 }}
                />

                <div className="flex items-center justify-between gap-3 relative z-10 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 text-primary">
                      <motion.div
                        className="absolute inset-0 rounded-full bg-primary/30"
                        animate={{ scale: isSpeaking ? [1, 1.35, 1] : 1 }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                      />
                      <Mic className="w-3.5 h-3.5 relative z-10 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-100">Atlas Clinical Scribe</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      </div>
                      <span className="text-xs text-zinc-400 font-mono">
                        {isSpeaking ? 'Listening to clinical speech...' : 'Speak study block or mistake...'}
                      </span>
                    </div>
                  </div>

                  {/* Real-time Dynamic Waveform Bars */}
                  <div className="flex items-center gap-1 h-5 px-2 bg-zinc-900/90 rounded-full border border-zinc-800">
                    {[0.4, 0.8, 0.6, 1, 0.5, 0.7, 0.3].map((factor, idx) => (
                      <motion.span
                        key={idx}
                        className="w-0.5 rounded-full bg-primary"
                        animate={{
                          height: isSpeaking 
                            ? Math.max(3, Math.min(18, energyLevel * 22 * factor + 3)) 
                            : 3
                        }}
                        transition={{ ease: 'linear', duration: 0.08 }}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelVoiceHUD}
                    className="w-7 h-7 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Real-Time Ghost-Typing Surface */}
                <div className="min-h-[44px] max-h-[88px] overflow-y-auto p-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs leading-relaxed relative z-10 font-sans">
                  {finalTranscript ? (
                    <span className="text-zinc-100 font-medium">{finalTranscript}</span>
                  ) : null}
                  {interimTranscript ? (
                    <span className="text-primary/90 italic ml-1">{interimTranscript}</span>
                  ) : null}
                  {!finalTranscript && !interimTranscript && (
                    <span className="text-zinc-500 italic">
                      E.g., "Studied 45m pharmacology on autonomic nervous system" or "Missed pheo question on alpha blockade"
                    </span>
                  )}
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex items-center justify-between gap-2 mt-3 pt-1 border-t border-zinc-800/80 relative z-10">
                  <span className="text-xs text-zinc-500 font-mono">
                    120Hz DSP • Ontology VAD Active
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelVoiceHUD}
                      className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleProcessSpeech}
                      disabled={!transcript && !finalTranscript}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:pointer-events-none active:scale-95"
                    >
                      <span>Done</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STATE 3: COMPILING SPEECH VIA LOCAL TOKENIZER / CLOUD COMPILER ────────── */}
            {hudState === 'compiling' && (
              <motion.div
                key="compiling-hud"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "p-4 rounded-3xl backdrop-blur-2xl border select-none relative overflow-hidden shadow-2xl flex items-center justify-between gap-3",
                  "bg-zinc-950/95 dark:bg-zinc-900/98 text-zinc-100 border-zinc-700/90 shadow-black/70"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100">Compiling Medical Intent...</h4>
                    <p className="text-xs text-zinc-400">Extracting subject, duration, and 20th Notebook rules</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCancelVoiceHUD}
                  className="w-7 h-7 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-zinc-100 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}

            {/* ── STATE 4: ZERO-TAP AUTO-COMMIT SPLIT ACTION CARD ──────────────────────────── */}
            {hudState === 'preview' && (
              <motion.div
                key="preview-hud"
                layout
                initial={{ opacity: 0, y: 15, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.94 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 120) {
                    handleCancelVoiceHUD();
                  }
                }}
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                className={cn(
                  "p-4 rounded-3xl backdrop-blur-2xl border select-none relative overflow-hidden shadow-2xl space-y-3 cursor-grab active:cursor-grabbing",
                  "bg-zinc-950/95 dark:bg-zinc-900/98 text-zinc-100 border-zinc-700/90 shadow-black/70"
                )}
              >
                {errorMessage ? (
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-rose-300">Could Not Understand Audio</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">{errorMessage}</p>
                    </div>
                  </div>
                ) : compiledDelta ? (
                  <>
                    {/* Header & Auto-Commit Countdown Ring */}
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                          {compiledDelta.targetSubjectName || 'Clinical Log'}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">
                          {compiledDelta.intent.replace('ACTION_', '')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isPausedCountdown && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-400 font-mono font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Auto-saving in {countdown}s</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handleCancelVoiceHUD}
                          className="w-6 h-6 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-zinc-100 flex items-center justify-center cursor-pointer"
                          title="Dismiss"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* ── Apple-Grade Split Action Capsules ─────────────────────────────── */}
                    <div className="space-y-2">
                      {/* Action 1: Study Block Capsule */}
                      {compiledDelta.studyDelta && (
                        <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 text-xs text-zinc-200">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-emerald-300">
                              Logged {compiledDelta.studyDelta.durationMinutes}m {compiledDelta.targetSubjectName}
                            </span>
                            {compiledDelta.studyDelta.topicExtracted && (
                              <span className="text-zinc-400 block text-xs truncate">
                                • {compiledDelta.studyDelta.topicExtracted}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action 2: 20th Notebook Mistake Capsule */}
                      {compiledDelta.distillations?.[0]?.twentyNotebookRule && (
                        <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-zinc-900/90 border border-amber-500/30 text-xs text-zinc-200">
                          <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Lightbulb className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-amber-300 block">
                              20th Notebook: {compiledDelta.distillations?.[0].tag || 'Clinical Rule'}
                            </span>
                            <span className="text-zinc-300 text-xs leading-relaxed">
                              {compiledDelta.distillations?.[0].twentyNotebookRule}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Fallback General Summary Capsule if neither is specifically populated */}
                      {!compiledDelta.studyDelta && !compiledDelta.distillations?.[0]?.twentyNotebookRule && (
                        <div className="p-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-200 leading-relaxed font-medium">
                          {compiledDelta.executiveSummary}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}

                {/* Bottom Actions & Swipe-to-cancel gesture hint */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/80">
                  <span className="text-xs text-zinc-500 font-mono">
                    Swipe card to cancel
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelVoiceHUD}
                      className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    {!errorMessage && (
                      <button
                        type="button"
                        onClick={handleCommitAction}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Commit Now</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* ── AMBIENT AUDIO CO-PILOT KEEP-ALIVE ANCHOR ────────────────────────────────── */}
      {ambientSession.isActive && (
        <audio
          src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=="
          loop
          autoPlay
          muted
          style={{ display: 'none' }}
        />
      )}

      {/* ── AMBIENT FULL-DUPLEX VOICE CO-PILOT DYNAMIC CAPSULE ─────────────────────── */}
      <DynamicActionCapsule
        isActive={ambientSession.isActive}
        isListening={ambientSession.isListening}
        isThinking={ambientSession.isThinking}
        isSpeakingAI={ambientSession.isSpeakingAI}
        energyLevel={ambientSession.energyLevel}
        liveTranscript={ambientSession.liveTranscript}
        actions={pendingClinicalActions}
        onStartRecording={ambientSession.startRecording}
        onStopRecording={ambientSession.stopAndSubmitRecording}
        onDismissAction={(actionId) => {
          setPendingClinicalActions((prev) => prev.filter((a) => a.id !== actionId));
        }}
        onCommitAction={(action) => {
          setPendingClinicalActions((prev) => prev.filter((a) => a.id !== action.id));
          toast.success(action.title, {
            description: action.description,
            icon: <Check className="w-4 h-4 text-emerald-400" />,
          });
        }}
        onCloseSession={() => {
          ambientSession.stopSession();
          setPendingClinicalActions([]);
        }}
      />
    </>
  );
};
