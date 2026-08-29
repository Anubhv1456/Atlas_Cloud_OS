import React, { useState, useEffect } from 'react';
import { Mic, MicOff, ShieldAlert, Check, X, Sparkles, RefreshCw, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function AudioPermissionBanner() {
  const [micState, setMicState] = useState<'checking' | 'prompt' | 'granted' | 'denied' | 'unsupported'>('checking');
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showFixModal, setShowFixModal] = useState(false);

  const checkPermission = async () => {
    if (typeof window === 'undefined') return;

    // Check if user dismissed for session
    const dismissed = sessionStorage.getItem('atlas_mic_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicState('unsupported');
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const res = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicState(res.state as 'prompt' | 'granted' | 'denied');

        res.onchange = () => {
          setMicState(res.state as 'prompt' | 'granted' | 'denied');
        };
      } catch (err) {
        // Fallback if query throws (e.g. Safari / iOS)
        setMicState('prompt');
      }
    } else {
      setMicState('prompt');
    }
  };

  useEffect(() => {
    checkPermission();

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
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (err: any) {
        if (
          err?.name === 'OverconstrainedError' ||
          err?.name === 'ConstraintNotSatisfiedError' ||
          err?.name === 'TypeError'
        ) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } else {
          throw err;
        }
      }

      // Stop stream immediately after acquiring permission
      stream.getTracks().forEach((track) => track.stop());

      sessionStorage.setItem('atlas_mic_verified_ok', 'true');
      setMicState('granted');
      setShowFixModal(false);
      toast.success('Microphone permission granted!', {
        description: 'Atlas is now registered in Chrome site settings. Voice commands are ready.',
      });
    } catch (err: any) {
      console.warn('[AudioPermissionBanner] Permission request failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicState('denied');
        setShowFixModal(true);
        toast.error('Microphone access denied', {
          description: 'Follow the unblock guide to grant microphone access in Chrome.',
        });
      } else {
        toast.error(`Microphone error: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('atlas_mic_banner_dismissed', 'true');
  };

  // Don't render if granted, unsupported, or explicitly dismissed
  if (micState === 'granted' || micState === 'unsupported' || (isDismissed && micState !== 'denied')) {
    return null;
  }

  // Don't render during initial rapid check if state is still checking
  if (micState === 'checking') {
    return null;
  }

  return (
    <>
      {/* Top Banner */}
      <div
        className={cn(
          'px-4 py-2.5 backdrop-blur-md shadow-md border-b text-xs transition-all duration-200 animate-in slide-in-from-top-2',
          micState === 'denied'
            ? 'bg-amber-950/90 via-rose-950/90 to-amber-950/90 border-amber-500/40 text-amber-100'
            : 'bg-gradient-to-r from-teal-950/90 via-emerald-950/90 to-cyan-950/90 border-teal-500/30 text-teal-100'
        )}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div
              className={cn(
                'p-2 rounded-xl border shrink-0',
                micState === 'denied'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
              )}
            >
              {micState === 'denied' ? (
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              ) : (
                <Mic className="w-4 h-4 animate-pulse text-teal-300" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <p className="font-bold text-foreground">
                  {micState === 'denied' ? 'Microphone Access Blocked' : 'Enable Voice Assistant & Chrome Audio'}
                </p>
                <span
                  className={cn(
                    'hidden md:inline-block px-1.5 py-0.5 rounded-full text-[10px] font-mono border',
                    micState === 'denied'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                  )}
                >
                  {micState === 'denied' ? 'Action Required' : 'Chrome PWA'}
                </span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-tight mt-0.5">
                {micState === 'denied'
                  ? 'Chrome blocked microphone access. Unblock in site settings to enable voice commands.'
                  : 'Grant microphone permission to register Atlas in Chrome settings and enable voice copilot commands.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            {micState === 'denied' ? (
              <Button
                size="sm"
                onClick={() => setShowFixModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-3.5 shadow-sm shadow-amber-500/20 gap-1.5 w-full sm:w-auto"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Fix Microphone Settings</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleRequestMicrophone}
                disabled={isRequesting}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs h-8 px-3.5 shadow-sm shadow-teal-500/20 gap-1.5 w-full sm:w-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isRequesting ? 'Requesting...' : 'Allow Microphone Access'}</span>
              </Button>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chrome PWA Microphone Fix Instructions Modal */}
      {showFixModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border shadow-2xl rounded-2xl max-w-md w-full p-6 space-y-5 text-foreground">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Unblock Chrome Microphone</h3>
                  <p className="text-xs text-muted-foreground">Follow these 1-minute steps to grant voice access</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFixModal(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <strong className="text-foreground">Android App / WebAPK:</strong>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Long-press the <strong>Atlas App Icon</strong> on your home screen &gt; Tap <strong>App Info (i)</strong> &gt; Tap <strong>Permissions</strong> &gt; Set <strong>Microphone</strong> to <strong>Allow</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-border/60">
                  <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <strong className="text-foreground">Desktop / Mobile Chrome Browser:</strong>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Click the <strong>Tune / Lock Icon</strong> next to the web address (URL bar) &gt; Tap <strong>Site Settings</strong> &gt; Change <strong>Microphone</strong> from "Block" to "Allow".
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFixModal(false)}
                className="w-full sm:w-1/2 text-xs h-9"
              >
                Close
              </Button>

              <Button
                type="button"
                onClick={handleRequestMicrophone}
                disabled={isRequesting}
                className="w-full sm:w-1/2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs h-9 gap-1.5 shadow-md shadow-teal-500/20"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isRequesting && 'animate-spin')} />
                <span>{isRequesting ? 'Checking...' : 'Retry Access Now'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
