import React, { useState, useEffect } from 'react';
import { Mic, ShieldAlert, Check, X, Sparkles, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function AudioPermissionBanner() {
  const [micState, setMicState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('granted');
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if user previously dismissed banner for this session
    const dismissed = sessionStorage.getItem('atlas_mic_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    const checkPermission = async () => {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const res = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setMicState(res.state as 'prompt' | 'granted' | 'denied');
          res.onchange = () => {
            setMicState(res.state as 'prompt' | 'granted' | 'denied');
          };
        } catch {
          // Fallback if query throws
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setMicState('unsupported');
          } else {
            // Assume prompt if query failed
            setMicState('prompt');
          }
        }
      } else if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicState('unsupported');
      } else {
        setMicState('prompt');
      }
    };

    checkPermission();

    // Re-check when window regains focus or visibility
    const handleFocus = () => checkPermission();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const handleRequestMicrophone = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Microphone audio is not supported in this browser.');
      setMicState('unsupported');
      return;
    }

    try {
      setIsRequesting(true);
      // Trigger native OS/browser permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Stop stream immediately after acquiring permission
      stream.getTracks().forEach((track) => track.stop());

      setMicState('granted');
      toast.success('Microphone permission granted!', {
        description: 'Voice commands, hands-free tutor, and audio diagnostics are now active.',
      });
    } catch (err: any) {
      console.warn('[AudioPermissionBanner] Permission request failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicState('denied');
        toast.error('Microphone access denied', {
          description: 'To unblock: Go to Settings > Device Permissions & Audio Diagnostics.',
        });
      } else {
        toast.error(`Microphone permission error: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('atlas_mic_banner_dismissed', 'true');
  };

  // Only show banner if permission state is 'prompt' and not explicitly dismissed
  if (micState !== 'prompt' || isDismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-teal-950/90 via-emerald-950/90 to-cyan-950/90 border-b border-teal-500/30 text-teal-100 px-4 py-2.5 backdrop-blur-md shadow-md animate-in slide-in-from-top-2 duration-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 shrink-0">
            <Mic className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <p className="font-bold text-foreground sm:text-xs">Enable Voice Assistant & Chrome PWA Audio</p>
              <span className="hidden md:inline-block px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-mono border border-teal-500/30">
                Action Required
              </span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-tight mt-0.5">
              Grant microphone permission to register Atlas in Chrome site settings and enable hands-free voice commands.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <Button
            size="sm"
            onClick={handleRequestMicrophone}
            disabled={isRequesting}
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs h-8 px-3.5 shadow-sm shadow-teal-500/20 gap-1.5 w-full sm:w-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRequesting ? 'Requesting...' : 'Allow Microphone Access'}</span>
          </Button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-teal-300/70 hover:text-teal-100 hover:bg-teal-500/20 transition-all"
            title="Dismiss for this session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
