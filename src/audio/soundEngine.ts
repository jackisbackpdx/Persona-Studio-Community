/**
 * Web Audio API Sound Engine & Synth Matrix
 * Provides real-time polyphonic synthesis, 808 sub-bass with slides,
 * acoustic drum synthesis, procedural foley texture synthesis,
 * multitrack mixer, and WAV export capabilities.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private isInitialized = false;

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

      this.masterFilter = this.ctx.createBiquadFilter();
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.setValueAtTime(20000, this.ctx.currentTime);

      this.masterGain.connect(this.masterFilter);
      this.masterFilter.connect(this.ctx.destination);
      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  private ensureContext(): AudioContext | null {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Convert note name (e.g. "C4", "A#3") to frequency
  public noteToFreq(note: string): number {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const match = note.match(/^([A-Ga-g]#?)(-?\d+)$/);
    if (!match) return 440;
    const noteName = match[1].toUpperCase();
    const octave = parseInt(match[2], 10);
    const semitone = notes.indexOf(noteName);
    if (semitone === -1) return 440;
    // MIDI note: (octave + 1) * 12 + semitone
    const midi = (octave + 1) * 12 + semitone;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Play Polyphonic Synth Note
  public playSynth(note: string = 'C4', duration = 0.4, type: OscillatorType = 'sawtooth', volume = 0.3) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const freq = this.noteToFreq(note);
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 1.003, now); // subtle detune warmth

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 3.5, now);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.2, now + duration);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  }

  // Play 808 Sub-bass with signature pitch slide
  public play808(note: string = 'C2', duration = 0.8, slide = true, volume = 0.5) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const targetFreq = this.noteToFreq(note);
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const waveshaper = ctx.createWaveShaper();

    // Subtle saturation curve
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    const k = 15;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    waveshaper.curve = curve;
    waveshaper.oversample = '2x';

    osc.type = 'sine';
    // Drill punch pitch envelope: starts high then drops to target frequency
    osc.frequency.setValueAtTime(targetFreq * 2.8, now);
    osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.06);

    if (slide) {
      // 808 slide bend up or down
      osc.frequency.setValueAtTime(targetFreq, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(targetFreq * 1.334, now + duration * 0.7);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(waveshaper);
    waveshaper.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  // Play Drum Elements: Kick, Snare, Hi-hat, Clap
  public playDrum(drumType: 'kick' | 'snare' | 'hihat' | 'clap', volume = 0.4) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    if (drumType === 'kick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.12);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.35);
    } else if (drumType === 'snare') {
      // Tone part
      const osc = ctx.createOscillator();
      const toneGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      toneGain.gain.setValueAtTime(volume * 0.7, now);
      toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(toneGain);
      toneGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.16);

      // Noise burst
      this.playNoiseBurst(0.18, volume * 0.6, 1200, 'bandpass');
    } else if (drumType === 'hihat') {
      this.playNoiseBurst(0.05, volume * 0.5, 7500, 'highpass');
    } else if (drumType === 'clap') {
      // Multi-tap noise envelope
      [0, 0.012, 0.024].forEach((offset) => {
        setTimeout(() => {
          this.playNoiseBurst(0.14, volume * 0.5, 1800, 'bandpass');
        }, offset * 1000);
      });
    }
  }

  // ==================== AUTHENTIC ACOUSTIC DRUM KIT VOICES ====================
  public playAcousticKick(volume = 0.48) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    // Resonant wooden kick body
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.09);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);

    // Beater click
    this.playNoiseBurst(0.025, volume * 0.35, 3200, 'bandpass');

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  public playAcousticSnare(rimshot = false, volume = 0.42) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    // Snare shell fundamental tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(rimshot ? 260 : 195, now);
    osc.frequency.exponentialRampToValueAtTime(115, now + 0.07);

    gain.gain.setValueAtTime(volume * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.22);

    // Bottom snare wires resonance
    this.playNoiseBurst(rimshot ? 0.24 : 0.18, volume * 0.65, 3400, 'highpass');
  }

  public playAcousticHiHat(open = false, volume = 0.35) {
    const dur = open ? 0.35 : 0.045;
    this.playNoiseBurst(dur, volume, 8200, 'highpass');
  }

  public playAcousticTom(pitch: 'high' | 'mid' | 'floor' = 'mid', volume = 0.4) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    const baseFreq = pitch === 'high' ? 180 : pitch === 'mid' ? 130 : 90;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.65, now + 0.28);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  public playAcousticCymbal(type: 'crash' | 'ride' = 'ride', volume = 0.35) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    if (type === 'crash') {
      this.playNoiseBurst(0.85, volume * 0.75, 4500, 'highpass');
      this.playSynth('G5', 0.6, 'sine', volume * 0.15);
    } else {
      // Ride ping with bell overtone
      this.playNoiseBurst(0.45, volume * 0.5, 6800, 'highpass');
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2450, now);
      gain.gain.setValueAtTime(volume * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.42);
    }
  }

  // ==================== ELECTRONIC DRUM / DJ SET VOICES ====================
  public playElectronicKick(punchy = false, volume = 0.5) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(punchy ? 175 : 220, now);
    osc.frequency.exponentialRampToValueAtTime(punchy ? 48 : 34, now + (punchy ? 0.12 : 0.28));

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (punchy ? 0.35 : 0.75));

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + (punchy ? 0.38 : 0.8));
  }

  public playElectronicSnare(volume = 0.42) {
    // 808/909 synth snare with snappy punch
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);

    gain.gain.setValueAtTime(volume * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.14);

    this.playNoiseBurst(0.16, volume * 0.7, 2400, 'bandpass');
  }

  public playElectronicHiHat(rolling = false, volume = 0.32) {
    if (rolling) {
      [0, 35, 70, 105].forEach((ms, i) => {
        setTimeout(() => {
          this.playNoiseBurst(0.035, volume * (0.5 + i * 0.15), 9000, 'highpass');
        }, ms);
      });
    } else {
      this.playNoiseBurst(0.035, volume, 8800, 'highpass');
    }
  }

  public playElectronicPercussion(sound: 'zap' | 'cowbell' | 'rim' | 'glitch' = 'zap', volume = 0.35) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    if (sound === 'cowbell') {
      // Dual resonant square waves
      [587, 845].forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(volume * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now);
        osc.stop(now + 0.2);
      });
    } else if (sound === 'zap') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
      gain.gain.setValueAtTime(volume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } else {
      this.playNoiseBurst(0.03, volume * 0.6, 4000, 'bandpass');
    }
  }

  // ==================== EXPANDED GUITAR VOICES ====================
  // Fingerpicked acoustic bronze strings
  public playGuitarFingerpick(notes: string[] = ['E3', 'G3', 'B3', 'E4'], volume = 0.32) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    notes.forEach((note, idx) => {
      setTimeout(() => {
        const freq = this.noteToFreq(note);
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 3.8, now);
        filter.frequency.exponentialRampToValueAtTime(freq * 1.2, now + 0.7);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

        osc.connect(filter);
        filter.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.8);
      }, idx * 110);
    });
  }

  // Electric clean chorus guitar
  public playGuitarElectricClean(notes: string[] = ['A3', 'C4', 'E4', 'A4'], volume = 0.32) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    notes.forEach((note, idx) => {
      setTimeout(() => {
        const freq = this.noteToFreq(note);
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, now);
        // Chorus detune
        osc2.frequency.setValueAtTime(freq * 1.004, now);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freq * 2.2, now);
        filter.Q.setValueAtTime(1.8, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(volume * 0.45, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.15);
        osc2.stop(now + 1.15);
      }, idx * 24);
    });
  }

  // Expressive Lead Guitar Lick with Vibrato
  public playGuitarLead(notes: string[] = ['E4', 'G4', 'A4', 'B4', 'D5'], volume = 0.35) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    notes.forEach((note, idx) => {
      setTimeout(() => {
        const freq = this.noteToFreq(note);
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        // Subtle pitch bend / vibrato
        osc.frequency.linearRampToValueAtTime(freq * 1.03, now + 0.22);
        osc.frequency.linearRampToValueAtTime(freq, now + 0.35);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 4.0, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now);
        osc.stop(now + 0.55);
      }, idx * 160);
    });
  }

  // Procedural Noise Generator for Foley & Drums
  private playNoiseBurst(duration: number, volume: number, filterFreq: number, filterType: BiquadFilterType) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + duration + 0.02);
  }

  // Foley Textures (Whisper, Crunch, Metal Key, Vinyl Crackle)
  public playFoley(texture: 'whisper' | 'crunch' | 'keys' | 'vinyl', volume = 0.35) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    if (texture === 'whisper') {
      // Soft breathing bandpass sweep
      this.playNoiseBurst(0.6, volume * 0.4, 2400, 'bandpass');
    } else if (texture === 'crunch') {
      // Broken gravel / vegetable crush
      this.playNoiseBurst(0.2, volume * 0.8, 800, 'lowpass');
      this.playSynth('G2', 0.15, 'triangle', volume * 0.4);
    } else if (texture === 'keys') {
      // Metallic resonant bell
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc2.type = 'sine';
      osc.frequency.setValueAtTime(2850, now);
      osc2.frequency.setValueAtTime(4120, now);

      gain.gain.setValueAtTime(volume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } else if (texture === 'vinyl') {
      this.playNoiseBurst(0.08, volume * 0.3, 4000, 'highpass');
    }
  }

  // Play Acoustic Guitar Pluck / Strum (warm nylon/bronze string emulation)
  public playGuitarChord(chord: string[] = ['E3', 'B3', 'E4', 'G#4', 'B4'], volume = 0.35) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    chord.forEach((note, idx) => {
      setTimeout(() => {
        const freq = this.noteToFreq(note);
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 4.5, now);
        filter.frequency.exponentialRampToValueAtTime(freq * 0.9, now + 0.8);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(volume * (0.8 + Math.random() * 0.4), now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

        osc.connect(filter);
        filter.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.95);
      }, idx * 28); // Strum delay across strings
    });
  }

  // Play Rich Upright Acoustic Piano Chord
  public playPianoChord(notes: string[] = ['C3', 'G3', 'C4', 'E4'], volume = 0.32) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    notes.forEach((note) => {
      const freq = this.noteToFreq(note);
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 2, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 5.0, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 1.2);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.25);
      osc2.stop(now + 1.25);
    });
  }

  // Play Fireplace Ember crackle
  public playFireplaceEmber(volume = 0.3) {
    this.playNoiseBurst(0.04, volume * 0.6, 3200, 'bandpass');
    setTimeout(() => {
      this.playNoiseBurst(0.03, volume * 0.4, 4800, 'highpass');
    }, 45);
  }

  // Play Ceramic Tea/Coffee Mug Clink
  public playTeaClink(volume = 0.25) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(3200, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  // Dispatch Action Sound based on persona interaction
  public playActionSound(
    soundType?:
      | 'synth_chord'
      | 'vinyl_spin'
      | 'fire_ember'
      | 'guitar_strum'
      | 'guitar_solo'
      | 'piano_note'
      | 'drum_acoustic_beat'
      | 'drum_electronic_beat'
      | 'tea_sip'
      | 'mic_tap'
      | 'none'
  ) {
    if (!soundType || soundType === 'none') return;
    this.init();
    switch (soundType) {
      case 'synth_chord':
        this.playSynth('D4', 0.45, 'sawtooth', 0.22);
        setTimeout(() => this.playSynth('F#4', 0.45, 'triangle', 0.2), 60);
        setTimeout(() => this.playSynth('A4', 0.5, 'sine', 0.22), 120);
        break;
      case 'vinyl_spin':
        this.playFoley('vinyl', 0.4);
        setTimeout(() => this.playNoiseBurst(0.12, 0.2, 2800, 'bandpass'), 80);
        break;
      case 'fire_ember':
        this.playFireplaceEmber(0.35);
        break;
      case 'guitar_strum':
        this.playGuitarChord(['A2', 'E3', 'A3', 'C#4', 'E4'], 0.35);
        break;
      case 'guitar_solo':
        this.playGuitarLead(['E4', 'G4', 'A4', 'C5', 'D5'], 0.32);
        break;
      case 'piano_note':
        this.playPianoChord(['F3', 'A3', 'C4', 'E4'], 0.28);
        break;
      case 'drum_acoustic_beat':
        // Groove: Kick on 1, Snare on 2, Hi-hats ticking, Tom fill
        this.playAcousticKick(0.5);
        this.playAcousticHiHat(false, 0.35);
        setTimeout(() => this.playAcousticHiHat(false, 0.32), 140);
        setTimeout(() => {
          this.playAcousticSnare(false, 0.44);
          this.playAcousticHiHat(true, 0.3);
        }, 280);
        setTimeout(() => this.playAcousticHiHat(false, 0.32), 420);
        setTimeout(() => {
          this.playAcousticKick(0.46);
          this.playAcousticTom('mid', 0.38);
        }, 560);
        setTimeout(() => {
          this.playAcousticSnare(true, 0.48);
          this.playAcousticCymbal('crash', 0.36);
        }, 840);
        break;
      case 'drum_electronic_beat':
        // Trap/Electronic 808 beat with snappy claps and rolling hats
        this.playElectronicKick(false, 0.55);
        this.playElectronicHiHat(true, 0.3);
        setTimeout(() => this.playElectronicPercussion('cowbell', 0.3), 140);
        setTimeout(() => {
          this.playElectronicSnare(0.45);
          this.playElectronicPercussion('zap', 0.25);
        }, 280);
        setTimeout(() => this.playElectronicHiHat(true, 0.32), 420);
        setTimeout(() => this.playElectronicKick(true, 0.5), 560);
        setTimeout(() => this.playElectronicSnare(0.48), 840);
        break;
      case 'tea_sip':
        this.playTeaClink(0.22);
        break;
      case 'mic_tap':
        this.playFoley('whisper', 0.3);
        break;
    }
  }

  // Vocal Chop / Topline Synth
  public playTopline(note: string = 'E4', volume = 0.35) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const freq = this.noteToFreq(note);
    const now = ctx.currentTime;

    // Formant-like filter combination for singing voice feel
    const osc = ctx.createOscillator();
    const formantFilter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    // Formant peak near 1000Hz (vowel "ah")
    formantFilter.type = 'bandpass';
    formantFilter.frequency.setValueAtTime(1050, now);
    formantFilter.Q.setValueAtTime(4.5, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(formantFilter);
    formantFilter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Set Master Volume
  public setMasterVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  // Offline Render and Export to WAV
  public async exportProjectToWav(
    tracks: Array<{
      type: 'synth' | '808' | 'drums' | 'foley' | 'topline';
      steps: boolean[];
      notes: string[];
      volume: number;
      isMuted: boolean;
    }>,
    bpm = 120,
    loops = 4
  ): Promise<Blob> {
    const stepDuration = 60 / bpm / 4; // 16th notes
    const patternDuration = stepDuration * 16;
    const totalDuration = patternDuration * loops;
    const sampleRate = 44100;

    const offlineCtx = new OfflineAudioContext(2, Math.ceil(totalDuration * sampleRate), sampleRate);
    const master = offlineCtx.createGain();
    master.gain.setValueAtTime(0.8, 0);
    master.connect(offlineCtx.destination);

    for (let loop = 0; loop < loops; loop++) {
      const loopOffset = loop * patternDuration;

      for (const track of tracks) {
        if (track.isMuted) continue;

        for (let step = 0; step < 16; step++) {
          if (!track.steps[step]) continue;
          const time = loopOffset + step * stepDuration;
          const note = track.notes[step] || 'C4';
          const vol = track.volume;

          if (track.type === 'synth') {
            const osc = offlineCtx.createOscillator();
            const gain = offlineCtx.createGain();
            osc.type = 'sawtooth';
            const f = this.noteToFreq(note);
            osc.frequency.setValueAtTime(f, time);
            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(vol * 0.3, time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + stepDuration * 1.8);
            osc.connect(gain);
            gain.connect(master);
            osc.start(time);
            osc.stop(time + stepDuration * 2);
          } else if (track.type === '808') {
            const osc = offlineCtx.createOscillator();
            const gain = offlineCtx.createGain();
            osc.type = 'sine';
            const f = this.noteToFreq(note);
            osc.frequency.setValueAtTime(f * 2.5, time);
            osc.frequency.exponentialRampToValueAtTime(f, time + 0.05);
            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(vol * 0.5, time + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + stepDuration * 3);
            osc.connect(gain);
            gain.connect(master);
            osc.start(time);
            osc.stop(time + stepDuration * 3.2);
          } else if (track.type === 'drums') {
            // Kick or snare depending on step
            const osc = offlineCtx.createOscillator();
            const gain = offlineCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(140, time);
            osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
            gain.gain.setValueAtTime(vol * 0.4, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
            osc.connect(gain);
            gain.connect(master);
            osc.start(time);
            osc.stop(time + 0.3);
          } else if (track.type === 'topline') {
            const osc = offlineCtx.createOscillator();
            const gain = offlineCtx.createGain();
            osc.type = 'sine';
            const f = this.noteToFreq(note);
            osc.frequency.setValueAtTime(f, time);
            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(vol * 0.35, time + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + stepDuration * 1.5);
            osc.connect(gain);
            gain.connect(master);
            osc.start(time);
            osc.stop(time + stepDuration * 1.8);
          } else if (track.type === 'foley') {
            const osc = offlineCtx.createOscillator();
            const gain = offlineCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(2400, time);
            gain.gain.setValueAtTime(vol * 0.25, time);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);
            osc.connect(gain);
            gain.connect(master);
            osc.start(time);
            osc.stop(time + 0.2);
          }
        }
      }
    }

    const renderedBuffer = await offlineCtx.startRendering();
    return this.bufferToWave(renderedBuffer, renderedBuffer.length);
  }

  // Helper: Convert AudioBuffer to WAV Blob
  private bufferToWave(abuffer: AudioBuffer, len: number): Blob {
    const numOfChan = abuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    const channels: Float32Array[] = [];
    let sample = 0;
    let offset = 0;
    let pos = 0;

    // write WAVE header
    const setUint16 = (data: number) => {
      out.setUint16(pos, data, true);
      pos += 2;
    };
    const setUint32 = (data: number) => {
      out.setUint32(pos, data, true);
      pos += 4;
    };

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit precision

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    for (let i = 0; i < abuffer.numberOfChannels; i++) {
      channels.push(abuffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
        out.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([out.buffer], { type: 'audio/wav' });
  }

  // Thunder rumble for Thunderstorm weather
  public playThunderRumble(volume = 0.5) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    // Deep low sub pulse
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.exponentialRampToValueAtTime(24, now + 2.2);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(42, now);
    osc2.frequency.exponentialRampToValueAtTime(18, now + 3.0);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 2.5);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume * 0.7, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 3.3);
    osc2.stop(now + 3.3);

    // Filtered noise crackle
    this.playNoiseBurst(1.8, volume * 0.45, 380, 'lowpass');
  }

  // Car pass-by doppler swoosh
  public playCarPassBy(volume = 0.25) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    // Doppler pitch shift
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(190, now + 0.6);
    osc.frequency.exponentialRampToValueAtTime(110, now + 1.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 1.8);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 2.0);

    // Tire tread road hiss
    this.playNoiseBurst(1.4, volume * 0.25, 600, 'bandpass');
  }
}

export const soundEngine = new SoundEngine();
