import { useState, useEffect, useRef, useCallback } from 'react';
import { injectMedicalGrammar } from '@/lib/ai/medicalSpeechGrammar';
import { acousticDsp, AudioDspSession } from '@/lib/ai/audioDsp';
import { cleanSpeechTranscript, combineConfirmedAndInterim } from '@/lib/ai/cleanSpeechTranscript';
import { speechCoordinator } from '@/lib/ai/speechSessionCoordinator';

// Web Speech API interface declarations for TypeScript
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  grammars?: any;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): ISpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new (): ISpeechRecognition;
    };
  }
}

export interface UseVoiceInputOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  enableDspVad?: boolean;
  onTranscriptChange?: (text: string) => void;
  onFinalResult?: (text: string) => void;
  onEnergyLevel?: (rmsDb: number, normalizedEnergy: number) => void;
  onSpeechAutoEnd?: () => void;
}

export interface UseVoiceInputReturn {
  isListening: boolean;
  isSpeaking: boolean;
  energyLevel: number;
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  error: string | null;
  isSupported: boolean;
  startListening: (overrideOptions?: UseVoiceInputOptions) => void;
  stopListening: () => void;
  resetTranscript: () => void;
  setTranscript: (text: string) => void;
}

export function useVoiceInput(defaultOptions: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [energyLevel, setEnergyLevel] = useState<number>(0);
  const [transcript, setTranscriptState] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const dspSessionRef = useRef<AudioDspSession | null>(null);
  const shouldListenRef = useRef<boolean>(false);
  const finalAccumulatorRef = useRef<string>('');

  const isSupported = typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    speechCoordinator.releaseLock('command-bar');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (err) {
        // Recognition might already be stopped
      }
      recognitionRef.current = null;
    }
    if (dspSessionRef.current) {
      try {
        dspSessionRef.current.stop();
      } catch (err) {
        // Ignore
      }
      dspSessionRef.current = null;
    }
    setIsListening(false);
    setIsSpeaking(false);
    setEnergyLevel(0);
    setInterimTranscript('');
  }, []);

  const resetTranscript = useCallback(() => {
    finalAccumulatorRef.current = '';
    setTranscriptState('');
    setInterimTranscript('');
    setFinalTranscript('');
    setError(null);
  }, []);

  const setTranscript = useCallback((text: string) => {
    finalAccumulatorRef.current = text;
    setTranscriptState(text);
    setFinalTranscript(text);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(async (overrideOptions?: UseVoiceInputOptions) => {
    if (!isSupported) {
      setError('Voice recognition is not supported in this browser. You can type or paste your notes directly.');
      return;
    }

    setError(null);
    shouldListenRef.current = true;

    // Acquire lock from singleton coordinator, pre-empting any other active voice listeners
    speechCoordinator.acquireLock('command-bar', () => {
      stopListening();
    });

    // Clean up any old instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (err) {
        // Ignore abort errors
      }
      recognitionRef.current = null;
    }

    if (dspSessionRef.current) {
      try {
        dspSessionRef.current.stop();
      } catch {
        // Ignore
      }
      dspSessionRef.current = null;
    }

    // 1. Initialize High-Pass DSP & Real-Time RMS VAD
    try {
      const dspSession = await acousticDsp.startAudioPipeline(
        {
          onSpeechStart: () => {
            setIsSpeaking(true);
          },
          onSpeechEnd: () => {
            setIsSpeaking(false);
            if (overrideOptions?.onSpeechAutoEnd) {
              overrideOptions.onSpeechAutoEnd();
            } else if (defaultOptions.onSpeechAutoEnd) {
              defaultOptions.onSpeechAutoEnd();
            }
          },
          onEnergyLevel: (rmsDb, normalized) => {
            setEnergyLevel(normalized);
            if (overrideOptions?.onEnergyLevel) {
              overrideOptions.onEnergyLevel(rmsDb, normalized);
            } else if (defaultOptions.onEnergyLevel) {
              defaultOptions.onEnergyLevel(rmsDb, normalized);
            }
          },
        },
        {
          silenceThresholdDb: -38,
          silenceDurationMs: 1600,
        }
      );
      dspSessionRef.current = dspSession;
    } catch (err: any) {
      console.warn('[useVoiceInput] DSP initialization failed:', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setError('Microphone permission blocked. Please grant microphone access in Settings > Device Permissions.');
        shouldListenRef.current = false;
        setIsListening(false);
        speechCoordinator.releaseLock('command-bar');
        return;
      }
    }

    // 2. Initialize Speech Recognition with Injected Medical Grammar
    try {
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionConstructor) {
        setError('Voice recognition unavailable.');
        return;
      }

      const recognition = new SpeechRecognitionConstructor();
      recognitionRef.current = recognition;

      // Inject JSGF Medical Lexicon
      injectMedicalGrammar(recognition);

      const continuous = overrideOptions?.continuous ?? defaultOptions.continuous ?? true;
      const interimResults = overrideOptions?.interimResults ?? defaultOptions.interimResults ?? true;
      const lang = overrideOptions?.lang ?? defaultOptions.lang ?? 'en-US';

      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
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
          const cleanedNewFinal = cleanSpeechTranscript(newFinal);
          if (cleanedNewFinal) {
            finalAccumulatorRef.current = cleanSpeechTranscript((finalAccumulatorRef.current ? finalAccumulatorRef.current.trim() + ' ' : '') + cleanedNewFinal);
            setFinalTranscript(finalAccumulatorRef.current);
            if (overrideOptions?.onFinalResult) {
              overrideOptions.onFinalResult(finalAccumulatorRef.current);
            } else if (defaultOptions.onFinalResult) {
              defaultOptions.onFinalResult(finalAccumulatorRef.current);
            }
          }
        }

        const sanitizedInterim = cleanSpeechTranscript(currentInterim);
        setInterimTranscript(sanitizedInterim);

        const fullText = combineConfirmedAndInterim(finalAccumulatorRef.current, sanitizedInterim);
        setTranscriptState(fullText);

        if (overrideOptions?.onTranscriptChange) {
          overrideOptions.onTranscriptChange(fullText);
        } else if (defaultOptions.onTranscriptChange) {
          defaultOptions.onTranscriptChange(fullText);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errType = event.error;
        if (errType === 'no-speech') {
          return;
        }

        if (errType === 'aborted') {
          return;
        }

        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          setError('Microphone access was denied. Please allow mic permissions in your browser.');
          shouldListenRef.current = false;
          setIsListening(false);
          return;
        }

        if (errType === 'network') {
          setError('Speech recognition network error. Please check your internet connection.');
          shouldListenRef.current = false;
          setIsListening(false);
          return;
        }

        setError(`Microphone error: ${errType}`);
      };

      recognition.onend = () => {
        if (shouldListenRef.current) {
          try {
            recognition.start();
          } catch (err) {
            setIsListening(false);
            shouldListenRef.current = false;
          }
        } else {
          setIsListening(false);
          setIsSpeaking(false);
          setInterimTranscript('');
        }
      };

      recognition.start();
      speechCoordinator.registerActiveStream('command-bar', recognition, dspSessionRef.current);
    } catch (err: any) {
      console.error('[useVoiceInput] Error starting speech recognition:', err);
      setError('Unable to activate microphone. Please check your device audio settings.');
      setIsListening(false);
      shouldListenRef.current = false;
    }
  }, [isSupported, defaultOptions]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (err) {
          // Ignore
        }
      }
      if (dspSessionRef.current) {
        try {
          dspSessionRef.current.stop();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    isSpeaking,
    energyLevel,
    transcript,
    interimTranscript,
    finalTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  };
}
