/**
 * Atlas Audio Stream Concurrency Singleton Coordinator
 * 
 * Ensures that only ONE component or service across the entire application
 * can hold the active microphone / SpeechRecognition lock at any given time.
 * Prevents race conditions, dual-mic streaming, and duplicate transcript leaks
 * between the Floating Command Bar HUD and the Voice Co-Pilot Drawer.
 */

type SessionOwner = 'drawer' | 'command-bar' | 'ambient' | 'quick-widget' | string;

interface SessionLockListener {
  ownerId: SessionOwner;
  onPreempted: () => void;
}

class SpeechSessionCoordinator {
  private static instance: SpeechSessionCoordinator;
  private currentOwner: SessionOwner | null = null;
  private activeRecognition: any = null;
  private activeDspSession: any = null;
  private listeners: Map<SessionOwner, () => void> = new Map();

  public static getInstance(): SpeechSessionCoordinator {
    if (!SpeechSessionCoordinator.instance) {
      SpeechSessionCoordinator.instance = new SpeechSessionCoordinator();
    }
    return SpeechSessionCoordinator.instance;
  }

  /**
   * Acquires the exclusive audio/speech lock.
   * If another component currently holds the lock, preempts it cleanly first.
   */
  public acquireLock(ownerId: SessionOwner, onPreempted: () => void): boolean {
    if (this.currentOwner && this.currentOwner !== ownerId) {
      console.log(`[SpeechCoordinator] Preempting previous owner "${this.currentOwner}" for new owner "${ownerId}"`);
      const existingPreemptCb = this.listeners.get(this.currentOwner);
      if (existingPreemptCb) {
        try {
          existingPreemptCb();
        } catch (err) {
          console.warn('[SpeechCoordinator] Error preempting previous owner:', err);
        }
      }
      this.stopActiveStreams();
    }

    this.currentOwner = ownerId;
    this.listeners.set(ownerId, onPreempted);
    return true;
  }

  /**
   * Registers active recognition or DSP stream for central safety teardown
   */
  public registerActiveStream(ownerId: SessionOwner, recognition?: any, dspSession?: any) {
    if (this.currentOwner === ownerId) {
      this.activeRecognition = recognition || null;
      this.activeDspSession = dspSession || null;
    }
  }

  /**
   * Releases the lock when a component gracefully finishes or unmounts.
   */
  public releaseLock(ownerId: SessionOwner) {
    if (this.currentOwner === ownerId) {
      this.stopActiveStreams();
      this.currentOwner = null;
      this.listeners.delete(ownerId);
    }
  }

  /**
   * Forcibly stops any active recognition instance or audio context
   */
  public stopActiveStreams() {
    if (this.activeRecognition) {
      try {
        this.activeRecognition.onresult = null;
        this.activeRecognition.onerror = null;
        this.activeRecognition.onend = null;
        this.activeRecognition.stop();
      } catch {}
      this.activeRecognition = null;
    }

    if (this.activeDspSession) {
      try {
        this.activeDspSession.stop();
      } catch {}
      this.activeDspSession = null;
    }
  }

  /**
   * Returns whether a given owner currently has the active microphone lock
   */
  public isOwner(ownerId: SessionOwner): boolean {
    return this.currentOwner === ownerId;
  }

  public getCurrentOwner(): SessionOwner | null {
    return this.currentOwner;
  }
}

export const speechCoordinator = SpeechSessionCoordinator.getInstance();
