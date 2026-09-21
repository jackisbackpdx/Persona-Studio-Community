import React from 'react';
import { Persona, EmotionalState, RoomId } from '../types';
import {
  X,
  Home,
  LogOut,
  Sliders,
  Download,
  Activity,
  Heart,
  Briefcase,
  Music,
  Compass,
  Disc,
  Feather,
} from 'lucide-react';

interface PersonaModalProps {
  persona: Persona;
  onClose: () => void;
  onToggleHouse: (personaId: string) => void;
  onUpdateEmotion: (personaId: string, emotion: EmotionalState) => void;
  onUpdateRoom: (personaId: string, room: RoomId) => void;
}

const EMOTIONS: EmotionalState[] = [
  'neutral',
  'anxious',
  'hyper-focused',
  'inspired',
  'exhausted',
  'irritated',
  'euphoric',
  'overwhelmed',
];

export const PersonaModal: React.FC<PersonaModalProps> = ({
  persona,
  onClose,
  onToggleHouse,
  onUpdateEmotion,
  onUpdateRoom,
}) => {
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(persona, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${persona.name.toLowerCase().replace(/\s+/g, '_')}_profile.json`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1c1a17] border border-[#3e372e] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Visual Swatch and House Presence Toggle */}
        <div className="relative px-6 py-5 bg-[#23201b] border-b border-[#383229] flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border-2 border-[#473e32] text-white font-serif-artisanal font-bold text-2xl relative"
              style={{
                backgroundColor: persona.visualAvatar?.color || '#c86236',
              }}
            >
              {persona.name.charAt(0)}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1c1a17] border border-[#443c32] flex items-center justify-center text-[10px] text-[#c49b4d]">
                <Disc className="w-3 h-3" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-serif-artisanal text-xl font-bold text-[#f5efe4] tracking-wide">
                  {persona.name}
                </h2>
                <span className="font-mono-artisanal text-xs px-2.5 py-0.5 rounded-full bg-[#2c261e] text-[#c49b4d] border border-[#443b2f] font-medium">
                  {persona.stageName}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-[#a89e8e]">
                <span>Age {persona.bioDemographics?.age}</span>
                <span>•</span>
                <span>{persona.bioDemographics?.gender}</span>
                <span>•</span>
                <span className="font-mono-artisanal font-semibold text-[#c49b4d]">MBTI: {persona.bioDemographics?.mbti}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="toggle-house-presence-btn"
              onClick={() => onToggleHouse(persona.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow ${
                persona.isInHouse
                  ? 'bg-[#5b6e4e] hover:bg-[#4d5e42] text-white border border-[#7a8c6e]'
                  : 'bg-[#66351d] hover:bg-[#522915] text-[#eed4c7] border border-[#8a4928]'
              }`}
            >
              {persona.isInHouse ? (
                <>
                  <Home className="w-3.5 h-3.5" /> At Residence
                </>
              ) : (
                <>
                  <LogOut className="w-3.5 h-3.5" /> Away (Re-Invite)
                </>
              )}
            </button>

            <button
              onClick={handleExportJSON}
              title="Export Persona Profile as JSON"
              className="p-2 bg-[#29251f] hover:bg-[#332e26] text-[#cfc7b8] rounded-xl border border-[#3e372e] transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-[#29251f] hover:bg-[#332e26] text-[#9c9182] hover:text-white rounded-xl border border-[#3e372e] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content with stable scrollbar */}
        <div className="p-6 discourse-scroll-container space-y-5 flex-1 text-xs text-[#dcd4c6]">
          {/* Room Location & Emotion Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#161411] p-4 rounded-xl border border-[#352f27]">
            <div>
              <label className="font-serif-artisanal text-xs font-semibold text-[#b8ad9c] block mb-2">
                House Chamber:
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'living_room', label: 'Hearth Parlor' },
                  { id: 'dining_room', label: 'Dining Hall' },
                  { id: 'studio', label: 'Sound Lab' },
                ].map((room) => (
                  <button
                    key={room.id}
                    onClick={() => onUpdateRoom(persona.id, room.id as RoomId)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                      persona.currentRoom === room.id
                        ? 'bg-[#c86236] text-white shadow font-semibold'
                        : 'bg-[#221f1a] text-[#8e8474] hover:bg-[#2c2822]'
                    }`}
                  >
                    {room.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-serif-artisanal text-xs font-semibold text-[#b8ad9c] block mb-2">
                Current Emotional Temperament:
              </label>
              <select
                value={persona.currentEmotionalState}
                onChange={(e) => onUpdateEmotion(persona.id, e.target.value as EmotionalState)}
                className="w-full bg-[#221f1a] text-[#ede8de] border border-[#3e372e] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#c86236] capitalize font-mono-artisanal"
              >
                {EMOTIONS.map((em) => (
                  <option key={em} value={em}>
                    {em}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Big Five OCEAN Personality Traits */}
          <div className="bg-[#161411] p-4 rounded-xl border border-[#352f27]">
            <h3 className="font-serif-artisanal text-sm font-bold text-[#ede8de] mb-3 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#c49b4d]" />
              Big Five Personality Spectrum
            </h3>
            <div className="grid grid-cols-5 gap-2.5">
              {[
                { label: 'Openness', val: persona.ocean?.o, color: 'bg-[#8a5d8f]' },
                { label: 'Conscientious', val: persona.ocean?.c, color: 'bg-[#5b6e4e]' },
                { label: 'Extraversion', val: persona.ocean?.e, color: 'bg-[#c49b4d]' },
                { label: 'Agreeableness', val: persona.ocean?.a, color: 'bg-[#c86236]' },
                { label: 'Neuroticism', val: persona.ocean?.n, color: 'bg-[#5d7a8c]' },
              ].map((m) => (
                <div key={m.label} className="bg-[#201d19] p-2.5 rounded-xl border border-[#38322a] text-center">
                  <span className="text-[10px] text-[#9c9182] block truncate">{m.label}</span>
                  <span className="text-base font-bold text-[#ede8de] font-mono-artisanal mt-0.5 block">{m.val}%</span>
                  <div className="w-full bg-[#2b2721] h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div className={`h-full ${m.color}`} style={{ width: `${m.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DSM-5 & Sensory Profile */}
          <div className="bg-[#161411] p-4 rounded-xl border border-[#352f27]">
            <h3 className="font-serif-artisanal text-sm font-bold text-[#ede8de] mb-2.5 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#c86236]" />
              Neurodivergence & Sensory Traits
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(persona.dsm5 || {}).map(([key, val]) => (
                <span
                  key={key}
                  className="px-2.5 py-1 bg-[#251b1c] text-[#e89090] border border-[#52292f] rounded-lg font-mono-artisanal text-xs"
                >
                  {key}: <strong className="text-[#f7dede]">{String(val)}</strong>
                </span>
              ))}
            </div>
            {persona.neuroAesthetics && (
              <div className="mt-3 pt-3 border-t border-[#2d2821] grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-[#8e8474] uppercase font-semibold">Neurobiology / Origin</span>
                  <p className="text-[#cfc7b8] mt-0.5 leading-relaxed">{persona.neuroAesthetics.genetics}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#8e8474] uppercase font-semibold">Visual Aesthetics</span>
                  <p className="text-[#cfc7b8] mt-0.5 leading-relaxed">{persona.neuroAesthetics.visuals}</p>
                </div>
              </div>
            )}
          </div>

          {/* Instruments & Acoustic Craft */}
          <div className="bg-[#161411] p-4 rounded-xl border border-[#352f27]">
            <h3 className="font-serif-artisanal text-sm font-bold text-[#ede8de] mb-2.5 flex items-center gap-1.5">
              <Music className="w-4 h-4 text-[#c49b4d]" />
              Instruments & Sonic Craft
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {(persona.instruments || []).map((inst, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-[#28211b] text-[#e8d5b5] border border-[#4d3d2c] rounded-lg text-xs font-medium"
                >
                  {inst}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(persona.skills || []).map((skill, i) => (
                <span key={i} className="px-2.5 py-0.5 bg-[#201d19] text-[#b8ad9c] rounded-md text-[11px] border border-[#352f27]">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Voice, Social Behavior & Daily Walkthrough */}
          <div className="space-y-3">
            <div className="bg-[#161411] p-4 rounded-xl border border-[#352f27]">
              <span className="font-serif-artisanal text-xs text-[#c49b4d] font-semibold block mb-1">
                Voice & Communication Style
              </span>
              <p className="text-[#ded7c8] italic leading-relaxed">{persona.voiceCommunicationStyle}</p>
            </div>

            <div className="bg-[#161411] p-4 rounded-xl border border-[#352f27]">
              <span className="font-serif-artisanal text-xs text-[#c49b4d] font-semibold block mb-1">
                Social Behavior Patterns
              </span>
              <p className="text-[#cfc7b8] leading-relaxed">{persona.socialBehaviorPatterns}</p>
            </div>

            <div className="bg-[#161411] p-4 rounded-xl border border-[#352f27]">
              <span className="font-serif-artisanal text-xs text-[#c49b4d] font-semibold block mb-1">
                Daily Life Walkthrough
              </span>
              <p className="text-[#cfc7b8] leading-relaxed text-[11px] whitespace-pre-line">
                {persona.dailyLifeWalkthrough}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
