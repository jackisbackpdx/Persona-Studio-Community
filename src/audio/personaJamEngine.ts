import { Persona, CharacterActionType, CharacterJamState } from '../types';
import { soundEngine } from './soundEngine';

export interface ActivePerformer {
  personaId: string;
  persona: Persona;
  instrument: string;
  actionType: CharacterActionType;
}

export interface JamSynergyProfile {
  title: string;
  genreFusion: string;
  description: string;
  bpm: number;
  musicalKey: string;
  scaleNotes: string[];
}

export class PersonaJamEngine {
  private static instance: PersonaJamEngine;
  private isEnabled: boolean = true;
  private volume: number = 0.55;
  private loopTimer: NodeJS.Timeout | null = null;
  private activePerformers: Map<string, ActivePerformer> = new Map();
  private currentStep: number = 0;
  private currentSynergy: JamSynergyProfile | null = null;
  private onStateChangeListeners: Array<(state: CharacterJamState | null) => void> = [];

  private constructor() {}

  public static getInstance(): PersonaJamEngine {
    if (!PersonaJamEngine.instance) {
      PersonaJamEngine.instance = new PersonaJamEngine();
    }
    return PersonaJamEngine.instance;
  }

  public subscribe(listener: (state: CharacterJamState | null) => void): () => void {
    this.onStateChangeListeners.push(listener);
    listener(this.getJamState());
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter((l) => l !== listener);
    };
  }

  public setMuted(muted: boolean) {
    this.isEnabled = !muted;
    if (muted && this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    } else if (!muted && this.activePerformers.size > 0 && !this.loopTimer) {
      this.startLoop();
    }
  }

  private notifyStateChange() {
    const state = this.getJamState();
    this.onStateChangeListeners.forEach((l) => l(state));
  }

  public getJamState(): CharacterJamState | null {
    if (this.activePerformers.size === 0) return null;

    const performersList = Array.from(this.activePerformers.values());
    const isCollab = performersList.length >= 2;

    const activePerformers = performersList.map((perf, index) => {
      let musicalRole: 'bass' | 'harmony' | 'melody' | 'percussion' | 'ambience' = 'harmony';
      if (perf.actionType === 'playing_acoustic_drums' || perf.actionType === 'playing_electronic_drums') {
        musicalRole = 'percussion';
      } else if (perf.actionType === 'playing_guitar') {
        musicalRole = index === 0 ? 'harmony' : 'melody';
      } else if (perf.persona.id === 'malik-johnson') {
        musicalRole = 'bass';
      } else if (perf.persona.id === 'jess-alpert') {
        musicalRole = 'melody';
      } else if (perf.persona.id === 'benji-park') {
        musicalRole = 'harmony';
      } else if (perf.persona.id === 'rowan-gable') {
        musicalRole = index === 0 ? 'harmony' : 'percussion';
      }

      return {
        personaId: perf.personaId,
        personaName: perf.persona.name,
        stageName: perf.persona.stageName,
        instrument: perf.instrument,
        actionType: perf.actionType,
        musicalRole,
      };
    });

    return {
      isCollaborative: isCollab,
      activePerformers,
      synergyTitle: this.currentSynergy?.title,
      genreFusion: this.currentSynergy?.genreFusion,
      bpm: this.currentSynergy?.bpm || 108,
      musicalKey: this.currentSynergy?.musicalKey || 'D Minor',
    };
  }

  public setPerformer(
    persona: Persona,
    actionType: CharacterActionType,
    instrumentName?: string
  ) {
    const isInstrumentAction = [
      'playing_synth',
      'playing_piano',
      'playing_guitar',
      'playing_acoustic_drums',
      'playing_electronic_drums',
      'recording_mic',
      'spinning_vinyl',
    ].includes(actionType);

    if (isInstrumentAction) {
      const resolvedInstrument =
        instrumentName ||
        (actionType === 'playing_guitar'
          ? 'Vintage Acoustic Guitar'
          : actionType === 'playing_piano'
          ? 'Craftsman Upright Piano'
          : actionType === 'playing_acoustic_drums'
          ? 'Ludwig Vintage Drum Kit'
          : actionType === 'playing_electronic_drums'
          ? 'Roland Electronic Drum / DJ Rig'
          : actionType === 'playing_synth'
          ? 'Analog Poly-Synth'
          : actionType === 'recording_mic'
          ? 'Studio Vocal Condenser'
          : 'Audiophile Turntable');

      this.activePerformers.set(persona.id, {
        personaId: persona.id,
        persona,
        instrument: resolvedInstrument,
        actionType,
      });
    } else {
      this.activePerformers.delete(persona.id);
    }

    this.recomputeSynergyAndLoop();
  }

  public removePerformer(personaId: string) {
    if (this.activePerformers.has(personaId)) {
      this.activePerformers.delete(personaId);
      this.recomputeSynergyAndLoop();
    }
  }

  public clearAllPerformers() {
    this.activePerformers.clear();
    this.stopLoop();
    this.notifyStateChange();
  }

  private recomputeSynergyAndLoop() {
    const count = this.activePerformers.size;
    if (count === 0) {
      this.stopLoop();
      this.currentSynergy = null;
      this.notifyStateChange();
      return;
    }

    const ids = Array.from(this.activePerformers.keys()).sort();

    if (count === 1) {
      const single = this.activePerformers.get(ids[0])!;
      this.currentSynergy = this.computeSoloProfile(single);
    } else {
      this.currentSynergy = this.computeCollaborativeProfile(ids);
    }

    this.startLoop();
    this.notifyStateChange();
  }

  private computeSoloProfile(perf: ActivePerformer): JamSynergyProfile {
    const id = perf.personaId;
    if (id === 'malik-johnson') {
      return {
        title: 'Drill Sub-Bass Architecture',
        genreFusion: 'Trap & Drill Bass Exploration',
        description: 'Syncopated 808 glides and punchy synth stabs in low register.',
        bpm: 130,
        musicalKey: 'F# Minor',
        scaleNotes: ['F#2', 'A2', 'C#3', 'E3', 'F#3'],
      };
    } else if (id === 'jess-alpert') {
      return {
        title: 'Topline Melodic Hook Riffs',
        genreFusion: 'Modern Pop & Neo-Soul',
        description: 'Vibrant harmonic vocal topline runs and bright chord inversions.',
        bpm: 112,
        musicalKey: 'G Major',
        scaleNotes: ['G3', 'B3', 'D4', 'E4', 'G4', 'B4'],
      };
    } else if (id === 'benji-park') {
      return {
        title: 'Cascading Foliage Fingerpicking',
        genreFusion: 'Organic Indie Folk',
        description: 'Warm open-tuning nylon guitar plucks and resonant wooden textures.',
        bpm: 88,
        musicalKey: 'D Major',
        scaleNotes: ['D3', 'F#3', 'A3', 'B3', 'D4', 'E4'],
      };
    } else {
      // Rowan Gable
      return {
        title: 'Geometric Frequency Matrices',
        genreFusion: 'Baroque Minimalist Glitch',
        description: 'Pure mathematical intervals, pristine sines, and phase-locked arpeggios.',
        bpm: 120,
        musicalKey: 'A Minor (Pure Dorian)',
        scaleNotes: ['A3', 'C4', 'E4', 'F#4', 'A4', 'B4'],
      };
    }
  }

  private computeCollaborativeProfile(personaIds: string[]): JamSynergyProfile {
    const hasMalik = personaIds.includes('malik-johnson');
    const hasJess = personaIds.includes('jess-alpert');
    const hasBenji = personaIds.includes('benji-park');
    const hasRowan = personaIds.includes('rowan-gable');

    if (hasMalik && hasJess && !hasBenji && !hasRowan) {
      return {
        title: 'Trap-Soul & Topline Anthem',
        genreFusion: 'Chicago Drill × Melodic Pop Soul',
        description: 'Malik anchors sub-harmonic 808 glides while Jess weaves emotive vocal toplines.',
        bpm: 124,
        musicalKey: 'D Minor',
        scaleNotes: ['D3', 'F3', 'G3', 'A3', 'C4', 'D4', 'F4'],
      };
    } else if (hasBenji && hasJess && !hasMalik && !hasRowan) {
      return {
        title: 'Warm Pine Acoustic Serenade',
        genreFusion: 'Organic Indie Folk-Pop Duet',
        description: 'Benji fingerpicks warm resonant chords while Jess harmonizes high lyrical hooks.',
        bpm: 96,
        musicalKey: 'G Major',
        scaleNotes: ['G3', 'B3', 'D4', 'E4', 'G4', 'A4'],
      };
    } else if (hasMalik && hasBenji && !hasJess && !hasRowan) {
      return {
        title: 'Organic Lofi Hip-Hop Session',
        genreFusion: 'Earthy Foley × Vinyl Boom-Bap',
        description: 'Benji provides wooden acoustic strums while Malik drops warm swing kicks and 808s.',
        bpm: 86,
        musicalKey: 'E Minor',
        scaleNotes: ['E2', 'G2', 'B2', 'D3', 'E3', 'G3'],
      };
    } else if (hasRowan && hasMalik && !hasJess && !hasBenji) {
      return {
        title: 'Spectral Cyber-Drill Architecture',
        genreFusion: 'Lossless Minimal Electronic × Industrial Sub',
        description: 'Rowan drives surgical clockwork arpeggios under Malik’s thunderous low-end pulses.',
        bpm: 132,
        musicalKey: 'F Minor',
        scaleNotes: ['F2', 'Ab2', 'C3', 'Eb3', 'F3', 'G3'],
      };
    } else if (hasRowan && hasBenji && !hasJess && !hasMalik) {
      return {
        title: 'Chamber Folk Synthesis',
        genreFusion: 'Neo-Classical Minimalist Folk',
        description: 'Pure tonal piano counterpoint meets tactile acoustic bronze string strums.',
        bpm: 90,
        musicalKey: 'D Dorian',
        scaleNotes: ['D3', 'E3', 'F3', 'A3', 'B3', 'D4'],
      };
    } else if (hasRowan && hasJess && !hasMalik && !hasBenji) {
      return {
        title: 'Polyphonic Vocal Architecture',
        genreFusion: 'Acapella Minimalist Choral Pop',
        description: 'Pristine harmonic stem layers supporting expressive, soaring pop toplines.',
        bpm: 110,
        musicalKey: 'C Major',
        scaleNotes: ['C3', 'E3', 'G3', 'B3', 'C4', 'D4', 'E4'],
      };
    } else {
      // 3 or 4 personas collaborating
      return {
        title: 'Commune Full Ensemble Session',
        genreFusion: 'Portland Craftsman Collaborative Jam',
        description: 'A multi-layered synergistic fusion uniting rhythm, acoustic strings, modular synths, and vocal toplines.',
        bpm: 116,
        musicalKey: 'D Minor',
        scaleNotes: ['D3', 'F3', 'G3', 'A3', 'C4', 'D4', 'E4', 'F4'],
      };
    }
  }

  private startLoop() {
    this.stopLoop();
    if (!this.isEnabled) return;

    const bpm = this.currentSynergy?.bpm || 110;
    // 16th note step duration in ms
    const stepIntervalMs = (60 / bpm / 4) * 1000;

    this.currentStep = 0;
    this.loopTimer = setInterval(() => {
      this.executeMusicalStep();
      this.currentStep = (this.currentStep + 1) % 16;
    }, stepIntervalMs);
  }

  private stopLoop() {
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopLoop();
    } else if (this.activePerformers.size > 0) {
      this.startLoop();
    }
    this.notifyStateChange();
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  private executeMusicalStep() {
    if (!this.isEnabled || this.activePerformers.size === 0) return;
    soundEngine.init();

    const step = this.currentStep;
    const isCollab = this.activePerformers.size >= 2;
    const vol = this.volume;

    this.activePerformers.forEach((perf) => {
      const id = perf.personaId;
      const action = perf.actionType;

      // 1. Direct Instrument Action Handling for Drums & Guitar
      if (action === 'playing_acoustic_drums') {
        // Authentic Ludwig acoustic drum kit groove
        if (step === 0 || step === 8 || step === 10) {
          soundEngine.playAcousticKick(vol * 0.7);
        }
        if (step === 4 || step === 12) {
          soundEngine.playAcousticSnare(step === 12, vol * 0.65);
        }
        if (step % 2 === 0) {
          soundEngine.playAcousticHiHat(step === 10, vol * 0.45);
        }
        if (step === 14) {
          soundEngine.playAcousticTom('mid', vol * 0.5);
        }
        if (step === 0 && Math.random() < 0.25) {
          soundEngine.playAcousticCymbal('crash', vol * 0.4);
        }
        return;
      }

      if (action === 'playing_electronic_drums') {
        // Electronic 808/909 DJ drum rig
        if (step === 0 || step === 10) {
          soundEngine.playElectronicKick(false, vol * 0.75);
        }
        if (step === 6) {
          soundEngine.playElectronicKick(true, vol * 0.6);
        }
        if (step === 4 || step === 12) {
          soundEngine.playElectronicSnare(vol * 0.65);
          if (step === 4) soundEngine.playElectronicPercussion('cowbell', vol * 0.35);
        }
        if (step % 2 === 0 || (step >= 12 && Math.random() < 0.7)) {
          soundEngine.playElectronicHiHat(step >= 12, vol * 0.4);
        }
        if (step === 14) {
          soundEngine.playElectronicPercussion('zap', vol * 0.35);
        }
        return;
      }

      if (action === 'playing_guitar') {
        if (step === 0 || step === 8) {
          soundEngine.playGuitarChord(
            step === 0 ? ['D3', 'A3', 'D4', 'F4'] : ['G2', 'D3', 'G3', 'B3'],
            vol * 0.5
          );
        }
        if (step === 2 || step === 6 || step === 10 || step === 14) {
          soundEngine.playGuitarFingerpick(['A3', 'C4', 'E4'], vol * 0.35);
        }
        return;
      }

      if (id === 'malik-johnson') {
        // Malik: Rhythmic Bass & Drums & Dark Synths
        if (step === 0 || step === 10) {
          // 808 kick punch
          soundEngine.play808(step === 0 ? 'D2' : 'C2', 0.45, true, vol * 0.7);
        }
        if (step === 4 || step === 12) {
          // Snare/Clap
          soundEngine.playDrum('clap', vol * 0.5);
        }
        if (step % 2 === 0 || (step >= 12 && step % 1 === 0)) {
          // Trap hihat rolls
          soundEngine.playDrum('hihat', vol * 0.35);
        }
        if ((step === 2 || step === 8) && action === 'playing_synth') {
          soundEngine.playSynth('F3', 0.25, 'sawtooth', vol * 0.3);
        }
      } else if (id === 'jess-alpert') {
        // Jess: Soulful Topline Chops & Lush Chords
        if (step === 0) {
          // Main harmonic chord pad
          if (isCollab) {
            soundEngine.playPianoChord(['D4', 'F4', 'A4', 'C5'], vol * 0.4);
          } else {
            soundEngine.playSynth('G4', 0.5, 'sine', vol * 0.4);
          }
        }
        if (step === 6 || step === 14) {
          // Topline vocal melody
          const notes = ['A4', 'C5', 'D5', 'F5'];
          const note = notes[Math.floor(Math.random() * notes.length)];
          soundEngine.playTopline(note, vol * 0.45);
        }
      } else if (id === 'benji-park') {
        // Benji: Fingerpicked Acoustic Guitar & Wooden Foley
        if (step === 0 || step === 8) {
          // Guitar strum
          soundEngine.playGuitarChord(
            step === 0 ? ['D3', 'A3', 'D4', 'F4'] : ['C3', 'G3', 'C4', 'E4'],
            vol * 0.45
          );
        }
        if (step === 2 || step === 6 || step === 10 || step === 14) {
          // Delicate fingerpicking note
          soundEngine.playSynth('A3', 0.15, 'triangle', vol * 0.3);
        }
        if (step === 4 || step === 12) {
          // Wood tap foley
          soundEngine.playFoley('crunch', vol * 0.25);
        }
      } else if (id === 'rowan-gable') {
        // Rowan: Geometric Pure Arpeggios & Clockwork Precision
        if (step % 4 === 0) {
          // Clean fundamental sine chord
          soundEngine.playPianoChord(['D3', 'A3', 'E4'], vol * 0.35);
        }
        if (step % 2 === 1) {
          // Crystalline arpeggio note
          const arps = ['D4', 'E4', 'F4', 'A4', 'C5', 'D5'];
          const arpNote = arps[(step * 2) % arps.length];
          soundEngine.playSynth(arpNote, 0.18, 'sine', vol * 0.3);
        }
      }
    });
  }
}

export const personaJamEngine = PersonaJamEngine.getInstance();
