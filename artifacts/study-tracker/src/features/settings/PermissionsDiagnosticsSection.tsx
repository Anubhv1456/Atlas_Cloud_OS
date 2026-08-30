import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Radio,
  HardDrive,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Sliders
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SettingsRow } from './SettingsLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function PermissionsDiagnosticsSection() {
  const [modalOpen, setModalOpen] = useState(false);
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

  const checkPermissions = async () => {
    if (typeof window === 'undefined') return;

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicState(result.state as 'prompt' | 'granted' | 'denied');
        result.onchange = () => {
          setMicState(result.state as 'prompt' | 'granted' | 'denied');
        };
      } catch {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setMicState('unsupported');
        }
      }
    } else if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicState('unsupported');
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechRecState(SpeechRecognitionClass ? 'supported' : 'unsupported');
    setSpeechSynthState('speechSynthesis' in window ? 'supported' : 'unsupported');

    if ('Notification' in window) {
      setNotificationState(Notification.permission);
    }

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
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });

      streamRef.current = stream;
      setMicState('granted');
      toast.success('Microphone permission active');

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
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicState('denied');
        setShowPwaGuide(true);
        toast.error('Microphone access denied');
      } else {
        toast.error(`Microphone error: ${err.message || 'Unknown error'}`);
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

  const handleTestSpeaker = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Speech synthesis is not supported on this browser.');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('Audio speaker verified. Atlas is ready.');
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
      toast.info('Testing voice speaker output...');
    } catch {
      toast.error('Failed to initiate audio output.');
    }
  };

  const handleTestSpeechRecognition = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      toast.error('Speech Recognition is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setSpeechRecState('active');
        toast.info('Listening... say a medical keyword', { duration: 3000 });
      };

      recognition.onresult = (e: any) => {
        const text = e.results[0]?.[0]?.transcript || '';
        toast.success(`Recognized: "${text}"`);
        setSpeechRecState('supported');
      };

      recognition.onerror = () => {
        setSpeechRecState('supported');
      };

      recognition.onend = () => {
        setSpeechRecState('supported');
      };

      recognition.start();
    } catch {
      toast.error('Failed to start speech test.');
    }
  };

  const isHealthy = micState === 'granted' && speechRecState !== 'unsupported';

  return (
    <>
      <SettingsRow
        icon={Sliders}
        iconBg="bg-teal-600 dark:bg-teal-500"
        label="Permissions & Audio Diagnostics"
        sublabel={`Microphone (${micState}) • Voice Engine (${speechRecState})`}
        value={isHealthy ? 'Healthy' : 'Diagnose'}
        chevron
        onClick={() => setModalOpen(true)}
      />

      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) stopMicTest(); setModalOpen(open); }}>
        <DialogContent className="sm:max-w-lg bg-card border-border/80 text-foreground rounded-3xl p-6 shadow-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Mic className="w-4.5 h-4.5 text-primary" />
                Hardware & Telemetry Diagnostics
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={checkPermissions}
                className="h-7 text-xs text-muted-foreground gap-1 px-2"
              >
                <RefreshCw className="w-3 h-3" />
                Re-check
              </Button>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Live status for browser speech engines, microphone hardware, and offline leases.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {/* Status Inset List */}
            <div className="bg-card border border-border/70 rounded-2xl overflow-hidden divide-y divide-border/30">
              {/* Mic Input */}
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={cn("p-1.5 rounded-lg", micState === 'granted' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>
                    {micState === 'granted' ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Microphone Input</p>
                    <p className="text-[11px] text-muted-foreground">getUserMedia Stream</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isTestingMic ? "destructive" : "outline"}
                  onClick={handleTestMicrophone}
                  className="h-7 text-[11px] px-2.5 rounded-lg"
                >
                  {isTestingMic ? 'Stop Meter' : 'Test Stream'}
                </Button>
              </div>

              {/* VU Meter */}
              {isTestingMic && (
                <div className="p-3 bg-muted/20 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span>Microphone Input Level</span>
                    <span>{dbLevel} dB</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-75"
                      style={{ width: `${Math.round(audioLevel * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Speech Recognition Engine */}
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Speech Recognition</p>
                    <p className="text-[11px] text-muted-foreground">Web Speech STT</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestSpeechRecognition}
                  disabled={speechRecState === 'unsupported'}
                  className="h-7 text-[11px] px-2.5 rounded-lg"
                >
                  <Sparkles className="w-3 h-3 mr-1 text-primary" />
                  Test Engine
                </Button>
              </div>

              {/* Speech Synthesis Speaker */}
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Voice Speaker</p>
                    <p className="text-[11px] text-muted-foreground">SpeechSynthesis TTS</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestSpeaker}
                  className="h-7 text-[11px] px-2.5 rounded-lg"
                >
                  Play Sample
                </Button>
              </div>
            </div>

            {/* PWA Guide */}
            <div className="bg-muted/30 border border-border/60 rounded-2xl p-3.5 space-y-2">
              <button
                type="button"
                onClick={() => setShowPwaGuide(!showPwaGuide)}
                className="w-full flex items-center justify-between text-left cursor-pointer"
              >
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  Chrome PWA Permissions Guide
                </span>
                {showPwaGuide ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>

              {showPwaGuide && (
                <div className="pt-2 text-[11px] text-muted-foreground space-y-1.5 border-t border-border/40">
                  <p>1. <strong>Mobile Chrome:</strong> Long-press icon &gt; App Info &gt; Permissions &gt; Allow Microphone.</p>
                  <p>2. <strong>Desktop Chrome:</strong> Click tune icon in address bar &gt; Site settings &gt; Set Microphone to Allow.</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
