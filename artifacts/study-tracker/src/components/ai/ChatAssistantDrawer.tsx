import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  Clipboard, 
  Trash2, 
  RotateCcw, 
  Bot, 
  User, 
  BookOpen, 
  Flame, 
  Trophy, 
  Zap, 
  ChevronDown,
  Info,
  Calendar,
  Layers,
  ArrowUp,
  Volume2,
  VolumeX,
  MessageSquare,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useAmbientVoiceSession } from '@/lib/ai/useAmbientVoiceSession';
import { useAISettings } from '@/lib/ai/aiSettingsStorage';
import { 
  ChatMessage, 
  sendChatMessageToGemini 
} from '@/lib/ai/conversationalEngine';
import { getLiveAtlasContext, LiveAtlasContext } from '@/lib/ai/contextPackager';
import { useClinicalFrictionEngine } from '@/lib/ai/frictionEngine';
import { convertDeltaToAction } from '@/lib/ai/geminiClient';
import { InlineActionCard } from './InlineActionCard';
import { MorphingActionCard } from './MorphingActionCard';
import { FloatingActionCapsule } from './FloatingActionCapsule';
import { VoiceWaveformVisualizer } from './VoiceWaveformVisualizer';
import { ParsedAtlasAction } from '@/lib/ai/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface ChatAssistantDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: 'text' | 'voice';
}

const DEFAULT_PROMPT_PILLS = [
  { label: "⚡ Priority decay review", text: "What are my highest priority memory decay topics right now?" },
  { label: "📝 Log 45m Pharma", text: "Studied Pharmacology Autonomic Nervous System for 45 mins, high recall." },
  { label: "💡 Add 20th Notebook Pearl", text: "Add pearl: DOC for acute manic episode with psychosis is Atypical Antipsychotic + Lithium." },
  { label: "🎯 Record GT Mock Score", text: "Recorded Mock GT score 144/200, weak in Microbiology and Pathology." }
];

export const ChatAssistantDrawer: React.FC<ChatAssistantDrawerProps> = ({
  open,
  onOpenChange,
  initialMode = 'text'
}) => {
  const { settings } = useAISettings();
  const { metrics, topDailyPulses } = useClinicalFrictionEngine();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Initial welcome message
    return [
      {
        id: 'msg-init',
        role: 'assistant',
        content: "👋 Hello Doctor! I'm your **Atlas Study Assistant**. Dictate or type your study sessions, 20th notebook pearls, test scores, or ask high-yield questions based on your live curriculum.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  // Dynamically compute context-aware high-yield discovery chips based on doctor's actual weakest/decaying subjects
  const dynamicPromptPills = React.useMemo(() => {
    const pills: { label: string; text: string }[] = [];

    // 1. Top decay/friction subjects with active mistakes
    if (metrics && metrics.length > 0) {
      const topCritical = metrics.find(m => m.decayUrgency === 'CRITICAL' || m.unresolvedMistakes > 0);
      if (topCritical) {
        const mistakeText = topCritical.unresolvedMistakes > 0 
          ? ` (${topCritical.unresolvedMistakes} active error traps)` 
          : '';
        pills.push({
          label: `⚡ Review ${topCritical.subjectName}${mistakeText}`,
          text: `What are my high-yield decay traps and unresolved 20th notebook mistakes in ${topCritical.subjectName}? Give me a rapid diagnostic drill.`
        });
      }

      // 2. Second urgent subject or topic pulse
      const secondSub = metrics.find(m => m.subjectName !== topCritical?.subjectName && (m.decayUrgency === 'ELEVATED' || m.frictionScore > 15));
      if (secondSub) {
        pills.push({
          label: `🔥 Rapid Drill: ${secondSub.subjectName}`,
          text: `Drill me on high-yield volatile topics for ${secondSub.subjectName} based on my recent error patterns.`
        });
      }
    }

    // 3. Next high-yield agenda pulse if available
    if (topDailyPulses && topDailyPulses.length > 0) {
      const pulse = topDailyPulses[0];
      if (pulse && !pills.some(p => p.label.includes(pulse.subjectName))) {
        pills.push({
          label: `🎯 ${pulse.subjectName}: ${pulse.topicName}`,
          text: `Provide high-yield clinical pearls and first-line drugs/investigations of choice for ${pulse.subjectName} (${pulse.topicName}).`
        });
      }
    }

    // 4. Fallback practical actions
    pills.push(
      { label: "💡 Log 20th Notebook Pearl", text: "Add 20th notebook pearl: DOC for acute manic episode with psychosis is Atypical Antipsychotic + Lithium." },
      { label: "🧠 Quiz me on Cranial Nerves", text: "Quiz me on cranial nerve nuclei, exit foramina, and high-yield clinical lesions." },
      { label: "🫀 Explain Beta-blocker contraindications", text: "Explain absolute and relative contraindications of Beta-blockers in high-yield detail." },
      { label: "📊 Record GT Score", text: "Recorded Mock GT score 144/200, weak in Microbiology and Pathology." }
    );

    return pills.slice(0, 5);
  }, [metrics, topDailyPulses]);

  const [activeTab, setActiveTab] = useState<'text' | 'voice'>(initialMode === 'voice' ? 'voice' : 'text');
  const [voiceInputMode, setVoiceInputMode] = useState<'push-to-talk' | 'hands-free'>('push-to-talk');
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [liveContext, setLiveContext] = useState<LiveAtlasContext | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeVoiceAction, setActiveVoiceAction] = useState<ParsedAtlasAction | null>(null);

  const handleDeltaReceived = useCallback(async (delta: CognitiveDelta, action?: ParsedAtlasAction | null) => {
    if (action) {
      setActiveVoiceAction(action);
    } else if (delta.intent && delta.intent !== 'ACTION_CLINICAL_QUERY') {
      const converted = await convertDeltaToAction(delta, delta.executiveSummary || '');
      if (converted) {
        setActiveVoiceAction(converted);
      }
    }

    if (delta.executiveSummary) {
      const voiceMsg: ChatMessage = {
        id: `ast-voice-${Date.now()}`,
        role: 'assistant',
        content: delta.executiveSummary,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        proposedAction: delta.actionProposal ? {
          action: delta.actionProposal.actionType as any,
          payload: delta.actionProposal.payload,
          summary: delta.executiveSummary
        } : undefined
      };
      setMessages((prev) => [...prev, voiceMsg]);
    }
  }, []);

  const ambientSession = useAmbientVoiceSession({
    autoSpeakResponse: !isMuted,
    mode: voiceInputMode,
    silenceDebounceMs: 800,
    onDeltaReceived: handleDeltaReceived
  });

  const ambientStopSession = ambientSession.stopSession;

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Multilingual Speech Synthesis Helper
  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || isMuted) return;
    try {
      window.speechSynthesis.cancel();
      const spokenText = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/#{1,6}\s+/g, '')
        .replace(/`{1,3}[^`]*`{1,3}/g, '')
        .trim();

      if (!spokenText) return;

      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const isHindi = /[\u0900-\u097F]/.test(spokenText) || /नमस्ते|डॉक्टर|हिंदी|हिंग्लिश/i.test(spokenText);

      if (isHindi) {
        utterance.lang = 'hi-IN';
        const hindiVoice = voices.find((v) => v.lang.startsWith('hi') || v.lang.includes('IN'));
        if (hindiVoice) utterance.voice = hindiVoice;
      } else {
        const naturalVoice = voices.find(
          (v) =>
            (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Alex')) &&
            v.lang.startsWith('en')
        );
        if (naturalVoice) utterance.voice = naturalVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[ChatAssistantDrawer] TTS failed:', err);
    }
  }, [isMuted]);

  // Live Web Speech Recognition
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceInput({
    continuous: true,
    interimResults: true,
    onFinalResult: (finalText) => {
      if (finalText.trim()) {
        setInputVal((prev) => {
          const space = prev && !prev.endsWith(' ') ? ' ' : '';
          return `${prev}${space}${finalText.trim()}`;
        });
      }
    }
  });

  // Fetch live Atlas study context on open
  useEffect(() => {
    if (open) {
      getLiveAtlasContext().then(setLiveContext).catch(console.error);
    }
  }, [open]);

  // Flush speech session cleanly whenever voice input mode switches
  const handleVoiceInputModeChange = useCallback((newMode: 'push-to-talk' | 'hands-free') => {
    if (newMode !== voiceInputMode) {
      if (ambientSession.isListening) {
        ambientSession.stopSession();
      }
      setVoiceInputMode(newMode);
    }
  }, [voiceInputMode, ambientSession]);

  // Handle initial mode trigger (voice vs text focus) and clean tear-down
  useEffect(() => {
    if (open) {
      if (initialMode === 'voice') {
        setActiveTab('voice');
      } else {
        setActiveTab('text');
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    } else {
      stopListening();
      setIsVoiceActive(false);
      resetTranscript();
      ambientStopSession();
    }
  }, [open, initialMode, stopListening, ambientStopSession, resetTranscript]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, interimTranscript]);

  // Send message handler
  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isLoading) return;

    // Synchronously unlock Web Speech Synthesis for iOS Safari on user action
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        const silentUtterance = new SpeechSynthesisUtterance('');
        silentUtterance.volume = 0;
        window.speechSynthesis.speak(silentUtterance);
      } catch (err) {}
    }

    // Stop voice if recording
    if (isListening) {
      stopListening();
      setIsVoiceActive(false);
    }

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVoiceInput: isVoiceActive
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputVal('');
    resetTranscript();
    setIsLoading(true);

    try {
      const response = await sendChatMessageToGemini(messages, text, isVoiceActive);

      const assistantMessage: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: response.replyMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        proposedAction: response.proposedAction,
        actionStatus: response.proposedAction ? 'pending' : undefined
      };

      setMessages((prev) => [...prev, assistantMessage]);
      speakText(response.replyMessage);
    } catch (err: any) {
      console.error('[ChatAssistantDrawer] Error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Unable to process request**: ${err.message || 'Please check your Gemini API key and network connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputVal, isLoading, isListening, stopListening, isVoiceActive, messages, resetTranscript]);

  // Toggle Voice Input
  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
      setIsVoiceActive(false);
    } else {
      // Synchronously unlock Web Speech Synthesis for iOS Safari on user tap
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          const silentUtterance = new SpeechSynthesisUtterance('');
          silentUtterance.volume = 0;
          window.speechSynthesis.speak(silentUtterance);
        } catch (err) {}
      }
      setIsVoiceActive(true);
      startListening();
    }
  };

  // 1-Tap Paste Clinical Stem from Clipboard
  const handlePasteClinicalStem = async () => {
    // Synchronously unlock Web Speech Synthesis for iOS Safari on user tap
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        const silentUtterance = new SpeechSynthesisUtterance('');
        silentUtterance.volume = 0;
        window.speechSynthesis.speak(silentUtterance);
      } catch (err) {}
    }
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText || !clipText.trim()) {
        toast.info("Clipboard is empty", { description: "Copy a clinical question or explanation stem first." });
        return;
      }
      
      const stemPrompt = `Analyze this clinical Q-Bank explanation and extract high-yield 20th notebook takeaway rules:\n\n${clipText.trim()}`;
      setInputVal(stemPrompt);
      setTimeout(() => {
        handleSendMessage(stemPrompt);
      }, 50);
      toast.success("Stem pasted & queued for high-yield extraction!");
    } catch (err) {
      toast.error("Clipboard access restricted. Please paste manually into the input box.");
    }
  };

  // Sync assistant open status to document and window event for BottomNav auto-hiding
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.dataset.assistantOpen = open ? 'true' : 'false';
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('atlas-assistant-toggle', { detail: { open } }));
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.dataset.assistantOpen = 'false';
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('atlas-assistant-toggle', { detail: { open: false } }));
      }
    };
  }, [open]);

  // Clear conversation history
  const handleClearHistory = () => {
    setMessages([
      {
        id: 'msg-init-reset',
        role: 'assistant',
        content: "✨ Conversation cleared. What would you like to log or review next?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Handle textarea auto-expansion & Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto">
        {/* Full-Screen Opaque Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 bg-background/95 sm:bg-background/80 backdrop-blur-xl"
        />

        {/* Full-Screen Native Sheet on Mobile / Centered Modal on Desktop */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.98 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className={cn(
            "relative w-full max-w-2xl h-[100dvh] sm:h-[84vh] flex flex-col rounded-none sm:rounded-2xl border-0 sm:border shadow-2xl overflow-hidden",
            "bg-card/98 dark:bg-card/95 border-border/80 dark:border-border/60 backdrop-blur-2xl"
          )}
        >
          {/* Header Bar with Live Exam Context Badge & Segmented Control */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-b border-border/40 bg-card">
            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm tracking-tight text-foreground truncate">
                    Atlas Clinical Intelligence
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">
                    Active Assistant
                  </p>
                </div>
              </div>
            </div>

            {/* Apple-Standard Segmented Control Tab Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/40 relative shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={cn(
                  "relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 z-10 flex items-center gap-1.5 cursor-pointer select-none",
                  activeTab === 'text'
                    ? "text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {activeTab === 'text' && (
                  <motion.div
                    layoutId="segmented-tab-active"
                    className="absolute inset-0 bg-background rounded-lg shadow-xs"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" />
                  Text
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('voice')}
                className={cn(
                  "relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 z-10 flex items-center gap-1.5 cursor-pointer select-none",
                  activeTab === 'voice'
                    ? "text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {activeTab === 'voice' && (
                  <motion.div
                    layoutId="segmented-tab-active"
                    className="absolute inset-0 bg-background rounded-lg shadow-xs"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Radio className={cn("w-3.5 h-3.5", ambientSession.isListening ? "text-rose-500 animate-pulse" : "text-indigo-400")} />
                  Voice Co-Pilot
                </span>
              </button>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  if (!isMuted && typeof window !== 'undefined' && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                  setIsMuted(!isMuted);
                }}
                title={isMuted ? "Unmute spoken responses" : "Mute spoken responses"}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  isMuted 
                    ? "text-rose-500 bg-rose-500/10 hover:bg-rose-500/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                title="Clear conversation"
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {activeTab === 'voice' ? (
            /* Apple-Standard Voice Co-Pilot Dedicated Screen */
            <div className="flex-1 flex flex-col items-center justify-between p-3 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom,16px))] space-y-2 sm:space-y-4 overflow-y-auto bg-gradient-to-b from-background via-card/50 to-background relative select-none">
              
              {/* Ambient Radial Reactive Glow Backdrop */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <motion.div
                  animate={{
                    scale: ambientSession.isListening
                      ? [1, 1.2, 1.05]
                      : ambientSession.isThinking
                      ? [1, 1.12, 1]
                      : ambientSession.isSpeakingAI
                      ? [1, 1.15, 1]
                      : [0.9, 1, 0.9],
                    opacity: ambientSession.isListening
                      ? 0.35
                      : ambientSession.isThinking
                      ? 0.3
                      : ambientSession.isSpeakingAI
                      ? 0.3
                      : 0.15,
                  }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className={cn(
                    "w-64 h-64 sm:w-80 sm:h-80 rounded-full blur-3xl transition-colors duration-700",
                    ambientSession.isListening
                      ? "bg-emerald-500"
                      : ambientSession.isThinking
                      ? "bg-amber-500"
                      : ambientSession.isSpeakingAI
                      ? "bg-sky-500"
                      : "bg-primary/40"
                  )}
                />
              </div>

              {/* Top Mode Switcher (Push-to-Talk vs Hands-Free) */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/40 backdrop-blur-md z-10 shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => handleVoiceInputModeChange('push-to-talk')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    voiceInputMode === 'push-to-talk' ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Hold to Talk
                </button>
                <button
                  type="button"
                  onClick={() => handleVoiceInputModeChange('hands-free')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    voiceInputMode === 'hands-free' ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Hands-Free (Auto-VAD)
                </button>
              </div>

              {/* Apple-Style Floating Intelligence Capsule (HUD Overlay in Upper Negative Space) */}
              <AnimatePresence>
                {(activeVoiceAction || ambientSession.lastParsedAction) && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="w-full max-w-md z-30 px-1"
                  >
                    <FloatingActionCapsule
                      action={(activeVoiceAction || ambientSession.lastParsedAction)!}
                      cognitiveDelta={ambientSession.lastCognitiveDelta || undefined}
                      onDismiss={() => {
                        setActiveVoiceAction(null);
                      }}
                      onConfirm={() => {
                        setActiveVoiceAction(null);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Interactive Orb & Visualizer */}
              <div className="flex-1 flex flex-col items-center justify-center space-y-2.5 sm:space-y-4 w-full max-w-lg my-auto relative z-10">
                
                {/* Interactive 3-Ring Resonance Orb */}
                <div className="relative flex items-center justify-center my-1 sm:my-2">
                  {(ambientSession.isListening || ambientSession.isSpeakingAI) && (
                    <>
                      <motion.div
                        className={cn(
                          "absolute rounded-full pointer-events-none",
                          ambientSession.isListening ? "bg-emerald-500/15" : "bg-sky-500/15"
                        )}
                        initial={{ width: 110, height: 110, opacity: 0.8 }}
                        animate={{ width: [110, 190], height: [110, 190], opacity: [0.8, 0] }}
                        transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut" }}
                      />
                      <motion.div
                        className={cn(
                          "absolute rounded-full pointer-events-none",
                          ambientSession.isListening ? "bg-emerald-500/10" : "bg-sky-500/10"
                        )}
                        initial={{ width: 110, height: 110, opacity: 0.5 }}
                        animate={{ width: [110, 160], height: [110, 160], opacity: [0.5, 0] }}
                        transition={{ repeat: Infinity, duration: 2.2, delay: 0.5, ease: "easeOut" }}
                      />
                      <motion.div
                        className={cn(
                          "absolute rounded-full pointer-events-none",
                          ambientSession.isListening ? "bg-emerald-500/15" : "bg-sky-500/15"
                        )}
                        initial={{ width: 110, height: 110, opacity: 0.7 }}
                        animate={{ width: [110, 210], height: [110, 210], opacity: [0.7, 0] }}
                        transition={{ repeat: Infinity, duration: 2.2, delay: 1.0, ease: "easeOut" }}
                      />
                    </>
                  )}

                  <motion.div 
                    animate={{ 
                      scale: ambientSession.isListening 
                        ? [1, 1.06, 1] 
                        : ambientSession.isSpeakingAI 
                        ? [1, 1.04, 1] 
                        : 1 
                    }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    onPointerDown={
                      voiceInputMode === 'push-to-talk'
                        ? ambientSession.startRecording
                        : undefined
                    }
                    onPointerUp={
                      voiceInputMode === 'push-to-talk'
                        ? ambientSession.stopAndSubmitRecording
                        : undefined
                    }
                    onPointerCancel={
                      voiceInputMode === 'push-to-talk'
                        ? ambientSession.stopAndSubmitRecording
                        : undefined
                    }
                    onClick={
                      voiceInputMode === 'hands-free'
                        ? ambientSession.isListening
                          ? ambientSession.stopAndSubmitRecording
                          : ambientSession.startRecording
                        : undefined
                    }
                    style={{ touchAction: 'none' }}
                    className={cn(
                      "relative w-28 h-28 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center border transition-all duration-300 cursor-pointer shadow-2xl backdrop-blur-md active:scale-95 select-none",
                      ambientSession.isListening
                        ? "bg-emerald-500/15 border-emerald-500/50 shadow-emerald-500/25 text-emerald-400 ring-4 ring-emerald-500/20"
                        : ambientSession.isThinking
                        ? "bg-amber-500/15 border-amber-500/50 shadow-amber-500/25 text-amber-400 ring-4 ring-amber-500/20"
                        : ambientSession.isSpeakingAI
                        ? "bg-sky-500/15 border-sky-500/50 shadow-sky-500/25 text-sky-400 ring-4 ring-sky-500/20"
                        : "bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary shadow-primary/10"
                    )}
                  >
                    {ambientSession.isListening ? (
                      <Mic className="w-10 h-10 sm:w-14 sm:h-14 animate-pulse" />
                    ) : ambientSession.isThinking ? (
                      <Sparkles className="w-10 h-10 sm:w-14 sm:h-14 animate-spin" />
                    ) : ambientSession.isSpeakingAI ? (
                      <Volume2 className="w-10 h-10 sm:w-14 sm:h-14 animate-pulse" />
                    ) : (
                      <Mic className="w-10 h-10 sm:w-14 sm:h-14" />
                    )}
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest mt-0.5 sm:mt-1 opacity-70">
                      {ambientSession.isListening ? "Listening" : ambientSession.isThinking ? "Thinking" : ambientSession.isSpeakingAI ? "Speaking" : voiceInputMode === 'hands-free' ? "Tap to Start" : "Hold Orb"}
                    </span>
                  </motion.div>
                </div>

                {/* Continuous Harmonic Canvas Sine Waveform */}
                <VoiceWaveformVisualizer 
                  isListening={ambientSession.isListening}
                  isThinking={ambientSession.isThinking}
                  isSpeakingAI={ambientSession.isSpeakingAI}
                  energyLevel={ambientSession.energyLevel}
                  className="h-8 sm:h-10 max-w-xs shrink-0"
                />

                {/* Kinetic Transcript Card with Frosted Glass Hierarchy */}
                <div className="w-full space-y-1.5 sm:space-y-2.5">
                  <div className="flex items-center justify-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      ambientSession.isListening ? "bg-emerald-400 animate-ping" : ambientSession.isThinking ? "bg-amber-400 animate-spin" : ambientSession.isSpeakingAI ? "bg-sky-400 animate-pulse" : "bg-muted-foreground/40"
                    )} />
                    <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                      {ambientSession.isListening
                        ? "Listening... (English / Hindi / Hinglish)"
                        : ambientSession.isThinking
                        ? "Analyzing medical reasoning..."
                        : ambientSession.isSpeakingAI
                        ? "Atlas Voice Speaking..."
                        : "Ready • Hold button or orb to speak"}
                    </span>
                  </div>
                  
                  <div className="text-xs sm:text-sm font-medium text-foreground min-h-[52px] max-h-24 sm:min-h-[72px] sm:max-h-36 overflow-y-auto px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-2xl bg-card/80 dark:bg-card/60 border border-border/60 backdrop-blur-md shadow-xs flex items-center justify-center text-center transition-all leading-relaxed">
                    {ambientSession.liveTranscript ? (
                      <span className="text-foreground font-semibold italic">
                        "{ambientSession.liveTranscript}"
                      </span>
                    ) : ambientSession.lastAIResponse ? (
                      <span className="text-foreground/90">
                        {ambientSession.lastAIResponse}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs sm:text-sm font-normal">
                        "Log a 20th notebook pearl, record a GT score, or quiz high-yield concepts."
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Voice Suggestion Pills - Horizontal Scrollable Row */}
                <div className="w-full flex flex-nowrap items-center justify-start sm:justify-center gap-1.5 overflow-x-auto scrollbar-none px-1 py-1 shrink-0">
                  {[ 
                    { label: "📝 Add 20th Notebook Rule", query: "Add 20th notebook pearl: Drug of choice for Trigeminal Neuralgia is Carbamazepine" },
                    { label: "🧠 Quiz me on Cranial Nerves", query: "Quiz me on Cranial Nerves clinical high-yields" },
                    { label: "🎯 Log GT 4 Score (142/200)", query: "Log Grand Test 4 score 142 out of 200" },
                  ].map((chip, idx) => ( 
                    <button
                      key={idx}
                      type="button"
                      onClick={() => ambientSession.submitSpeechTurn(chip.query)} 
                      className="whitespace-nowrap shrink-0 px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 backdrop-blur-sm transition-all duration-200 cursor-pointer active:scale-95 shadow-2xs"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apple-Style Tactile Bottom Control Bar */}
              <div className="w-full max-w-md flex flex-col items-center justify-center shrink-0 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] z-10 gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onPointerDown={
                    voiceInputMode === 'push-to-talk'
                      ? ambientSession.startRecording
                      : undefined
                  }
                  onPointerUp={
                    voiceInputMode === 'push-to-talk'
                      ? ambientSession.stopAndSubmitRecording
                      : undefined
                  }
                  onPointerCancel={
                    voiceInputMode === 'push-to-talk'
                      ? ambientSession.stopAndSubmitRecording
                      : undefined
                  }
                  onClick={
                    voiceInputMode === 'hands-free'
                      ? ambientSession.isListening
                        ? ambientSession.stopAndSubmitRecording
                        : ambientSession.startRecording
                      : undefined
                  }
                  style={{ touchAction: 'none' }}
                  className={cn(
                    "w-full h-11 sm:h-13 py-2.5 sm:py-3.5 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2.5 sm:gap-3 transition-all duration-200 cursor-pointer select-none active:scale-[0.98]",
                    ambientSession.isListening
                      ? "bg-emerald-600 text-white shadow-emerald-600/30 ring-4 ring-emerald-500/25 animate-pulse"
                      : ambientSession.isThinking
                      ? "bg-amber-600 text-white shadow-amber-600/30"
                      : "bg-primary text-primary-foreground shadow-primary/25 hover:bg-primary/90"
                  )}
                >
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>
                    {ambientSession.isListening
                      ? voiceInputMode === 'hands-free' ? "Listening... Tap to Stop" : "Listening... Release to Send"
                      : ambientSession.isThinking
                      ? "Analyzing Reasoning..."
                      : voiceInputMode === 'hands-free'
                      ? "Tap to Talk (Hands-Free)"
                      : "Hold to Talk (Push-to-Talk)"}
                  </span>
                </button>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground/60 text-center select-none pt-0.5">
                  ⚖️ Educational revision tool for medical exam prep. Not for clinical patient management.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Messages Scroll Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 select-text"
          >
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2.5 max-w-[90%] sm:max-w-[85%]",
                    isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"
                  )}
                >
                  {/* Avatar Icon */}
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs",
                    isAssistant 
                      ? "bg-primary/15 text-primary" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-3.5 h-3.5" />}
                  </div>

                  {/* Message Bubble */}
                  <div className="flex flex-col flex-1 min-w-0 space-y-2">
                    {msg.content ? (
                      <div className={cn(
                        "px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm",
                        isAssistant
                          ? "bg-card border border-border/50 rounded-bl-md text-foreground"
                          : "bg-primary text-primary-foreground rounded-br-md"
                      )}>
                        <div className="whitespace-pre-wrap break-words font-medium">
                          {msg.content}
                        </div>
                      </div>
                    ) : null}

                    {/* In-Stream Proposed Morphing Action Card (Only for genuine DB mutations) */}
                    {isAssistant && msg.proposedAction && msg.proposedAction.action !== 'ACTION_CLINICAL_QUERY' && (
                      <div className="w-full">
                        <MorphingActionCard
                          action={msg.proposedAction}
                          onCommit={() => {
                            setMessages((prev) => 
                              prev.map((m) => m.id === msg.id ? { ...m, actionStatus: 'committed' } : m)
                            );
                          }}
                          onDismiss={() => {
                            setMessages((prev) => 
                              prev.map((m) => m.id === msg.id ? { ...m, actionStatus: 'declined' } : m)
                            );
                          }}
                          enableSwipe={true}
                          autoCommitSeconds={0}
                        />
                      </div>
                    )}

                    <span className={cn(
                      "text-[10px] text-muted-foreground/70 px-1",
                      isAssistant ? "text-left" : "text-right"
                    )}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator with Thinking Dots */}
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs p-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <span>Analyzing Atlas curriculum</span>
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce [animation-delay:0.2s]">.</span>
                  <span className="animate-bounce [animation-delay:0.4s]">.</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Discovery Prompt Chips */}
          <div className="px-4 py-2 border-t border-border/40 bg-muted/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {dynamicPromptPills.map((pill, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => handleSendMessage(pill.text)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-background/80 hover:bg-background border border-border/60 hover:border-primary/40 text-[11px] text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Real-time Voice Waveform Overlay (when listening) */}
          {isListening && (
            <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <VoiceWaveformVisualizer isListening={isListening} />
                <span className="text-xs font-medium text-rose-600 dark:text-rose-400 truncate max-w-[280px]">
                  {interimTranscript ? `"${interimTranscript}"` : "Listening... Speak clearly"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleVoice}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* Unified Multi-Modal Input Bar */}
          <div className="p-3 sm:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] border-t border-border/40 bg-card shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-2xl bg-muted/30 border border-border/50 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              {/* 1-Tap Paste Clinical Stem Button */}
              <button
                type="button"
                onClick={handlePasteClinicalStem}
                title="1-Tap Paste Clinical Stem / Q-Bank Explanation from Clipboard"
                className="p-2.5 sm:p-3 rounded-xl text-muted-foreground hover:text-primary hover:bg-card transition-colors shrink-0 cursor-pointer"
              >
                <Clipboard className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Text Input Area */}
              <textarea
                ref={inputRef}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask Atlas..."
                className="flex-1 max-h-28 sm:max-h-32 min-h-[40px] sm:min-h-[44px] py-2.5 sm:py-3 px-2 bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none leading-relaxed"
              />

              {/* Hold-to-Talk / Tap Audio Dictation Button */}
              <button
                type="button"
                onClick={handleToggleVoice}
                onPointerDown={() => {
                  if (!isListening) {
                    setIsVoiceActive(true);
                    startListening();
                  }
                }}
                onPointerUp={() => {
                  if (isListening) {
                    stopListening();
                    setIsVoiceActive(false);
                  }
                }}
                className={cn(
                  "p-2.5 sm:p-3 rounded-xl transition-all shrink-0 cursor-pointer select-none active:scale-95",
                  isListening
                    ? "bg-rose-500 text-white shadow-md animate-pulse"
                    : "text-muted-foreground hover:text-foreground hover:bg-card"
                )}
                title={isListening ? "Release or tap to stop recording" : "Hold or tap to speak"}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>

              {/* Send Button */}
              <button
                type="button"
                disabled={!inputVal.trim() || isLoading}
                onClick={() => handleSendMessage()}
                className={cn(
                  "p-2.5 sm:p-3 rounded-xl transition-all shrink-0 cursor-pointer",
                  inputVal.trim() && !isLoading
                    ? "bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-95"
                    : "bg-card text-muted-foreground/50 opacity-60 cursor-not-allowed border border-border/40"
                )}
              >
                <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground/60 text-center pb-1 pt-1.5 px-4 select-none">
              ⚖️ Educational revision assistant for medical exam prep. Not for clinical diagnosis or patient care.
            </p>
          </div>
        </>
      )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
