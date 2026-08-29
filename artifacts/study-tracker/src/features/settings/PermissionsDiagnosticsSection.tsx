import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  HardDrive,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function PermissionsDiagnosticsSection() {
  const [micState, setMicState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [speechRecState, setSpeechRecState] = useState<'supported' | 'unsupported' | 'active' | 'blocked'>('supported');
  const [speechSynthState, setSpeechSynthState] = useState<'supported' | 'unsupported'>('supported');
  const [notificationState, setNotificationState] = useState<'default' | 'granted' | 'denied'>('default');
  const [storagePersisted, setStoragePersisted] = useState<boolean | null>(null);

  // Audio Testing State
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [dbLevel, setDbLevel] = useState<number>(-100);
  const [showPwaGuide, setShowPwaGuide] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Check initial permissions status
  const checkPermissions = async () => {
    if (typeof window === 'undefined') return;

    // 1. Microphone Permission
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicState(result.state as 'prompt' | 'granted' | 'denied');
        result.onchange = () => {
          setMicState(result.state as 'prompt' | 'granted' | 'denied');
        };
      } catch {
        // Fallback check
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setMicState('unsupported');
        }
      }
    } else if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicState('unsupported');
    }

    // 2. Web Speech Recognition
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechRecState(SpeechRecognitionClass ? 'supported' : 'unsupported');

    // 3. Web Speech Synthesis
    setSpeechSynthState('speechSynthesis' in window ? 'supported' : 'unsupported');

    // 4. Notifications
    if ('Notification' in window) {
      setNotificationState(Notification.permission);
    }

    // 5. Storage Persistence
    if (navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then((persisted) => setStoragePersisted(persisted)).catch(() => {});
    }
  };

  useEffect(() => {
    checkPermissions();

    return () => {
      stopMicTest();
    };
  }, []);

  // Request & Test Microphone Stream
  const handleTestMicrophone = async () => {
    if (isTestingMic) {
      stopMicTest();
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Microphone audio input is not supported by this browser.');
      setMicState('unsupported');
      return;
    }

    try {
      setIsTestingMic(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      setMicState('granted');
      toast.success('Microphone permission granted!', {
        description: 'Speak into your microphone to verify the audio level meter below.',
      });

      // Audio Context for Level Meter
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(1, avg / 128);
        const calculatedDb = Math.round(20 * Math.log10(Math.max(normalized, 0.001)));

        setAudioLevel(normalized);
        setDbLevel(calculatedDb);

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err: any) {
      stopMicTest();
      console.warn('[Permissions] getUserMedia failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicState('denied');
        setShowPwaGuide(true);
        toast.error('Microphone access denied', {
          description: 'Follow the PWA Microphone Unblock Guide below to allow microphone access.',
        });
      } else {
        toast.error(`Microphone initialization error: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const stopMicTest = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsTestingMic(false);
    setAudioLevel(0);
    setDbLevel(-100);
  };

  // Test Web Speech TTS Speaker Output
  const handleTestSpeaker = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Speech synthesis is not supported on this browser.');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        'Audio system online. Medical voice assistant Atlas is ready for high-yield study sessions.'
      );
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google')));
      if (preferred) utterance.voice = preferred;

      utterance.onend = () => {
        toast.success('Audio playback verified successfully!');
      };
      utterance.onerror = () => {
        toast.error('Audio speaker test failed.');
      };

      window.speechSynthesis.speak(utterance);
      toast.info('Playing voice test sample...');
    } catch (err) {
      toast.error('Failed to initiate audio playback.');
    }
  };

  // Test Web Speech Recognition Engine
  const handleTestSpeechRecognition = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      toast.error('Web Speech Recognition API is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setSpeechRecState('active');
        toast.info('Speech engine listening... Say a medical term (e.g. "Aortic Stenosis")', { duration: 4000 });
      };

      recognition.onresult = (e: any) => {
        const text = e.results[0]?.[0]?.transcript || '';
        toast.success(`Recognized: "${text}"`);
        setSpeechRecState('supported');
      };

      recognition.onerror = (e: any) => {
        if (e.error === 'not-allowed') {
          setSpeechRecState('blocked');
          setShowPwaGuide(true);
          toast.error('Speech recognition blocked', {
            description: 'Chrome requires microphone permission for SpeechRecognition.',
          });
        } else if (e.error !== 'no-speech') {
          toast.error(`Speech test error: ${e.error}`);
        }
        setSpeechRecState('supported');
      };

      recognition.onend = () => {
        if (speechRecState === 'active') {
          setSpeechRecState('supported');
        }
      };

      recognition.start();
    } catch (err: any) {
      toast.error(`Failed to start speech test: ${err.message}`);
    }
  };

  // Request Notification Permission
  const handleRequestNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Push notifications not supported on this device.');
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setNotificationState(perm);
      if (perm === 'granted') {
        toast.success('Push notifications enabled!');
      } else {
        toast.error('Notification permission denied.');
      }
    } catch (err) {
      toast.error('Failed to request notification permission.');
    }
  };

  // Request Storage Persistence
  const handleRequestStoragePersistence = async () => {
    if (navigator.storage && navigator.storage.persist) {
      try {
        const isPersisted = await navigator.storage.persist();
        setStoragePersisted(isPersisted);
        if (isPersisted) {
          toast.success('Storage persistence granted!', {
            description: 'Your notes and study logs will not be cleared by the browser during low disk space.',
          });
        } else {
          toast.info('Storage persistence managed automatically by browser.');
        }
      } catch (err) {
        toast.error('Storage persistence request failed.');
      }
    }
  };

  return (
    <div id="permissions-diagnostics" className="p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-6">
      {/* Section Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">Device Permissions & Audio Diagnostics</h2>
            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
              PWA Ready
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Troubleshoot microphone capture, voice recognition, and offline storage permissions when installed as a Chrome PWA or standalone WebAPK.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={checkPermissions}
          className="shrink-0 text-xs gap-1.5 hover:bg-accent"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-Check
        </Button>
      </div>

      {/* Permissions & Hardware Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* 1. Microphone Input */}
        <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  micState === 'granted'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : micState === 'denied'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                )}
              >
                {micState === 'granted' ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Microphone Input</p>
                <p className="text-[11px] text-muted-foreground">getUserMedia Stream</p>
              </div>
            </div>

            <Badge
              variant={
                micState === 'granted'
                  ? 'default'
                  : micState === 'denied'
                  ? 'destructive'
                  : 'secondary'
              }
              className="text-[10px] capitalize"
            >
              {micState}
            </Badge>
          </div>

          {/* Audio Level VU Meter */}
          {isTestingMic && (
            <div className="space-y-1.5 bg-background p-2.5 rounded-lg border border-border/60">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                <span>Signal Level</span>
                <span className={audioLevel > 0.05 ? 'text-emerald-500 font-bold' : ''}>
                  {audioLevel > 0.05 ? `${dbLevel} dB` : 'Silent'}
                </span>
              </div>
              <div className="flex items-center gap-1 h-3">
                {Array.from({ length: 14 }).map((_, i) => {
                  const threshold = (i + 1) / 14;
                  const isActive = audioLevel >= threshold;
                  let colorClass = 'bg-emerald-500';
                  if (i >= 10) colorClass = 'bg-amber-500';
                  if (i >= 12) colorClass = 'bg-rose-500';

                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex-1 h-full rounded-xs transition-all duration-75',
                        isActive ? colorClass : 'bg-muted/80'
                      )}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant={isTestingMic ? 'destructive' : micState === 'granted' ? 'outline' : 'default'}
              className="w-full text-xs h-8 gap-1.5"
              onClick={handleTestMicrophone}
            >
              <Mic className="w-3.5 h-3.5" />
              {isTestingMic ? 'Stop Mic Test' : micState === 'granted' ? 'Test Mic Input' : 'Request Mic Permission'}
            </Button>
          </div>
        </div>

        {/* 2. Web Speech Recognition Engine */}
        <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  speechRecState === 'supported' || speechRecState === 'active'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'bg-destructive/10 text-destructive'
                )}
              >
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Speech Recognition</p>
                <p className="text-[11px] text-muted-foreground">webkitSpeechRecognition</p>
              </div>
            </div>

            <Badge
              variant={speechRecState === 'active' ? 'default' : speechRecState === 'supported' ? 'outline' : 'destructive'}
              className="text-[10px] capitalize"
            >
              {speechRecState}
            </Badge>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Powers hands-free voice commands and instant clinical transcription.
          </p>

          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs h-8 gap-1.5"
            onClick={handleTestSpeechRecognition}
            disabled={speechRecState === 'unsupported'}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Test Speech Engine
          </Button>
        </div>

        {/* 3. Speech Synthesis (Audio Output) */}
        <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Audio Output / Speaker</p>
                <p className="text-[11px] text-muted-foreground">SpeechSynthesis TTS</p>
              </div>
            </div>

            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              Ready
            </Badge>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Provides spoken feedback for medical flashcards and AI tutor explanations.
          </p>

          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs h-8 gap-1.5"
            onClick={handleTestSpeaker}
          >
            <Volume2 className="w-3.5 h-3.5" />
            Test Voice Speaker
          </Button>
        </div>

        {/* 4. Vault Offline Storage & Notifications */}
        <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-purple-600 dark:text-primary">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Persistence & Push</p>
                <p className="text-[11px] text-muted-foreground">IndexedDB & Notifications</p>
              </div>
            </div>

            <div className="flex gap-1">
              {storagePersisted && (
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-purple-600 border-purple-500/20">
                  Persisted
                </Badge>
              )}
              {notificationState === 'granted' && (
                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">
                  Notifs On
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-[11px] h-8 gap-1 px-2"
              onClick={handleRequestStoragePersistence}
            >
              <HardDrive className="w-3 h-3" />
              Persistent Storage
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-[11px] h-8 gap-1 px-2"
              onClick={handleRequestNotifications}
            >
              <Bell className="w-3 h-3" />
              Notifications
            </Button>
          </div>
        </div>
      </div>

      {/* Chrome PWA / Android WebAPK Troubleshooting Guide Accordion */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 p-4 space-y-3">
        <button
          type="button"
          onClick={() => setShowPwaGuide(!showPwaGuide)}
          className="w-full flex items-center justify-between text-left focus:outline-hidden"
        >
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-semibold text-foreground">
              Chrome PWA / Android Microphone Unblock Guide
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
            <span>{showPwaGuide ? 'Hide Instructions' : 'View Fix'}</span>
            {showPwaGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showPwaGuide && (
          <div className="pt-2 text-xs text-muted-foreground space-y-2.5 border-t border-amber-500/20 animate-in fade-in duration-150">
            <p className="leading-relaxed">
              If Chrome installed this application as a Progressive Web App (PWA) or Android WebAPK, Chrome may block microphone access silently until explicitly allowed in site settings.
            </p>

            <div className="space-y-2 pl-2 border-l-2 border-amber-500/40 font-medium text-foreground">
              <div className="flex items-start gap-2">
                <span className="shrink-0 w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] flex items-center justify-center font-bold">1</span>
                <p className="text-[11px]">
                  <strong>Android / Mobile Chrome PWA:</strong> Long-press the App Icon on your home screen &gt; Tap <strong>App Info (i)</strong> &gt; Tap <strong>Permissions</strong> &gt; Set <strong>Microphone</strong> to <strong>Allow</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="shrink-0 w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] flex items-center justify-center font-bold">2</span>
                <p className="text-[11px]">
                  <strong>Desktop Chrome PWA:</strong> Click the <strong>Tune / Controls</strong> or <strong>Lock Icon</strong> next to the address bar &gt; Select <strong>Site Settings</strong> &gt; Toggle <strong>Microphone</strong> from "Block" to "Allow".
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="shrink-0 w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] flex items-center justify-center font-bold">3</span>
                <p className="text-[11px]">
                  <strong>Re-Initialize:</strong> Once allowed, tap <strong>"Test Mic Input"</strong> above to confirm audio signal capture.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
