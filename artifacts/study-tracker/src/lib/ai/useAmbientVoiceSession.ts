import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { bargeInController } from './audio/bargeInController';
import { speechGrammarCorrector } from './medicalSpeechGrammar';
import { executeCognitiveCompiler } from './geminiClient';
import { getSpeechLexicon } from './userVoiceLexicon';
import { CognitiveDelta, ParsedAtlasAction } from './types';
import { cleanSpeechTranscript, combineConfirmedAndInterim } from './cleanSpeechTranscript';
import { speechCoordinator } from './speechSessionCoordinator';

export interface AmbientVoiceSessionState {
  isActive: boolean;
  isListening: boolean;
  isThinking: boolean;
  isSpeakingAI: boolean;
  energyLevel: number;
  rmsDb: number;
  liveTranscript: string;
  lastAIResponse: string | null;
  lastCognitiveDelta: CognitiveDelta | null;
  lastParsedAction: ParsedAtlasAction | null;
  errorMessage: string | null;
}

export interface UseAmbientVoiceSessionOptions {
  autoSpeakResponse?: boolean;
  mode?: 'push-to-talk' | 'hands-free';
  silenceDebounceMs?: number;
  onDeltaReceived?: (delta: CognitiveDelta, action?: ParsedAtlasAction | null) => void;
}

/**
 * Enterprise Medical Voice Session Hook
 * - Instant Push-to-Talk transcript locking (zero delay)
 * - 800ms Auto-VAD trailing silence debouncer for Hands-Free mode
 * - Strict index-based isFinal token accumulator
 * - Audio Stream Concurrency Singleton lock coordination
 */
export function useAmbientVoiceSession(options: UseAmbientVoiceSessionOptions = {}) {
  const [sessionState, setSessionState] = useState<AmbientVoiceSessionState>({
    isActive: false,
    isListening: false,
    isThinking: false,
    isSpeakingAI: false,
    energyLevel: 0,
    rmsDb: -50,
    liveTranscript: '',
    lastAIResponse: null,
    lastCognitiveDelta: null,
    lastParsedAction: null,
    errorMessage: null,
  });

  const recognitionRef = useRef<any>(null);
  const conversationHistoryRef = useRef<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const confirmedTranscriptRef = useRef<string>('');
  const interimTranscriptRef = useRef<string>('');
  const liveTranscriptRef = useRef<string>('');
  const isRecordingRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<any>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const silenceThresholdMs = options.silenceDebounceMs ?? 800;

  // Speak AI response with neural Web Speech API
  const speakAIResponse = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    bargeInController.triggerBargeIn();

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
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }
    } else {
      const naturalVoice = voices.find(
        (v) =>
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Alex')) &&
          v.lang.startsWith('en')
      );
      if (naturalVoice) utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      bargeInController.setSpeakingTTS(true, utterance);
      setSessionState((prev) => ({ ...prev, isSpeakingAI: true }));
    };

    utterance.onend = () => {
      bargeInController.setSpeakingTTS(false);
      setSessionState((prev) => ({ ...prev, isSpeakingAI: false }));
    };

    utterance.onerror = () => {
      bargeInController.setSpeakingTTS(false);
      setSessionState((prev) => ({ ...prev, isSpeakingAI: false }));
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Process speech turn
  const submitSpeechTurn = useCallback(async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    const correctedText = speechGrammarCorrector.correctMedicalTranscript(trimmed);

    setSessionState((prev) => ({
      ...prev,
      isThinking: true,
      liveTranscript: correctedText,
    }));

    try {
      const history = conversationHistoryRef.current.map(item => ({
        role: item.role as 'user' | 'assistant',
        content: item.text,
      }));

      const result = await executeCognitiveCompiler(correctedText, history);
      const replyText = result.delta.executiveSummary || 'Action noted and ready for confirmation.';

      conversationHistoryRef.current.push({ role: 'user', text: correctedText });
      conversationHistoryRef.current.push({ role: 'assistant', text: replyText });

      setSessionState((prev) => ({
        ...prev,
        isThinking: false,
        lastAIResponse: replyText,
        lastCognitiveDelta: result.delta || null,
        lastParsedAction: result.action || null,
        errorMessage: null,
      }));

      if (result.delta && optionsRef.current.onDeltaReceived) {
        optionsRef.current.onDeltaReceived(result.delta, result.action || null);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([20, 60, 20]);
        }
      }

      if (optionsRef.current.autoSpeakResponse !== false && replyText) {
        speakAIResponse(replyText);
      }
    } catch (err: any) {
      console.error('[VoiceTurn] Turn error:', err);
      setSessionState((prev) => ({
        ...prev,
        isThinking: false,
        errorMessage: err?.message || 'Failed to process voice turn',
      }));
    }
  }, [speakAIResponse]);

  // Stop recording immediately and submit
  const stopAndSubmitRecording = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    isRecordingRef.current = false;
    
    // Instantly abort/stop recognition to freeze audio stream
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    speechCoordinator.releaseLock('drawer-voice');

    setSessionState((prev) => ({
      ...prev,
      isListening: false,
      energyLevel: 0,
    }));

    // Instantly extract, sanitize, and submit without waiting for browser speech timeout
    const rawToSubmit = liveTranscriptRef.current || confirmedTranscriptRef.current || interimTranscriptRef.current;
    const finalTranscript = cleanSpeechTranscript(rawToSubmit);
    
    // Clear accumulators for the next turn
    confirmedTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    liveTranscriptRef.current = '';

    if (finalTranscript.length > 0) {
      submitSpeechTurn(finalTranscript);
    }
  }, [submitSpeechTurn]);

  // Start Voice Recording (Push-to-Talk or Hands-Free)
  const startRecording = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (isRecordingRef.current) return;

    // Acquire lock from speech coordinator
    speechCoordinator.acquireLock('drawer-voice', () => {
      stopAndSubmitRecording();
    });

    isRecordingRef.current = true;

    // Unlock speech synth
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        const silentUtterance = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(silentUtterance);
      } catch {}
    }

    bargeInController.triggerBargeIn();
    confirmedTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    liveTranscriptRef.current = '';

    setSessionState((prev) => ({
      ...prev,
      isActive: true,
      isListening: true,
      liveTranscript: '',
      errorMessage: null,
    }));

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }

    try {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch {}
        }

        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        const customLexicon = getSpeechLexicon();
        if (customLexicon && (window as any).SpeechGrammarList) {
          try {
            const grammarList = new (window as any).SpeechGrammarList();
            const grammarStr = `#JSGF V1.0; grammar medical; public <term> = ${customLexicon.slice(0, 80).join(' | ')};`;
            grammarList.addFromString(grammarStr, 1);
            recognition.grammars = grammarList;
          } catch {}
        }

        recognition.onresult = (event: any) => {
          bargeInController.triggerBargeIn();

          let currentInterim = '';
          let newFinal = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            const text = res[0]?.transcript || '';
            if (res.isFinal) {
              newFinal += text + ' ';
            } else {
              currentInterim += text;
            }
          }

          if (newFinal) {
            const cleanedFinal = cleanSpeechTranscript(newFinal);
            if (cleanedFinal) {
              confirmedTranscriptRef.current = cleanSpeechTranscript(
                (confirmedTranscriptRef.current ? confirmedTranscriptRef.current.trim() + ' ' : '') + cleanedFinal
              );
            }
          }

          const sanitizedInterim = cleanSpeechTranscript(currentInterim);
          interimTranscriptRef.current = sanitizedInterim;

          const combinedTranscript = combineConfirmedAndInterim(
            confirmedTranscriptRef.current,
            sanitizedInterim
          );

          liveTranscriptRef.current = combinedTranscript;

          setSessionState((prev) => ({
            ...prev,
            liveTranscript: combinedTranscript,
            energyLevel: 0.85,
          }));

          // Step 2.2: Hands-Free Auto-VAD 800ms trailing silence timer
          if (optionsRef.current.mode === 'hands-free' && combinedTranscript.length > 2) {
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
            }
            silenceTimerRef.current = setTimeout(() => {
              silenceTimerRef.current = null;
              if (isRecordingRef.current) {
                stopAndSubmitRecording();
              }
            }, silenceThresholdMs);
          }
        };

        recognition.onerror = (e: any) => {
          if (e.error !== 'no-speech') {
            console.warn('[VoiceSession] Recognition error:', e.error);
          }
          isRecordingRef.current = false;
        };

        recognition.onend = () => {
          if (isRecordingRef.current && optionsRef.current.mode === 'hands-free') {
            try {
              recognition.start();
            } catch {}
          } else {
            isRecordingRef.current = false;
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
        speechCoordinator.registerActiveStream('drawer-voice', recognition);
      }
    } catch (err) {
      console.warn('[VoiceSession] Failed to start recognition:', err);
      isRecordingRef.current = false;
    }
  }, [silenceThresholdMs, stopAndSubmitRecording]);

  // Compatibility methods for external drills
  const startSession = useCallback(() => {
    confirmedTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    liveTranscriptRef.current = '';
    setSessionState((prev) => ({ ...prev, isActive: true, liveTranscript: '' }));
  }, []);

  const stopSession = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    speechCoordinator.releaseLock('drawer-voice');
    isRecordingRef.current = false;
    confirmedTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    liveTranscriptRef.current = '';
    setSessionState((prev) => ({
      ...prev,
      isActive: false,
      isListening: false,
      isThinking: false,
      isSpeakingAI: false,
      liveTranscript: '',
    }));
  }, []);

  // Teardown lock on unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return useMemo(() => ({
    ...sessionState,
    startRecording,
    stopAndSubmitRecording,
    startSession,
    stopSession,
    submitSpeechTurn,
  }), [
    sessionState,
    startRecording,
    stopAndSubmitRecording,
    startSession,
    stopSession,
    submitSpeechTurn,
  ]);
}

