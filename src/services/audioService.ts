class AudioService {
  private ctx: AudioContext | null = null;
  // Start silent so audio never begins unexpectedly; the player can enable it.
  private isMuted: boolean = true;
  private masterGain: GainNode | null = null;
  private music: HTMLAudioElement | null = null;
  private samples = new Map<string, AudioBuffer>();
  private lastSampleTime = new Map<string, number>();
  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.45, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.startBackgroundMusic();
      void this.loadSamples();
      if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {});
      this.isInitialized = true;
    } catch {
      // AudioContext unavailable or blocked
    }
  }

  private startBackgroundMusic() {
    if (!this.ctx || !this.masterGain) return;
    // Stream the ten-minute track rather than decoding it into a large AudioBuffer.
    this.music = new Audio(`${import.meta.env.BASE_URL}assets/audio/space-ambient-osmic.mp3`);
    this.music.loop = true;
    this.music.preload = 'none';
    const musicGain = this.ctx.createGain();
    musicGain.gain.value = 0.55;
    this.ctx.createMediaElementSource(this.music).connect(musicGain);
    musicGain.connect(this.masterGain);
    if (!this.isMuted) void this.music.play().catch(() => {});
  }

  private async loadSamples() {
    const ctx = this.ctx;
    if (!ctx) return;
    await Promise.all(['card-flip', 'choice-confirm', 'starlight', 'footstep-1', 'footstep-2'].map(async (name) => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}assets/audio/${name}.ogg`);
        if (!response.ok) return;
        this.samples.set(name, await ctx.decodeAudioData(await response.arrayBuffer()));
      } catch {
        // The existing synthesized cue remains available if a sample cannot load.
      }
    }));
  }

  private playSample(name: string, volume: number, rate = 1): boolean {
    if (this.isMuted || !this.ctx || !this.masterGain) return false;
    const buffer = this.samples.get(name);
    if (!buffer) return false;
    const now = this.ctx.currentTime;
    // Avoid stacked copies when a scene and its overlay report the same event.
    if (now - (this.lastSampleTime.get(name) ?? -Infinity) < 0.1) return true;
    this.lastSampleTime.set(name, now);
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(this.masterGain);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    source.start();
    return true;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.init();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.45, this.ctx.currentTime, 0.05);
    }
    if (this.isMuted) {
      this.music?.pause();
    } else {
      void this.music?.play().catch(() => {});
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playHoverChime() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freqs = [880, 1046.5, 1174.66, 1318.51, 1567.98]; // A5 pentatonic
      const freq = freqs[Math.floor(Math.random() * freqs.length)];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {
      // ignore
    }
  }

  public playChoiceConfirm() {
    if (this.playSample('choice-confirm', 0.22, 0.85)) return;
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const chords = [440, 554.37, 659.25, 880]; // A major celestial chord

      chords.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.06, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 1.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 1.25);
      });
    } catch {
      // ignore
    }
  }

  public playHoofStep(isHorse: boolean = false) {
    if (this.playSample(Math.random() > 0.5 ? 'footstep-1' : 'footstep-2', isHorse ? 0.16 : 0.1, isHorse ? 0.8 : 1)) return;
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // Low muted thud
      const baseFreq = isHorse ? 95 : 120;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

      gain.gain.setValueAtTime(isHorse ? 0.035 : 0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // ignore
    }
  }

  public playStarlightChime() {
    if (this.playSample('starlight', 0.18, 0.85)) return;
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.28); // E6

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.46);
    } catch {
      // ignore
    }
  }

  public playCrimsonResonance() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [329.63, 493.88, 659.25]; // E major cosmic triad
      freqs.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.03);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.6);

        gain.gain.setValueAtTime(0.05, now + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.03 + 0.85);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.03);
        osc.stop(now + idx * 0.03 + 0.9);
      });
    } catch {
      // ignore
    }
  }

  public playCrimsonDrop() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.4);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.46);
    } catch {
      // ignore
    }
  }

  public playWindWhisper() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(190, now + 1.5);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 2.3);
    } catch {
      // ignore
    }
  }

  public playTarotDraw() {
    if (this.playSample('card-flip', 0.25, 0.8)) return;
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      // Shimmering mystical harp sweep
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.04, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.6);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.65);
      });
    } catch {
      // ignore
    }
  }

  public playTarotFlip() {
    if (this.playSample('card-flip', 0.3)) return;
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);

      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch {
      // ignore
    }
  }
}

export const audioService = new AudioService();
