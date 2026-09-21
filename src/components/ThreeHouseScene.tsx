import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Persona,
  RoomId,
  PersonaActionDecision,
  CharacterActionType,
  WeatherType,
  OutdoorEvent,
  CharacterJamState,
} from '../types';
import { soundEngine } from '../audio/soundEngine';
import { personaJamEngine } from '../audio/personaJamEngine';
import { buildPortlandCommuneHouse } from './scene/HouseArchitecture';
import {
  createOutdoorEnvironment,
  OutdoorEnvironmentManager,
} from './scene/OutdoorEnvironment';
import {
  createWeatherAndSky,
  WeatherAndSkyManager,
} from './scene/WeatherAndSky';
import {
  CharacterController,
  createArticulatedCharacter,
  planPathThroughDoorways,
  getHotspotByName,
  getRandomHotspot,
  updateCharacterAnimation,
  updateCharacterNameplate,
  setCharacterSpeechBubble,
} from './scene/CharacterModel';
import { subAgentManager } from './agent/SubAgentManager';
import { SubAgentControlDeck } from './agent/SubAgentControlDeck';
import {
  Compass,
  Home,
  Armchair,
  Coffee,
  Sliders,
  Eye,
  Disc,
  Zap,
  Play,
  Pause,
  CloudRain,
  CloudDrizzle,
  Cloud,
  CloudSun,
  CloudLightning,
  Snowflake,
  Flame,
  Sun,
  Moon,
  ChevronDown,
  Music,
  Volume2,
  VolumeX,
  Sparkles,
  Car,
  Trees,
} from 'lucide-react';

interface ThreeHouseSceneProps {
  personas: Persona[];
  activePersonaId: string | null;
  onSelectPersona: (persona: Persona) => void;
  onOpenDAW: () => void;
  latestMessage?: { speakerId: string; speakerName: string; text: string; actionNote?: string } | null;
  onUpdatePersonaState?: (personaId: string, updates: Partial<Persona>) => void;
}

interface AgentLiveStatus {
  actionLabel: string;
  thought?: string;
  isThinking: boolean;
  lastUpdated: number;
}

export const ThreeHouseScene: React.FC<ThreeHouseSceneProps> = ({
  personas,
  activePersonaId,
  onSelectPersona,
  onOpenDAW,
  latestMessage,
  onUpdatePersonaState,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controllersRef = useRef<Map<string, CharacterController>>(new Map());
  const animationFrameId = useRef<number | null>(null);

  // Synchronized state refs to avoid stale closures in event handlers
  const personasRef = useRef<Persona[]>(personas);
  personasRef.current = personas;

  const latestMessageRef = useRef(latestMessage);
  latestMessageRef.current = latestMessage;

  const onUpdatePersonaStateRef = useRef(onUpdatePersonaState);
  onUpdatePersonaStateRef.current = onUpdatePersonaState;

  const onSelectPersonaRef = useRef(onSelectPersona);
  onSelectPersonaRef.current = onSelectPersona;

  const onOpenDAWRef = useRef(onOpenDAW);
  onOpenDAWRef.current = onOpenDAW;

  // Camera preset positions
  const [cameraView, setCameraView] = useState<
    'overview' | 'living' | 'dining' | 'studio' | 'street' | 'follow'
  >('overview');
  const [isDragging, setIsDragging] = useState(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const cameraTarget = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.6, 0));
  const currentCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 18, 24));
  const desiredCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 18, 24));

  // Outdoor Environment & Weather & Day/Night Cycle State
  const [weather, setWeather] = useState<WeatherType>('partially_cloudy');
  const [timeOfDay, setTimeOfDay] = useState<number>(17.5); // 5:30 PM Portland golden twilight
  const [isTimeAutoCycling, setIsTimeAutoCycling] = useState<boolean>(true);
  const [isWeatherDropdownOpen, setIsWeatherDropdownOpen] = useState<boolean>(false);
  const [latestOutdoorEvent, setLatestOutdoorEvent] = useState<OutdoorEvent | null>(null);

  const weatherRef = useRef<WeatherType>(weather);
  weatherRef.current = weather;
  const timeOfDayRef = useRef<number>(timeOfDay);
  timeOfDayRef.current = timeOfDay;
  const isTimeAutoCyclingRef = useRef<boolean>(isTimeAutoCycling);
  isTimeAutoCyclingRef.current = isTimeAutoCycling;

  const outdoorManagerRef = useRef<OutdoorEnvironmentManager | null>(null);
  const weatherSkyManagerRef = useRef<WeatherAndSkyManager | null>(null);

  // Collaborative Music & Persona Jam State
  const [jamState, setJamState] = useState<CharacterJamState | null>(null);
  const [isJamMuted, setIsJamMuted] = useState<boolean>(false);

  // Subscribe to Collaborative Persona Jam Engine
  useEffect(() => {
    const unsub = personaJamEngine.subscribe((state) => {
      setJamState(state);
    });
    return unsub;
  }, []);

  // Autonomous Agent Control State
  const [isAutonomousEnabled, setIsAutonomousEnabled] = useState(true);
  const [agentLiveStatuses, setAgentLiveStatuses] = useState<Record<string, AgentLiveStatus>>({});
  const [isSpurringAction, setIsSpurringAction] = useState(false);

  // Agent cycle tracking refs
  const lastDecisionTimesRef = useRef<Map<string, number>>(new Map());
  const pendingAgentStepsRef = useRef<Set<string>>(new Set());
  const elapsedRef = useRef(0);
  const lastGlobalDecisionTimeRef = useRef(0);

  // Sound mapping helper
  const mapActionToSound = (action: CharacterActionType) => {
    switch (action) {
      case 'playing_synth':
        return 'synth_chord';
      case 'playing_piano':
        return 'piano_note';
      case 'spinning_vinyl':
        return 'vinyl_spin';
      case 'warming_fireplace':
        return 'fire_ember';
      case 'playing_guitar':
        return 'guitar_strum';
      case 'drinking_tea':
        return 'tea_sip';
      case 'recording_mic':
        return 'mic_tap';
      default:
        return 'none';
    }
  };

  // Apply decision received from an autonomous sub-agent to the 3D character controller
  const applyAgentDecisionToCharacter = useCallback(
    (personaId: string, decision: PersonaActionDecision) => {
      const ctrl = controllersRef.current.get(personaId);
      const persona = personasRef.current.find((p) => p.id === personaId);
      if (!ctrl || !persona) return;

      // Resolve Target Hotspot
      let targetSpot = getHotspotByName(decision.targetHotspot);
      if (!targetSpot || targetSpot.roomId !== decision.targetRoom) {
        targetSpot = getRandomHotspot(decision.targetRoom);
      }

      // 1. Path Planning through Doorways & Obstacles via NavMesh
      const destination = new THREE.Vector3(targetSpot.x, 0, targetSpot.z);
      const waypoints = planPathThroughDoorways(ctrl.group.position, destination);

      if (waypoints.length > 0) {
        ctrl.waypointQueue = waypoints;
        ctrl.isMoving = true;
      } else {
        ctrl.waypointQueue = [];
        ctrl.isMoving = false;
      }
      ctrl.currentRoom = decision.targetRoom;
      ctrl.currentHotspotName = targetSpot.name;
      ctrl.currentActionType = decision.actionType;
      ctrl.facingAngle = targetSpot.facingAngle;
      ctrl.targetSeatHeight = targetSpot.seatHeight || 0.6;
      ctrl.currentActivity = decision.actionDescription || targetSpot.label;
      ctrl.lastThought = decision.thought;

      // 2. Play Audio Effect & Synchronize with Collaborative Persona Jam Engine
      const isInstrument = [
        'playing_synth',
        'playing_piano',
        'playing_guitar',
        'recording_mic',
        'spinning_vinyl',
      ].includes(decision.actionType);

      if (isInstrument) {
        soundEngine.init();
        personaJamEngine.setPerformer(persona, decision.actionType, targetSpot.label);
      } else {
        personaJamEngine.removePerformer(personaId);
      }

      const soundType = decision.soundTrigger || targetSpot.soundTrigger || mapActionToSound(decision.actionType);
      if (soundType && soundType !== 'none') {
        soundEngine.playActionSound(soundType);
      }

      // 3. Show Thought / Speech Bubble
      const bubbleText = decision.spokenDialogue || decision.thought;
      const isThought = !decision.spokenDialogue;
      setCharacterSpeechBubble(ctrl, bubbleText, isThought);

      // Auto-hide bubble after 6.5s
      setTimeout(() => {
        if (ctrl.speechBubble) {
          ctrl.speechBubble.visible = false;
        }
      }, 6500);

      // 4. Update 3D Floating Nameplate
      updateCharacterNameplate(ctrl, persona, decision.actionDescription || targetSpot.label);

      // 5. Update Live Agent Status State & Parent App State
      setAgentLiveStatuses((prev) => ({
        ...prev,
        [personaId]: {
          actionLabel: decision.actionDescription || targetSpot.label,
          thought: decision.thought,
          isThinking: false,
          lastUpdated: Date.now(),
        },
      }));

      onUpdatePersonaStateRef.current?.(personaId, {
        currentRoom: decision.targetRoom,
        currentEmotionalState: decision.updatedEmotionalState,
        currentActivity: decision.actionDescription || targetSpot.label,
        lastThought: decision.thought,
      });

      lastDecisionTimesRef.current.set(personaId, elapsedRef.current);
    },
    []
  );

  // Autonomous Decision Execution (Dispatches to SubAgentManager for this persona)
  const triggerAgentStep = useCallback(
    async (personaId: string, forced: boolean = false, userDirective?: string) => {
      const persona = personasRef.current.find((p) => p.id === personaId);
      if (!persona || !persona.isInHouse) return;

      const ctrl = controllersRef.current.get(personaId);
      if (!ctrl) return;

      if (ctrl.isMoving && !forced) return;

      setAgentLiveStatuses((prev) => ({
        ...prev,
        [personaId]: {
          actionLabel: prev[personaId]?.actionLabel || ctrl.currentActivity || 'Deliberating...',
          thought: prev[personaId]?.thought,
          isThinking: true,
          lastUpdated: Date.now(),
        },
      }));

      await subAgentManager.tickSubAgent(personaId, userDirective);
    },
    []
  );

  // Initialize Three.js Scene, Lighting, & Architecture
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene with atmospheric PNW evening palette
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#13110e');
    scene.fog = new THREE.FogExp2('#13110e', 0.018);

    // 2. Camera setup
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 1000);
    camera.position.copy(desiredCameraPos.current);
    camera.lookAt(cameraTarget.current);
    cameraRef.current = camera;

    // 3. Renderer with soft PCF shadows and tone mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;
    container.replaceChildren(renderer.domElement);

    // 4. Dynamic Day/Night Lighting, Sky & Weather System
    const weatherSky = createWeatherAndSky(scene);
    weatherSkyManagerRef.current = weatherSky;

    // 5. Exterior 3D Modeling (Elevated Foundation, Front Porch, Steps, Yard, Trees, Sidewalk, Street, Moving Cars)
    const outdoorEnv = createOutdoorEnvironment(scene);
    outdoorManagerRef.current = outdoorEnv;
    outdoorEnv.setOnEventCallback((ev: OutdoorEvent) => {
      setLatestOutdoorEvent(ev);
      // Auto-clear toast after 6.5s
      setTimeout(() => {
        setLatestOutdoorEvent((curr) => (curr?.id === ev.id ? null : curr));
      }, 6500);
    });

    // 6. Build Architectural Portland House with Doorway Openings
    buildPortlandCommuneHouse(scene);

    // Clear and instantiate initial resident bodies directly into the fresh scene
    controllersRef.current.clear();
    personasRef.current.forEach((persona, index) => {
      if (!persona.isInHouse) return;
      try {
        const ctrl = createArticulatedCharacter(persona, index);
        scene.add(ctrl.group);
        controllersRef.current.set(persona.id, ctrl);
        lastDecisionTimesRef.current.set(persona.id, index * 3.5);
      } catch (err) {
        console.error('Failed to create character for', persona.name, err);
      }
    });

    // 6. Interactive Raycasting for Selecting Characters & Objects
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      let clickedPersonaId: string | null = null;
      let clickedActionTag: string | null = null;

      for (const hit of intersects) {
        let curr: THREE.Object3D | null = hit.object;
        while (curr) {
          if (curr.userData && curr.userData.personaId) {
            clickedPersonaId = curr.userData.personaId;
            break;
          }
          if (curr.userData && curr.userData.actionTag) {
            clickedActionTag = curr.userData.actionTag;
            break;
          }
          curr = curr.parent;
        }
        if (clickedPersonaId || clickedActionTag) break;
      }

      if (clickedPersonaId) {
        const found = personasRef.current.find((p) => p.id === clickedPersonaId);
        if (found) {
          soundEngine.init();
          soundEngine.playSynth('E4', 0.2, 'triangle', 0.25);
          onSelectPersonaRef.current(found);
        }
      } else if (clickedActionTag === 'open_daw') {
        soundEngine.init();
        soundEngine.playSynth('G4', 0.3, 'sine', 0.3);
        onOpenDAWRef.current();
      } else if (clickedActionTag === 'play_synth') {
        soundEngine.init();
        soundEngine.playActionSound('synth_chord');
      } else if (clickedActionTag === 'dining_table') {
        soundEngine.init();
        soundEngine.playActionSound('tea_sip');
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // 7. Resize Observer with requestAnimationFrame guard to prevent loop errors
    let resizeRaf: number | null = null;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w === 0 || h === 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      });
    });
    resizeObserver.observe(container);

    // 8. Main Render & Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      elapsedRef.current = elapsed;

      // Smooth camera interpolation
      currentCameraPos.current.lerp(desiredCameraPos.current, 0.08);
      camera.position.copy(currentCameraPos.current);
      camera.lookAt(cameraTarget.current);

      // Advance Time of Day if Auto-cycling is enabled
      if (isTimeAutoCyclingRef.current) {
        timeOfDayRef.current = (timeOfDayRef.current + delta * 0.12) % 24;
        setTimeOfDay(timeOfDayRef.current);
      }

      // Update Sky & Weather Lighting System
      if (weatherSkyManagerRef.current) {
        weatherSkyManagerRef.current.setTimeOfDay(timeOfDayRef.current);
        weatherSkyManagerRef.current.setWeather(weatherRef.current);
        const { isNight, nightFactor } = weatherSkyManagerRef.current.update(delta, elapsed);

        // Update Outdoor Environment (cars, porch lanterns, fireflies, streetlights)
        if (outdoorManagerRef.current) {
          outdoorManagerRef.current.update(delta, elapsed, isNight, nightFactor);
        }
      }

      // Subtle fireplace ember flicker
      const fireLight = scene.getObjectByName('fireLight') as THREE.PointLight;
      if (fireLight) {
        fireLight.intensity = 1.8 + Math.sin(elapsed * 7.5) * 0.3 + Math.cos(elapsed * 13.0) * 0.15;
      }

      // Identify position of current speaker for head-tracking
      let speakerWorldPos: THREE.Vector3 | null = null;
      if (latestMessageRef.current) {
        const speakerCtrl = controllersRef.current.get(latestMessageRef.current.speakerId);
        if (speakerCtrl) {
          speakerWorldPos = speakerCtrl.group.position.clone();
        }
      }

      // Update all Articulated Characters
      const allPositions: THREE.Vector3[] = [];
      controllersRef.current.forEach((c) => {
        allPositions.push(c.group.position);
      });

      controllersRef.current.forEach((ctrl) => {
        const p = personasRef.current.find((x) => x.id === ctrl.personaId);
        if (!p) return;

        const isSpeaking = latestMessageRef.current
          ? latestMessageRef.current.speakerId === p.id
          : false;

        const neighborPositions = allPositions.filter((pos) => pos !== ctrl.group.position);

        // Update Character Animation with shortest-arc rotation and separation forces
        updateCharacterAnimation(
          ctrl,
          delta,
          elapsed,
          isSpeaking,
          p.currentEmotionalState,
          speakerWorldPos,
          neighborPositions
        );
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      controllersRef.current.forEach((ctrl) => {
        scene.remove(ctrl.group);
      });
      controllersRef.current.clear();
      weatherSkyManagerRef.current?.dispose();
      outdoorManagerRef.current?.dispose();
      renderer.dispose();
    };
  }, []);

  // Update Character Roster & Model Instantiation when personas list changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove personas who left the house
    controllersRef.current.forEach((ctrl, id) => {
      const p = personas.find((x) => x.id === id);
      if (!p || !p.isInHouse) {
        scene.remove(ctrl.group);
        controllersRef.current.delete(id);
      }
    });

    // Create or update each persona inside the house
    personas.forEach((persona, index) => {
      if (!persona.isInHouse) return;

      let ctrl = controllersRef.current.get(persona.id);
      if (!ctrl) {
        try {
          ctrl = createArticulatedCharacter(persona, index);
          scene.add(ctrl.group);
          controllersRef.current.set(persona.id, ctrl);

          // Initialize staggered decision timer so they don't all decide simultaneously
          lastDecisionTimesRef.current.set(persona.id, elapsedRef.current + index * 3.5);
        } catch (err) {
          console.error('Failed to create character for', persona.name, err);
        }
      } else if (ctrl.group.parent !== scene) {
        scene.add(ctrl.group);
      }

      if (ctrl) {
        // If room changed externally (e.g. from modal), navigate through doorways
        if (ctrl.currentRoom !== persona.currentRoom && !ctrl.isMoving) {
          ctrl.currentRoom = persona.currentRoom;
          const targetHotspot = getRandomHotspot(persona.currentRoom);
          const destination = new THREE.Vector3(targetHotspot.x, 0, targetHotspot.z);
          const waypoints = planPathThroughDoorways(ctrl.group.position, destination);
          if (waypoints.length > 0) {
            ctrl.waypointQueue = waypoints;
            ctrl.isMoving = true;
          } else {
            ctrl.waypointQueue = [];
            ctrl.isMoving = false;
          }
          ctrl.currentHotspotName = targetHotspot.name;
          ctrl.currentActionType = targetHotspot.defaultAction;
          ctrl.facingAngle = targetHotspot.facingAngle;
          ctrl.targetSeatHeight = targetHotspot.seatHeight || 0.6;
          ctrl.currentActivity = targetHotspot.label;
        }

        // Update Speech Bubble if this persona spoke in discourse
        const isSpeaking = latestMessage && latestMessage.speakerId === persona.id;
        if (isSpeaking) {
          setCharacterSpeechBubble(ctrl, latestMessage.text, false);
        }

        // Toggle Active Selection Ring
        if (ctrl.halo) {
          ctrl.halo.visible = activePersonaId === persona.id;
        }
      }
    });
  }, [personas, activePersonaId, latestMessage]);

  // Synchronize personas with individual autonomous sub-agents
  useEffect(() => {
    subAgentManager.syncPersonas(personas);
  }, [personas]);

  // Subscribe to SubAgentManager decisions for all resident characters
  useEffect(() => {
    const unsubscribe = subAgentManager.subscribe({
      onDecision: (personaId, decision) => {
        applyAgentDecisionToCharacter(personaId, decision);
      },
    });
    return unsubscribe;
  }, [applyAgentDecisionToCharacter]);

  // Update SubAgentManager global autonomy state
  useEffect(() => {
    subAgentManager.setGlobalAutonomy(isAutonomousEnabled);
  }, [isAutonomousEnabled]);

  // Instant Spur: triggers an immediate autonomous agent step for active or random resident
  const handleSpurAgentAction = async () => {
    const inHouse = personas.filter((p) => p.isInHouse);
    if (inHouse.length === 0) return;

    setIsSpurringAction(true);
    soundEngine.init();
    soundEngine.playSynth('F#4', 0.25, 'triangle', 0.3);

    // Pick active persona or a random stationed resident
    const targetPersona =
      (activePersonaId && inHouse.find((p) => p.id === activePersonaId)) ||
      inHouse[Math.floor(Math.random() * inHouse.length)];

    if (targetPersona) {
      await triggerAgentStep(targetPersona.id, true);
    }
    setTimeout(() => setIsSpurringAction(false), 800);
  };

  // Camera preset controller
  const setPreset = (
    view: 'overview' | 'living' | 'dining' | 'studio' | 'street' | 'follow'
  ) => {
    setCameraView(view);
    if (view === 'overview') {
      desiredCameraPos.current.set(0, 22, 34);
      cameraTarget.current.set(0, 1.4, 4);
    } else if (view === 'living') {
      desiredCameraPos.current.set(-10, 8.5, 9.5);
      cameraTarget.current.set(-10, 1.4, -0.5);
    } else if (view === 'dining') {
      desiredCameraPos.current.set(0, 9.5, 10);
      cameraTarget.current.set(0, 1.4, 0);
    } else if (view === 'studio') {
      desiredCameraPos.current.set(10, 8.5, 9.5);
      cameraTarget.current.set(10, 1.4, -0.5);
    } else if (view === 'street') {
      desiredCameraPos.current.set(0, 15, 48);
      cameraTarget.current.set(0, 1.2, 16);
    }
  };

  // Follow active persona camera tracking
  useEffect(() => {
    if (cameraView === 'follow' && activePersonaId) {
      const ctrl = controllersRef.current.get(activePersonaId);
      if (ctrl) {
        desiredCameraPos.current.set(ctrl.group.position.x, 6.0, ctrl.group.position.z + 7.5);
        cameraTarget.current.set(ctrl.group.position.x, 1.4, ctrl.group.position.z);
      }
    }
  }, [activePersonaId, cameraView, personas]);

  // Mouse drag camera orbit
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    desiredCameraPos.current.x -= deltaX * 0.04;
    desiredCameraPos.current.y += deltaY * 0.04;
    desiredCameraPos.current.y = Math.max(2.0, Math.min(65, desiredCameraPos.current.y));

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => setIsDragging(false);

  // Extended zoom out to view elevated residence, front steps, yard, street and cars
  const handleWheel = (e: React.WheelEvent) => {
    desiredCameraPos.current.z += e.deltaY * 0.025;
    desiredCameraPos.current.z = Math.max(4.5, Math.min(85, desiredCameraPos.current.z));
  };

  // Weather options for the dropdown with all 7 requested weather icons
  const WEATHER_OPTIONS: Array<{
    type: WeatherType;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      type: 'light_rain',
      label: 'Light Rain',
      icon: <CloudRain className="w-3.5 h-3.5 text-sky-400" />,
    },
    {
      type: 'heavy_rain',
      label: 'Heavy Rain',
      icon: <CloudDrizzle className="w-3.5 h-3.5 text-blue-500" />,
    },
    {
      type: 'cloudy',
      label: 'Cloudy',
      icon: <Cloud className="w-3.5 h-3.5 text-slate-400" />,
    },
    {
      type: 'partially_cloudy',
      label: 'Partially Cloudy',
      icon: <CloudSun className="w-3.5 h-3.5 text-amber-300" />,
    },
    {
      type: 'thunderstorm',
      label: 'Thunderstorm',
      icon: <CloudLightning className="w-3.5 h-3.5 text-indigo-400" />,
    },
    {
      type: 'snow',
      label: 'Snow',
      icon: <Snowflake className="w-3.5 h-3.5 text-cyan-200" />,
    },
    {
      type: 'smoke',
      label: 'Smoke',
      icon: <Flame className="w-3.5 h-3.5 text-amber-500" />,
    },
  ];

  const getWeatherIcon = (w: WeatherType) => {
    switch (w) {
      case 'light_rain':
        return <CloudRain className="w-3.5 h-3.5 text-sky-400" />;
      case 'heavy_rain':
        return <CloudDrizzle className="w-3.5 h-3.5 text-blue-500" />;
      case 'cloudy':
        return <Cloud className="w-3.5 h-3.5 text-slate-400" />;
      case 'partially_cloudy':
        return <CloudSun className="w-3.5 h-3.5 text-amber-300" />;
      case 'thunderstorm':
        return <CloudLightning className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />;
      case 'snow':
        return <Snowflake className="w-3.5 h-3.5 text-cyan-200" />;
      case 'smoke':
        return <Flame className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <CloudSun className="w-3.5 h-3.5 text-amber-300" />;
    }
  };

  const formatTimeOfDay = (hours: number) => {
    const totalMinutes = Math.floor(hours * 60) % 1440;
    const h24 = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const period = h24 >= 12 ? 'PM' : 'AM';
    const displayH = h24 % 12 === 0 ? 12 : h24 % 12;
    const mm = m < 10 ? `0${m}` : m;
    return `${displayH}:${mm} ${period}`;
  };

  // Helper to trigger collaborative duo jam
  const triggerDuoJam = (persona1Id: string, persona2Id: string) => {
    const p1 = personasRef.current.find((p) => p.id === persona1Id);
    const p2 = personasRef.current.find((p) => p.id === persona2Id);
    if (!p1 || !p2) return;

    soundEngine.init();

    // Assign p1 to synth
    applyAgentDecisionToCharacter(p1.id, {
      personaId: p1.id,
      thought: `Syncing tracks with ${p2.name} in the studio.`,
      spokenDialogue: "Let's craft this rhythm together.",
      targetRoom: 'studio',
      targetHotspot: 'analog_synth',
      actionType: 'playing_synth',
      actionDescription: 'Playing Analog Poly-Synth',
      updatedEmotionalState: 'inspired',
      soundTrigger: 'synth_chord',
    });

    // Assign p2 to piano
    setTimeout(() => {
      applyAgentDecisionToCharacter(p2.id, {
        personaId: p2.id,
        thought: `Harmonizing chords with ${p1.name}.`,
        spokenDialogue: 'Locked into the tempo.',
        targetRoom: 'studio',
        targetHotspot: 'upright_piano',
        actionType: 'playing_piano',
        actionDescription: 'Playing Upright Piano',
        updatedEmotionalState: 'inspired',
        soundTrigger: 'piano_note',
      });
    }, 280);
  };

  const inHouseResidents = personas.filter((p) => p.isInHouse);

  return (
    <div
      id="portland-house-scene"
      className="relative w-full h-full select-none overflow-hidden bg-[#14120f] rounded-2xl border border-[#38332c] shadow-2xl flex flex-col"
    >
      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Top Header Overlay Bar - Unified non-overlapping layout */}
      <div className="absolute top-3 inset-x-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Side: View Cameras Panel + Atmosphere Tool Panel directly to the right */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* 1. View Cameras Panel */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#1e1c18]/94 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#443d34] shadow-xl text-xs text-[#e5ded2]">
            <span className="font-serif-artisanal text-xs text-[#b8ad9c] flex items-center gap-1.5 mr-0.5 font-semibold">
              <Compass className="w-3.5 h-3.5 text-[#d97736]" /> View:
            </span>
            <button
              id="cam-overview-btn"
              onClick={() => setPreset('overview')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 text-xs ${
                cameraView === 'overview'
                  ? 'bg-[#c86236] text-white shadow-md'
                  : 'bg-[#282520] hover:bg-[#343029] text-[#cfc7b8] border border-[#3e372e]'
              }`}
            >
              <Home className="w-3.5 h-3.5" /> Full Residence
            </button>
            <button
              id="cam-street-btn"
              onClick={() => setPreset('street')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 text-xs ${
                cameraView === 'street'
                  ? 'bg-[#3b5e39] text-white shadow-md'
                  : 'bg-[#282520] hover:bg-[#343029] text-[#cfc7b8] border border-[#3e372e]'
              }`}
              title="View outdoor front porch, steps, yard, and street traffic"
            >
              <Trees className="w-3.5 h-3.5 text-emerald-400" /> Street & Porch
            </button>
            <button
              id="cam-living-btn"
              onClick={() => setPreset('living')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 text-xs ${
                cameraView === 'living'
                  ? 'bg-[#a35e39] text-white shadow-md'
                  : 'bg-[#282520] hover:bg-[#343029] text-[#cfc7b8] border border-[#3e372e]'
              }`}
            >
              <Armchair className="w-3.5 h-3.5 text-[#e5b382]" /> Hearth Parlor
            </button>
            <button
              id="cam-dining-btn"
              onClick={() => setPreset('dining')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 text-xs ${
                cameraView === 'dining'
                  ? 'bg-[#5b6e4e] text-white shadow-md'
                  : 'bg-[#282520] hover:bg-[#343029] text-[#cfc7b8] border border-[#3e372e]'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-[#9ab08c]" /> Communal Table
            </button>
            <button
              id="cam-studio-btn"
              onClick={() => setPreset('studio')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 text-xs ${
                cameraView === 'studio'
                  ? 'bg-[#7e4f7a] text-white shadow-md'
                  : 'bg-[#282520] hover:bg-[#343029] text-[#cfc7b8] border border-[#3e372e]'
              }`}
            >
              <Disc className="w-3.5 h-3.5 text-[#cda4c9]" /> Sound Lab
            </button>
            {activePersonaId && (
              <button
                id="cam-follow-btn"
                onClick={() => setCameraView('follow')}
                className={`px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 text-xs ${
                  cameraView === 'follow'
                    ? 'bg-[#c49b4d] text-slate-950 font-semibold shadow-md'
                    : 'bg-[#282520] hover:bg-[#343029] text-[#cfc7b8] border border-[#3e372e]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Follow Resident
              </button>
            )}
          </div>

          {/* 2. Tool Panel to the right of the View tool panel: Time of Day Slider & Weather Dropdown Arrow */}
          <div
            id="atmosphere-tool-panel"
            className="flex items-center gap-2.5 bg-[#1e1c18]/94 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#443d34] shadow-xl text-xs text-[#e5ded2]"
          >
            {/* Time of Day Section: Sun/Moon, clock, slider, auto-cycle play/pause */}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[#e5b382]">
                {timeOfDay >= 6 && timeOfDay < 18 ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-sky-300" />
                )}
                <span className="font-mono text-[11px] font-semibold text-[#f5efe4] w-14">
                  {formatTimeOfDay(timeOfDay)}
                </span>
              </span>

              {/* Time Slider */}
              <input
                id="time-of-day-slider"
                type="range"
                min="0"
                max="24"
                step="0.2"
                value={timeOfDay}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTimeOfDay(val);
                  timeOfDayRef.current = val;
                }}
                className="w-18 sm:w-24 accent-[#d97736] h-1.5 bg-[#343029] rounded-lg cursor-pointer"
                title="Slide to adjust time of day"
              />

              {/* Play / Pause Auto Day-Night Progression */}
              <button
                id="time-cycle-toggle-btn"
                onClick={() => {
                  const next = !isTimeAutoCycling;
                  setIsTimeAutoCycling(next);
                  isTimeAutoCyclingRef.current = next;
                }}
                className={`p-1 rounded-md transition-colors ${
                  isTimeAutoCycling
                    ? 'text-amber-400 hover:text-amber-300 bg-[#332a21]'
                    : 'text-[#8e8576] hover:text-[#cfc7b8] bg-[#221f1a]'
                }`}
                title={isTimeAutoCycling ? 'Pause Day/Night Cycle' : 'Auto-advance Day/Night Cycle'}
              >
                {isTimeAutoCycling ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
            </div>

            {/* Separator inside panel */}
            <span className="text-[#4e463b] font-light">|</span>

            {/* Weather Dropdown Section: dropdown arrow to the right within the same tool panel */}
            <div className="relative">
              <button
                id="weather-dropdown-btn"
                onClick={() => setIsWeatherDropdownOpen(!isWeatherDropdownOpen)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#282520] hover:bg-[#343029] border border-[#3e372e] transition-all text-[#e5ded2] text-xs"
                title="Choose weather"
              >
                {getWeatherIcon(weather)}
                <span className="text-[11px] font-medium capitalize hidden sm:inline">
                  {weather.replace('_', ' ')}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-[#b8ad9c] transition-transform duration-200 ${
                    isWeatherDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu with all 7 requested Weather Icons */}
              {isWeatherDropdownOpen && (
                <div
                  id="weather-options-menu"
                  className="absolute top-full left-0 mt-1.5 w-48 bg-[#1a1815]/98 backdrop-blur-lg border border-[#4a4237] rounded-xl shadow-2xl py-1.5 z-40 flex flex-col gap-0.5"
                >
                  <div className="px-3 py-1 text-[10px] uppercase tracking-wider font-semibold text-[#8a7f6f] border-b border-[#342f27] mb-1">
                    Select Weather
                  </div>
                  {WEATHER_OPTIONS.map((opt) => (
                    <button
                      key={opt.type}
                      onClick={() => {
                        soundEngine.init();
                        setWeather(opt.type);
                        weatherRef.current = opt.type;
                        setIsWeatherDropdownOpen(false);
                      }}
                      className={`flex items-center gap-2.5 px-3 py-1.5 text-xs text-left transition-colors ${
                        weather === opt.type
                          ? 'bg-[#c86236] text-white font-medium shadow-sm'
                          : 'text-[#cfc7b8] hover:bg-[#2c2822] hover:text-white'
                      }`}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Resident Autonomy & DAW */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Autonomy Toggle & Spur Action Button */}
          <div className="bg-[#1e1c18]/94 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#443d34] shadow-xl flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-[11px] text-[#cfc7b8]">
              <span
                className={`w-2 h-2 rounded-full ${
                  isAutonomousEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-600'
                }`}
              />
              <span className="text-[#e6decb] font-medium">Resident Autonomy</span>
            </div>

            <button
              id="toggle-autonomous-btn"
              onClick={() => setIsAutonomousEnabled(!isAutonomousEnabled)}
              className={`px-2 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-all ${
                isAutonomousEnabled
                  ? 'bg-[#2b3a25] text-emerald-300 border-emerald-600/40 hover:bg-[#35482e]'
                  : 'bg-[#332a21] text-amber-300 border-amber-600/40 hover:bg-[#403529]'
              }`}
              title={isAutonomousEnabled ? 'Pause autonomous wandering' : 'Resume autonomous wandering'}
            >
              {isAutonomousEnabled ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isAutonomousEnabled ? 'Active' : 'Paused'}</span>
            </button>

            <button
              id="spur-agent-step-btn"
              onClick={handleSpurAgentAction}
              disabled={isSpurringAction || inHouseResidents.length === 0}
              className="px-2.5 py-1 bg-[#8c4b26] hover:bg-[#a6592e] disabled:opacity-50 text-white rounded-lg border border-[#c86236]/60 text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              title="Spur an instant creative action for resident"
            >
              <Zap className={`w-3 h-3 text-amber-300 ${isSpurringAction ? 'animate-spin' : ''}`} />
              <span>Spur Action</span>
            </button>
          </div>

          {/* Analog DAW Button */}
          <button
            id="overlay-open-daw-btn"
            onClick={onOpenDAW}
            className="px-3 py-1.5 bg-[#2a231b] hover:bg-[#352c22] border border-[#c49b4d]/60 text-[#f5efe4] text-xs font-semibold rounded-xl shadow-lg flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sliders className="w-3.5 h-3.5 text-[#c49b4d]" />
            <span>Analog DAW</span>
          </button>
        </div>
      </div>

      {/* Synergistic Collaborative Jam Session HUD (When 1+ resident is playing instruments) */}
      {jamState && jamState.activePerformers.length > 0 && (
        <div
          id="collaborative-jam-hud"
          className="absolute top-16 left-3 right-3 sm:left-auto sm:right-3 sm:w-96 z-20 bg-[#1a1714]/95 backdrop-blur-xl border border-[#c49b4d]/40 rounded-2xl shadow-2xl p-3 pointer-events-auto flex flex-col gap-2 text-xs text-[#e5ded2] animate-in fade-in slide-in-from-top-2 duration-300"
        >
          {/* Jam Header with Live Title and Audio Mute */}
          <div className="flex items-center justify-between border-b border-[#383229] pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <div className="flex items-center gap-1.5">
                <Music className="w-4 h-4 text-[#d97736]" />
                <span className="font-serif-artisanal font-bold text-sm text-[#f5efe4]">
                  {jamState.activePerformers.length > 1
                    ? jamState.synergyTitle
                    : 'Solo Studio Session'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Animated Equalizer Wave Bars */}
              {!isJamMuted && (
                <div className="flex items-end gap-0.5 h-3.5 px-1">
                  <span className="w-0.5 bg-amber-400 rounded-full animate-pulse h-3" />
                  <span
                    className="w-0.5 bg-orange-400 rounded-full animate-pulse h-2"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-0.5 bg-yellow-300 rounded-full animate-pulse h-3.5"
                    style={{ animationDelay: '300ms' }}
                  />
                  <span
                    className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-2.5"
                    style={{ animationDelay: '200ms' }}
                  />
                </div>
              )}
              {/* Audio Mute/Unmute */}
              <button
                onClick={() => {
                  const next = !isJamMuted;
                  setIsJamMuted(next);
                  personaJamEngine.setMuted(next);
                }}
                className={`p-1 rounded-lg border text-xs transition-all ${
                  isJamMuted
                    ? 'bg-rose-950/40 border-rose-600/40 text-rose-300 hover:bg-rose-900/50'
                    : 'bg-[#2b251e] border-[#443a2d] text-amber-300 hover:bg-[#383025]'
                }`}
                title={isJamMuted ? 'Unmute Live Jam Audio' : 'Mute Jam Audio'}
              >
                {isJamMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Synergy Genre Badge (Multi-Performer Fusion) */}
          {jamState.activePerformers.length > 1 && (
            <div className="flex items-center justify-between bg-[#241f1a] px-2.5 py-1.5 rounded-xl border border-[#3e3528]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#e0b77a] font-medium">
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                <span>{jamState.genreFusion}</span>
              </div>
              <div className="font-mono text-[10px] text-[#a89b87]">
                {jamState.bpm} BPM • {jamState.musicalKey}
              </div>
            </div>
          )}

          {/* Active Performers List */}
          <div className="flex flex-col gap-1.5">
            {jamState.activePerformers.map((perf) => (
              <div
                key={perf.personaId}
                className="flex items-center justify-between bg-[#1f1c18] px-2.5 py-1.5 rounded-lg border border-[#332c23]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                    style={{
                      backgroundColor:
                        personas.find((p) => p.id === perf.personaId)?.visualAvatar.color ||
                        '#d97736',
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-[#f5efe4] text-xs">{perf.personaName}</span>
                    <span className="text-[10px] text-[#9c9182]">{perf.instrument}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#2b251e] text-[#d97736] border border-[#443829]">
                  {perf.musicalRole}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Duo Jam Trigger Shortcuts */}
          <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#2e2820]">
            <span className="text-[10px] text-[#8e8474]">Quick Synergies:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => triggerDuoJam('jess-alpert', 'malik-johnson')}
                className="px-2 py-0.5 rounded bg-[#2a231b] hover:bg-[#382f24] text-[10px] text-[#e2d5c3] border border-[#443829] transition-colors"
                title="Jess (Soul Vocals/Synth) + Malik (808 Sub / Drill)"
              >
                Jess × Malik
              </button>
              <button
                onClick={() => triggerDuoJam('benji-park', 'jess-alpert')}
                className="px-2 py-0.5 rounded bg-[#2a231b] hover:bg-[#382f24] text-[10px] text-[#e2d5c3] border border-[#443829] transition-colors"
                title="Benji (Folk Acoustic) + Jess (Melodic Pop)"
              >
                Benji × Jess
              </button>
              <button
                onClick={() => triggerDuoJam('rowan-gable', 'malik-johnson')}
                className="px-2 py-0.5 rounded bg-[#2a231b] hover:bg-[#382f24] text-[10px] text-[#e2d5c3] border border-[#443829] transition-colors"
                title="Rowan (Modular Synth) + Malik (Trap Drums)"
              >
                Rowan × Malik
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outdoor Programmatic Random Event Notification Banner */}
      {latestOutdoorEvent && (
        <div
          id="outdoor-event-toast"
          className="absolute top-16 left-1/2 -translate-x-1/2 z-30 max-w-md bg-[#1c1915]/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#594d3e] shadow-2xl text-xs text-[#e8dfd2] flex items-center gap-2.5 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <Car className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="flex flex-col">
            <span className="font-semibold text-[#f5efe4] text-xs">
              {latestOutdoorEvent.title}
            </span>
            <span className="text-[11px] text-[#b0a594]">
              {latestOutdoorEvent.description}
            </span>
          </div>
        </div>
      )}

      {/* Interactive Sub-Agent Neural Control Deck */}
      <SubAgentControlDeck
        personas={personas}
        activePersonaId={activePersonaId}
        onSelectPersona={onSelectPersona}
      />

      {/* Bottom Live Resident Activity Ticker & Thoughts */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pointer-events-none">
        {/* Autonomous Activity HUD Chips */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {inHouseResidents.slice(0, 4).map((p) => {
            const status = agentLiveStatuses[p.id];
            const isSelected = activePersonaId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPersona(p)}
                className={`px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs transition-all flex items-center gap-2 shadow-lg ${
                  isSelected
                    ? 'bg-[#2d261e]/95 border-[#c49b4d] text-[#f5efe4] scale-[1.02]'
                    : 'bg-[#1a1815]/90 border-[#38332c] text-[#cfc7b8] hover:border-[#544c41]'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: p.visualAvatar?.color || '#d97736' }}
                />
                <div className="flex flex-col items-start leading-tight">
                  <span className="font-serif-artisanal font-bold text-[#f5efe4] text-xs flex items-center gap-1">
                    {p.name.split(' ')[0]}
                    {status?.isThinking && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                    )}
                  </span>
                  <span className="text-[10px] text-[#9c9182] font-mono-artisanal truncate max-w-[130px]">
                    {status?.actionLabel || p.currentActivity || 'In Residence'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="bg-[#1e1c18]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#3e372e] text-[11px] text-[#a89f91] flex items-center gap-2.5 pointer-events-auto shrink-0 self-end sm:self-auto">
          <span className="flex items-center gap-1 text-[#dcd4c6]">
            <span className="w-2 h-2 rounded-full bg-[#d97736]" /> Hearth
          </span>
          <span className="flex items-center gap-1 text-[#dcd4c6]">
            <span className="w-2 h-2 rounded-full bg-[#788a68]" /> Dining
          </span>
          <span className="flex items-center gap-1 text-[#dcd4c6]">
            <span className="w-2 h-2 rounded-full bg-[#a855f7]" /> Studio
          </span>
          <span className="text-[#595146]">|</span>
          <span className="text-[#8e8576]">Click Resident to Inspect</span>
        </div>
      </div>
    </div>
  );
};
