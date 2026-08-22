/**
 * Acoustic Pre-Flight & Digital Signal Processing (DSP) Pipeline
 * 
 * Provides:
 * 1. 120Hz High-Pass Biquad Filtering (strips HVAC/fan rumble)
 * 2. Dynamics Compression (normalizes whispered vs loud voice)
 * 3. Real-Time RMS Energy Voice Activity Detection (VAD)
 * 4. Adaptive silence and speech duration tracking
 */

export interface VADCallbackEvents {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onEnergyLevel?: (rmsDb: number, normalizedEnergy: number) => void;
}

export interface AudioDspSession {
  audioContext: AudioContext;
  mediaStream: MediaStream;
  analyser: AnalyserNode;
  stop: () => void;
}

export class AcousticDspEngine {
  private static instance: AcousticDspEngine;

  public static getInstance(): AcousticDspEngine {
    if (!AcousticDspEngine.instance) {
      AcousticDspEngine.instance = new AcousticDspEngine();
    }
    return AcousticDspEngine.instance;
  }

  /**
   * Initializes high-pass filtering, dynamics compression, and real-time VAD
   */
  public async startAudioPipeline(
    events: VADCallbackEvents,
    options: {
      silenceThresholdDb?: number;
      silenceDurationMs?: number;
      minSpeechDurationMs?: number;
    } = {}
  ): Promise<AudioDspSession> {
    const silenceThresholdDb = options.silenceThresholdDb ?? -38;
    const silenceDurationMs = options.silenceDurationMs ?? 1600;
    const minSpeechDurationMs = options.minSpeechDurationMs ?? 350;

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
        console.warn('[AudioDSP] Detailed constraints rejected, falling back to basic audio stream:', err);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        throw err;
      }
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const source = ctx.createMediaStreamSource(stream);

    // 1. High-Pass Filter at 120Hz (Strips fan, air-conditioning, and rumble)
    const highPass = ctx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.setValueAtTime(120, ctx.currentTime);
    highPass.Q.setValueAtTime(0.707, ctx.currentTime);

    // 2. Dynamics Compressor (Normalizes speech peaks)
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, ctx.currentTime);
    compressor.knee.setValueAtTime(30, ctx.currentTime);
    compressor.ratio.setValueAtTime(12, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.25, ctx.currentTime);

    // 3. Analyser Node for Real-time FFT & RMS calculation
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.4;

    // Connect DSP graph: Source -> HighPass -> Compressor -> Analyser
    source.connect(highPass);
    highPass.connect(compressor);
    compressor.connect(analyser);

    // VAD State Machine Variables
    const dataArray = new Float32Array(analyser.fftSize);
    let isSpeaking = false;
    let speechStartTime = 0;
    let lastSpokenTime = 0;
    let isRunning = true;
    let rafId: number;

    const analyzeFrame = () => {
      if (!isRunning) return;

      analyser.getFloatTimeDomainData(dataArray);

      // Compute Root-Mean-Square (RMS) Energy
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -100;

      // Normalized 0 to 1 scale for UI waveforms
      const normalizedEnergy = Math.max(0, Math.min(1, (rmsDb + 60) / 45));
      events.onEnergyLevel?.(rmsDb, normalizedEnergy);

      const now = performance.now();

      if (rmsDb > silenceThresholdDb) {
        // Voice Activity Detected
        lastSpokenTime = now;

        if (!isSpeaking) {
          if (speechStartTime === 0) {
            speechStartTime = now;
          } else if (now - speechStartTime >= minSpeechDurationMs) {
            isSpeaking = true;
            events.onSpeechStart?.();
          }
        }
      } else {
        // Silence detected
        if (isSpeaking && now - lastSpokenTime > silenceDurationMs) {
          isSpeaking = false;
          speechStartTime = 0;
          events.onSpeechEnd?.();
        } else if (!isSpeaking && now - speechStartTime > minSpeechDurationMs) {
          speechStartTime = 0;
        }
      }

      rafId = requestAnimationFrame(analyzeFrame);
    };

    rafId = requestAnimationFrame(analyzeFrame);

    const stop = () => {
      isRunning = false;
      cancelAnimationFrame(rafId);

      stream.getTracks().forEach((track) => track.stop());

      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    };

    return {
      audioContext: ctx,
      mediaStream: stream,
      analyser,
      stop,
    };
  }
}

export const acousticDsp = AcousticDspEngine.getInstance();
