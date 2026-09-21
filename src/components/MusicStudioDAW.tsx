import React, { useState, useEffect, useRef } from 'react';
import { DAWProject, DAWTrack, Persona } from '../types';
import { soundEngine } from '../audio/soundEngine';
import {
  Play,
  Square,
  Volume2,
  Download,
  Sparkles,
  RefreshCw,
  Plus,
  Sliders,
  Radio,
  Music2,
  Trash2,
  FileCode,
  X,
} from 'lucide-react';

interface MusicStudioDAWProps {
  personas: Persona[];
  onClose?: () => void;
  onPersonaContributed?: (personaName: string, trackName: string) => void;
}

const DEFAULT_PROJECT: DAWProject = {
  title: 'Commune Jam Session #1',
  bpm: 128,
  swing: 0,
  tracks: [
    {
      id: 'track-topline',
      name: 'Jess - Topline Vocal Chops',
      type: 'topline',
      color: '#e11d48',
      volume: 0.8,
      pan: 0,
      isMuted: false,
      isSolo: false,
      steps: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, true, false],
      notes: ['E4', 'G4', 'A4', 'B4', 'E4', 'G4', 'A4', 'B4', 'E4', 'G4', 'A4', 'B4', 'E4', 'G4', 'A4', 'B4'],
    },
    {
      id: 'track-synth',
      name: 'Dave - Cinematic Synth Chords',
      type: 'synth',
      color: '#0284c7',
      volume: 0.75,
      pan: -0.2,
      isMuted: false,
      isSolo: false,
      steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      notes: ['C4', 'C4', 'C4', 'C4', 'G3', 'G3', 'G3', 'G3', 'A#3', 'A#3', 'A#3', 'A#3', 'F3', 'F3', 'F3', 'F3'],
    },
    {
      id: 'track-808',
      name: 'Malik - Sliding 808 Sub',
      type: '808',
      color: '#a855f7',
      volume: 0.85,
      pan: 0,
      isMuted: false,
      isSolo: false,
      steps: [true, false, false, false, false, false, true, false, false, true, false, false, false, false, true, false],
      notes: ['C2', 'C2', 'C2', 'C2', 'C2', 'C2', 'D#2', 'D#2', 'D#2', 'G1', 'G1', 'G1', 'G1', 'G1', 'A#1', 'A#1'],
    },
    {
      id: 'track-drums',
      name: 'Ty - Drum Pocket & Claps',
      type: 'drums',
      color: '#ea580c',
      volume: 0.8,
      pan: 0.1,
      isMuted: false,
      isSolo: false,
      steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      notes: ['kick', 'hihat', 'kick', 'snare', 'kick', 'hihat', 'kick', 'clap', 'kick', 'hihat', 'kick', 'snare', 'kick', 'hihat', 'kick', 'clap'],
    },
    {
      id: 'track-foley',
      name: 'Benji & Lily - Foley Micro-Resonance',
      type: 'foley',
      color: '#10b981',
      volume: 0.65,
      pan: 0.3,
      isMuted: false,
      isSolo: false,
      steps: [false, false, true, false, false, false, false, true, false, false, true, false, false, false, false, true],
      notes: ['crunch', 'whisper', 'keys', 'vinyl', 'crunch', 'whisper', 'keys', 'vinyl', 'crunch', 'whisper', 'keys', 'vinyl', 'crunch', 'whisper', 'keys', 'vinyl'],
    },
  ],
};

const PIANO_KEYS = [
  { note: 'C3', isBlack: false },
  { note: 'C#3', isBlack: true },
  { note: 'D3', isBlack: false },
  { note: 'D#3', isBlack: true },
  { note: 'E3', isBlack: false },
  { note: 'F3', isBlack: false },
  { note: 'F#3', isBlack: true },
  { note: 'G3', isBlack: false },
  { note: 'G#3', isBlack: true },
  { note: 'A3', isBlack: false },
  { note: 'A#3', isBlack: true },
  { note: 'B3', isBlack: false },
  { note: 'C4', isBlack: false },
  { note: 'C#4', isBlack: true },
  { note: 'D4', isBlack: false },
  { note: 'D#4', isBlack: true },
  { note: 'E4', isBlack: false },
  { note: 'F4', isBlack: false },
  { note: 'G4', isBlack: false },
  { note: 'A4', isBlack: false },
  { note: 'B4', isBlack: false },
  { note: 'C5', isBlack: false },
];

export const MusicStudioDAW: React.FC<MusicStudioDAWProps> = ({ personas, onClose, onPersonaContributed }) => {
  const [project, setProject] = useState<DAWProject>(DEFAULT_PROJECT);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(personas[0]?.id || '');
  const [isGeneratingTrack, setIsGeneratingTrack] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'sequencer' | 'keyboard' | 'drumpads' | 'foley'>('sequencer');
  const [lastAIThought, setLastAIThought] = useState<string | null>(null);

  const stepTimerRef = useRef<number | null>(null);

  // Sequencer Playback Loop
  useEffect(() => {
    if (!isPlaying) {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      return;
    }

    soundEngine.init();
    const stepIntervalMs = (60 / project.bpm / 4) * 1000;

    stepTimerRef.current = window.setInterval(() => {
      setCurrentStep((prev) => {
        const next = (prev + 1) % 16;

        // Trigger notes for this step across all unmuted tracks
        const hasSolo = project.tracks.some((t) => t.isSolo);

        project.tracks.forEach((track) => {
          if (track.isMuted) return;
          if (hasSolo && !track.isSolo) return;
          if (!track.steps[next]) return;

          const note = track.notes[next] || 'C4';
          const vol = track.volume;

          if (track.type === 'synth') {
            soundEngine.playSynth(note, 0.25, 'sawtooth', vol * 0.4);
          } else if (track.type === '808') {
            soundEngine.play808(note, 0.6, true, vol * 0.6);
          } else if (track.type === 'topline') {
            soundEngine.playTopline(note, vol * 0.45);
          } else if (track.type === 'drums') {
            if (note === 'kick' || note === 'snare' || note === 'hihat' || note === 'clap') {
              soundEngine.playDrum(note, vol * 0.5);
            } else {
              soundEngine.playDrum(next % 4 === 0 ? 'kick' : next % 4 === 2 ? 'snare' : 'hihat', vol * 0.5);
            }
          } else if (track.type === 'foley') {
            if (note === 'whisper' || note === 'crunch' || note === 'keys' || note === 'vinyl') {
              soundEngine.playFoley(note, vol * 0.4);
            } else {
              soundEngine.playFoley(next % 2 === 0 ? 'crunch' : 'keys', vol * 0.4);
            }
          }
        });

        return next;
      });
    }, stepIntervalMs);

    return () => {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, [isPlaying, project]);

  const toggleStep = (trackId: string, stepIndex: number) => {
    soundEngine.init();
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => {
        if (t.id !== trackId) return t;
        const newSteps = [...t.steps];
        newSteps[stepIndex] = !newSteps[stepIndex];
        if (newSteps[stepIndex]) {
          // Play preview note
          const note = t.notes[stepIndex] || 'C4';
          if (t.type === 'synth') soundEngine.playSynth(note, 0.2, 'sawtooth', 0.3);
          else if (t.type === '808') soundEngine.play808(note, 0.4, false, 0.4);
          else if (t.type === 'topline') soundEngine.playTopline(note, 0.3);
          else if (t.type === 'drums') soundEngine.playDrum('kick', 0.4);
          else if (t.type === 'foley') soundEngine.playFoley('keys', 0.3);
        }
        return { ...t, steps: newSteps };
      }),
    }));
  };

  const toggleMute = (trackId: string) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, isMuted: !t.isMuted } : t)),
    }));
  };

  const toggleSolo = (trackId: string) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, isSolo: !t.isSolo } : t)),
    }));
  };

  const updateVolume = (trackId: string, val: number) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, volume: val } : t)),
    }));
  };

  // AI Persona Suggests / Composes Track
  const handleAIGeneratePattern = async (trackId: string) => {
    const persona = personas.find((p) => p.id === selectedPersonaId) || personas[0];
    const track = project.tracks.find((t) => t.id === trackId);
    if (!persona || !track) return;

    setIsGeneratingTrack(true);
    try {
      const res = await fetch('/api/studio/suggest-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona,
          trackType: track.type,
          genreOrMood: `${persona.stageName} aesthetic`,
        }),
      });
      const data = await res.json();

      if (data && data.stepPattern) {
        setProject((prev) => ({
          ...prev,
          tracks: prev.tracks.map((t) => {
            if (t.id !== trackId) return t;
            return {
              ...t,
              steps: data.stepPattern.map((x: number) => Boolean(x)),
              notes: data.notes && data.notes.length === 16 ? data.notes : t.notes,
            };
          }),
        }));
        setLastAIThought(`"${data.thought}" — ${persona.name} (${persona.stageName})`);
        if (onPersonaContributed) {
          onPersonaContributed(persona.name, track.name);
        }
      }
    } catch (e) {
      console.error('Failed to generate AI pattern:', e);
    } finally {
      setIsGeneratingTrack(false);
    }
  };

  // Export Master Audio to WAV
  const handleExportWAV = async () => {
    setIsExporting(true);
    try {
      soundEngine.init();
      const wavBlob = await soundEngine.exportProjectToWav(
        project.tracks.map((t) => ({
          type: t.type,
          steps: t.steps,
          notes: t.notes,
          volume: t.volume,
          isMuted: t.isMuted,
        })),
        project.bpm,
        4
      );

      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error exporting WAV audio:', e);
    } finally {
      setIsExporting(false);
    }
  };

  // Export Project JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '_')}_project.json`;
    a.click();
  };

  return (
    <div
      id="daw-container"
      className="w-full h-full bg-slate-950 text-slate-100 flex flex-col border border-slate-800 rounded-xl overflow-hidden shadow-2xl"
    >
      {/* DAW Top Control Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Music2 className="w-5 h-5 text-purple-400" />
              FLUX DAW: Simulated Music Studio
            </h2>
          </div>
          <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400 border border-slate-700">
            {project.title}
          </span>
        </div>

        {/* Transport Controls (Play, Stop, BPM) */}
        <div className="flex items-center gap-2">
          <button
            id="daw-play-btn"
            onClick={() => {
              soundEngine.init();
              setIsPlaying(!isPlaying);
            }}
            className={`px-4 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md ${
              isPlaying
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Play Loop
              </>
            )}
          </button>

          <button
            id="daw-stop-btn"
            onClick={() => {
              setIsPlaying(false);
              setCurrentStep(0);
            }}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700"
          >
            <Square className="w-3.5 h-3.5" />
          </button>

          {/* BPM selector */}
          <div className="flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400 font-mono">BPM:</span>
            <input
              type="number"
              min="60"
              max="180"
              value={project.bpm}
              onChange={(e) => setProject({ ...project, bpm: Math.max(60, Math.min(180, Number(e.target.value))) })}
              className="w-12 bg-transparent text-slate-100 font-mono font-bold focus:outline-none"
            />
          </div>

          {/* Instrument Sub-Tabs */}
          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('sequencer')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeTab === 'sequencer' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sequencer
            </button>
            <button
              onClick={() => {
                soundEngine.init();
                setActiveTab('keyboard');
              }}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeTab === 'keyboard' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Piano Keys
            </button>
            <button
              onClick={() => {
                soundEngine.init();
                setActiveTab('drumpads');
              }}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeTab === 'drumpads' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              808 & Drums
            </button>
            <button
              onClick={() => {
                soundEngine.init();
                setActiveTab('foley');
              }}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeTab === 'foley' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Foley Rig
            </button>
          </div>
        </div>

        {/* AI Persona Collaborator Selector & Export */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Collaborator:</span>
            <select
              value={selectedPersonaId}
              onChange={(e) => setSelectedPersonaId(e.target.value)}
              className="bg-slate-900 text-slate-200 rounded px-2 py-0.5 border border-slate-700 focus:outline-none"
            >
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.stageName})
                </option>
              ))}
            </select>
          </div>

          <button
            id="daw-export-wav-btn"
            onClick={handleExportWAV}
            disabled={isExporting}
            className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow border border-sky-400/30 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? 'Rendering...' : 'Export WAV'}
          </button>

          <button
            id="daw-export-json-btn"
            onClick={handleExportJSON}
            title="Export project file"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
          >
            <FileCode className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* AI Persona Voice Banner (If contributed) */}
      {lastAIThought && (
        <div className="bg-purple-950/40 border-b border-purple-800/40 px-4 py-2 text-xs text-purple-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="italic font-medium">{lastAIThought}</span>
          </div>
          <button onClick={() => setLastAIThought(null)} className="text-purple-400 hover:text-purple-200 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
        {activeTab === 'sequencer' && (
          <div className="flex flex-col gap-3">
            {/* Step Counter Header */}
            <div className="flex items-center">
              <div className="w-64 shrink-0 text-xs font-semibold text-slate-400 px-2">Tracks & Mixer</div>
              <div className="flex-1 grid grid-cols-16 gap-1 px-2">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className={`text-center font-mono text-[10px] py-1 rounded ${
                      currentStep === i && isPlaying
                        ? 'bg-sky-500 text-white font-bold'
                        : i % 4 === 0
                        ? 'bg-slate-800/80 text-slate-300'
                        : 'text-slate-600'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Multitrack Sequencer Grid */}
            {project.tracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 shadow-sm hover:border-slate-700 transition-all"
              >
                {/* Track Channel Info & Mix Controls */}
                <div className="w-64 shrink-0 flex flex-col gap-1.5 pr-3 border-r border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate flex items-center gap-1.5" style={{ color: track.color }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: track.color }} />
                      {track.name}
                    </span>
                    <button
                      onClick={() => handleAIGeneratePattern(track.id)}
                      disabled={isGeneratingTrack}
                      title="Ask current persona to write this track"
                      className="px-1.5 py-0.5 bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 rounded text-[10px] flex items-center gap-1 border border-purple-700/50"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      {isGeneratingTrack ? '...' : 'AI Pattern'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => toggleMute(track.id)}
                      className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                        track.isMuted ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      M
                    </button>
                    <button
                      onClick={() => toggleSolo(track.id)}
                      className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                        track.isSolo ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      S
                    </button>

                    {/* Volume slider */}
                    <div className="flex items-center gap-1 flex-1">
                      <Volume2 className="w-3 h-3 text-slate-500" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={track.volume}
                        onChange={(e) => updateVolume(track.id, parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
                      />
                    </div>
                  </div>
                </div>

                {/* 16 Step Buttons */}
                <div className="flex-1 grid grid-cols-16 gap-1 px-3">
                  {track.steps.map((isActive, sIndex) => {
                    const isBeat = sIndex % 4 === 0;
                    const isCursor = currentStep === sIndex && isPlaying;
                    return (
                      <button
                        key={sIndex}
                        onClick={() => toggleStep(track.id, sIndex)}
                        className={`h-11 rounded-md transition-all flex flex-col items-center justify-center border ${
                          isActive
                            ? 'shadow-md ring-1 ring-white/20'
                            : isBeat
                            ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60'
                            : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800'
                        } ${isCursor ? 'scale-105 border-white' : ''}`}
                        style={{
                          backgroundColor: isActive ? track.color : undefined,
                          borderColor: isActive ? track.color : undefined,
                        }}
                      >
                        <span
                          className={`text-[9px] font-mono leading-none ${
                            isActive ? 'text-white font-bold' : 'text-slate-500'
                          }`}
                        >
                          {track.notes[sIndex] || ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Playable Piano Keyboard Mode */}
        {activeTab === 'keyboard' && (
          <div className="flex flex-col items-center justify-center p-6 bg-slate-900/90 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <Music2 className="w-4 h-4 text-sky-400" />
              Polyphonic Synth & Melodic Keyboard
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Click or tap keys to play in real-time. Dave Sterling or Jess Alpert can record these motifs directly into the
              arrangement.
            </p>

            {/* Piano Keys Matrix */}
            <div className="relative flex items-start select-none py-2 bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-2xl overflow-x-auto">
              {PIANO_KEYS.map((k) => {
                if (k.isBlack) {
                  return (
                    <button
                      key={k.note}
                      onClick={() => {
                        soundEngine.init();
                        soundEngine.playSynth(k.note, 0.4, 'sawtooth', 0.4);
                      }}
                      className="w-7 h-28 bg-slate-900 hover:bg-sky-600 active:bg-sky-400 text-[10px] text-slate-300 font-mono -mx-3.5 z-10 rounded-b shadow-lg border border-slate-700 flex items-end justify-center pb-2 transition-colors"
                    >
                      {k.note}
                    </button>
                  );
                }
                return (
                  <button
                    key={k.note}
                    onClick={() => {
                      soundEngine.init();
                      soundEngine.playSynth(k.note, 0.4, 'sawtooth', 0.35);
                    }}
                    className="w-10 h-44 bg-slate-100 hover:bg-sky-200 active:bg-sky-300 text-slate-900 text-xs font-mono rounded-b border border-slate-300 flex items-end justify-center pb-3 font-semibold shadow transition-colors"
                  >
                    {k.note}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Playable 808 Sub & Drum Pads Mode */}
        {activeTab === 'drumpads' && (
          <div className="flex flex-col items-center p-6 bg-slate-900/90 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-400" />
              Malik's Sliding 808s & Tyler's Drum MPC Pads
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Low-end rumble and rhythmic acoustic hits crafted by the commune's beat producers.
            </p>

            <div className="grid grid-cols-4 gap-4 max-w-xl w-full">
              {[
                { name: '808 Sub C1', note: 'C1', type: '808', color: 'bg-purple-600' },
                { name: '808 Slide D#1', note: 'D#1', type: '808', color: 'bg-purple-700' },
                { name: '808 Slide G1', note: 'G1', type: '808', color: 'bg-indigo-600' },
                { name: '808 High A#1', note: 'A#1', type: '808', color: 'bg-indigo-700' },
                { name: 'Heavy Kick', drum: 'kick', type: 'drum', color: 'bg-amber-600' },
                { name: 'Snappy Snare', drum: 'snare', type: 'drum', color: 'bg-red-600' },
                { name: 'Crisp Hi-Hat', drum: 'hihat', type: 'drum', color: 'bg-sky-600' },
                { name: 'Staggered Clap', drum: 'clap', type: 'drum', color: 'bg-rose-600' },
              ].map((pad, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    soundEngine.init();
                    if (pad.type === '808') {
                      soundEngine.play808(pad.note, 0.7, true, 0.6);
                    } else if (pad.drum) {
                      soundEngine.playDrum(pad.drum as any, 0.5);
                    }
                  }}
                  className={`h-24 ${pad.color} hover:brightness-110 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg flex flex-col items-center justify-center gap-1 border border-white/20 transition-all`}
                >
                  <span>{pad.name}</span>
                  <span className="text-[10px] font-mono text-white/70">Trigger</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Playable Foley Soundboard */}
        {activeTab === 'foley' && (
          <div className="flex flex-col items-center p-6 bg-slate-900/90 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Lily & Benji's Tactile Foley Micro-Station
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Organic tactile textures synthesized in real time, from delicate ASMR breath sweeps to crunchy crushed metal.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl w-full">
              {[
                { name: 'Binaural Whisper', texture: 'whisper', desc: 'Soft breath sweep', bg: 'bg-violet-900/80' },
                { name: 'Vegetable / Gravel Crunch', texture: 'crunch', desc: 'Smashed organic matter', bg: 'bg-emerald-900/80' },
                { name: 'Antique Key Rattle', texture: 'keys', desc: 'High-Q metal overtones', bg: 'bg-amber-900/80' },
                { name: 'Vinyl Dust Crackle', texture: 'vinyl', desc: 'Turntable stylus warmth', bg: 'bg-slate-800/80' },
              ].map((foley, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    soundEngine.init();
                    soundEngine.playFoley(foley.texture as any, 0.5);
                  }}
                  className={`h-28 ${foley.bg} hover:brightness-125 active:scale-95 text-slate-100 rounded-xl p-3 border border-slate-700 flex flex-col justify-between text-left shadow-lg transition-all`}
                >
                  <div>
                    <span className="text-xs font-bold block">{foley.name}</span>
                    <span className="text-[11px] text-slate-400">{foley.desc}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Click to Play Texture</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
