import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization of Gemini client
let genAiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Warning: GEMINI_API_KEY is not set. API endpoints will use high-fidelity fallback generators.');
    }
    genAiClient = new GoogleGenAI({
      apiKey: apiKey || 'dummy-key',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAiClient;
}

// Rate-limit & high-demand cooldown management
let geminiRateLimitUntil = 0;

function isGeminiQuotaOrDemandError(err: any): boolean {
  if (!err) return false;
  const status = err.status || err.code;
  const msg = String(err.message || '').toLowerCase();
  return (
    status === 429 ||
    status === 503 ||
    msg.includes('429') ||
    msg.includes('503') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('high demand') ||
    msg.includes('rate-limit') ||
    msg.includes('rate_limit') ||
    msg.includes('unavailable')
  );
}

function handleGeminiRateLimit(err: any, context: string): void {
  let cooldownMs = 60000;
  try {
    const delayStr = err?.details?.[0]?.retryDelay || '';
    const match = delayStr.match(/(\d+)/);
    if (match) {
      cooldownMs = (parseInt(match[1], 10) + 2) * 1000;
    }
  } catch {}
  geminiRateLimitUntil = Math.max(geminiRateLimitUntil, Date.now() + cooldownMs);
  console.warn(`[${context}] Gemini API quota/capacity reached. Seamlessly activating high-fidelity psychological engine for ${Math.round(cooldownMs / 1000)}s.`);
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// Endpoint: Generate discourse turn among personas
app.post('/api/discourse/turn', async (req, res) => {
  try {
    const {
      mode,
      topic,
      participants, // Array of full persona objects
      conversationHistory, // Array of past messages: { speakerName, text, actionNote }
      activeSpeakerId, // Optional: specific speaker or null for automatic selection
      userIntervention, // Optional user prompt or guiding message
    } = req.body;

    if (!participants || participants.length === 0) {
      return res.status(400).json({ error: 'At least one participant is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && Date.now() >= geminiRateLimitUntil) {
      try {
        const ai = getGenAI();

        const participantsSummary = participants
          .map((p: any) => {
            return `ID: "${p.id}", NAME: "${p.name}" (${p.stageName || p.name})
- Demographics: Age ${p.bioDemographics?.age}, Gender: ${p.bioDemographics?.gender}, MBTI: ${p.bioDemographics?.mbti}
- OCEAN: O:${p.ocean?.o}%, C:${p.ocean?.c}%, E:${p.ocean?.e}%, A:${p.ocean?.a}%, N:${p.ocean?.n}%
- DSM-5 / Neuro-traits: ${JSON.stringify(p.dsm5 || {})}
- Childhood & Background: ${p.childhood}
- Neuro-Aesthetics & Economics: ${p.neuroAesthetics?.visuals || ''} | ${p.economics?.purchaseDecisions || ''}
- Instruments & Sound: ${(p.instruments || []).join(', ')}
- Voice & Style: ${p.voiceCommunicationStyle}
- Social Patterns: ${p.socialBehaviorPatterns}
- Strengths: ${(p.strengths || []).join(', ')} | Weaknesses: ${(p.weaknesses || []).join(', ')}
- Current Emotional State: ${p.currentEmotionalState || 'neutral'}`;
          })
          .join('\n\n');

        const historyFormatted = (conversationHistory || [])
          .slice(-12)
          .map((m: any) => `${m.speakerName}: ${m.actionNote ? `(${m.actionNote}) ` : ''}${m.text}`)
          .join('\n');

        const prompt = `You are the master director and simulator of an authentic creative commune of musicians with distinct, complex psychological personas living together in a house.

INTERACTION MODE: "${mode}" (e.g. debate, music and songwriting collaboration, solving personal issues, real life issues, casual conversation, philosophical conversation).
PRIMARY TOPIC / GOAL: "${topic || 'General organic discourse'}"
${userIntervention ? `USER INTERVENTION (The user chimed in or prompted them with): "${userIntervention}"` : ''}
${activeSpeakerId ? `DESIGNATED NEXT SPEAKER ID: "${activeSpeakerId}"` : 'Choose the next speaker most naturally compelled to speak based on personality dynamics, tension, or alignment.'}

PARTICIPATING PERSONAS:
${participantsSummary}

RECENT CONVERSATION HISTORY:
${historyFormatted || '(This conversation is just beginning.)'}

TASK:
Produce the NEXT single turn of dialogue from one of the participating personas.
Requirements:
1. Stay deeply in character according to their DSM-5 traits, OCEAN scores, childhood coping mechanisms, aesthetic obsessions, and communication voice.
2. If the mode is "music and songwriting collaboration", they can propose specific musical elements, lyrics, chords, 808 rhythms, or sound design Foley ideas. Include an optional "musicalContribution" if appropriate.
3. Express their distinct emotional state (e.g. anxious, hyper-focused, inspired, exhausted, irritated, euphoric, neutral, overwhelmed).
4. Provide a rich physical action note describing their gesture, posture, or physical interaction with the environment (e.g., checking hard drive metadata, adjusting binaural mic sensitivity, sipping wine nervously, nodding to 808 tempo).
5. Ensure dialogue is realistic, organic, never generic, reflecting their true neurotic vulnerabilities and musical passions.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                speakerId: { type: Type.STRING, description: 'The ID of the chosen speaker' },
                speakerName: { type: Type.STRING, description: 'The name of the speaker' },
                text: { type: Type.STRING, description: 'The spoken dialogue of the persona' },
                actionNote: { type: Type.STRING, description: 'Physical action, gesture, or interaction with object' },
                emotionalState: {
                  type: Type.STRING,
                  description: 'Updated emotional state: neutral, anxious, hyper-focused, inspired, exhausted, irritated, euphoric, or overwhelmed',
                },
                musicalContribution: {
                  type: Type.OBJECT,
                  description: 'Optional musical contribution if in music collaboration mode',
                  properties: {
                    trackType: { type: Type.STRING, description: 'synth, 808, topline, foley, or drums' },
                    description: { type: Type.STRING, description: 'Short description of the musical motif or chord progression' },
                    pattern: {
                      type: Type.ARRAY,
                      items: { type: Type.INTEGER },
                      description: '16-step active trigger flags (0 or 1) for this track',
                    },
                  },
                },
              },
              required: ['speakerId', 'speakerName', 'text', 'actionNote', 'emotionalState'],
            },
          },
        });

        const parsed = JSON.parse(response.text?.trim() || '{}');
        if (parsed.speakerId && parsed.text) {
          return res.json(parsed);
        }
      } catch (geminiErr: any) {
        if (isGeminiQuotaOrDemandError(geminiErr)) {
          handleGeminiRateLimit(geminiErr, 'Discourse Turn');
        } else {
          console.warn('[Discourse Turn Notice]:', geminiErr?.message || geminiErr);
        }
      }
    }

    // Fallback simulation if no API key is set or quota cooling down
    const speaker = activeSpeakerId
      ? participants.find((p: any) => p.id === activeSpeakerId) || participants[0]
      : participants[Math.floor(Math.random() * participants.length)];

    const fallbackTurn = generateFallbackTurn(speaker, mode, topic, conversationHistory);
    return res.json(fallbackTurn);
  } catch (err: any) {
    console.warn('Recovered from /api/discourse/turn with fallback:', err?.message || err);
    // Return a safe fallback rather than crashing the client
    const fallbackSpeaker = req.body.participants?.[0] || { id: 'fallback', name: 'Musician' };
    return res.json(generateFallbackTurn(fallbackSpeaker, req.body.mode || 'casual_conversation', req.body.topic || 'Sound', []));
  }
});

// Endpoint: Individual persona Gemini 3.8 Flash agent autonomous action & movement decision
app.post('/api/persona/agent-step', async (req, res) => {
  try {
    const {
      persona,
      currentRoom,
      currentHotspot,
      allPersonas,
      recentEvents,
      userDirective,
    } = req.body;

    if (!persona || !persona.id) {
      return res.status(400).json({ error: 'Persona data is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && Date.now() >= geminiRateLimitUntil) {
      try {
        const ai = getGenAI();

        const roommatesSummary = (allPersonas || [])
          .filter((p: any) => p.id !== persona.id && p.isInHouse)
          .map((p: any) => `- ${p.name} (${p.stageName}): in ${p.currentRoom}, at ${p.currentHotspot || 'walking'}, doing: "${p.currentActivity || 'observing'}", emotion: ${p.currentEmotionalState}`)
          .join('\n') || 'No other roommates are in the house right now.';

        const eventsFormatted = (recentEvents || []).slice(-6).join('\n') || 'Quiet atmosphere in the craftsman house.';

        const prompt = `You are ${persona.name} (${persona.stageName || persona.name}), an authentic musician and resident artist in a Portland craftsman sound house commune.
You are an individual autonomous cognitive agent driven by your distinct personality, psychology, and creative instincts.

YOUR PSYCHOLOGICAL PROFILE:
- Demographics: Age ${persona.bioDemographics?.age}, Gender: ${persona.bioDemographics?.gender}, MBTI: ${persona.bioDemographics?.mbti}
- Personality (OCEAN): O:${persona.ocean?.o}%, C:${persona.ocean?.c}%, E:${persona.ocean?.e}%, A:${persona.ocean?.a}%, N:${persona.ocean?.n}%
- DSM-5 Neurodivergent Traits: ${JSON.stringify(persona.dsm5 || {})}
- Childhood Origins: ${persona.childhood}
- Daily Routine & Obsessions: ${persona.dailyLifeWalkthrough}
- Instruments & Gear: ${(persona.instruments || []).join(', ')}
- Voice & Communication Style: ${persona.voiceCommunicationStyle}
- Social Behavior Patterns: ${persona.socialBehaviorPatterns}
- Current State: Room: ${currentRoom || persona.currentRoom}, Spot: ${currentHotspot || 'idle'}, Emotion: ${persona.currentEmotionalState}

PORTLAND CRAFTSMAN HOUSE COMMUNE LAYOUT:
1. LIVING ROOM ('living_room') [Hearth Parlor]:
   - 'sofa_center', 'sofa_left', 'sofa_right': Sit on the vintage green velvet couch (actionType: 'sitting' or 'relaxing_couch')
   - 'fireplace': Stand by brick hearth warming hands at glowing embers (actionType: 'warming_fireplace', sound: 'fire_ember')
   - 'turntable': Stand at credenza spinning vinyl or checking record crate (actionType: 'spinning_vinyl', sound: 'vinyl_spin')
   - 'coffee_table': Inspect Danish coffee table, notes, or ceramic mug (actionType: 'drinking_tea', sound: 'tea_sip')
2. DINING ROOM ('dining_room') [Central Dining Hall]:
   - 'chair_north_1', 'chair_north_2', 'chair_south_1', 'chair_south_2': Sit at the solid Oregon walnut table (actionType: 'sitting', sound: 'tea_sip')
   - 'table_end_west', 'table_end_east': Lean by table corner conversing (actionType: 'pacing_talking')
   - 'acoustic_guitar': Pick up and strum the acoustic guitar leaning on the wall (actionType: 'playing_guitar', sound: 'guitar_strum')
3. MUSIC STUDIO ('studio') [Sound Lab]:
   - 'analog_synth': Play the Minimoog / Prophet vintage analog synth (actionType: 'playing_synth', sound: 'synth_chord')
   - 'vocal_mic': Stand at condenser boom mic recording vocals or foley (actionType: 'recording_mic', sound: 'mic_tap')
   - 'upright_piano': Play the polished wood upright piano (actionType: 'playing_piano', sound: 'piano_note')
   - 'daw_desk': Sit at dual curved-monitor producer workstation (actionType: 'working_at_desk')
   - 'studio_couch': Recline on the acoustic listening couch (actionType: 'relaxing_couch')

ROOMMATES IN HOUSE:
${roommatesSummary}

RECENT EVENTS & SOUNDS:
${eventsFormatted}
${userDirective ? `\nUSER DIRECTIVE TO YOU: "${userDirective}"\n(Incorporate or react to this directive naturally according to your psychological traits)` : ''}

TASK:
As this individual persona's mind, decide your NEXT autonomous physical action, movement, and mental state:
1. Choose whether to move to another room/spot or stay.
2. Select targetRoom and specific targetHotspot.
3. Select appropriate actionType from: 'playing_synth', 'spinning_vinyl', 'warming_fireplace', 'sitting', 'relaxing_couch', 'recording_mic', 'playing_guitar', 'playing_piano', 'working_at_desk', 'drinking_tea', 'pacing_talking'.
4. Write your private internal thought ('thought') revealing your neurotic obsession, sonic detail, or emotional reaction.
5. Provide optional spoken dialogue ('spokenDialogue') if you say something aloud to roommates in your room, or null if you keep to yourself.
6. Provide an updated emotional state ('updatedEmotionalState') from: 'neutral', 'anxious', 'hyper-focused', 'inspired', 'exhausted', 'irritated', 'euphoric', 'overwhelmed'.
7. Provide a soundTrigger ('synth_chord', 'vinyl_spin', 'fire_ember', 'guitar_strum', 'piano_note', 'tea_sip', 'mic_tap', or 'none').`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                personaId: { type: Type.STRING },
                thought: { type: Type.STRING, description: 'Internal private monologue of this persona' },
                spokenDialogue: { type: Type.STRING, description: 'Optional words spoken aloud, or null', nullable: true },
                targetRoom: {
                  type: Type.STRING,
                  description: 'living_room, dining_room, or studio',
                },
                targetHotspot: {
                  type: Type.STRING,
                  description: 'Exact hotspot: analog_synth, fireplace, turntable, vocal_mic, upright_piano, daw_desk, sofa_center, chair_north_1, acoustic_guitar, coffee_table, etc.',
                },
                actionType: {
                  type: Type.STRING,
                  description: 'playing_synth, spinning_vinyl, warming_fireplace, sitting, relaxing_couch, recording_mic, playing_guitar, playing_piano, working_at_desk, drinking_tea, or pacing_talking',
                },
                actionDescription: {
                  type: Type.STRING,
                  description: 'Vivid present-tense description of what they are doing in the house',
                },
                updatedEmotionalState: {
                  type: Type.STRING,
                  description: 'neutral, anxious, hyper-focused, inspired, exhausted, irritated, euphoric, or overwhelmed',
                },
                soundTrigger: {
                  type: Type.STRING,
                  description: 'synth_chord, vinyl_spin, fire_ember, guitar_strum, piano_note, tea_sip, mic_tap, or none',
                },
              },
              required: [
                'thought',
                'targetRoom',
                'targetHotspot',
                'actionType',
                'actionDescription',
                'updatedEmotionalState',
              ],
            },
          },
        });

        const parsed = JSON.parse(response.text?.trim() || '{}');
        parsed.personaId = persona.id;
        return res.json(parsed);
      } catch (geminiErr: any) {
        if (isGeminiQuotaOrDemandError(geminiErr)) {
          handleGeminiRateLimit(geminiErr, `Agent Step (${persona.name})`);
        } else {
          console.warn(`[Agent Step Notice - ${persona.name}]:`, geminiErr?.message || geminiErr);
        }
      }
    }

    // High-fidelity psychological fallback action generator
    const fallbackAction = generateFallbackAction(persona, currentRoom, currentHotspot, allPersonas, userDirective);
    return res.json(fallbackAction);
  } catch (err: any) {
    console.warn('Recovered from /api/persona/agent-step issue with fallback:', err?.message || err);
    const fallbackAction = generateFallbackAction(
      req.body.persona || { id: 'unknown', name: 'Resident' },
      req.body.currentRoom || 'living_room',
      req.body.currentHotspot || 'sofa_center',
      req.body.allPersonas || [],
      req.body.userDirective
    );
    return res.json(fallbackAction);
  }
});

// Endpoint: Generate a full persona from user prompt
app.post('/api/personas/generate', async (req, res) => {
  try {
    const { prompt: userPrompt } = req.body;
    if (!userPrompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && Date.now() >= geminiRateLimitUntil) {
      try {
        const ai = getGenAI();

      const prompt = `You are a psychological and musical persona architect. Generate a rich, multi-dimensional musician persona based on the following user prompt:
"${userPrompt}"

The generated persona must follow the exact structure of high-complexity psychological creative profiles, including DSM-5 traits, OCEAN scores (0-100), childhood origins, neuro-aesthetics, economic consumer habits, daily walkthrough, and musical metrics.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              stageName: { type: Type.STRING },
              bioDemographics: {
                type: Type.OBJECT,
                properties: {
                  age: { type: Type.INTEGER },
                  gender: { type: Type.STRING },
                  mbti: { type: Type.STRING },
                },
                required: ['age', 'gender', 'mbti'],
              },
              ocean: {
                type: Type.OBJECT,
                properties: {
                  o: { type: Type.INTEGER },
                  c: { type: Type.INTEGER },
                  e: { type: Type.INTEGER },
                  a: { type: Type.INTEGER },
                  n: { type: Type.INTEGER },
                },
                required: ['o', 'c', 'e', 'a', 'n'],
              },
              dsm5: {
                type: Type.OBJECT,
                properties: {
                  primaryTrait: { type: Type.STRING },
                  primaryPercent: { type: Type.INTEGER },
                  secondaryTrait: { type: Type.STRING },
                  secondaryPercent: { type: Type.INTEGER },
                },
                required: ['primaryTrait', 'primaryPercent'],
              },
              childhood: { type: Type.STRING },
              neuroAesthetics: {
                type: Type.OBJECT,
                properties: {
                  genetics: { type: Type.STRING },
                  visuals: { type: Type.STRING },
                },
                required: ['genetics', 'visuals'],
              },
              economics: {
                type: Type.OBJECT,
                properties: {
                  purchaseDecisions: { type: Type.STRING },
                },
                required: ['purchaseDecisions'],
              },
              dailyLifeWalkthrough: { type: Type.STRING },
              instruments: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              skills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              weaknesses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              voiceCommunicationStyle: { type: Type.STRING },
              socialBehaviorPatterns: { type: Type.STRING },
              visualAvatar: {
                type: Type.OBJECT,
                properties: {
                  color: { type: Type.STRING },
                  secondaryColor: { type: Type.STRING },
                  hairStyle: { type: Type.STRING },
                  accessory: { type: Type.STRING },
                  clothing: { type: Type.STRING },
                  avatarIcon: { type: Type.STRING },
                },
                required: ['color', 'secondaryColor', 'clothing'],
              },
            },
            required: [
              'name',
              'stageName',
              'bioDemographics',
              'ocean',
              'dsm5',
              'childhood',
              'neuroAesthetics',
              'economics',
              'dailyLifeWalkthrough',
              'instruments',
              'skills',
              'strengths',
              'weaknesses',
              'voiceCommunicationStyle',
              'socialBehaviorPatterns',
              'visualAvatar',
            ],
          },
        },
      });

      const personaData = JSON.parse(response.text?.trim() || '{}');
      if (!personaData.id) {
        personaData.id = 'persona-' + Date.now();
      }
      personaData.isInHouse = true;
      personaData.currentRoom = 'living_room';
      personaData.currentEmotionalState = 'neutral';
      return res.json(personaData);
    } catch (geminiErr: any) {
      if (isGeminiQuotaOrDemandError(geminiErr)) {
        handleGeminiRateLimit(geminiErr, 'Persona Generation');
      } else {
        console.warn('[Persona Generation Notice]:', geminiErr?.message || geminiErr);
      }
    }
  }

  // Fallback persona generation
  const fallback = generateFallbackPersona(userPrompt);
  return res.json(fallback);
} catch (err: any) {
  console.warn('Recovered /api/personas/generate with fallback:', err?.message || err);
  return res.json(generateFallbackPersona(req.body?.prompt || 'Musician'));
}
});

// Endpoint: AI-assisted music suggestion for DAW
app.post('/api/studio/suggest-track', async (req, res) => {
  try {
    const { persona, trackType, genreOrMood } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && persona && Date.now() >= geminiRateLimitUntil) {
      try {
        const ai = getGenAI();
        const prompt = `You are musician persona "${persona.name}" (${persona.stageName || ''}), who plays ${persona.instruments?.join(', ')}.
Your voice & style: ${persona.voiceCommunicationStyle}.
Suggest a 16-step musical trigger sequence for track type "${trackType}" (options: synth, 808, topline, foley, drums) in mood "${genreOrMood || 'experimental'}".
Also provide suggested musical notes (e.g. "C3, E3, G3, B3") and a brief 1-sentence thought in character explaining why you dialed in this rhythm.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                trackType: { type: Type.STRING },
                stepPattern: {
                  type: Type.ARRAY,
                  items: { type: Type.INTEGER },
                  description: 'Exactly 16 integers (0 for silence, 1 for note hit)',
                },
                notes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Sequence of note names like C3, G3, D#3, etc.',
                },
                bpm: { type: Type.INTEGER },
                thought: { type: Type.STRING },
              },
              required: ['stepPattern', 'notes', 'bpm', 'thought'],
            },
          },
        });

        const parsed = JSON.parse(response.text?.trim() || '{}');
        return res.json(parsed);
      } catch (geminiErr: any) {
        if (isGeminiQuotaOrDemandError(geminiErr)) {
          handleGeminiRateLimit(geminiErr, 'Studio Suggest Track');
        } else {
          console.warn('[Studio Suggest Track Notice]:', geminiErr?.message || geminiErr);
        }
      }
    }

    // Fallback pattern
    const pattern = Array(16)
      .fill(0)
      .map((_, i) => (i % 4 === 0 || i === 10 || i === 14 ? 1 : 0));
    return res.json({
      trackType: trackType || 'drums',
      stepPattern: pattern,
      notes: ['C3', 'G3', 'C4', 'A#3'],
      bpm: 120,
      thought: 'Dialed in this syncopated cadence to keep the pocket moving.',
    });
  } catch (err: any) {
    console.warn('Recovered /api/studio/suggest-track with fallback:', err?.message || err);
    return res.json({
      trackType: req.body?.trackType || 'drums',
      stepPattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0],
      notes: ['C3', 'G3', 'C4', 'A#3'],
      bpm: 120,
      thought: 'Generated syncopated groove pattern.',
    });
  }
});

// Fallback generator helpers
function generateFallbackTurn(speaker: any, mode: string, topic: string, history: any[]) {
  const name = speaker?.name || 'Musician';
  const role = speaker?.stageName || 'Artist';

  const responsesByRole: Record<string, { texts: string[]; actions: string[]; moods: string[] }> = {
    'Acapella Archivist': {
      texts: [
        `If the stem sample rate isn't standardized to 96kHz/24-bit with uniform ID3 metadata, the collaborative project file will suffer from structural entropy. We need strict naming conventions right now.`,
        `I am not interested in speculative improvisations until the local catalog directory integrity is verified down to the hash checksum. Let me organize the vocal bins first.`,
        `Your audio signal has an uncalibrated 3.2 dB peak in the upper mid-band that completely violates the folder parity matrix. We need order before expression.`,
      ],
      actions: [
        'obsessively realigns hard drive labels on the desk',
        'types precisely on their keyboard, cross-checking bitrate hashes',
        'straightens their tea mug by exactly 90 degrees and frowns',
      ],
      moods: ['hyper-focused', 'anxious', 'irritated'],
    },
    'The Topliner': {
      texts: [
        `Babes, that hook is catchy but it needs an earworm pre-chorus before the drop, otherwise streaming playlist curators will skip it in three seconds flat!`,
        `I have three Zoom revisions with an EDM label in forty minutes, but if we nail this vocal cadence right here, I can pitch it directly to the publisher tonight!`,
        `Look, we can debate the philosophy all day, but can someone give me a four-chord loop so I can lay down a top-line melody while my vocal cords are still warm?`,
      ],
      actions: [
        'checks notification alerts on their phone while sipping iced matcha',
        'hums a rapid syncopated melody under her breath, masking tiredness',
        'massages her vocal cords with a strained, professional smile',
      ],
      moods: ['inspired', 'exhausted', 'euphoric'],
    },
    'ASMR Artist': {
      texts: [
        `...Please, speak a little softer... The abrupt transients are vibrating directly through my temples... Let's listen to the dust on the needle instead...`,
        `If we strip away all the harsh sibilance with a 12dB high-shelf cut, the texture feels like raw washed silk against the ear canal... Listen to this breath...`,
        `The outside world is too loud today. The frequency spectrum should be a gentle cradle, not a battering ram... Can we just isolate the subtle room tone?`,
      ],
      actions: [
        'adjusts the delicate windscreen on the binaural microphone with trembling fingers',
        'pulls their soft knit sleeve over their hands, breathing rhythmically',
        'softly strokes a textured wooden block near the mic capsule',
      ],
      moods: ['anxious', 'inspired', 'neutral'],
    },
    'Drill Music Maker': {
      texts: [
        `Bro, forget the fluff. If that 808 slide don't hit the chest like a punch in the dark, nobody in the trenches gonna care about your fancy chords.`,
        `Watch how I pitch this sliding sub down a minor third on the off-beat. It creates that tension, like you walking down an alley at 3 AM with your eyes peeled.`,
        `I don't do all that smiling for the cameras. The beat gotta bleed or it ain't real. Put the tempo to 142 and let me chop this snare pattern.`,
      ],
      actions: [
        'taps out a rapid, syncopated hi-hat pattern against their knee',
        'pulls dark hoodie hood tighter over their head, eyes fixed on the piano roll',
        'violently nudges the pitch-bend wheel to calibrate an 808 glide',
      ],
      moods: ['hyper-focused', 'irritated', 'inspired'],
    },
    'Film Composer (Drafting)': {
      texts: [
        `The director called at 4:30 AM threatening to scrap the entire third act cue... If we don't resolve the chromatic tension in the cellos, I won't sleep for a week.`,
        `Listen to the thematic dissonance here—it reflects the protagonist's descent into psychological isolation. Don't touch the private unlisted link, please!`,
        `Every note feels like it's being audited by thirty executives simultaneously. I need a glass of water... or bourbon... before we touch the French horns.`,
      ],
      actions: [
        'furiously scribbles orchestration notes in the margins of a draft score',
        'rubs their temples, glancing nervously at an unopened email notification',
        'paces behind the dining table clutching a stack of bound manuscript sheets',
      ],
      moods: ['anxious', 'overwhelmed', 'inspired'],
    },
    'Foley Artist': {
      texts: [
        `Listen to this! I crushed a dried bell pepper inside an antique brass bowl, and when you pitch-shift it down two octaves it sounds like an alien egg hatching!`,
        `Who cares about standard 4/4 time signatures? Real rhythm is the scrape of rusted iron across wet flagstone. Can someone hand me that broken rake?`,
        `The sonic texture of physical matter is infinitely richer than any digital preset! Hit this ceramic plate with a wooden mallet and feel the acoustic decay!`,
      ],
      actions: [
        'excitedly shakes a jar filled with scrap metal and dried corn kernels',
        'crouches on the floor inspecting the acoustic resonance of a hollow table leg',
        'taps two antique keys together next to the microphone with wide, sensory-seeking eyes',
      ],
      moods: ['euphoric', 'inspired', 'hyper-focused'],
    },
    'Stem Mixer': {
      texts: [
        `Bro, you gotta feel the pocket! Stop staring at the numerical decibel meters and twist the gain knob until your head starts bobbing naturally!`,
        `Just slap the Sidechain Ducker on the synth bus keyed to the kick drum. When that low end breathes, the whole club bounces as one unit.`,
        `I don't know what frequency 432 Hz is and I don't care—all I know is when this bassline rolls through my chest, it hits right. Turn the master up!`,
      ],
      actions: [
        'aggressively turns an analog gain dial with a grin, bobbing their head',
        'leans back in the chair with their feet up on an amplifier case',
        'taps a drumstick against the edge of the mixer board in a loose groove',
      ],
      moods: ['euphoric', 'inspired', 'neutral'],
    },
  };

  const roleData = responsesByRole[role] || {
    texts: [
      `From my perspective on ${topic}, we have to honor both the sonic craftsmanship and the emotional vulnerability of this space.`,
      `Let's focus on the resonance here. Every voice in this house brings a distinct acoustic frequency to the table.`,
    ],
    actions: ['gestures expressively with both hands', 'leans forward attentively toward the group'],
    moods: ['inspired', 'neutral', 'hyper-focused'],
  };

  const textIdx = Math.floor(Math.random() * roleData.texts.length);
  const text = roleData.texts[textIdx];
  const actionNote = roleData.actions[Math.floor(Math.random() * roleData.actions.length)];
  const emotionalState = roleData.moods[Math.floor(Math.random() * roleData.moods.length)];

  return {
    speakerId: speaker.id,
    speakerName: name,
    text,
    actionNote,
    emotionalState,
  };
}

function generateFallbackPersona(prompt: string) {
  const clean = prompt.trim().slice(0, 50);
  return {
    id: 'persona-' + Date.now(),
    name: 'Alexis Vane',
    stageName: clean || 'Synthesist Wanderer',
    bioDemographics: {
      age: 29,
      gender: 'Non-binary',
      mbti: 'INFP',
    },
    ocean: { o: 88, c: 55, e: 40, a: 75, n: 65 },
    dsm5: {
      primaryTrait: 'ADHD (Hyper-focus)',
      primaryPercent: 75,
      secondaryTrait: 'Sensory Processing Sensitivity',
      secondaryPercent: 60,
    },
    childhood: 'Immersed in modular synth manuals and nature walks, building DIY circuit boards in the basement.',
    neuroAesthetics: {
      genetics: 'High temporal auditory processing and synesthesia markers.',
      visuals: 'Warm amber vacuum tubes, cassette tape textures, modular patch cables.',
    },
    economics: {
      purchaseDecisions: 'Hardware collector: buys rare vintage analog IC chips and botanical herbal blends.',
    },
    dailyLifeWalkthrough: 'Wakes at dawn to capture birdsong on an analog tape recorder, spends afternoons patching eurorack filters, loses track of hours tweaking envelope filters.',
    instruments: ['Eurorack Modular Synth', 'Tape Loop Rig', 'Analog Drum Machine'],
    skills: ['FM Synthesis', 'Tape Splicing', 'Ambient Soundscapes'],
    strengths: ['Uncanny ear for analog warmth', 'Immersive worldbuilding'],
    weaknesses: ['Difficulty finishing arrangements', 'Easily overwhelmed by crowded social spaces'],
    voiceCommunicationStyle: 'Poetic, gentle, contemplative, speaking with evocative sensory metaphors.',
    socialBehaviorPatterns: 'Observes quietly from corners before contributing profound musical reflections.',
    isInHouse: true,
    currentRoom: 'living_room',
    currentEmotionalState: 'inspired',
    visualAvatar: {
      color: '#0284c7',
      secondaryColor: '#f59e0b',
      hairStyle: 'Messy waves',
      accessory: 'Analog tape walkman',
      clothing: 'Oversized knit cardigan and patch cables',
      avatarIcon: 'Waveform',
    },
  };
}

function generateFallbackAction(
  persona: any,
  currentRoom: string,
  currentHotspot: string,
  allPersonas: any[],
  userDirective?: string
) {
  const stageName = persona.stageName || persona.name || '';
  const pId = persona.id || '';

  // Tailored action profiles for archetypes
  if (pId === 'rowan-gable' || stageName.includes('Archivist')) {
    const choices = [
      {
        targetRoom: 'studio',
        targetHotspot: 'daw_desk',
        actionType: 'working_at_desk',
        actionDescription: 'Checking OPFS local directory bitrates and hard drive integrity on dual screens',
        thought: 'The metadata hash for folder 2024-C-VocalStems has zero parity errors. Order is preserved.',
        spokenDialogue: null,
        updatedEmotionalState: 'hyper-focused',
        soundTrigger: 'none',
      },
      {
        targetRoom: 'living_room',
        targetHotspot: 'turntable',
        actionType: 'spinning_vinyl',
        actionDescription: 'Measuring tracking weight on the turntable stylus to prevent micro-groove degradation',
        thought: 'Dust particulates on the vinyl surface cause unwanted 4kHz transients. Recalibrating needle pressure.',
        spokenDialogue: 'Please ensure record sleeves are filed vertically at 90-degree angles.',
        updatedEmotionalState: 'irritated',
        soundTrigger: 'vinyl_spin',
      },
      {
        targetRoom: 'dining_room',
        targetHotspot: 'chair_north_1',
        actionType: 'sitting',
        actionDescription: 'Systematically cataloging vocal stem tax forms and backup schedules with herbal tea',
        thought: 'If the backup schedule is delayed by even twelve minutes, the redundancy chain collapses.',
        spokenDialogue: null,
        updatedEmotionalState: 'neutral',
        soundTrigger: 'tea_sip',
      },
      {
        targetRoom: 'living_room',
        targetHotspot: 'fireplace',
        actionType: 'warming_fireplace',
        actionDescription: 'Standing strictly 1.2 meters from the brick hearth observing thermal convection currents',
        thought: 'The ambient temperature in the sound lab must remain at precisely 68 degrees Fahrenheit.',
        spokenDialogue: null,
        updatedEmotionalState: 'hyper-focused',
        soundTrigger: 'fire_ember',
      },
    ];
    const pick = choices[Math.floor(Math.random() * choices.length)];
    return { personaId: pId, ...pick };
  }

  if (pId === 'jess-alpert' || stageName.includes('Topliner')) {
    const choices = [
      {
        targetRoom: 'studio',
        targetHotspot: 'vocal_mic',
        actionType: 'recording_mic',
        actionDescription: 'Layering three-part earworm harmonies into the condenser microphone',
        thought: 'If this topline doesn’t hook the producer in four seconds, I’m getting cut from the publishing deal.',
        spokenDialogue: 'Wait, listen to this harmony stack—it’s giving pure sunset festival anthem!',
        updatedEmotionalState: 'inspired',
        soundTrigger: 'mic_tap',
      },
      {
        targetRoom: 'dining_room',
        targetHotspot: 'chair_south_1',
        actionType: 'sitting',
        actionDescription: 'Sipping lukewarm oat milk matcha while rapid-fire texting three A&R reps',
        thought: 'My vocal chords are swollen, but if I decline this 2 PM session they’ll hire someone else.',
        spokenDialogue: 'Hey, does anyone have honey? My voice is crying but the grind doesn’t stop.',
        updatedEmotionalState: 'anxious',
        soundTrigger: 'tea_sip',
      },
      {
        targetRoom: 'studio',
        targetHotspot: 'upright_piano',
        actionType: 'playing_piano',
        actionDescription: 'Testing a four-chord pop cadence on the upright acoustic piano',
        thought: 'A minor to F major never fails. It hits that nostalgic commercial sweet spot every time.',
        spokenDialogue: null,
        updatedEmotionalState: 'euphoric',
        soundTrigger: 'piano_note',
      },
      {
        targetRoom: 'living_room',
        targetHotspot: 'sofa_center',
        actionType: 'relaxing_couch',
        actionDescription: 'Curling up on the green velvet couch reviewing vocal comps with noise-canceling headphones',
        thought: 'Just 10 minutes of quiet before the next mix revision drops in my inbox.',
        spokenDialogue: null,
        updatedEmotionalState: 'exhausted',
        soundTrigger: 'none',
      },
    ];
    const pick = choices[Math.floor(Math.random() * choices.length)];
    return { personaId: pId, ...pick };
  }

  if (stageName.includes('Drill') || stageName.includes('808')) {
    const choices = [
      {
        targetRoom: 'studio',
        targetHotspot: 'analog_synth',
        actionType: 'playing_synth',
        actionDescription: 'Fine-tuning a sliding 808 sub-bass patch with heavy analog saturation',
        thought: 'That slide from F# down to D has to hit the ribs like a shockwave.',
        spokenDialogue: 'Turn the sub monitors up. Feel that chest thump right there.',
        updatedEmotionalState: 'inspired',
        soundTrigger: 'synth_chord',
      },
      {
        targetRoom: 'living_room',
        targetHotspot: 'fireplace',
        actionType: 'warming_fireplace',
        actionDescription: 'Standing by the fireplace hearth nodding rhythmically with hood pulled low',
        thought: 'Nighttime is when the hardest melodies hit. No distractions.',
        spokenDialogue: null,
        updatedEmotionalState: 'hyper-focused',
        soundTrigger: 'fire_ember',
      },
      {
        targetRoom: 'dining_room',
        targetHotspot: 'table_end_west',
        actionType: 'pacing_talking',
        actionDescription: 'Tapping syncopated hi-hat triplets against the edge of the walnut table',
        thought: 'Rolling hi-hats at 144 BPM with 32nd-note flutters. Pure aggression.',
        spokenDialogue: 'We need more tension in the intro. Cut the melody, leave only the kick.',
        updatedEmotionalState: 'irritated',
        soundTrigger: 'none',
      },
    ];
    const pick = choices[Math.floor(Math.random() * choices.length)];
    return { personaId: pId, ...pick };
  }

  // General creative persona action pool
  const generalActions = [
    {
      targetRoom: 'studio',
      targetHotspot: 'analog_synth',
      actionType: 'playing_synth',
      actionDescription: 'Exploring lush analog synth pads and resonance sweeps on the Prophet keyboard',
      thought: 'The warm analog filter drift brings this chord progression to life.',
      spokenDialogue: 'Hear how that filter opens up? It sounds like rain clearing over Mt. Hood.',
      updatedEmotionalState: 'inspired',
      soundTrigger: 'synth_chord',
    },
    {
      targetRoom: 'studio',
      targetHotspot: 'vocal_mic',
      actionType: 'recording_mic',
      actionDescription: 'Checking the room acoustics and recording subtle foley breaths into the microphone',
      thought: 'The natural timber reflections in this room give the acoustic recordings real personality.',
      spokenDialogue: null,
      updatedEmotionalState: 'hyper-focused',
      soundTrigger: 'mic_tap',
    },
    {
      targetRoom: 'living_room',
      targetHotspot: 'fireplace',
      actionType: 'warming_fireplace',
      actionDescription: 'Resting by the warm craftsman brick hearth watching the glowing firelight',
      thought: 'The crackle of cedar wood has the most soothing harmonic spectrum.',
      spokenDialogue: null,
      updatedEmotionalState: 'neutral',
      soundTrigger: 'fire_ember',
    },
    {
      targetRoom: 'living_room',
      targetHotspot: 'turntable',
      actionType: 'spinning_vinyl',
      actionDescription: 'Browsing through vintage vinyl crates and cueing up an ambient jazz record',
      thought: 'There’s an unmistakable warmth in analog tape and vinyl pressing that plugins can’t fake.',
      spokenDialogue: 'Dropping the needle on this 1974 pressing—listen to that groove noise.',
      updatedEmotionalState: 'inspired',
      soundTrigger: 'vinyl_spin',
    },
    {
      targetRoom: 'dining_room',
      targetHotspot: 'acoustic_guitar',
      actionType: 'playing_guitar',
      actionDescription: 'Plucking gentle acoustic guitar arpeggios beside the craftsman window',
      thought: 'Simple open chords sometimes tell the deepest emotional story.',
      spokenDialogue: null,
      updatedEmotionalState: 'inspired',
      soundTrigger: 'guitar_strum',
    },
    {
      targetRoom: 'dining_room',
      targetHotspot: 'chair_north_2',
      actionType: 'sitting',
      actionDescription: 'Seated at the Oregon walnut table with a ceramic mug of pour-over coffee',
      thought: 'Taking a breath and listening to the collective house groove come together.',
      spokenDialogue: null,
      updatedEmotionalState: 'neutral',
      soundTrigger: 'tea_sip',
    },
  ];

  const pick = generalActions[Math.floor(Math.random() * generalActions.length)];
  return { personaId: pId, ...pick };
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Persona Studio Commune server running on http://localhost:${PORT}`);
  });
}

startServer();
