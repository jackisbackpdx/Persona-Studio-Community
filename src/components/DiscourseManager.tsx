import React, { useState, useEffect, useRef } from 'react';
import { Persona, InteractionMode, DiscourseMessage, DiscourseSession, EmotionalState } from '../types';
import { soundEngine } from '../audio/soundEngine';
import {
  Flame,
  Music,
  HeartHandshake,
  Anchor,
  Coffee,
  Compass,
  Send,
  Bookmark,
  Download,
  History,
  Trash2,
  Check,
  Play,
  Pause,
  ArrowRight,
  Disc,
  Radio,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface DiscourseManagerProps {
  personas: Persona[];
  onSelectPersona: (persona: Persona) => void;
  onTurnGenerated: (message: DiscourseMessage) => void;
  onUpdatePersonaEmotion?: (personaId: string, emotion: EmotionalState) => void;
  savedSessions: DiscourseSession[];
  onSaveSession: (session: DiscourseSession) => void;
  onLoadSession: (session: DiscourseSession) => void;
  onDeleteSession: (sessionId: string) => void;
}

const MODES: Array<{ id: InteractionMode; label: string; icon: any; color: string; desc: string }> = [
  {
    id: 'debate',
    label: 'Aesthetic Debate',
    icon: Flame,
    color: 'text-[#e58a52] bg-[#2d1c14] border-[#66351d]',
    desc: 'Passionate clash of music philosophies, production ethics, and creative authenticity.',
  },
  {
    id: 'music_collaboration',
    label: 'Studio Composition',
    icon: Music,
    color: 'text-[#d4a0e8] bg-[#2a172e] border-[#593063]',
    desc: 'Harmonizing toplines, programming 808s, laying foley textures, and arranging tracks in the DAW.',
  },
  {
    id: 'personal_issues',
    label: 'Sensory & Personal',
    icon: HeartHandshake,
    color: 'text-[#e89090] bg-[#2b171a] border-[#5e2b32]',
    desc: 'Unpacking burnout, misophonia, social anxiety, family pressures, and sensory overwhelm.',
  },
  {
    id: 'real_life_issues',
    label: 'Industry & Hustle',
    icon: Anchor,
    color: 'text-[#90cce8] bg-[#14232c] border-[#29485b]',
    desc: 'Navigating rent, streaming playlist gatekeeping, city noise complaints, and survival.',
  },
  {
    id: 'casual_conversation',
    label: 'Hearth & Banter',
    icon: Coffee,
    color: 'text-[#a3c98f] bg-[#1a2617] border-[#374e30]',
    desc: 'Dining table banter, morning oatmeal rituals, flea market finds, tea recipes, and gear talk.',
  },
  {
    id: 'philosophical_conversation',
    label: 'Acoustic Philosophy',
    icon: Compass,
    color: 'text-[#d6c496] bg-[#272317] border-[#574c2e]',
    desc: 'Acoustic resonance, human vulnerability, silence as frequency, and temporal impermanence.',
  },
];

const SUGGESTED_TOPICS: Record<InteractionMode, string[]> = {
  debate: [
    'Does algorithmic streaming force music into disposable 15-second hooks?',
    'Strict metadata cataloging vs spontaneous improvised chaos in the studio',
    'Analog tube saturation and tape hiss vs sterile digital precision',
  ],
  music_collaboration: [
    'Layering binaural whispering textures beneath a syncopated 140BPM sub-bass groove',
    'Composing a cinematic film cue pairing classical cello with crushed ceramic foley',
    'Arranging a radio-ready earworm hook over a sidechain-pumped vintage house beat',
  ],
  personal_issues: [
    'Living with sensory overload and misophonia when sharing a house with extroverts',
    'Generalized anxiety: crippling panic from sudden late-night director feedback',
    'The physical toll of performing a bubbly persona while hiding deep exhaustion',
  ],
  real_life_issues: [
    'Surviving high Portland rents while refusing to sell publishing catalog rights',
    'Neighbor noise complaints from late-night vegetable crushing and analog 808s',
    'Balancing commercial freelance revisions against personal artistic sanity',
  ],
  casual_conversation: [
    'Why Rowan’s identical 6:30 AM oatmeal breakfast routine baffles Tyler',
    'The odd assortment of metal items Benji brought home from the thrift store today',
    'The best noise-canceling headphones, earplugs, and blackout curtains for sleep',
  ],
  philosophical_conversation: [
    'Does great music require human suffering to genuinely resonate?',
    'Is silence the ultimate frequency or merely absence of data?',
    'The beauty of physical impermanence versus the illusion of infinite digital backups',
  ],
};

export const DiscourseManager: React.FC<DiscourseManagerProps> = ({
  personas,
  onSelectPersona,
  onTurnGenerated,
  onUpdatePersonaEmotion,
  savedSessions,
  onSaveSession,
  onLoadSession,
  onDeleteSession,
}) => {
  const inHousePersonas = personas.filter((p) => p.isInHouse);

  // Active discourse configuration
  const [mode, setMode] = useState<InteractionMode>('debate');
  const [topic, setTopic] = useState<string>(SUGGESTED_TOPICS.debate[0]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    inHousePersonas.slice(0, 3).map((p) => p.id)
  );
  const [messages, setMessages] = useState<DiscourseMessage[]>([]);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [userInput, setUserInput] = useState<string>('');
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoPlayTimerRef = useRef<number | null>(null);

  // Scroll to bottom on new message smoothly
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Keep participant list in sync if personas leave the house
  useEffect(() => {
    setSelectedParticipants((prev) => prev.filter((id) => inHousePersonas.some((p) => p.id === id)));
  }, [personas]);

  // Auto-play loop
  useEffect(() => {
    if (!isAutoPlaying) {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      return;
    }

    const scheduleNextTurn = () => {
      autoPlayTimerRef.current = window.setTimeout(async () => {
        if (!isGenerating && selectedParticipants.length > 0) {
          await generateNextTurn();
        }
        if (isAutoPlaying) scheduleNextTurn();
      }, 5200);
    };

    scheduleNextTurn();
    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [isAutoPlaying, isGenerating, selectedParticipants, mode, topic, messages]);

  const toggleParticipant = (id: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Generate next discourse turn via server
  const generateNextTurn = async (customUserPrompt?: string) => {
    if (selectedParticipants.length === 0) return;
    setIsGenerating(true);

    try {
      const activePersonaObjects = personas.filter((p) => selectedParticipants.includes(p.id));

      const res = await fetch('/api/discourse/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          topic,
          participants: activePersonaObjects,
          recentHistory: messages.slice(-8).map((m) => ({
            speakerId: m.speakerId,
            speakerName: m.speakerName,
            text: m.text,
            actionNote: m.actionNote,
            emotionalState: m.emotionalState,
          })),
          userIntervention: customUserPrompt || (userInput ? userInput : undefined),
        }),
      });

      const data = await res.json();
      if (data && data.text) {
        const newMessage: DiscourseMessage = {
          id: 'msg-' + Date.now(),
          speakerId: data.speakerId,
          speakerName: data.speakerName,
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionNote: data.actionNote,
          emotionalState: (data.emotionalState as EmotionalState) || 'neutral',
          musicalContribution: data.musicalContribution,
        };

        setMessages((prev) => [...prev, newMessage]);
        onTurnGenerated(newMessage);

        if (onUpdatePersonaEmotion && data.speakerId && data.emotionalState) {
          onUpdatePersonaEmotion(data.speakerId, data.emotionalState);
        }

        soundEngine.init();
        soundEngine.playTopline('C5', 0.15);

        if (customUserPrompt || userInput) {
          setUserInput('');
        }
      }
    } catch (e) {
      console.error('Failed to generate turn:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCurrentSession = () => {
    if (messages.length === 0) return;
    const session: DiscourseSession = {
      id: 'session-' + Date.now(),
      title: `${MODES.find((m) => m.id === mode)?.label}: ${topic.slice(0, 45)}...`,
      mode,
      topic,
      participants: selectedParticipants,
      messages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSaveSession(session);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  const handleExportMarkdown = () => {
    let md = `# The Division Street Commune • Discourse Log\n`;
    md += `**Aesthetic Mode:** ${mode.replace('_', ' ').toUpperCase()}\n`;
    md += `**Topic:** ${topic}\n`;
    md += `**Resident Artists:** ${selectedParticipants
      .map((id) => personas.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(', ')}\n\n---\n\n`;

    messages.forEach((m) => {
      md += `### ${m.speakerName} [${m.timestamp}] (${m.emotionalState})\n`;
      if (m.actionNote) md += `*${m.actionNote}*\n\n`;
      md += `"${m.text}"\n\n`;
      if (m.musicalContribution) {
        md += `> 🎵 **Musical Idea:** ${m.musicalContribution.description}\n\n`;
      }
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commune-discourse-${mode}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="discourse-manager-container"
      className="w-full h-full bg-[#191714] text-[#ede8de] flex flex-col border border-[#38332b] rounded-2xl overflow-hidden shadow-2xl"
    >
      {/* Artisanal Header */}
      <div className="bg-[#201d19] border-b border-[#38322a] px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#2e2922] border border-[#4d4438] flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 text-[#d97736]" />
          </div>
          <div>
            <h2 className="font-serif-artisanal text-base font-bold text-[#f5efe4] leading-tight tracking-wide">
              Resident Discourse Log
            </h2>
            <p className="text-[11px] text-[#9c9182]">Portland Studio Commune • Live Discourse</p>
          </div>
          <span className="ml-2 font-mono-artisanal text-[10px] px-2 py-0.5 rounded-full bg-[#2a2620] text-[#c49b4d] border border-[#443c32]">
            {messages.length} Exchanges
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="save-session-btn"
            onClick={handleSaveCurrentSession}
            disabled={messages.length === 0}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
              saveSuccessNotice
                ? 'bg-[#5b6e4e] text-white border-[#7a8c6e]'
                : 'bg-[#2a2620] hover:bg-[#353029] text-[#ded7c8] border-[#443c32] disabled:opacity-50'
            }`}
          >
            {saveSuccessNotice ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Bookmark className="w-3.5 h-3.5 text-[#c49b4d]" />}
            {saveSuccessNotice ? 'Archived' : 'Archive Log'}
          </button>

          <button
            id="view-history-btn"
            onClick={() => setShowHistoryModal(true)}
            className="px-3 py-1.5 bg-[#2a2620] hover:bg-[#353029] text-[#ded7c8] text-xs font-medium rounded-lg border border-[#443c32] flex items-center gap-1.5 transition-all"
          >
            <History className="w-3.5 h-3.5 text-[#a855f7]" />
            Archives ({savedSessions.length})
          </button>

          <button
            id="export-transcript-btn"
            onClick={handleExportMarkdown}
            disabled={messages.length === 0}
            className="p-1.5 bg-[#2a2620] hover:bg-[#353029] text-[#ded7c8] rounded-lg border border-[#443c32] disabled:opacity-50 transition-all"
            title="Export markdown log"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Aesthetic Mode Selector Strip */}
      <div className="bg-[#1c1a16] border-b border-[#332e26] px-4 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 custom-scrollbar">
        <span className="font-serif-artisanal italic text-xs text-[#9c9182] shrink-0 mr-1.5">Aesthetic Mode:</span>
        {MODES.map((m) => {
          const Icon = m.icon;
          const isSelected = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id);
                setTopic(SUGGESTED_TOPICS[m.id][0]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all border ${
                isSelected
                  ? `${m.color} ring-1 ring-white/20 font-semibold shadow-sm`
                  : 'bg-[#24211b] hover:bg-[#2c2822] text-[#aba090] border-[#3a352d]'
              }`}
            >
              <Icon className="w-3 h-3" />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Topic & Participant Selection Bar */}
      <div className="bg-[#181613] px-4 py-2.5 border-b border-[#332e26] flex flex-col gap-2 shrink-0 text-xs">
        {/* Topic Input with suggested prompts */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="font-serif-artisanal text-xs text-[#b8ad9c] font-semibold shrink-0">Inquiry Topic:</span>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Prompt or thematic inquiry for the residents..."
              className="flex-1 bg-[#12110e] border border-[#3e372e] rounded-lg px-3 py-1 text-[#ede8de] text-xs focus:outline-none focus:border-[#d97736]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-[#8a8070] custom-scrollbar">
            <span className="shrink-0 text-[#6e6659]">Suggestions:</span>
            {SUGGESTED_TOPICS[mode].map((sTopic, i) => (
              <button
                key={i}
                onClick={() => setTopic(sTopic)}
                className="shrink-0 px-2 py-0.5 rounded bg-[#221f1a] hover:bg-[#2c2822] border border-[#38332a] text-[#b0a696] hover:text-[#ede8de] transition-colors truncate max-w-xs"
              >
                "{sTopic.slice(0, 52)}..."
              </button>
            ))}
          </div>
        </div>

        {/* Participating Resident Artists */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#29251f]">
          <span className="text-[11px] font-medium text-[#8e8474] shrink-0">In Discussion:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {inHousePersonas.map((persona) => {
              const isSelected = selectedParticipants.includes(persona.id);
              return (
                <button
                  key={persona.id}
                  onClick={() => toggleParticipant(persona.id)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 border ${
                    isSelected
                      ? 'bg-[#312a20] text-[#e8d5b5] border-[#c49b4d] shadow-sm'
                      : 'bg-[#1e1c18] text-[#786e60] border-[#312c24] hover:text-[#b8ad9c]'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: persona.visualAvatar?.color || '#d97736' }}
                  />
                  {persona.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Discourse Transcript Stream (Layout Shift Eliminated via stable gutter) */}
      <div className="flex-1 discourse-scroll-container p-4 space-y-3.5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#786e60]">
            <Disc className="w-10 h-10 text-[#423c33] mb-3 animate-spin-slow" />
            <h3 className="font-serif-artisanal text-base font-bold text-[#cfc7b8]">The Hearth is Peaceful</h3>
            <p className="text-xs max-w-md mt-1 text-[#8f8576] leading-relaxed">
              Select who joins the discourse above, set an inquiry topic, and observe how their creative dispositions clash, harmonize, or produce new analog musical sketches.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => generateNextTurn()}
                disabled={isGenerating || selectedParticipants.length === 0}
                className="px-4 py-2 bg-[#c86236] hover:bg-[#b5552b] text-white text-xs font-semibold rounded-xl shadow border border-[#d97736]/40 flex items-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#ffedd5]" /> Begin Discussion
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const speaker = personas.find((p) => p.id === msg.speakerId);
            const avatarColor = speaker?.visualAvatar?.color || '#c49b4d';
            const isUser = msg.speakerId === 'user';

            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 p-3.5 rounded-xl border transition-all ${
                  isUser
                    ? 'bg-[#221f1a] border-[#c49b4d]/50 ml-10'
                    : 'bg-[#1f1d19] border-[#383229] hover:border-[#4d4437] mr-2'
                }`}
              >
                {/* Speaker Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: avatarColor }}
                    />
                    <button
                      onClick={() => speaker && onSelectPersona(speaker)}
                      className="font-serif-artisanal font-bold text-sm hover:underline text-[#f3eee5] flex items-center gap-1.5"
                    >
                      {msg.speakerName}
                      {speaker?.stageName && (
                        <span className="font-sans text-[10px] font-normal text-[#9e9382]">
                          ({speaker.stageName})
                        </span>
                      )}
                    </button>
                    <span className="font-mono-artisanal text-[9px] px-1.5 py-0.5 rounded bg-[#2c2821] text-[#c49b4d] uppercase tracking-wider">
                      {msg.emotionalState}
                    </span>
                  </div>
                  <span className="font-mono-artisanal text-[10px] text-[#6d6457]">{msg.timestamp}</span>
                </div>

                {/* Stage Action Note */}
                {msg.actionNote && (
                  <p className="text-xs text-[#a89d8d] italic pl-4 border-l border-[#4a4235] my-0.5">
                    *{msg.actionNote}*
                  </p>
                )}

                {/* Spoken Dialogue */}
                <p className="text-xs text-[#ded7c8] pl-4 leading-relaxed font-sans">{msg.text}</p>

                {/* Musical Contribution Tape Cue Card */}
                {msg.musicalContribution && (
                  <div className="mt-2 ml-4 bg-[#261d2b] border border-[#5d3b66] rounded-lg p-2.5 text-xs text-[#e4c9ea] flex items-start gap-2.5">
                    <Music className="w-4 h-4 text-[#d4a0e8] shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-artisanal text-[10px] uppercase font-bold tracking-wider text-[#e6b9f7]">
                          Recorded Sketch • {msg.musicalContribution.trackType}
                        </span>
                      </div>
                      <p className="text-[#d8c3df] text-xs mt-0.5 leading-normal">
                        {msg.musicalContribution.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Facilitation Desk: Chime In, Auto-Discourse, Turn Trigger */}
      <div className="bg-[#201d19] border-t border-[#38322a] p-3 flex flex-col gap-2 shrink-0">
        {/* Facilitator Chime In Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateNextTurn(userInput)}
            placeholder="Intervene or pose a question to the room..."
            className="flex-1 bg-[#14120f] border border-[#3e372e] rounded-xl px-3.5 py-2 text-xs text-[#ede8de] placeholder-[#6e6557] focus:outline-none focus:border-[#c86236]"
          />
          <button
            id="chime-in-btn"
            onClick={() => generateNextTurn(userInput)}
            disabled={isGenerating || !userInput.trim()}
            className="px-3.5 py-2 bg-[#c86236] hover:bg-[#b5552b] disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow flex items-center gap-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" /> Send Inquiry
          </button>
        </div>

        {/* Playback & Turn Controls */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-2">
            <button
              id="discourse-auto-toggle-btn"
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                isAutoPlaying
                  ? 'bg-[#a35e39] text-white ring-1 ring-[#e58a52]'
                  : 'bg-[#29251f] hover:bg-[#332e26] text-[#cfc7b8] border border-[#3e372e]'
              }`}
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-200" /> Pause Auto Loop
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-[#c49b4d]" /> Auto Discourse
                </>
              )}
            </button>

            <button
              id="discourse-next-turn-btn"
              onClick={() => generateNextTurn()}
              disabled={isGenerating || selectedParticipants.length === 0}
              className="px-3 py-1.5 bg-[#29251f] hover:bg-[#332e26] text-[#ded7c8] font-medium rounded-lg border border-[#3e372e] flex items-center gap-1.5 disabled:opacity-40 transition-all"
            >
              <ArrowRight className="w-3.5 h-3.5 text-[#d97736]" />
              {isGenerating ? 'Contemplating...' : 'Next Persona'}
            </button>

            <button
              id="clear-transcript-btn"
              onClick={() => setMessages([])}
              className="px-2 py-1 text-[#786e60] hover:text-[#d97736] text-xs transition-colors"
              title="Clear transcript log"
            >
              Clear
            </button>
          </div>

          <span className="font-mono-artisanal text-[10px] text-[#7d7466]">
            {selectedParticipants.length} voices present
          </span>
        </div>
      </div>

      {/* Saved Sessions Archive Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1f1d19] border border-[#443d34] rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#383229] flex items-center justify-between">
              <h3 className="font-serif-artisanal text-base font-bold text-[#f5efe4] flex items-center gap-2">
                <History className="w-4 h-4 text-[#c49b4d]" />
                Archived Discourse Sessions
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-[#9e9382] hover:text-[#ede8de] text-xs font-semibold px-2 py-1 rounded hover:bg-[#2d2922]"
              >
                Close
              </button>
            </div>

            <div className="p-4 flex-1 discourse-scroll-container space-y-2.5">
              {savedSessions.length === 0 ? (
                <div className="text-center py-8 text-[#786e60] text-xs">
                  No archived logs found. Save active discourse sessions to revisit anytime.
                </div>
              ) : (
                savedSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3 bg-[#181613] rounded-xl border border-[#353028] hover:border-[#4a4338] flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif-artisanal text-sm font-bold text-[#ede8de] truncate">{session.title}</h4>
                      <p className="text-[11px] text-[#9c9182] truncate mt-0.5">{session.topic}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-[#6d6457] font-mono-artisanal">
                        <span>{session.messages.length} exchanges</span>
                        <span>•</span>
                        <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onLoadSession(session);
                          setMode(session.mode);
                          setTopic(session.topic);
                          setMessages(session.messages);
                          setSelectedParticipants(session.participants);
                          setShowHistoryModal(false);
                        }}
                        className="px-3 py-1 bg-[#c86236] hover:bg-[#b5552b] text-white rounded-lg text-xs font-medium transition-all"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => onDeleteSession(session.id)}
                        className="p-1.5 text-[#786e60] hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
