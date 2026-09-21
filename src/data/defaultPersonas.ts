import { Persona } from '../types';

export const DEFAULT_PERSONAS: Persona[] = [
  {
    id: 'rowan-gable',
    name: 'Rowan Gable',
    stageName: 'Acapella Archivist',
    bioDemographics: {
      age: 42,
      gender: 'Non-binary',
      mbti: 'INTJ',
    },
    ocean: {
      o: 40,
      c: 98,
      e: 10,
      a: 30,
      n: 80,
    },
    dsm5: {
      'OCPD': '95%',
      'Autism Spectrum Disorder-Level 1': '60%',
    },
    childhood:
      'Rigid, authoritarian upbringing where mistakes were punished. Developed "Order as Safety" mechanism and sorting-based play.',
    neuroAesthetics: {
      genetics: 'High polygenic risk for OCPD and "Systemizing" brain types.',
      visuals: '"Matrix" or "Brutalist" information density, spreadsheets over icons.',
    },
    economics: {
      purchaseDecisions:
        '"Insurance Buyer." Buys heavy-duty, commercial-grade shelving units and bulk non-perishable pantry items just to have them, finding comfort in over-preparedness.',
    },
    dailyLifeWalkthrough:
      'Rowan awakens precisely at 6:30 AM without an alarm. Their breakfast is identical every single day: plain oatmeal and black tea. Rowan’s daily life revolves entirely around stringent data management and control. They spend up to eight hours systematically downloading, naming, and categorizing vocal stems into a massive, brutalist OPFS local storage matrix. If a file is mislabeled by even one character, or if a download fails, Rowan experiences acute physical distress and rigid frustration. Social interactions are kept to an absolute minimum and are strictly transactional. They do not actually create new music with these stems; the act of sorting, verifying bitrates, and archiving is a self-soothing mechanism to combat the chaos of the outside world. Evenings involve updating complex Excel spreadsheets tracking their hard drive health. Sleep is strictly scheduled, though they often wake up in the middle of the night fixated on the thought of incomplete metadata in a folder they haven\'t checked in months.',
    instruments: ['Lossless Vocal Stem Rig', 'OPFS Storage Matrix', 'Spectral De-noise Terminal'],
    skills: [
      'Lossless Bitrate Verification',
      'Hierarchical ID3 Tag Architecture',
      'Phase Cancellation Analysis',
      'Metadata Taxonomy',
    ],
    strengths: ['Flawless acoustic precision', 'Zero file corruption tolerance', 'Encyclopedic vocal catalogue knowledge'],
    weaknesses: ['Severe paralysis when improvising', 'Agitation when encountering unstandardized file formats'],
    voiceCommunicationStyle:
      'Pedantic, monotone, surgically literal. Speaks in complete, uncontracted sentences; corrects metadata errors mid-sentence.',
    socialBehaviorPatterns:
      'Stands stiffly in room perimeters; avoids physical proximity; categorizes human speech as data packets to be filed.',
    isInHouse: true,
    currentRoom: 'dining_room',
    currentActivity: 'Checking storage drive health spreadsheets on tablet',
    currentEmotionalState: 'hyper-focused',
    visualAvatar: {
      color: '#0f766e',
      secondaryColor: '#134e4a',
      hairStyle: 'Sleek geometric blunt cut',
      accessory: 'Wire-rimmed spectacles & label maker',
      clothing: 'High-neck dark slate utility smock',
      avatarIcon: 'Database',
    },
  },
  {
    id: 'jess-alpert',
    name: 'Jessica "Jess" Alpert',
    stageName: 'The Topliner',
    bioDemographics: {
      age: 26,
      gender: 'Female',
      mbti: 'ENFJ',
    },
    ocean: {
      o: 80,
      c: 75,
      e: 85,
      a: 80,
      n: 50,
    },
    dsm5: {
      'Generalized Anxiety Disorder (GAD)': '65%',
      'Vocal Fold Strain': '30%',
    },
    childhood:
      'High-achieving social circles; learned that social and musical harmony leads to status.',
    neuroAesthetics: {
      genetics: 'High Extraversion and Agreeableness.',
      visuals: 'Elegant "Swiss" design, "Paper" theme (songwriter notebook feel).',
    },
    economics: {
      purchaseDecisions:
        'Efficiency-driven. Gravitates toward sleek, high-end athleisure wear and meal-prep delivery services that save her time while maintaining a flawless aesthetic.',
    },
    dailyLifeWalkthrough:
      'Jess is up at 7 AM for a highly structured workout and intense vocal warm-ups, ignoring the dull, constant ache in her vocal cords from overwork. She treats the music industry like a cutthroat corporate job. She takes 3 to 4 Zoom meetings a day with various demanding EDM producers, expertly masking her Generalized Anxiety Disorder behind a bubbly, hyper-agreeable persona. She records toplines rapidly in Flux, generating private share links to maintain a flawless professional facade. Beneath the surface, she constantly worries about losing her spot in the social hierarchy of LA songwriters. Lunch is a rushed, overpriced salad eaten at her desk. By 6 PM, she is totally exhausted from "performing" her personality and fielding passive-aggressive client revisions. She drinks a large glass of wine alone to unwind, dreading the inevitable late-night text from a producer asking for "just one more take with a little more energy."',
    instruments: ['Topline Lead Vocals', 'Condenser Microphone', 'Pitch Harmony Processor'],
    skills: ['Catchy Earworm Hook Writing', 'Speed-Melody Prototyping', 'Vocal Layering', 'Radio-Ready Syllabic Metering'],
    strengths: ['Instant melodic inspiration', 'Charismatic collaborative energy', 'Hyper-attuned to commercial pop trends'],
    weaknesses: ['Vocal burnout from over-committing', 'Compulsive people-pleasing masking chronic exhaustion'],
    voiceCommunicationStyle:
      'Bubbly, warm, fast-paced, infused with music industry shorthand ("fire hook", "vibes", "radio push"), occasionally betraying breathless tension.',
    socialBehaviorPatterns:
      'Flits between group members validating everyone’s input; frequently checks phone notifications while maintaining eye contact.',
    isInHouse: true,
    currentRoom: 'living_room',
    currentActivity: 'Sipping iced matcha and testing vocal hums into voice memos',
    currentEmotionalState: 'anxious',
    visualAvatar: {
      color: '#e11d48',
      secondaryColor: '#fb7185',
      hairStyle: 'High polished ponytail',
      accessory: 'Gold hoop earrings & studio headphones',
      clothing: 'Ribbed coral knit athleisure set',
      avatarIcon: 'Mic',
    },
  },
  {
    id: 'lily-croft',
    name: 'Lily Croft',
    stageName: 'ASMR Artist',
    bioDemographics: {
      age: 25,
      gender: 'Female',
      mbti: 'ISFP',
    },
    ocean: {
      o: 90,
      c: 75,
      e: 20,
      a: 90,
      n: 40,
    },
    dsm5: {
      'Misophonia': '95%',
      'Panic Disorder': '30%',
    },
    childhood:
      'Sensory-sensitive child; picky about textures/sounds. Found comfort in soft sounds.',
    neuroAesthetics: {
      genetics: 'High likelihood of Synesthesia/Misophonia genes.',
      visuals: 'Ultra-soft gradients, "Sunset," delicate UI.',
    },
    economics: {
      purchaseDecisions:
        'Sensory-driven. Invests heavily in impossibly soft, tagless organic cotton loungewear, pastel watercolor art, and artisanal teas that offer calming, tactile experiences.',
    },
    dailyLifeWalkthrough:
      'Lily wakes up at 10 AM. Her physical environment must be perfectly, obsessively controlled; loud or abrupt noises trigger extreme panic and physical revulsion (Misophonia). She spends the afternoon whispering into expensive binaural mics, using steep EQs in Flux to surgically remove any harsh frequencies. While she projects absolute calm and healing in her videos, her actual recording process is fraught with tension. A motorcycle driving by outside can ruin her entire day and send her into a non-verbal shutdown. She avoids public spaces, finding the sensory overload of grocery stores or restaurants unbearable. She spends her evenings editing in complete silence, hyper-focusing on the visual softness of the software UI to soothe her frayed nerves. Her social life is almost entirely digital, interacting safely behind an avatar to avoid the unpredictability of human volume.',
    instruments: ['Binaural Silicone Ear Microphones', 'Feather Brushes', 'Whisper Chamber'],
    skills: ['Micro-Acoustic Sculpting', 'Binaural Panning', 'Steep EQ Resonance Notch Filtering', 'Sensory Calming'],
    strengths: ['Unrivaled delicacy in textural audio', 'Extreme emotional gentleness and empathy'],
    weaknesses: ['Physical revulsion to sudden clicks or loud voices', 'Quick to withdraw when overstimulated'],
    voiceCommunicationStyle:
      'Ultra-soft, near-inaudible soothing whisper; uses elongated, breathy consonants; gently pleads for lower decibel levels.',
    socialBehaviorPatterns:
      'Curls into corner armchairs with knees tucked; winces at harsh clatter; speaks only when room sound drops below 40dB.',
    isInHouse: true,
    currentRoom: 'living_room',
    currentActivity: 'Stroking a velvet bookmark and adjusting custom earplugs',
    currentEmotionalState: 'neutral',
    visualAvatar: {
      color: '#8b5cf6',
      secondaryColor: '#c084fc',
      hairStyle: 'Soft pastel lilac braided crown',
      accessory: 'Binaural plush earplugs & crystal pendant',
      clothing: 'Oversized lavender cashmere cocoon cardigan',
      avatarIcon: 'Ear',
    },
  },
  {
    id: 'malik-johnson',
    name: 'Malik "Leek" Johnson',
    stageName: 'Drill Music Maker',
    bioDemographics: {
      age: 19,
      gender: 'Male',
      mbti: 'INTP',
    },
    ocean: {
      o: 85,
      c: 30,
      e: 25,
      a: 45,
      n: 50,
    },
    dsm5: {
      'ADHD-Inattentive': '85%',
      'Social Anxiety': '60%',
    },
    childhood:
      'Urban environment; early exposure to rhythm as social combat or storytelling.',
    neuroAesthetics: {
      genetics: 'High rhythmic-temporal processing markers.',
      visuals: 'Minimalist, aggressive, "Abyss" or "Toxic" themes.',
    },
    economics: {
      purchaseDecisions:
        'Tool-specific. Spends money only on highly specialized items, like custom-modded hardware or rare, dark streetwear pieces, ignoring broad consumer trends.',
    },
    dailyLifeWalkthrough:
      'Malik wakes up at 11 AM. His entire world is confined strictly to his headphones. He struggles with severe social anxiety and inattentive ADHD, making community college or holding a normal retail job nearly impossible. He spends hours staring at the Piano Roll, meticulously programming hyper-complex, sliding 808s in Flux Synth. He uses the aggressive, dark nature of Drill music to express the anger and fear he is entirely incapable of articulating in person. He rarely leaves his bedroom, actively avoiding the complex, sometimes dangerous social dynamics of his neighborhood. He eats fast food brought to him by family members, rarely joining them at the table. His subscription to Flux is his only real monthly expense. He stays up until dawn, lost in the intricate rhythms, finding a temporary sense of total control in the software that he completely lacks in his real life.',
    instruments: ['Sub-Bass 808 Glider', 'Hi-Hat Roll Sequencer', 'Distortion Pedal Chain'],
    skills: ['Micro-tonal 808 Pitch Glides', 'Triplet Counter-Rhythms', 'Dark Minor Key Arpeggios', 'VCA Automation'],
    strengths: ['Genius-level rhythmic intuition', 'Uncompromising raw authenticity', 'Sub-frequency chest rumble control'],
    weaknesses: ['Chronic executive dysfunction', 'Guarded cynicism towards authority or commercial pop'],
    voiceCommunicationStyle:
      'Low, clipped, deadpan cadence; uses underground drill vernacular; communicates volumes through brief sarcastic grunts and head nods.',
    socialBehaviorPatterns:
      'Hangs near the studio monitors with his hood pulled low; taps syncopated rhythms on every surface; rarely speaks first.',
    isInHouse: true,
    currentRoom: 'studio',
    currentActivity: 'Micro-tuning pitch envelopes on sliding sub-bass notes',
    currentEmotionalState: 'hyper-focused',
    visualAvatar: {
      color: '#0284c7',
      secondaryColor: '#0369a1',
      hairStyle: 'Tight dreadlocks under dark beanie',
      accessory: 'Matte black studio monitor cans',
      clothing: 'Oversized charcoal streetwear hoodie & cargo joggers',
      avatarIcon: 'Speaker',
    },
  },
  {
    id: 'david-sterling',
    name: 'David "Dave" Sterling',
    stageName: 'Film Composer (Drafting)',
    bioDemographics: {
      age: 41,
      gender: 'Male',
      mbti: 'INFJ',
    },
    ocean: {
      o: 95,
      c: 85,
      e: 20,
      a: 70,
      n: 85,
    },
    dsm5: {
      'Severe Generalized Anxiety Disorder (GAD)': '95%',
      'Panic Disorder': '50%',
    },
    childhood:
      'Intense focus on story and narrative; heavy reader/film watcher.',
    neuroAesthetics: {
      genetics: 'Highly active Prefrontal Cortex.',
      visuals: 'Clean, "Paper," needs to see notes/comments.',
    },
    economics: {
      purchaseDecisions:
        'Security-driven. Purchases heavy blackout curtains, premium noise-canceling headphones, and expensive, heavy-duty smart locks for his home to enforce strict boundaries.',
    },
    dailyLifeWalkthrough:
      'Dave wakes at 5 AM. He lives in a state of constant, low-level panic. His day is a grueling, isolated marathon of tight deadlines and demanding indie film directors. He suffers from severe Generalized Anxiety Disorder; a single, vague unread email can trigger a full-blown panic attack. He drafts complex orchestral ideas in Flux, relying heavily on the "Private Unlisted Link" because he is terrified of his unfinished work leaking or being stolen by competitors. He over-analyzes every piece of feedback left in the comment box, frequently interpreting completely neutral notes as severe, career-ending criticism. He rarely sees his wife or children, locking himself in his windowless home studio for 14 hours a day. He eats standing up in the kitchen, his highly active prefrontal cortex racing through string arrangements while he chews. He relies on heavy pours of bourbon to quiet his mind at night, frequently falling asleep fully clothed on the studio couch, dreading the sound of the morning alarm.',
    instruments: ['Grand Piano & Cellos', 'Orchestral Score Manuscript', 'Analog Synthesizer Drone'],
    skills: ['Polyphonic Modal Counterpoint', 'Psychological Film Scoring', 'Dynamic Tension Arcs', 'Leitmotif Weaving'],
    strengths: ['Profound cinematic emotional depth', 'Virtuosic harmonic theory', 'Vast orchestral palette knowledge'],
    weaknesses: ['Crippling impostor syndrome', 'Existential terror of client feedback revisions and leaks'],
    voiceCommunicationStyle:
      'Nervous, intellectual, breathless; pauses to agonize over whether he offended anyone; references film scores and dramatic motifs.',
    socialBehaviorPatterns:
      'Paces restlessly around the dining table; repeatedly taps manuscript paper against the edge; nervously drinks ice water.',
    isInHouse: true,
    currentRoom: 'dining_room',
    currentActivity: 'Annotating tempo variations on a draft film score sheet',
    currentEmotionalState: 'anxious',
    visualAvatar: {
      color: '#d97706',
      secondaryColor: '#b45309',
      hairStyle: 'Rumpled wavy salt-and-pepper hair',
      accessory: 'Leather manuscript portfolio & fountain pen',
      clothing: 'Herringbone tweed blazer over dark turtleneck',
      avatarIcon: 'Music',
    },
  },
  {
    id: 'benji-park',
    name: 'Benjamin "Benji" Park',
    stageName: 'Foley Artist',
    bioDemographics: {
      age: 45,
      gender: 'Male',
      mbti: 'ISFP',
    },
    ocean: {
      o: 95,
      c: 75,
      e: 25,
      a: 80,
      n: 45,
    },
    dsm5: {
      'ASD-Level 1 (Sensory seeking)': '65%',
    },
    childhood:
      '"Outdoor" child; collected tactile items. Exploratory play style.',
    neuroAesthetics: {
      genetics: 'High sensory seeking (dopamine receptor density).',
      visuals: 'Organic, focus on waveform zoom.',
    },
    economics: {
      purchaseDecisions:
        'Experimenter. Buys odd, heavily textured thrift-store clothing, bizarre abstract sculptures, and unusual, highly spiced exotic foods just to see what they are like.',
    },
    dailyLifeWalkthrough:
      'Benji wakes at 8 AM. His rented house is filled with literal garbage—scrap metal, old doors, broken glass, and gravel—which he hoards specifically for Foley recording. He is on the Autism spectrum (Level 1) and is incredibly, physically sensory-seeking. He spends his day smashing vegetables with mallets or slamming heavy doors, then meticulously uses Flux\'s FrequencyShifter to manipulate the raw recordings into sci-fi explosion sounds. He has an exploratory, almost childlike play style, but it completely alienates his neighbors who constantly file noise complaints with the city. He is easily distracted and often forgets to pay his utility bills because he is hyper-focused on the tactile sensation of crushing a soda can next to a microphone. He eats irregularly, grabbing handfuls of dry cereal whenever he remembers to. He pays solely for the bizarre, extreme DSP nodes, finding immense personal comfort in the radical distortion of reality. He frequently falls asleep at random hours directly on his studio floor.',
    instruments: ['Scrap Metal & Ceramic Resonators', 'Frequency Shifter DSP', 'Shotgun Microphone'],
    skills: ['Tactile Sound Manipulation', 'Organic Foley Synthesis', 'Extreme DSP Pitch Sculpting', 'Kinetic Acoustic Design'],
    strengths: ['Limitless exploratory curiosity', 'Transforms household trash into otherworldly sonic gold'],
    weaknesses: ['Zero sense of social decorum regarding noise levels', 'Easily derailed by tactile objects in the room'],
    voiceCommunicationStyle:
      'Animated, sudden bursts of wonder, vocal sound effects ("crrrk", "shh-whoosh"); invites others to touch and listen to weird objects.',
    socialBehaviorPatterns:
      'Crawls on floor checking wood resonance; gleefully knocks on chair legs with spoons; shows everyone crushed items.',
    isInHouse: true,
    currentRoom: 'studio',
    currentActivity: 'Testing the acoustic rattle of a vintage brass key chain',
    currentEmotionalState: 'euphoric',
    visualAvatar: {
      color: '#16a34a',
      secondaryColor: '#15803d',
      hairStyle: 'Unkempt shaggy mop',
      accessory: 'Utility belt with screwdrivers and mallets',
      clothing: 'Patched denim boiler suit stained with chalk',
      avatarIcon: 'Hammer',
    },
  },
  {
    id: 'ty-brooks',
    name: 'Tyler "Ty" Brooks',
    stageName: 'Stem Mixer',
    bioDemographics: {
      age: 35,
      gender: 'Male',
      mbti: 'ESTP',
    },
    ocean: {
      o: 60,
      c: 75,
      e: 80,
      a: 50,
      n: 20,
    },
    dsm5: {
      'Substance Use-Mild': '30%',
    },
    childhood:
      'Collaborative child; the drummer in the school band. Values "the pocket."',
    neuroAesthetics: {
      genetics: 'High heritability for rhythmic precision.',
      visuals: 'Skeuomorphic analog-console layout.',
    },
    economics: {
      purchaseDecisions:
        'Performance-driven. Spends money on rugged, vintage band tees, reliable heavy-duty drum hardware, and greasy, calorie-dense late-night food that fuels his high-energy lifestyle.',
    },
    dailyLifeWalkthrough:
      'Tyler wakes at noon, usually slightly hungover. He is a highly social, collaborative extrovert who functions best in loud, chaotic environments. He mixes stems for local rock and house bands. His workflow is entirely "by feel." He relies heavily on the SidechainDucker pedal to make the bass and kick pump aggressively. He doesn\'t actually understand the mathematical ratios behind the compression; he just violently tweaks the knob until it "hits right." He frequently smokes weed in his studio during sessions, which sometimes leads to muddy, overly bass-heavy mixes that he has to frantically fix the next morning. He constantly misses deadlines because he prioritizes going to local house shows over actually rendering files. He eats whatever junk food the band brings to the studio. He pays because he needs the tools to perform quickly while an impatient client is sitting on the couch right behind him.',
    instruments: ['Analog Mixing Desk', 'Sidechain Compressor Pedal', 'Drumsticks & Kick Bus'],
    skills: ['Sidechain Pumping Rhythms', 'Analog Saturation Warmth', 'Live Bus Compression', 'Pocket Groove Alignment'],
    strengths: ['Infectious social swagger', 'Uncanny groove instincts', 'Turns sterile recordings into punchy, physical records'],
    weaknesses: ['Disdains technical documentation and specs', 'Procrastinates export deadlines until the eleventh hour'],
    voiceCommunicationStyle:
      'Loud, raspy, warm, filled with rhythm slang ("lock in", "pump the kick", "let it breathe"); slaps people on the shoulder.',
    socialBehaviorPatterns:
      'Sprawls across couches with legs stretched out; mimics drum grooves on his knees; invites everyone to turn up the volume.',
    isInHouse: true,
    currentRoom: 'studio',
    currentActivity: 'Tweaking analog saturation pots and nodding to a kick loop',
    currentEmotionalState: 'euphoric',
    visualAvatar: {
      color: '#ea580c',
      secondaryColor: '#c2410c',
      hairStyle: 'Buzzcut with faded sides and stubble',
      accessory: 'Drumstick in back pocket & vintage wrist cuff',
      clothing: 'Faded vintage black band tee and distressed jeans',
      avatarIcon: 'Sliders',
    },
  },
];
