import { Persona, PersonaSubAgentState, SubAgentThought, PersonaActionDecision, RoomId, CharacterActionType } from '../../types';
import { soundEngine } from '../../audio/soundEngine';

export interface SubAgentEventListener {
  onStateChange?: (agentStates: Map<string, PersonaSubAgentState>) => void;
  onDecision?: (personaId: string, decision: PersonaActionDecision) => void;
}

/**
 * Autonomous Sub-Agent Engine.
 * Manages an individual, dedicated autonomous cognitive cycle for each character
 * in the Portland Craftsman house commune.
 */
export class SubAgentManager {
  private agentStates: Map<string, PersonaSubAgentState> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private personas: Persona[] = [];
  private listeners: Set<SubAgentEventListener> = new Set();
  private isGlobalAutonomous: boolean = true;

  constructor() {}

  public subscribe(listener: SubAgentEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyStateChange() {
    for (const listener of this.listeners) {
      listener.onStateChange?.(new Map(this.agentStates));
    }
  }

  public getAgentStates(): Map<string, PersonaSubAgentState> {
    return new Map(this.agentStates);
  }

  public getAgentState(personaId: string): PersonaSubAgentState | undefined {
    return this.agentStates.get(personaId);
  }

  /**
   * Synchronizes active sub-agents with current house personas.
   */
  public syncPersonas(currentPersonas: Persona[]) {
    this.personas = currentPersonas;

    // Remove sub-agents for personas no longer in house
    const activePersonaIds = new Set(currentPersonas.filter((p) => p.isInHouse).map((p) => p.id));

    for (const [id, timer] of this.timers) {
      if (!activePersonaIds.has(id)) {
        clearTimeout(timer);
        this.timers.delete(id);
      }
    }

    // Initialize or refresh sub-agents
    currentPersonas.forEach((p, index) => {
      if (!p.isInHouse) return;

      if (!this.agentStates.has(p.id)) {
        // Derive initial goal based on personality archetype
        const initialGoal = this.deriveInitialGoal(p);
        const newState: PersonaSubAgentState = {
          personaId: p.id,
          phase: 'observing',
          currentGoal: initialGoal,
          mentalEnergy: Math.max(40, Math.min(95, 100 - (p.ocean?.n || 50) * 0.4)),
          recentThoughts: [
            {
              id: `${p.id}-init-${Date.now()}`,
              timestamp: Date.now(),
              text: p.lastThought || `Settled into ${p.currentRoom}. ${initialGoal}`,
              type: 'observation',
            },
          ],
          lastActionTime: Date.now(),
          actionDurationSeconds: 16 + (index % 4) * 6,
          isAutonomous: true,
        };

        this.agentStates.set(p.id, newState);
        this.scheduleNextTick(p.id, 8000 + index * 4000);
      }
    });

    this.notifyStateChange();
  }

  private deriveInitialGoal(persona: Persona): string {
    const stage = persona.stageName?.toLowerCase() || '';
    const name = persona.name?.toLowerCase() || '';

    if (stage.includes('archivist') || name.includes('rowan')) {
      return 'Maintain catalog metadata and examine reel-to-reel tape head alignment';
    }
    if (stage.includes('shredder') || name.includes('malik')) {
      return 'Test 12AX7 preamp tube warmth on vintage analog synthesizer circuits';
    }
    if (stage.includes('modular') || name.includes('maya')) {
      return 'Route control voltage clock signals into polyrhythmic Eurorack gate dividers';
    }
    if (stage.includes('purist') || name.includes('jess')) {
      return 'Audit acoustic room resonance and test condenser microphone polar patterns';
    }
    if (stage.includes('ambient') || name.includes('david')) {
      return 'Listen to rain against craftsman cedar shingles and build drone texture';
    }
    if (stage.includes('dub') || name.includes('benji')) {
      return 'Feed spring reverb into analog space echo tape loop feedback chain';
    }
    if (stage.includes('poet') || name.includes('lily')) {
      return 'Jot handwritten stream-of-consciousness lyric fragments with peppermint tea';
    }
    return 'Absorb ambient acoustic harmonics of the communal house';
  }

  /**
   * Schedules an autonomous decision tick for a specific sub-agent
   */
  private scheduleNextTick(personaId: string, delayMs: number) {
    if (this.timers.has(personaId)) {
      clearTimeout(this.timers.get(personaId));
      this.timers.delete(personaId);
    }

    const timer = setTimeout(() => {
      this.tickSubAgent(personaId);
    }, delayMs);

    this.timers.set(personaId, timer);
  }

  /**
   * Executes a cognitive deliberation cycle for a single sub-agent.
   */
  public async tickSubAgent(personaId: string, forcedUserDirective?: string) {
    const state = this.agentStates.get(personaId);
    const persona = this.personas.find((p) => p.id === personaId);

    if (!state || !persona || !persona.isInHouse) {
      return;
    }

    if (!this.isGlobalAutonomous && !forcedUserDirective) {
      // If autonomy is globally paused, re-check in 10 seconds
      this.scheduleNextTick(personaId, 10000);
      return;
    }

    if (!state.isAutonomous && !forcedUserDirective) {
      return;
    }

    // 1. Transition to Deliberating Phase
    state.phase = 'deliberating';
    this.notifyStateChange();

    try {
      // Gather sensory context for this sub-agent
      const roommatesInSameRoom = this.personas.filter(
        (p) => p.id !== persona.id && p.isInHouse && p.currentRoom === persona.currentRoom
      );

      const roommatesContext = roommatesInSameRoom
        .map((p) => `${p.name} (${p.currentActivity || 'present'})`)
        .join(', ') || 'alone in this room';

      const directive = forcedUserDirective || state.userDirective;

      // Call dedicated agent-step backend endpoint
      const response = await fetch('/api/persona/agent-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona,
          currentRoom: persona.currentRoom,
          currentHotspot: persona.currentHotspot,
          allPersonas: this.personas,
          recentEvents: [
            `Current goal: ${state.currentGoal}`,
            `Roommates present: ${roommatesContext}`,
          ],
          userDirective: directive,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sub-agent HTTP error: ${response.status}`);
      }

      const decision: PersonaActionDecision = await response.json();

      // Clear one-time user directive after consumption
      if (forcedUserDirective || state.userDirective) {
        state.userDirective = undefined;
      }

      // 2. Append thought to sub-agent stream
      if (decision.thought) {
        state.recentThoughts.unshift({
          id: `${persona.id}-${Date.now()}`,
          timestamp: Date.now(),
          text: decision.thought,
          type: 'internal_monologue',
        });
        if (state.recentThoughts.length > 25) {
          state.recentThoughts.pop();
        }
      }

      if (decision.spokenDialogue) {
        state.recentThoughts.unshift({
          id: `${persona.id}-spk-${Date.now()}`,
          timestamp: Date.now(),
          text: `"${decision.spokenDialogue}"`,
          type: 'speech',
        });
      }

      // 3. Update internal cognitive state
      state.phase = 'acting';
      state.lastActionTime = Date.now();

      // Compute dynamic action duration based on Conscientiousness & Neuroticism
      const c = persona.ocean?.c || 50;
      const n = persona.ocean?.n || 50;
      const baseDuration = 18 + Math.round((c / 100) * 16) - Math.round((n / 100) * 8);
      state.actionDurationSeconds = Math.max(14, Math.min(42, baseDuration));

      // Subtle mental energy adjustment
      state.mentalEnergy = Math.max(20, Math.min(100, state.mentalEnergy + (Math.random() * 8 - 4)));

      // If actionDescription hints at a new goal, update currentGoal
      if (decision.actionDescription) {
        state.currentGoal = decision.actionDescription;
      }

      this.notifyStateChange();

      // 4. Trigger audio sound cue
      if (decision.soundTrigger && decision.soundTrigger !== 'none') {
        soundEngine.playActionSound(decision.soundTrigger);
      }

      // 5. Notify scene controller of new action decision
      for (const listener of this.listeners) {
        listener.onDecision?.(personaId, decision);
      }

      // Schedule next autonomous tick
      this.scheduleNextTick(personaId, state.actionDurationSeconds * 1000);
    } catch (err) {
      console.warn(`[SubAgent ${persona.name}] tick error:`, err);
      state.phase = 'acting';
      this.notifyStateChange();
      // Retry in 12 seconds
      this.scheduleNextTick(personaId, 12000);
    }
  }

  /**
   * Injects a direct user command or inspiration to a specific persona's sub-agent.
   */
  public sendUserDirective(personaId: string, directiveText: string) {
    const state = this.agentStates.get(personaId);
    if (!state) return;

    state.userDirective = directiveText;
    state.recentThoughts.unshift({
      id: `${personaId}-dir-${Date.now()}`,
      timestamp: Date.now(),
      text: `DIRECTIVE RECEIVED: "${directiveText}"`,
      type: 'action_plan',
    });
    this.notifyStateChange();

    // Trigger immediate deliberation with this directive
    this.tickSubAgent(personaId, directiveText);
  }

  public setGlobalAutonomy(enabled: boolean) {
    this.isGlobalAutonomous = enabled;
    if (enabled) {
      // Kick off any stalled agents
      this.agentStates.forEach((_state, pId) => {
        this.scheduleNextTick(pId, 2000 + Math.random() * 5000);
      });
    }
    this.notifyStateChange();
  }

  public setAgentAutonomy(personaId: string, enabled: boolean) {
    const state = this.agentStates.get(personaId);
    if (state) {
      state.isAutonomous = enabled;
      if (enabled) {
        this.scheduleNextTick(personaId, 2000);
      }
      this.notifyStateChange();
    }
  }

  public destroy() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.listeners.clear();
  }
}

export const subAgentManager = new SubAgentManager();
