/**
 * Microphone → damped 0–1 energy, plus a simple speech gate.
 *
 * Honest about its tier: this is RMS + an adaptive noise floor + hysteresis.
 * It is NOT spectral or model-based VAD. That is sufficient to keep keyboards
 * and room hum from animating the face, and it is declared as simulated-grade
 * in docs/INTEGRATIONS.md rather than being passed off as production VAD.
 */

export interface MicOptions {
  /** Energy must exceed floor * this to count as speech. */
  openRatio?: number;
  /** Once open, it stays open until it drops below floor * this. */
  closeRatio?: number;
  /** Speech segment ends after this much continuous silence. */
  hangMs?: number;
}

export class MicEngine {
  private ctx?: AudioContext;
  private analyser?: AnalyserNode;
  private stream?: MediaStream;
  private buf?: Float32Array<ArrayBuffer>;
  private raf = 0;

  /** Smoothed energy, 0–1. */
  energy = 0;
  speaking = false;

  /**
   * Adaptive noise floor. Critically, this only adapts DOWNWARD quickly and
   * upward slowly, and only while not speaking — measuring the floor during
   * gaps rather than as a running average, so a loud voice can't drag the
   * floor up and desensitise the gate.
   */
  private floor = 0.006;
  private lastLoud = 0;

  private onEnergy?: (e: number) => void;
  private onSpeech?: (speaking: boolean) => void;

  private opts: MicOptions;

  constructor(opts: MicOptions = {}) {
    this.opts = opts;
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true, // Stops our own speaker output re-triggering us.
        noiseSuppression: true,
        autoGainControl: false, // AGC would fight the adaptive floor.
      },
    });

    this.ctx = new AudioContext();
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    // First damping layer, before our own smoothing.
    this.analyser.smoothingTimeConstant = 0.7;
    src.connect(this.analyser);
    this.buf = new Float32Array(new ArrayBuffer(this.analyser.fftSize * 4));

    const loop = () => {
      this.tick();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private tick() {
    if (!this.analyser || !this.buf) return;
    this.analyser.getFloatTimeDomainData(this.buf);

    // RMS over the frame — instant energy, better than frequency data here.
    let sum = 0;
    for (let i = 0; i < this.buf.length; i++) sum += this.buf[i] * this.buf[i];
    const rms = Math.sqrt(sum / this.buf.length);

    const { openRatio = 3.2, closeRatio = 1.9, hangMs = 900 } = this.opts;
    const now = performance.now();

    // Update the floor only during quiet — never while speech is present.
    if (!this.speaking) {
      if (rms < this.floor) this.floor += (rms - this.floor) * 0.25; // fall fast
      else this.floor += (rms - this.floor) * 0.002; // rise slowly
      this.floor = Math.max(0.0015, this.floor);
    }

    const ratio = rms / this.floor;
    if (!this.speaking && ratio > openRatio) {
      this.speaking = true;
      this.onSpeech?.(true);
    } else if (this.speaking) {
      if (ratio > closeRatio) this.lastLoud = now;
      else if (now - this.lastLoud > hangMs) {
        this.speaking = false;
        this.onSpeech?.(false);
      }
    }

    // Map above-floor energy into 0–1, then damp so the face never jitters.
    const target = Math.max(0, Math.min(1, (ratio - 1) / (openRatio * 2.4)));
    this.energy += (target - this.energy) * 0.16;
    this.onEnergy?.(this.energy);
  }

  subscribeEnergy(cb: (e: number) => void) {
    this.onEnergy = cb;
    return () => {
      this.onEnergy = undefined;
    };
  }

  subscribeSpeech(cb: (speaking: boolean) => void) {
    this.onSpeech = cb;
    return () => {
      this.onSpeech = undefined;
    };
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close();
    this.ctx = undefined;
    this.analyser = undefined;
    this.energy = 0;
    this.speaking = false;
  }
}
