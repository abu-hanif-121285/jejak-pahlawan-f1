import type { AudioSettings } from '../types';

type ToneOptions = {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  slideTo?: number;
  delay?: number;
};

class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private engineNodes: { oscA: OscillatorNode; oscB: OscillatorNode; filter: BiquadFilterNode; gain: GainNode } | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicStep = 0;
  private settings: AudioSettings = { music: true, sfx: true };

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 0.75;
      this.master.connect(ctx.destination);

      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = this.settings.music ? 0.17 : 0;
      this.musicBus.connect(this.master);

      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = this.settings.sfx ? 0.9 : 0;
      this.sfxBus.connect(this.master);
    } catch {
      this.ctx = null;
    }
  }

  unlock() {
    this.init();
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
  }

  get isReady() {
    return Boolean(this.ctx);
  }

  setSettings(settings: AudioSettings) {
    this.settings = settings;
    if (!this.ctx) return;
    if (this.musicBus) this.musicBus.gain.value = settings.music ? 0.17 : 0;
    if (this.sfxBus) this.sfxBus.gain.value = settings.sfx ? 0.9 : 0;
    if (settings.music) this.startMusic();
    else this.stopMusic();
  }

  private tone({ freq, dur, type = 'sine', gain = 0.18, slideTo, delay = 0 }: ToneOptions) {
    if (!this.ctx || !this.sfxBus || !this.settings.sfx) return;
    const ctx = this.ctx;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), start + dur);
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.03, dur / 3));
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(env).connect(this.sfxBus);
    osc.start(start);
    osc.stop(start + dur + 0.03);
  }

  click() {
    this.tone({ freq: 660, dur: 0.06, type: 'triangle', gain: 0.12 });
    this.tone({ freq: 990, dur: 0.05, type: 'triangle', gain: 0.07, delay: 0.045 });
  }

  whoosh() {
    this.tone({ freq: 120, dur: 0.35, type: 'sawtooth', gain: 0.07, slideTo: 520 });
  }

  gatePass() {
    this.tone({ freq: 90, dur: 0.25, type: 'sawtooth', gain: 0.14, slideTo: 200 });
  }

  turbo() {
    this.tone({ freq: 180, dur: 0.55, type: 'sawtooth', gain: 0.13, slideTo: 880 });
    this.tone({ freq: 440, dur: 0.5, type: 'sine', gain: 0.1, slideTo: 1320, delay: 0.05 });
  }

  correct() {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) =>
      this.tone({ freq, dur: 0.22, type: 'triangle', gain: 0.16, delay: i * 0.085 }),
    );
  }

  wrong() {
    this.tone({ freq: 220, dur: 0.22, type: 'sawtooth', gain: 0.16, slideTo: 150 });
    this.tone({ freq: 180, dur: 0.36, type: 'square', gain: 0.1, slideTo: 90, delay: 0.18 });
  }

  timeout() {
    [0, 0.22, 0.44].forEach((delay, i) =>
      this.tone({ freq: 520 - i * 90, dur: 0.16, type: 'square', gain: 0.12, delay }),
    );
  }

  tick(urgent = false) {
    this.tone({ freq: urgent ? 1200 : 880, dur: 0.05, type: 'square', gain: urgent ? 0.1 : 0.055 });
  }

  countdown(final = false) {
    this.tone({ freq: final ? 880 : 520, dur: final ? 0.4 : 0.13, type: 'triangle', gain: 0.18 });
    if (final) this.tone({ freq: 1320, dur: 0.45, type: 'sine', gain: 0.14, delay: 0.05 });
  }

  win() {
    const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5];
    melody.forEach((freq, i) =>
      this.tone({ freq, dur: i === melody.length - 1 ? 0.9 : 0.26, type: 'triangle', gain: 0.17, delay: i * 0.17 }),
    );
    melody.forEach((freq, i) =>
      this.tone({ freq: freq / 2, dur: 0.32, type: 'sine', gain: 0.07, delay: i * 0.17 }),
    );
  }

  gameOver() {
    [392, 349.23, 293.66, 196].forEach((freq, i) =>
      this.tone({ freq, dur: i === 3 ? 0.9 : 0.34, type: 'sawtooth', gain: 0.13, delay: i * 0.26 }),
    );
  }

  startEngine() {
    if (!this.ctx || !this.sfxBus || this.engineNodes) return;
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    filter.Q.value = 5;
    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    oscA.type = 'sawtooth';
    oscB.type = 'square';
    oscA.frequency.value = 62;
    oscB.frequency.value = 93;
    const mixA = ctx.createGain();
    const mixB = ctx.createGain();
    mixA.gain.value = 0.65;
    mixB.gain.value = 0.35;
    oscA.connect(mixA).connect(filter);
    oscB.connect(mixB).connect(filter);
    filter.connect(gain).connect(this.sfxBus);
    oscA.start();
    oscB.start();
    this.engineNodes = { oscA, oscB, filter, gain };
  }

  updateEngine(ratio: number, throttle: boolean) {
    if (!this.ctx || !this.engineNodes) return;
    const t = this.ctx.currentTime;
    const r = Math.max(0, Math.min(1, ratio));
    const base = 52 + r * 165 + (throttle ? 14 : 0);
    this.engineNodes.oscA.frequency.setTargetAtTime(base, t, 0.08);
    this.engineNodes.oscB.frequency.setTargetAtTime(base * 1.5, t, 0.08);
    this.engineNodes.filter.frequency.setTargetAtTime(300 + r * 1500, t, 0.1);
    const level = this.settings.sfx ? (this.engineNodes.gain.gain.value === 0 ? 0.035 : 0.05) : 0;
    this.engineNodes.gain.gain.setTargetAtTime(level + r * 0.02, t, 0.12);
  }

  stopEngine() {
    const nodes = this.engineNodes;
    if (!nodes || !this.ctx) {
      this.engineNodes = null;
      return;
    }
    this.engineNodes = null;
    const t = this.ctx.currentTime;
    nodes.gain.gain.setTargetAtTime(0, t, 0.08);
    window.setTimeout(() => {
      try {
        nodes.oscA.stop();
        nodes.oscB.stop();
      } catch {
        /* already stopped */
      }
    }, 400);
  }

  startMusic() {
    this.init();
    if (!this.ctx || !this.musicBus || this.musicTimer || !this.settings.music) return;
    this.musicStep = 0;
    const roots = [110, 130.81, 98, 87.31];
    const pattern = [0, 7, 12, 7, 15, 12, 7, 3];
    const playStep = () => {
      if (!this.ctx || !this.musicBus || !this.settings.music) return;
      const step = this.musicStep++;
      const ctx = this.ctx;
      const t = ctx.currentTime + 0.02;
      const root = roots[Math.floor(step / 8) % roots.length];
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = step % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.value = root * Math.pow(2, pattern[step % 8] / 12);
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.16, t + 0.03);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      osc.connect(env).connect(this.musicBus);
      osc.start(t);
      osc.stop(t + 0.45);
      if (step % 8 === 0) {
        const bass = ctx.createOscillator();
        const bassEnv = ctx.createGain();
        bass.type = 'triangle';
        bass.frequency.value = root / 2;
        bassEnv.gain.setValueAtTime(0.0001, t);
        bassEnv.gain.exponentialRampToValueAtTime(0.11, t + 0.08);
        bassEnv.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
        bass.connect(bassEnv).connect(this.musicBus);
        bass.start(t);
        bass.stop(t + 1.7);
      }
    };
    playStep();
    this.musicTimer = setInterval(playStep, 260);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  stopAll() {
    this.stopEngine();
    this.stopMusic();
    if (this.ctx && this.settings.music) this.startMusic();
  }
}

export const audio = new GameAudio();
