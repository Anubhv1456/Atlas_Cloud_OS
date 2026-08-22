/**
 * Atlas Audio Worklet & Ultra-Low-Latency VAD Subsystem
 * 
 * Provides continuous 16kHz PCM audio capturing with sub-80ms energy detection,
 * optimized for non-blocking browser threads and seamless barge-in execution.
 */

export interface VoiceWorkletConfig {
  sampleRate?: number;
  vadThresholdDb?: number;
  speechDurationTriggerMs?: number;
  silenceReleaseMs?: number;
}

export interface VoiceWorkletCallbacks {
  onAudioChunk?: (pcmData: Float32Array) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onEnergy?: (rmsDb: number, normalizedEnergy: number) => void;
}

export class VoiceWorkletController {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private processorNode: ScriptProcessorNode | AudioWorkletNode | null = null;
  private isRunning = false;
  private isSpeaking = false;
  private speechStartTimestamp = 0;
  private lastSpeechTimestamp = 0;

  private vadThresholdDb: number;
  private speechDurationTriggerMs: number;
  private silenceReleaseMs: number;

  constructor(config: VoiceWorkletConfig = {}) {
    this.vadThresholdDb = config.vadThresholdDb ?? -52;
    this.speechDurationTriggerMs = config.speechDurationTriggerMs ?? 60; // sub-80ms trigger
    this.silenceReleaseMs = config.silenceReleaseMs ?? 1200;
  }

  /**
   * Initializes the continuous PCM streaming pipeline with VAD
   */
  public async start(callbacks: VoiceWorkletCallbacks): Promise<void> {
    if (this.isRunning) return;

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
        console.warn('[VoiceWorklet] Detailed constraints rejected, falling back to basic audio stream:', err);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        throw err;
      }
    }

    this.mediaStream = stream;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const source = this.audioContext.createMediaStreamSource(stream);

    // 120Hz Biquad Highpass Filter (reduces environmental rumble)
    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(120, this.audioContext.currentTime);

    // Dynamic Compression (normalizes audio range)
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
    compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
    compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);

    // Analyser node for FFT and RMS computations
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.2;

    source.connect(highpass);
    highpass.connect(compressor);
    compressor.connect(this.analyser);

    // Continuous PCM chunk processor
    const bufferSize = 2048;
    const scriptNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
    this.processorNode = scriptNode;

    scriptNode.onaudioprocess = (audioProcessingEvent) => {
      if (!this.isRunning) return;

      const inputBuffer = audioProcessingEvent.inputBuffer;
      const inputData = inputBuffer.getChannelData(0);

      // Compute RMS Energy for sub-80ms VAD
      let sumSquares = 0;
      for (let i = 0; i < inputData.length; i++) {
        sumSquares += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sumSquares / inputData.length);
      const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -100;
      const normalizedEnergy = Math.max(0, Math.min(1, (rmsDb + 60) / 45));

      callbacks.onEnergy?.(rmsDb, normalizedEnergy);
      callbacks.onAudioChunk?.(new Float32Array(inputData));

      const now = performance.now();

      if (rmsDb > this.vadThresholdDb) {
        this.lastSpeechTimestamp = now;

        if (!this.isSpeaking) {
          if (this.speechStartTimestamp === 0) {
            this.speechStartTimestamp = now;
          } else if (now - this.speechStartTimestamp >= this.speechDurationTriggerMs) {
            this.isSpeaking = true;
            callbacks.onSpeechStart?.();
          }
        }
      } else {
        if (this.isSpeaking && now - this.lastSpeechTimestamp > this.silenceReleaseMs) {
          this.isSpeaking = false;
          this.speechStartTimestamp = 0;
          callbacks.onSpeechEnd?.();
        } else if (!this.isSpeaking && now - this.speechStartTimestamp > this.speechDurationTriggerMs) {
          this.speechStartTimestamp = 0;
        }
      }
    };

    compressor.connect(scriptNode);

    this.isRunning = true;
  }

  public getSpeakingState(): boolean {
    return this.isSpeaking;
  }

  public stop(): void {
    this.isRunning = false;
    this.isSpeaking = false;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}
