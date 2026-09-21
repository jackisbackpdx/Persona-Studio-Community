import React, { useState, useEffect } from 'react';
import { Persona, PersonaSubAgentState } from '../../types';
import { subAgentManager } from './SubAgentManager';
import { Brain, Sparkles, Send, Play, Pause, Zap, Activity, MessageSquare, ChevronDown, ChevronUp, Radio } from 'lucide-react';

interface SubAgentControlDeckProps {
  personas: Persona[];
  activePersonaId: string | null;
  onSelectPersona: (persona: Persona) => void;
}

export const SubAgentControlDeck: React.FC<SubAgentControlDeckProps> = ({
  personas,
  activePersonaId,
  onSelectPersona,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentStates, setAgentStates] = useState<Map<string, PersonaSubAgentState>>(
    subAgentManager.getAgentStates()
  );
  const [directiveInput, setDirectiveInput] = useState('');
  const [isGlobalAuto, setIsGlobalAuto] = useState(true);

  // Subscribe to SubAgentManager updates
  useEffect(() => {
    const unsubscribe = subAgentManager.subscribe({
      onStateChange: (newStates) => {
        setAgentStates(newStates);
      },
    });
    return unsubscribe;
  }, []);

  const activeHousePersonas = personas.filter((p) => p.isInHouse);

  // Sync selectedAgentId when activePersonaId changes
  useEffect(() => {
    if (activePersonaId) {
      setSelectedAgentId(activePersonaId);
    } else if (!selectedAgentId && activeHousePersonas.length > 0) {
      setSelectedAgentId(activeHousePersonas[0].id);
    }
  }, [activePersonaId, activeHousePersonas]);

  const currentPersona = activeHousePersonas.find((p) => p.id === selectedAgentId) || activeHousePersonas[0];
  const currentState = currentPersona ? agentStates.get(currentPersona.id) : undefined;

  const handleSendDirective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directiveInput.trim() || !currentPersona) return;

    subAgentManager.sendUserDirective(currentPersona.id, directiveInput.trim());
    setDirectiveInput('');
  };

  const handleTriggerTick = (personaId: string) => {
    subAgentManager.tickSubAgent(personaId);
  };

  const handleToggleGlobalAuto = () => {
    const next = !isGlobalAuto;
    setIsGlobalAuto(next);
    subAgentManager.setGlobalAutonomy(next);
  };

  const handleToggleAgentAuto = (personaId: string, current: boolean) => {
    subAgentManager.setAgentAutonomy(personaId, !current);
  };

  if (activeHousePersonas.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 z-30 max-w-md w-[calc(100%-2rem)] md:w-[420px]">
      {/* Floating Header Pill */}
      <div className="bg-[#1e1712]/95 backdrop-blur-md rounded-2xl border border-[#c49b4d]/40 shadow-2xl overflow-hidden transition-all duration-300">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#2a2019] transition-colors select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#c86236]/20 border border-[#c86236]/40 flex items-center justify-center text-[#c86236]">
              <Brain className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#f5efe4]">
                  Sub-Agent Neural Network
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#5b6e4e]/30 text-[#a3b899] border border-[#5b6e4e]/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#86efac] animate-ping" />
                  {activeHousePersonas.length} Active
                </span>
              </div>
              <p className="text-[11px] text-[#b3a898] truncate max-w-[240px]">
                {currentPersona
                  ? `${currentPersona.name}: ${currentState?.currentGoal || 'Deliberating actions...'}`
                  : 'Independent resident agents running concurrently'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleGlobalAuto();
              }}
              title={isGlobalAuto ? 'Pause all autonomous agents' : 'Resume autonomous cycles'}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                isGlobalAuto
                  ? 'bg-[#5b6e4e]/30 text-[#86efac] border-[#5b6e4e]/60'
                  : 'bg-[#3b2d22] text-[#9c9182] border-[#523e2f]'
              }`}
            >
              {isGlobalAuto ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <button
              className="text-[#b3a898] hover:text-[#f5efe4] transition-colors p-1"
              aria-label="Toggle Deck"
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expandable Monitor & Control Deck */}
        {isOpen && (
          <div className="border-t border-[#3a2d24] p-3.5 space-y-3.5 bg-[#18120e]/95 max-h-[460px] overflow-y-auto">
            {/* Persona Selection Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {activeHousePersonas.map((p) => {
                const st = agentStates.get(p.id);
                const isSelected = p.id === (currentPersona?.id || '');
                const phase = st?.phase || 'acting';

                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedAgentId(p.id);
                      onSelectPersona(p);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-[#c86236] text-white border-[#e07a4f] shadow-md scale-[1.02]'
                        : 'bg-[#261d16] text-[#d6cdbf] border-[#423327] hover:border-[#c49b4d]/50'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: p.visualAvatar?.color || '#c49b4d' }}
                    />
                    <span>{p.name.split(' ')[0]}</span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                        phase === 'deliberating'
                          ? 'bg-purple-900/60 text-purple-200 animate-pulse'
                          : phase === 'acting'
                          ? 'bg-emerald-900/60 text-emerald-200'
                          : 'bg-amber-900/60 text-amber-200'
                      }`}
                    >
                      {phase === 'deliberating' ? 'delib' : phase}
                    </span>
                  </button>
                );
              })}
            </div>

            {currentPersona && (
              <>
                {/* Agent Profile & Real-Time Cognitive Bar */}
                <div className="p-3 bg-[#221a14] rounded-xl border border-[#3f3125] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#f5efe4]">
                          {currentPersona.name}
                        </span>
                        <span className="text-xs text-[#c49b4d] font-serif italic">
                          ({currentPersona.stageName})
                        </span>
                      </div>
                      <div className="text-[11px] text-[#9c9182] flex items-center gap-2 mt-0.5">
                        <span className="capitalize">Room: {currentPersona.currentRoom?.replace('_', ' ')}</span>
                        <span>•</span>
                        <span className="capitalize">Mood: {currentPersona.currentEmotionalState}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleAgentAuto(currentPersona.id, currentState?.isAutonomous ?? true)}
                        className={`text-[10px] font-semibold px-2 py-1 rounded-lg border flex items-center gap-1 transition-colors ${
                          currentState?.isAutonomous
                            ? 'bg-[#5b6e4e]/30 text-[#86efac] border-[#5b6e4e]/50'
                            : 'bg-[#33261c] text-[#8c8072] border-[#473628]'
                        }`}
                        title="Toggle autonomous decision cycle for this sub-agent"
                      >
                        <Radio className="w-3 h-3" />
                        {currentState?.isAutonomous ? 'Auto' : 'Manual'}
                      </button>

                      <button
                        onClick={() => handleTriggerTick(currentPersona.id)}
                        disabled={currentState?.phase === 'deliberating'}
                        className="text-[10px] font-semibold px-2 py-1 bg-[#c86236]/30 hover:bg-[#c86236]/50 text-[#fca5a5] border border-[#c86236]/60 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                        title="Force immediate cognitive deliberation"
                      >
                        <Zap className="w-3 h-3" />
                        Deliberate
                      </button>
                    </div>
                  </div>

                  {/* Mental Energy Gauge & Current Goal */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#a89d8f] flex items-center gap-1">
                        <Activity className="w-3 h-3 text-[#c49b4d]" /> Creative Stamina
                      </span>
                      <span className="font-mono text-[#f5efe4] text-[10px]">
                        {Math.round(currentState?.mentalEnergy || 75)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#17110d] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#c86236] to-[#c49b4d] rounded-full transition-all duration-500"
                        style={{ width: `${currentState?.mentalEnergy || 75}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-1 text-[11px] text-[#e0d6c7] bg-[#1a130e] p-2 rounded-lg border border-[#33261d]">
                    <span className="text-[#c49b4d] font-semibold mr-1.5">Current Objective:</span>
                    <span>{currentState?.currentGoal || 'Observing commune harmonies...'}</span>
                  </div>
                </div>

                {/* Sub-Agent Stream of Consciousness */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9c9182] flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#c86236]" /> Cognitive Thought Stream
                    </span>
                    <span className="text-[10px] text-[#7a6f61] font-mono">
                      {currentState?.recentThoughts?.length || 0} cycles
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                    {(currentState?.recentThoughts || []).slice(0, 4).map((thought) => (
                      <div
                        key={thought.id}
                        className={`text-[11px] p-2 rounded-lg border leading-relaxed ${
                          thought.type === 'speech'
                            ? 'bg-[#291f16] border-[#c49b4d]/50 text-[#fef08a] italic'
                            : thought.type === 'action_plan'
                            ? 'bg-[#2b1e16] border-[#c86236]/60 text-[#fed7aa]'
                            : 'bg-[#1b1510] border-[#382a20] text-[#d6cdbf]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[9px] text-[#8c8072] mb-0.5">
                          <span className="uppercase tracking-wider font-mono font-semibold">
                            {thought.type.replace('_', ' ')}
                          </span>
                          <span>{new Date(thought.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                        <p>{thought.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* User Prompt / Directive Injection */}
                <form onSubmit={handleSendDirective} className="pt-1 flex gap-1.5">
                  <input
                    type="text"
                    value={directiveInput}
                    onChange={(e) => setDirectiveInput(e.target.value)}
                    placeholder={`Direct ${currentPersona.name.split(' ')[0]} (e.g., 'Work on synth loop')...`}
                    className="flex-1 bg-[#17110d] border border-[#3f3125] focus:border-[#c86236] rounded-xl px-3 py-1.5 text-xs text-[#f5efe4] placeholder-[#736758] focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!directiveInput.trim()}
                    className="px-3 py-1.5 bg-[#c86236] hover:bg-[#b0532b] text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-40 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Guide</span>
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
