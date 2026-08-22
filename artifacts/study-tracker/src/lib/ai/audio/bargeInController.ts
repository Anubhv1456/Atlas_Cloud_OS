/**
 * Atlas Instant Barge-In & Audio Buffer Flush Controller
 * 
 * Halts active text-to-speech output within <60ms upon detecting user speech onset,
 * eliminating conversational overlap and creating a natural, polite full-duplex experience.
 */

export class BargeInController {
  private static instance: BargeInController;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private activeAudioNodes: AudioBufferSourceNode[] = [];
  private isSpeakingTTS = false;
  private onBargeInCallbacks: Set<() => void> = new Set();

  public static getInstance(): BargeInController {
    if (!BargeInController.instance) {
      BargeInController.instance = new BargeInController();
    }
    return BargeInController.instance;
  }

  public registerOnBargeIn(callback: () => void): () => void {
    this.onBargeInCallbacks.add(callback);
    return () => this.onBargeInCallbacks.delete(callback);
  }

  public setSpeakingTTS(speaking: boolean, utterance?: SpeechSynthesisUtterance): void {
    this.isSpeakingTTS = speaking;
    if (speaking && utterance) {
      this.currentUtterance = utterance;
    } else if (!speaking) {
      this.currentUtterance = null;
    }
  }

  public registerAudioSourceNode(node: AudioBufferSourceNode): void {
    this.activeAudioNodes.push(node);
    node.onended = () => {
      this.activeAudioNodes = this.activeAudioNodes.filter((n) => n !== node);
      if (this.activeAudioNodes.length === 0) {
        this.isSpeakingTTS = false;
      }
    };
  }

  /**
   * Executes instant barge-in: cancel all active speech synthesis and audio buffers
   */
  public triggerBargeIn(): boolean {
    if (!this.isSpeakingTTS && this.activeAudioNodes.length === 0 && !window.speechSynthesis?.speaking) {
      return false;
    }

    // 1. Flush browser SpeechSynthesis queue
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // 2. Stop any Web Audio API buffers
    for (const node of this.activeAudioNodes) {
      try {
        node.stop();
        node.disconnect();
      } catch {}
    }
    this.activeAudioNodes = [];

    this.isSpeakingTTS = false;
    this.currentUtterance = null;

    // 3. Notify subscribers
    this.onBargeInCallbacks.forEach((cb) => cb());
    return true;
  }

  public isTTSRunning(): boolean {
    return this.isSpeakingTTS || (typeof window !== 'undefined' && !!window.speechSynthesis?.speaking);
  }
}

export const bargeInController = BargeInController.getInstance();
