export type InteractionMode =
  | 'debate'
  | 'music_collaboration'
  | 'personal_issues'
  | 'real_life_issues'
  | 'casual_conversation'
  | 'philosophical_conversation';

export type RoomId = 'living_room' | 'dining_room' | 'studio';

export type WeatherType =
  | 'light_rain'
  | 'heavy_rain'
  | 'cloudy'
  | 'partially_cloudy'
  | 'thunderstorm'
  | 'snow'
  | 'smoke';

export type SeasonType = 'spring' | 'summer' | 'fall' | 'winter';

export interface OutdoorEvent {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  type: 'traffic' | 'wildlife' | 'weather' | 'neighborhood';
}

export interface CharacterJamState {
  isCollaborative: boolean;
  activePerformers: Array<{
    personaId: string;
    personaName: string;
    stageName: string;
    instrument: string;
    actionType: CharacterActionType;
    musicalRole: 'bass' | 'harmony' | 'melody' | 'percussion' | 'ambience';
  }>;
  synergyTitle?: string;
  genreFusion?: string;
  bpm: number;
  musicalKey: string;
}

export type CharacterActionType =
  | 'idle_standing'
  | 'walking'
  | 'sitting'
  | 'playing_synth'
  | 'spinning_vinyl'
  | 'warming_fireplace'
  | 'relaxing_couch'
  | 'recording_mic'
  | 'playing_guitar'
  | 'playing_piano'
  | 'playing_acoustic_drums'
  | 'playing_electronic_drums'
  | 'working_at_desk'
  | 'drinking_tea'
  | 'pacing_talking';

export interface PersonaActionDecision {
  personaId: string;
  thought: string;
  spokenDialogue: string | null;
  targetRoom: RoomId;
  targetHotspot: string;
  actionType: CharacterActionType;
  actionDescription: string;
  updatedEmotionalState: EmotionalState;
  soundTrigger?:
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
    | 'none';
}

export type EmotionalState =
  | 'neutral'
  | 'anxious'
  | 'hyper-focused'
  | 'inspired'
  | 'exhausted'
  | 'irritated'
  | 'euphoric'
  | 'overwhelmed';

export interface BioDemographics {
  age: number;
  gender: string;
  mbti: string;
}

export interface OceanScores {
  o: number; // Openness
  c: number; // Conscientiousness
  e: number; // Extraversion
  a: number; // Agreeableness
  n: number; // Neuroticism
}

export interface DSM5Traits {
  [condition: string]: number | string;
}

export interface NeuroAesthetics {
  genetics: string;
  visuals: string;
}

export interface EconomicsProfile {
  purchaseDecisions: string;
}

export interface VisualAvatar {
  color: string;
  secondaryColor: string;
  hairStyle: string;
  accessory: string;
  clothing: string;
  avatarIcon?: string;
}

export interface Persona {
  id: string;
  name: string;
  stageName: string;
  bioDemographics: BioDemographics;
  ocean: OceanScores;
  dsm5: DSM5Traits;
  childhood: string;
  neuroAesthetics: NeuroAesthetics;
  economics: EconomicsProfile;
  dailyLifeWalkthrough: string;
  instruments: string[];
  skills: string[];
  strengths: string[];
  weaknesses: string[];
  voiceCommunicationStyle: string;
  socialBehaviorPatterns: string;
  isInHouse: boolean;
  currentRoom: RoomId;
  currentHotspot?: string;
  currentActivity?: string;
  currentActionType?: CharacterActionType;
  lastThought?: string;
  currentEmotionalState: EmotionalState;
  visualAvatar: VisualAvatar;
}

export interface MusicalContribution {
  trackType: 'synth' | '808' | 'drums' | 'foley' | 'topline';
  description: string;
  pattern?: number[]; // 16 steps
}

export interface DiscourseMessage {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: string;
  actionNote?: string;
  emotionalState: EmotionalState;
  musicalContribution?: MusicalContribution;
}

export interface DiscourseSession {
  id: string;
  title: string;
  mode: InteractionMode;
  topic: string;
  participants: string[]; // Persona IDs
  messages: DiscourseMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface DAWTrack {
  id: string;
  name: string;
  type: 'synth' | '808' | 'drums' | 'foley' | 'topline';
  color: string;
  volume: number; // 0 to 1
  pan: number; // -1 to 1
  isMuted: boolean;
  isSolo: boolean;
  steps: boolean[]; // 16 steps
  notes: string[]; // 16 step notes e.g. "C4", "E4"
}

export interface DAWProject {
  title: string;
  bpm: number;
  swing: number;
  tracks: DAWTrack[];
}

// ==================== SUB-AGENT COGNITIVE ENGINE TYPES ====================
export type SubAgentPhase = 'observing' | 'deliberating' | 'acting' | 'reflecting';

export interface SubAgentThought {
  id: string;
  timestamp: number;
  text: string;
  type: 'observation' | 'deliberation' | 'internal_monologue' | 'speech' | 'action_plan';
}

export interface PersonaSubAgentState {
  personaId: string;
  phase: SubAgentPhase;
  currentGoal: string;
  mentalEnergy: number; // 0 to 100
  recentThoughts: SubAgentThought[];
  lastActionTime: number;
  actionDurationSeconds: number;
  isAutonomous: boolean;
  userDirective?: string;
  attentionTarget?: string; // another persona's name or hotspot
}

