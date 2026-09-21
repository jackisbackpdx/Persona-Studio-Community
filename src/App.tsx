import React, { useState, useEffect, useCallback } from 'react';
import { Persona, DiscourseMessage, DiscourseSession, EmotionalState, RoomId } from './types';
import { DEFAULT_PERSONAS } from './data/defaultPersonas';
import { ThreeHouseScene } from './components/ThreeHouseScene';
import { MusicStudioDAW } from './components/MusicStudioDAW';
import { DiscourseManager } from './components/DiscourseManager';
import { PersonaModal } from './components/PersonaModal';
import { AddPersonaModal } from './components/AddPersonaModal';
import { soundEngine } from './audio/soundEngine';
import {
  Users,
  Sliders,
  Plus,
  Compass,
  Home,
  Disc,
  Feather,
  Sparkles,
} from 'lucide-react';

const LOCAL_STORAGE_KEY_PERSONAS = 'persona_commune_roster_v1';
const LOCAL_STORAGE_KEY_SESSIONS = 'persona_commune_sessions_v1';

export default function App() {
  // Personas State
  const [personas, setPersonas] = useState<Persona[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PERSONAS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load personas from localStorage, using defaults');
    }
    return DEFAULT_PERSONAS;
  });

  // Saved Sessions State
  const [savedSessions, setSavedSessions] = useState<DiscourseSession[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load sessions from localStorage');
    }
    return [];
  });

  // UI Modals & Active Selections
  const [inspectedPersona, setInspectedPersona] = useState<Persona | null>(null);
  const [isAddPersonaOpen, setIsAddPersonaOpen] = useState(false);
  const [isDAWOpen, setIsDAWOpen] = useState(false);
  const [latestMessage, setLatestMessage] = useState<DiscourseMessage | null>(null);

  // Layout View Mode: 'split' (3D House + Discourse), 'house_only', 'discourse_only'
  const [viewMode, setViewMode] = useState<'split' | 'house_only' | 'discourse_only'>('split');

  // Persistence Effects
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PERSONAS, JSON.stringify(personas));
    } catch (e) {
      console.error('Failed to save personas to localStorage', e);
    }
  }, [personas]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_SESSIONS, JSON.stringify(savedSessions));
    } catch (e) {
      console.error('Failed to save sessions to localStorage', e);
    }
  }, [savedSessions]);

  // Persona Actions
  const handleToggleHousePresence = (personaId: string) => {
    setPersonas((prev) =>
      prev.map((p) => {
        if (p.id !== personaId) return p;
        const nextState = !p.isInHouse;
        return { ...p, isInHouse: nextState };
      })
    );
    if (inspectedPersona && inspectedPersona.id === personaId) {
      setInspectedPersona((prev) => (prev ? { ...prev, isInHouse: !prev.isInHouse } : null));
    }
    soundEngine.init();
    soundEngine.playSynth('A4', 0.2, 'sine', 0.3);
  };

  const handleUpdateEmotion = (personaId: string, emotion: EmotionalState) => {
    setPersonas((prev) =>
      prev.map((p) => (p.id === personaId ? { ...p, currentEmotionalState: emotion } : p))
    );
    if (inspectedPersona && inspectedPersona.id === personaId) {
      setInspectedPersona((prev) => (prev ? { ...prev, currentEmotionalState: emotion } : null));
    }
  };

  const handleUpdateRoom = (personaId: string, room: RoomId) => {
    setPersonas((prev) =>
      prev.map((p) => (p.id === personaId ? { ...p, currentRoom: room } : p))
    );
    if (inspectedPersona && inspectedPersona.id === personaId) {
      setInspectedPersona((prev) => (prev ? { ...prev, currentRoom: room } : null));
    }
  };

  const handleUpdatePersonaState = (personaId: string, updates: Partial<Persona>) => {
    setPersonas((prev) =>
      prev.map((p) => (p.id === personaId ? { ...p, ...updates } : p))
    );
    if (inspectedPersona && inspectedPersona.id === personaId) {
      setInspectedPersona((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const handleSelectPersona = useCallback((persona: Persona) => {
    setInspectedPersona(persona);
  }, []);

  const handleOpenDAW = useCallback(() => {
    soundEngine.init();
    setIsDAWOpen(true);
  }, []);

  const handleAddPersona = (newPersona: Persona) => {
    setPersonas((prev) => [newPersona, ...prev]);
    soundEngine.init();
    soundEngine.playSynth('C5', 0.4, 'triangle', 0.4);
  };

  const handleTurnGenerated = (msg: DiscourseMessage) => {
    setLatestMessage(msg);
  };

  const handleSaveSession = (session: DiscourseSession) => {
    setSavedSessions((prev) => [session, ...prev.filter((s) => s.id !== session.id)]);
  };

  const handleDeleteSession = (sessionId: string) => {
    setSavedSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const inHouseCount = personas.filter((p) => p.isInHouse).length;

  return (
    <div className="w-screen h-screen bg-[#14120f] text-[#ede8de] flex flex-col overflow-hidden font-sans select-none">
      {/* Artisanal Top Header Bar */}
      <header className="h-16 bg-[#1a1815] border-b border-[#352f27] px-5 flex items-center justify-between shrink-0 z-30 shadow-md">
        {/* Logo & Artisan Commune Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-[#28231c] border border-[#c49b4d]/40 flex items-center justify-center shadow-inner">
            <Disc className="w-5 h-5 text-[#c49b4d]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif-artisanal text-lg font-bold text-[#f5efe4] tracking-wide">
                The Division Street Commune
              </h1>
              <span className="font-mono-artisanal text-[10px] px-2 py-0.5 rounded-full bg-[#2a251e] text-[#c49b4d] border border-[#4a3f32] tracking-wider uppercase">
                Portland, OR
              </span>
            </div>
            <p className="text-[11px] text-[#9e9383] hidden sm:block">
              An artisan collective of autonomous creative personas in a craftsman sound house
            </p>
          </div>
        </div>

        {/* Resident Avatars & Workspace Toggles */}
        <div className="flex items-center gap-3">
          {/* Quick Roster Avatars */}
          <div className="hidden lg:flex items-center -space-x-1.5 mr-1">
            {personas.map((p) => (
              <button
                key={p.id}
                onClick={() => setInspectedPersona(p)}
                title={`${p.name} (${p.stageName}) • ${p.isInHouse ? 'At Residence' : 'Out of House'}`}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] text-[#f7f4ed] border-2 border-[#1a1815] shadow-md transition-all hover:scale-125 hover:z-20 ${
                  p.isInHouse ? 'opacity-100 ring-1 ring-[#c49b4d]/50' : 'opacity-35 grayscale'
                }`}
                style={{ backgroundColor: p.visualAvatar?.color || '#a35e39' }}
              >
                {p.name.charAt(0)}
              </button>
            ))}
          </div>

          <span className="font-mono-artisanal text-[11px] text-[#8e8474] hidden sm:inline mr-2">
            <Users className="w-3.5 h-3.5 inline mr-1 text-[#b8ad9c]" />
            {inHouseCount}/{personas.length} in residence
          </span>

          {/* View Mode Toggle Controls */}
          <div className="flex bg-[#24211b] p-1 rounded-xl border border-[#383229] text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded-lg transition-all font-medium ${
                viewMode === 'split'
                  ? 'bg-[#c86236] text-white font-semibold shadow-sm'
                  : 'text-[#9c9182] hover:text-[#f5efe4]'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('house_only')}
              className={`px-3 py-1 rounded-lg transition-all font-medium ${
                viewMode === 'house_only'
                  ? 'bg-[#c86236] text-white font-semibold shadow-sm'
                  : 'text-[#9c9182] hover:text-[#f5efe4]'
              }`}
            >
              Residence
            </button>
            <button
              onClick={() => setViewMode('discourse_only')}
              className={`px-3 py-1 rounded-lg transition-all font-medium ${
                viewMode === 'discourse_only'
                  ? 'bg-[#c86236] text-white font-semibold shadow-sm'
                  : 'text-[#9c9182] hover:text-[#f5efe4]'
              }`}
            >
              Discourse
            </button>
          </div>

          {/* Launch DAW Studio */}
          <button
            id="nav-open-daw-btn"
            onClick={() => {
              soundEngine.init();
              setIsDAWOpen(true);
            }}
            className="px-3.5 py-1.5 bg-[#29221b] hover:bg-[#352c22] text-[#f5efe4] text-xs font-semibold rounded-xl shadow border border-[#c49b4d]/60 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sliders className="w-3.5 h-3.5 text-[#c49b4d]" />
            <span>Analog DAW</span>
          </button>

          {/* Add Persona Button */}
          <button
            id="nav-add-persona-btn"
            onClick={() => setIsAddPersonaOpen(true)}
            className="px-3.5 py-1.5 bg-[#5b6e4e] hover:bg-[#4d5e42] text-white text-xs font-semibold rounded-xl shadow border border-[#7a8c6e] flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Artist</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 overflow-hidden p-3 gap-3 flex flex-col md:flex-row">
        {/* Left Column: Portland House 3D Environment */}
        {(viewMode === 'split' || viewMode === 'house_only') && (
          <div
            className={`h-full transition-all flex flex-col ${
              viewMode === 'house_only' ? 'w-full' : 'w-full md:w-7/12'
            }`}
          >
            <ThreeHouseScene
              personas={personas}
              activePersonaId={inspectedPersona?.id || null}
              onSelectPersona={handleSelectPersona}
              onOpenDAW={handleOpenDAW}
              latestMessage={latestMessage}
              onUpdatePersonaState={handleUpdatePersonaState}
            />
          </div>
        )}

        {/* Right Column: Discourse Chamber */}
        {(viewMode === 'split' || viewMode === 'discourse_only') && (
          <div
            className={`h-full transition-all flex flex-col ${
              viewMode === 'discourse_only' ? 'w-full' : 'w-full md:w-5/12'
            }`}
          >
            <DiscourseManager
              personas={personas}
              onSelectPersona={(persona) => setInspectedPersona(persona)}
              onTurnGenerated={handleTurnGenerated}
              onUpdatePersonaEmotion={handleUpdateEmotion}
              savedSessions={savedSessions}
              onSaveSession={handleSaveSession}
              onLoadSession={(session) => {}}
              onDeleteSession={handleDeleteSession}
            />
          </div>
        )}
      </main>

      {/* Simulated Analog DAW Studio Modal */}
      {isDAWOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-3 md:p-6 flex items-center justify-center">
          <div className="w-full max-w-7xl h-full max-h-[95vh]">
            <MusicStudioDAW
              personas={personas}
              onClose={() => setIsDAWOpen(false)}
              onPersonaContributed={(personaName, trackName) => {
                setLatestMessage({
                  id: 'daw-contrib-' + Date.now(),
                  speakerId: 'daw',
                  speakerName: personaName,
                  text: `I just laid down a fresh 16-step sequence for ${trackName}! Check out the groove.`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  emotionalState: 'inspired',
                  actionNote: `Tweaking knobs and faders on the ${trackName} channel in the DAW`,
                });
              }}
            />
          </div>
        </div>
      )}

      {/* Persona Profile Inspector Modal */}
      {inspectedPersona && (
        <PersonaModal
          persona={inspectedPersona}
          onClose={() => setInspectedPersona(null)}
          onToggleHouse={handleToggleHousePresence}
          onUpdateEmotion={handleUpdateEmotion}
          onUpdateRoom={handleUpdateRoom}
        />
      )}

      {/* Add New Persona Modal */}
      {isAddPersonaOpen && (
        <AddPersonaModal
          onClose={() => setIsAddPersonaOpen(false)}
          onAddPersona={handleAddPersona}
        />
      )}
    </div>
  );
}
