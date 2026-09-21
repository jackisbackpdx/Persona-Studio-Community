import React, { useState } from 'react';
import { Persona, EmotionalState, RoomId } from '../types';
import {
  X,
  Edit3,
  FileCode,
  Eye,
  Check,
  Plus,
  Compass,
  Music,
  Disc,
  Feather,
} from 'lucide-react';

interface AddPersonaModalProps {
  onClose: () => void;
  onAddPersona: (newPersona: Persona) => void;
}

const EMPTY_PERSONA: Persona = {
  id: 'persona-' + Date.now(),
  name: 'Kira Thorne',
  stageName: 'Granular Sound Architect',
  bioDemographics: {
    age: 28,
    gender: 'Non-binary',
    mbti: 'INTP',
  },
  ocean: {
    o: 92,
    c: 65,
    e: 30,
    a: 70,
    n: 60,
  },
  dsm5: {
    'Sensory Processing Sensitivity': '80%',
    'ADHD (Hyper-focus)': '65%',
  },
  childhood:
    'Lived near Portland rail yards; became obsessed with the textural humming of electrical transformers and morning diesel engines.',
  neuroAesthetics: {
    genetics: 'High temporal auditory sensitivity and synesthetic pitch-to-color mapping.',
    visuals: 'Minimalist woodblock textures, dark cathode-ray oscilloscope phosphor green.',
  },
  economics: {
    purchaseDecisions:
      'Spends money on rare circuit-bent guitar pedals, vintage tape echo machines, and dark roast artisanal coffee beans.',
  },
  dailyLifeWalkthrough:
    'Wakes at 8 AM, brews coffee with a siphon dripper, records ambient rain gutter hydrophones, and modulates delay feedback until midnight.',
  instruments: ['Granular Synthesizer', 'Circuit-bent Cassette Deck', 'Contact Hydrophones'],
  skills: ['Granular Micro-looping', 'Tape Degradation Sculpting', 'Sub-harmonic Droning', 'Oscilloscope Calibration'],
  strengths: ['Unrivaled atmospheric texture creation', 'Zero fear of radical sonic dissonance'],
  weaknesses: ['Perfectionist procrastination', 'Easily disoriented in high-decibel social environments'],
  voiceCommunicationStyle:
    'Thoughtful, quiet, analytical cadence; speaks in visual metaphors comparing sound to wood grain and textures.',
  socialBehaviorPatterns:
    'Sits quietly near window sills observing equipment lights; speaks with intense precision when asked about audio synthesis.',
  isInHouse: true,
  currentRoom: 'studio',
  currentEmotionalState: 'inspired',
  visualAvatar: {
    color: '#0e7490',
    secondaryColor: '#164e63',
    hairStyle: 'Dark wavy textured bob',
    accessory: 'Brass patch cable clip',
    clothing: 'Charcoal wool studio smock',
    avatarIcon: 'Waveform',
  },
};

export const AddPersonaModal: React.FC<AddPersonaModalProps> = ({ onClose, onAddPersona }) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'form' | 'json'>('prompt');
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [personaDraft, setPersonaDraft] = useState<Persona>({ ...EMPTY_PERSONA, id: 'persona-' + Date.now() });
  const [jsonText, setJsonText] = useState(JSON.stringify(personaDraft, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const updateDraft = (updated: Persona) => {
    setPersonaDraft(updated);
    setJsonText(JSON.stringify(updated, null, 2));
    setJsonError(null);
  };

  const handleGenerateWithAI = async () => {
    if (!promptText.trim()) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/personas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });

      const data = await res.json();
      if (data && data.name) {
        const fullPersona: Persona = {
          ...data,
          id: 'persona-' + Date.now(),
          isInHouse: true,
          currentRoom: 'living_room',
          currentEmotionalState: 'inspired',
        };
        updateDraft(fullPersona);
      }
    } catch (e) {
      console.error('Failed to generate persona with Gemini:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    try {
      const parsed = JSON.parse(val);
      if (parsed.name && parsed.ocean) {
        setPersonaDraft(parsed);
        setJsonError(null);
      } else {
        setJsonError('JSON must include at least name and ocean metrics.');
      }
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  const handleSave = () => {
    onAddPersona(personaDraft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1c1a17] border border-[#3e372e] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#23201b] border-b border-[#383229] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Disc className="w-5 h-5 text-[#c49b4d]" />
            <h2 className="font-serif-artisanal text-base font-bold text-[#f5efe4]">
              Induct New Resident Artist
            </h2>
            <span className="text-xs text-[#9e9383] font-sans">| Generative Studio Prompt or Manual Blueprint</span>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1 bg-[#181613] p-1 rounded-xl text-xs border border-[#332e26]">
            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'prompt' ? 'bg-[#c86236] text-white shadow font-semibold' : 'text-[#9c9182] hover:text-[#ede8de]'
              }`}
            >
              <Feather className="w-3.5 h-3.5" /> Archetype Studio
            </button>
            <button
              onClick={() => setActiveTab('form')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'form' ? 'bg-[#c86236] text-white shadow font-semibold' : 'text-[#9c9182] hover:text-[#ede8de]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Trait Builder
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'json' ? 'bg-[#c86236] text-white shadow font-semibold' : 'text-[#9c9182] hover:text-[#ede8de]'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" /> Schema JSON
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-[#29251f] hover:bg-[#353029] text-[#9c9182] hover:text-white rounded-lg transition-colors border border-[#3e372e]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Split Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Editor */}
          <div className="lg:col-span-7 border-r border-[#38322a] p-6 discourse-scroll-container space-y-4 text-xs">
            {/* TAB 1: AI Prompt Generator */}
            {activeTab === 'prompt' && (
              <div className="space-y-4">
                <div className="bg-[#241f19] border border-[#4d3e2e] rounded-xl p-4">
                  <h3 className="font-serif-artisanal text-xs font-bold text-[#e8d5b5] flex items-center gap-1.5 mb-1">
                    <Compass className="w-4 h-4 text-[#c49b4d]" />
                    Describe Any Creative, Musician, or Eccentric Artist
                  </h3>
                  <p className="text-[11px] text-[#b8ad9c] leading-relaxed">
                    Synthesizes a complete psychological profile: Big Five OCEAN, neurodivergent sensory traits, childhood roots, instruments, voice habits, and daily rituals.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="font-serif-artisanal text-xs text-[#cfc7b8] font-semibold block">
                    Artist Description or Archetype:
                  </label>
                  <textarea
                    rows={4}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="e.g. An ambient cassette loop sculptress with hyper-focus who collects sound from dripping gutters and plays a 1970s Farfisa organ..."
                    className="w-full bg-[#14120f] border border-[#3e372e] rounded-xl p-3 text-xs text-[#ede8de] placeholder-[#6e6557] focus:outline-none focus:border-[#c86236]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="generate-persona-ai-btn"
                    onClick={handleGenerateWithAI}
                    disabled={isGenerating || !promptText.trim()}
                    className="px-4 py-2.5 bg-[#c86236] hover:bg-[#b5552b] disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg border border-[#d97736]/40 flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Feather className="w-4 h-4" />
                    {isGenerating ? 'Synthesizing Profile...' : 'Synthesize Artist Profile'}
                  </button>

                  <div className="text-[11px] text-[#786e60]">
                    Review the live preview on the right before inducting.
                  </div>
                </div>

                {/* Quick Concept Starters */}
                <div className="pt-3 border-t border-[#332e26] space-y-1.5">
                  <span className="font-serif-artisanal text-[11px] text-[#8e8474] block">Artisan Concept Starters:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Shoegaze tape-loop pioneer with sensory processing sensitivity',
                      'Ex-classical cello prodigy turned ambient modular synthesizer builder',
                      'Field recordist obsessed with train whistle doppler effects and rain',
                      'Analog tube amp purist who rejects screens and speaks in poetic aphorisms',
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPromptText(chip)}
                        className="text-[11px] bg-[#221f1a] hover:bg-[#2c2822] text-[#b8ad9c] hover:text-[#ede8de] rounded-lg px-2.5 py-1 text-left border border-[#353028] transition-colors"
                      >
                        "{chip}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Form Builder */}
            {activeTab === 'form' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#9c9182] font-medium block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={personaDraft.name}
                      onChange={(e) => updateDraft({ ...personaDraft, name: e.target.value })}
                      className="w-full bg-[#14120f] border border-[#3e372e] rounded-lg px-3 py-1.5 text-xs text-[#ede8de] focus:outline-none focus:border-[#c86236]"
                    />
                  </div>
                  <div>
                    <label className="text-[#9c9182] font-medium block mb-1">Stage Name / Role</label>
                    <input
                      type="text"
                      value={personaDraft.stageName}
                      onChange={(e) => updateDraft({ ...personaDraft, stageName: e.target.value })}
                      className="w-full bg-[#14120f] border border-[#3e372e] rounded-lg px-3 py-1.5 text-xs text-[#ede8de] focus:outline-none focus:border-[#c86236]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[#9c9182] font-medium block mb-1">Age</label>
                    <input
                      type="number"
                      value={personaDraft.bioDemographics?.age}
                      onChange={(e) =>
                        updateDraft({
                          ...personaDraft,
                          bioDemographics: { ...personaDraft.bioDemographics, age: parseInt(e.target.value, 10) || 25 },
                        })
                      }
                      className="w-full bg-[#14120f] border border-[#3e372e] rounded-lg px-3 py-1.5 text-xs text-[#ede8de] focus:outline-none focus:border-[#c86236]"
                    />
                  </div>
                  <div>
                    <label className="text-[#9c9182] font-medium block mb-1">Gender</label>
                    <input
                      type="text"
                      value={personaDraft.bioDemographics?.gender}
                      onChange={(e) =>
                        updateDraft({
                          ...personaDraft,
                          bioDemographics: { ...personaDraft.bioDemographics, gender: e.target.value },
                        })
                      }
                      className="w-full bg-[#14120f] border border-[#3e372e] rounded-lg px-3 py-1.5 text-xs text-[#ede8de] focus:outline-none focus:border-[#c86236]"
                    />
                  </div>
                  <div>
                    <label className="text-[#9c9182] font-medium block mb-1">MBTI</label>
                    <input
                      type="text"
                      value={personaDraft.bioDemographics?.mbti}
                      onChange={(e) =>
                        updateDraft({
                          ...personaDraft,
                          bioDemographics: { ...personaDraft.bioDemographics, mbti: e.target.value },
                        })
                      }
                      className="w-full bg-[#14120f] border border-[#3e372e] rounded-lg px-3 py-1.5 text-xs text-[#ede8de] focus:outline-none focus:border-[#c86236]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#9c9182] font-medium block mb-1">Voice & Communication Style</label>
                  <textarea
                    rows={2}
                    value={personaDraft.voiceCommunicationStyle}
                    onChange={(e) => updateDraft({ ...personaDraft, voiceCommunicationStyle: e.target.value })}
                    className="w-full bg-[#14120f] border border-[#3e372e] rounded-lg p-2 text-xs text-[#ede8de] focus:outline-none focus:border-[#c86236]"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: Raw JSON */}
            {activeTab === 'json' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#9c9182] font-medium">Persona Blueprint JSON:</span>
                  {jsonError && <span className="text-rose-400 text-[11px] font-mono">{jsonError}</span>}
                </div>
                <textarea
                  rows={14}
                  value={jsonText}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  className="w-full font-mono-artisanal text-[11px] bg-[#14120f] border border-[#3e372e] rounded-xl p-3 text-[#ded7c8] focus:outline-none focus:border-[#c86236] leading-relaxed"
                />
              </div>
            )}
          </div>

          {/* Right Column: Live Real-Time Persona Preview */}
          <div className="lg:col-span-5 p-6 bg-[#161411] flex flex-col justify-between discourse-scroll-container text-xs space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#332e26] pb-2">
                <span className="font-serif-artisanal font-bold text-xs text-[#ded7c8] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#c49b4d]" />
                  Real-time Artist Dossier
                </span>
                <span className="font-mono-artisanal text-[10px] bg-[#29231c] text-[#c49b4d] border border-[#44382c] px-2 py-0.5 rounded-full">
                  Live Sync
                </span>
              </div>

              {/* Persona ID Card Preview */}
              <div className="p-4 rounded-2xl bg-[#1f1c18] border border-[#383229] shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-serif-artisanal font-bold text-xl text-white shadow-lg border-2 border-[#473e32]"
                    style={{ backgroundColor: personaDraft.visualAvatar?.color || '#c86236' }}
                  >
                    {personaDraft.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-serif-artisanal font-bold text-sm text-[#f5efe4]">{personaDraft.name}</h3>
                    <p className="text-[11px] text-[#c49b4d] font-medium">{personaDraft.stageName}</p>
                    <p className="text-[10px] text-[#9c9182] mt-0.5 font-mono-artisanal">
                      Age {personaDraft.bioDemographics?.age} • {personaDraft.bioDemographics?.gender} • {personaDraft.bioDemographics?.mbti}
                    </p>
                  </div>
                </div>

                {/* Big Five Metrics */}
                <div className="mt-4 pt-3 border-t border-[#2d2821] space-y-1.5">
                  {[
                    { label: 'O', val: personaDraft.ocean?.o, col: 'bg-[#8a5d8f]' },
                    { label: 'C', val: personaDraft.ocean?.c, col: 'bg-[#5b6e4e]' },
                    { label: 'E', val: personaDraft.ocean?.e, col: 'bg-[#c49b4d]' },
                    { label: 'A', val: personaDraft.ocean?.a, col: 'bg-[#c86236]' },
                    { label: 'N', val: personaDraft.ocean?.n, col: 'bg-[#5d7a8c]' },
                  ].map(({ label, val, col }) => (
                    <div key={label} className="flex items-center gap-2 text-[10px]">
                      <span className="w-3 font-mono-artisanal font-bold text-[#8e8474]">{label}</span>
                      <div className="flex-1 bg-[#29251f] h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full ${col}`} style={{ width: `${val}%` }} />
                      </div>
                      <span className="w-7 text-right font-mono-artisanal text-[#8e8474]">{val}%</span>
                    </div>
                  ))}
                </div>

                {/* Instruments preview */}
                <div className="mt-3 pt-3 border-t border-[#2d2821] flex flex-wrap gap-1">
                  {(personaDraft.instruments || []).slice(0, 3).map((inst, i) => (
                    <span key={i} className="text-[10px] bg-[#28211b] text-[#e8d5b5] px-2 py-0.5 rounded border border-[#4d3d2c]">
                      {inst}
                    </span>
                  ))}
                </div>

                {/* Voice quote preview */}
                <div className="mt-3 bg-[#161411] p-2.5 rounded-xl border border-[#2d2821] text-[11px] text-[#cfc7b8] italic">
                  "{personaDraft.voiceCommunicationStyle.slice(0, 110)}..."
                </div>
              </div>
            </div>

            {/* Bottom Add Action */}
            <div className="pt-4 border-t border-[#332e26]">
              <button
                id="confirm-add-persona-btn"
                onClick={handleSave}
                disabled={Boolean(jsonError)}
                className="w-full py-2.5 bg-[#5b6e4e] hover:bg-[#4d5e42] text-white font-bold rounded-xl shadow-lg border border-[#7a8c6e] flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Welcome Artist to Residence
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
