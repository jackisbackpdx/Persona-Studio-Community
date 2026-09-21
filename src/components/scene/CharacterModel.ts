import * as THREE from 'three';
import { Persona, EmotionalState, RoomId, CharacterActionType } from '../../types';
import { planNavMeshPath, computeAgentSeparationForce } from './NavMesh';

// Hotspot definitions for each room
export interface RoomHotspot {
  roomId: RoomId;
  name: string;
  label: string;
  x: number;
  z: number;
  facingAngle?: number;
  defaultAction: CharacterActionType;
  seatHeight?: number;
  soundTrigger?:
    | 'synth_chord'
    | 'vinyl_spin'
    | 'fire_ember'
    | 'guitar_strum'
    | 'piano_note'
    | 'tea_sip'
    | 'mic_tap'
    | 'none';
}

/**
 * Universal safe canvas rounded rectangle drawing helper
 * Compatible with all browser runtimes and headless environments
 */
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

export const ROOM_HOTSPOTS: RoomHotspot[] = [
  // Living Room Hotspots (Hearth Parlor)
  {
    roomId: 'living_room',
    name: 'sofa_left',
    label: 'Vintage Velvet Sofa (Left)',
    x: -11.2,
    z: -2.7,
    facingAngle: 0,
    defaultAction: 'sitting',
    seatHeight: 0.52,
  },
  {
    roomId: 'living_room',
    name: 'sofa_center',
    label: 'Vintage Velvet Sofa (Center)',
    x: -10.0,
    z: -2.7,
    facingAngle: 0,
    defaultAction: 'relaxing_couch',
    seatHeight: 0.52,
  },
  {
    roomId: 'living_room',
    name: 'sofa_right',
    label: 'Vintage Velvet Sofa (Right)',
    x: -8.8,
    z: -2.7,
    facingAngle: 0,
    defaultAction: 'sitting',
    seatHeight: 0.52,
  },
  {
    roomId: 'living_room',
    name: 'fireplace',
    label: 'Brick Hearth & Glowing Embers',
    x: -12.4,
    z: 0.0,
    facingAngle: -Math.PI / 2,
    defaultAction: 'warming_fireplace',
    soundTrigger: 'fire_ember',
  },
  {
    roomId: 'living_room',
    name: 'turntable',
    label: 'Audiophile Turntable & Vinyl Crate',
    x: -12.6,
    z: 2.5,
    facingAngle: -Math.PI / 2,
    defaultAction: 'spinning_vinyl',
    soundTrigger: 'vinyl_spin',
  },
  {
    roomId: 'living_room',
    name: 'coffee_table',
    label: 'Danish Coffee Table & Mugs',
    x: -10.0,
    z: 0.6,
    facingAngle: Math.PI,
    defaultAction: 'drinking_tea',
    soundTrigger: 'tea_sip',
  },

  // Dining Room Hotspots (Communal Hall)
  {
    roomId: 'dining_room',
    name: 'chair_north_1',
    label: 'Walnut Table Chair (North 1)',
    x: -1.2,
    z: -1.6,
    facingAngle: 0,
    defaultAction: 'sitting',
    seatHeight: 0.6,
    soundTrigger: 'tea_sip',
  },
  {
    roomId: 'dining_room',
    name: 'chair_north_2',
    label: 'Walnut Table Chair (North 2)',
    x: 1.2,
    z: -1.6,
    facingAngle: 0,
    defaultAction: 'sitting',
    seatHeight: 0.6,
    soundTrigger: 'tea_sip',
  },
  {
    roomId: 'dining_room',
    name: 'chair_south_1',
    label: 'Walnut Table Chair (South 1)',
    x: -1.2,
    z: 1.6,
    facingAngle: Math.PI,
    defaultAction: 'sitting',
    seatHeight: 0.6,
    soundTrigger: 'tea_sip',
  },
  {
    roomId: 'dining_room',
    name: 'chair_south_2',
    label: 'Walnut Table Chair (South 2)',
    x: 1.2,
    z: 1.6,
    facingAngle: Math.PI,
    defaultAction: 'sitting',
    seatHeight: 0.6,
    soundTrigger: 'tea_sip',
  },
  {
    roomId: 'dining_room',
    name: 'table_end_west',
    label: 'Walnut Table Head (West)',
    x: -2.5,
    z: 0,
    facingAngle: Math.PI / 2,
    defaultAction: 'pacing_talking',
  },
  {
    roomId: 'dining_room',
    name: 'table_end_east',
    label: 'Walnut Table Head (East)',
    x: 2.5,
    z: 0,
    facingAngle: -Math.PI / 2,
    defaultAction: 'pacing_talking',
  },
  {
    roomId: 'dining_room',
    name: 'acoustic_guitar',
    label: 'Craftsman Acoustic Guitar',
    x: -3.2,
    z: -5.8,
    facingAngle: 0,
    defaultAction: 'playing_guitar',
    soundTrigger: 'guitar_strum',
  },

  // Music Studio Hotspots (Sound Lab)
  {
    roomId: 'studio',
    name: 'analog_synth',
    label: 'Prophet / Minimoog Synth',
    x: 10.0,
    z: -1.6,
    facingAngle: Math.PI,
    defaultAction: 'playing_synth',
    soundTrigger: 'synth_chord',
  },
  {
    roomId: 'studio',
    name: 'vocal_mic',
    label: 'Condenser Vocal Microphone',
    x: 7.9,
    z: 1.2,
    facingAngle: -Math.PI * 0.75,
    defaultAction: 'recording_mic',
    soundTrigger: 'mic_tap',
  },
  {
    roomId: 'studio',
    name: 'upright_piano',
    label: 'Upright Acoustic Piano',
    x: 12.6,
    z: 1.2,
    facingAngle: Math.PI / 2,
    defaultAction: 'playing_piano',
    soundTrigger: 'piano_note',
  },
  {
    roomId: 'studio',
    name: 'daw_desk',
    label: 'Dual Curved-Monitor Workstation',
    x: 10.0,
    z: -2.0,
    facingAngle: Math.PI,
    defaultAction: 'working_at_desk',
    seatHeight: 0.58,
  },
  {
    roomId: 'studio',
    name: 'studio_couch',
    label: 'Studio Listening Lounge',
    x: 10.0,
    z: 3.2,
    facingAngle: Math.PI,
    defaultAction: 'relaxing_couch',
    seatHeight: 0.5,
  },
  {
    roomId: 'studio',
    name: 'acoustic_drums',
    label: 'Vintage Ludwig Drum Kit (Throne)',
    x: 7.2,
    z: -4.8,
    facingAngle: -Math.PI / 2,
    defaultAction: 'playing_acoustic_drums',
    seatHeight: 0.54,
    soundTrigger: 'drum_acoustic_beat',
  },
  {
    roomId: 'studio',
    name: 'electronic_drums',
    label: 'Electronic Drum & DJ Rig (Throne)',
    x: 13.2,
    z: -4.8,
    facingAngle: -Math.PI / 2,
    defaultAction: 'playing_electronic_drums',
    seatHeight: 0.54,
    soundTrigger: 'drum_electronic_beat',
  },
  {
    roomId: 'studio',
    name: 'studio_guitar_stand',
    label: 'Craftsman Sunburst Guitar Stand',
    x: 6.2,
    z: -2.8,
    facingAngle: Math.PI / 4,
    defaultAction: 'playing_guitar',
    soundTrigger: 'guitar_strum',
  },
];

// Architectural Doorway Portals (Waypoints to cross walls safely)
export const DOORWAY_LIVING_DINING = { x: -5.0, z: 0.0 };
export const DOORWAY_DINING_STUDIO = { x: 5.0, z: 0.0 };

export interface CharacterController {
  personaId: string;
  group: THREE.Group;
  currentRoom: RoomId;
  currentHotspotName: string;
  targetPos: THREE.Vector3;
  waypointQueue: THREE.Vector3[];
  isMoving: boolean;
  walkPhase: number;
  idleTimer: number;
  currentActionType: CharacterActionType;
  actionTimer: number;
  sittingProgress: number; // 0 (standing) to 1 (seated)
  targetSeatHeight: number;
  facingAngle?: number;
  // Skeletal Joint Hierarchy
  pelvis: THREE.Group;
  torso: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  leftForearm: THREE.Group;
  leftHand: THREE.Group;
  rightArm: THREE.Group;
  rightForearm: THREE.Group;
  rightHand: THREE.Group;
  leftThigh: THREE.Group;
  leftShin: THREE.Group;
  leftAnkle: THREE.Group;
  leftFoot: THREE.Group;
  rightThigh: THREE.Group;
  rightShin: THREE.Group;
  rightAnkle: THREE.Group;
  rightFoot: THREE.Group;
  // Interactive Musical Props & Sticks
  guitarProp?: THREE.Group;
  drumstickL?: THREE.Mesh;
  drumstickR?: THREE.Mesh;
  // Visual Indicators
  halo: THREE.Mesh;
  speechBubble: THREE.Sprite | null;
  nameSprite: THREE.Sprite;
  currentActivity?: string;
  lastThought?: string;
}

/**
 * Creates an articulated, fully realized 3D character body
 * with an accurate skeletal system, distinct clothing, styled hair, accessories,
 * and multi-part walking footwear meshes capable of natural foot-roll articulation.
 */
export function createArticulatedCharacter(persona: Persona, index: number = 0): CharacterController {
  const root = new THREE.Group();
  root.userData = { personaId: persona.id };

  const baseColor = persona.visualAvatar?.color || '#3b82f6';
  const secondaryColor = persona.visualAvatar?.secondaryColor || '#1e3a8a';

  // Tactile Material Library
  const skinMat = new THREE.MeshStandardMaterial({
    color: '#fed7aa',
    roughness: 0.75,
  });

  const clothesMat = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.8,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: secondaryColor,
    roughness: 0.85,
  });

  const leatherBootMat = new THREE.MeshStandardMaterial({
    color: '#2a1a10',
    roughness: 0.5,
  });

  const rubberSoleMat = new THREE.MeshStandardMaterial({
    color: '#e2e8f0',
    roughness: 0.9,
  });

  const beltMat = new THREE.MeshStandardMaterial({
    color: '#1c1917',
    roughness: 0.6,
  });

  const buckleMat = new THREE.MeshStandardMaterial({
    color: '#fbbf24',
    metalness: 0.85,
    roughness: 0.3,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: secondaryColor,
    roughness: 0.65,
  });

  // ==================== SKELETAL HIERARCHY ====================

  // 1. Pelvis / Hips (Root of human skeleton chain)
  const pelvis = new THREE.Group();
  pelvis.position.y = 1.05;
  root.add(pelvis);

  // Hip / Waist Mesh (Pants upper with seam contour)
  const hipMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.26, 16), pantsMat);
  hipMesh.castShadow = true;
  pelvis.add(hipMesh);

  // Leather Belt with Brass Buckle
  const beltMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.045, 16), beltMat);
  beltMesh.position.y = 0.11;
  pelvis.add(beltMesh);

  const buckleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.045, 0.02), buckleMat);
  buckleMesh.position.set(0, 0.11, 0.245);
  pelvis.add(buckleMesh);

  // 2. Torso & Spine
  const torso = new THREE.Group();
  torso.position.y = 0.14;
  pelvis.add(torso);

  const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.235, 0.62, 16), clothesMat);
  torsoMesh.position.y = 0.31;
  torsoMesh.castShadow = true;
  torso.add(torsoMesh);

  // Collar / Neckline
  const collarMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.1, 14), clothesMat);
  collarMesh.position.y = 0.64;
  torso.add(collarMesh);

  // 3. Neck & Head
  const neck = new THREE.Group();
  neck.position.y = 0.66;
  torso.add(neck);

  const neckCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.12, 12), skinMat);
  neckCylinder.position.y = 0.06;
  neck.add(neckCylinder);

  const head = new THREE.Group();
  head.position.y = 0.14;
  neck.add(head);

  // Sculpted Head / Face
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Hair Styling
  const hairMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65),
    hairMat
  );
  hairMesh.position.y = 0.05;
  hairMesh.rotation.x = -0.15;
  head.add(hairMesh);

  // Eyes (Sclera and Pupils)
  const eyeWhiteGeo = new THREE.SphereGeometry(0.032, 8, 8);
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
  const eyePupilGeo = new THREE.SphereGeometry(0.016, 8, 8);
  const eyePupilMat = new THREE.MeshBasicMaterial({ color: '#0f172a' });

  const eyeL = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  eyeL.position.set(-0.075, 0.02, 0.195);
  const pupilL = new THREE.Mesh(eyePupilGeo, eyePupilMat);
  pupilL.position.set(0, 0, 0.025);
  eyeL.add(pupilL);
  head.add(eyeL);

  const eyeR = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  eyeR.position.set(0.075, 0.02, 0.195);
  const pupilR = new THREE.Mesh(eyePupilGeo, eyePupilMat);
  pupilR.position.set(0, 0, 0.025);
  eyeR.add(pupilR);
  head.add(eyeR);

  // Distinct Persona Accessories & Garments
  if (persona.id === 'rowan-gable') {
    // Wire-rimmed spectacles
    const glasses = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.07, 0.04),
      new THREE.MeshStandardMaterial({ color: '#171717', metalness: 0.9 })
    );
    glasses.position.set(0, 0.02, 0.215);
    head.add(glasses);
  } else if (persona.id === 'malik-johnson') {
    // Dark Beanie
    const beanie = new THREE.Mesh(
      new THREE.CylinderGeometry(0.23, 0.245, 0.22, 14),
      new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.9 })
    );
    beanie.position.set(0, 0.14, 0);
    head.add(beanie);
  } else if (persona.id === 'jess-alpert') {
    // Studio cans headphones around neck
    const cans = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.04, 8, 20),
      new THREE.MeshStandardMaterial({ color: '#d97706', metalness: 0.6 })
    );
    cans.rotation.x = Math.PI / 2;
    cans.position.set(0, -0.05, 0);
    head.add(cans);
  } else if (persona.id === 'benji-park') {
    // Mechanic Tool belt pouch
    const toolPouch = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.16, 0.1),
      new THREE.MeshStandardMaterial({ color: '#854d0e' })
    );
    toolPouch.position.set(0.24, -0.05, 0);
    pelvis.add(toolPouch);
  }

  // ==================== UPPER SKELETAL LIMBS ====================

  // Helper to sculpt hand
  const createHandMesh = () => {
    const handGroup = new THREE.Group();
    // Palm
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.075, 0.035), skinMat);
    palm.position.y = -0.035;
    handGroup.add(palm);
    // Thumb
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.04, 0.025), skinMat);
    thumb.position.set(0.035, -0.02, 0.01);
    thumb.rotation.z = -0.35;
    handGroup.add(thumb);
    // Relaxed Curled Fingers
    const fingers = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.03), skinMat);
    fingers.position.set(0, -0.08, 0.008);
    fingers.rotation.x = 0.25;
    handGroup.add(fingers);
    return handGroup;
  };

  // Left Arm (Shoulder -> Upper Arm -> Forearm -> Wrist -> Hand)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.32, 0.52, 0);
  torso.add(leftArm);

  const leftShoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), clothesMat);
  leftArm.add(leftShoulderCap);

  const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.062, 0.36, 10), clothesMat);
  leftUpperArm.position.y = -0.18;
  leftUpperArm.castShadow = true;
  leftArm.add(leftUpperArm);

  const leftForearm = new THREE.Group();
  leftForearm.position.y = -0.36;
  leftArm.add(leftForearm);

  const leftElbowCap = new THREE.Mesh(new THREE.SphereGeometry(0.062, 8, 8), skinMat);
  leftForearm.add(leftElbowCap);

  const leftForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.048, 0.32, 10), skinMat);
  leftForearmMesh.position.y = -0.16;
  leftForearmMesh.castShadow = true;
  leftForearm.add(leftForearmMesh);

  const leftHand = createHandMesh();
  leftHand.position.y = -0.32;
  leftForearm.add(leftHand);

  // Right Arm (Shoulder -> Upper Arm -> Forearm -> Wrist -> Hand)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.32, 0.52, 0);
  torso.add(rightArm);

  const rightShoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), clothesMat);
  rightArm.add(rightShoulderCap);

  const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.062, 0.36, 10), clothesMat);
  rightUpperArm.position.y = -0.18;
  rightUpperArm.castShadow = true;
  rightArm.add(rightUpperArm);

  const rightForearm = new THREE.Group();
  rightForearm.position.y = -0.36;
  rightArm.add(rightForearm);

  const rightElbowCap = new THREE.Mesh(new THREE.SphereGeometry(0.062, 8, 8), skinMat);
  rightForearm.add(rightElbowCap);

  const rightForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.048, 0.32, 10), skinMat);
  rightForearmMesh.position.y = -0.16;
  rightForearmMesh.castShadow = true;
  rightForearm.add(rightForearmMesh);

  const rightHand = createHandMesh();
  rightHand.position.y = -0.32;
  rightForearm.add(rightHand);

  // Musical Drumstick Props (Attached to Left and Right Hands)
  const stickMat = new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.45 });
  const drumstickL = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.014, 0.45, 8), stickMat);
  drumstickL.rotation.x = Math.PI / 2 + 0.15;
  drumstickL.position.set(0, -0.06, 0.16);
  drumstickL.visible = false;
  leftHand.add(drumstickL);

  const drumstickR = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.014, 0.45, 8), stickMat);
  drumstickR.rotation.x = Math.PI / 2 + 0.15;
  drumstickR.position.set(0, -0.06, 0.16);
  drumstickR.visible = false;
  rightHand.add(drumstickR);

  // Craftsman Acoustic Sunburst Guitar (Slung across Torso, pick-upable by characters)
  const guitarProp = new THREE.Group();
  guitarProp.position.set(0.08, 0.28, 0.28);
  guitarProp.rotation.set(0.18, -0.35, -0.58);
  guitarProp.visible = false;

  // Guitar Body (Lower bout & Upper bout)
  const gLower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.11, 16),
    new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.35 })
  );
  gLower.rotation.x = Math.PI / 2;
  gLower.position.set(0, -0.14, 0);
  gLower.scale.set(1.0, 1.15, 1.0);
  guitarProp.add(gLower);

  const gUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.19, 0.1, 16),
    new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.35 })
  );
  gUpper.rotation.x = Math.PI / 2;
  gUpper.position.set(0, 0.18, 0);
  guitarProp.add(gUpper);

  // Soundhole
  const gHole = new THREE.Mesh(
    new THREE.CircleGeometry(0.055, 16),
    new THREE.MeshBasicMaterial({ color: '#171717' })
  );
  gHole.position.set(0, 0.1, 0.058);
  guitarProp.add(gHole);

  // Neck and Headstock
  const gNeck = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.52, 0.035),
    new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.5 })
  );
  gNeck.position.set(0, 0.52, 0.01);
  guitarProp.add(gNeck);

  const gHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.15, 0.03),
    new THREE.MeshStandardMaterial({ color: '#78350f' })
  );
  gHead.position.set(0, 0.82, 0.02);
  gHead.rotation.x = -0.15;
  guitarProp.add(gHead);

  // Woven Guitar Strap
  const gStrap = new THREE.Mesh(
    new THREE.TorusGeometry(0.38, 0.016, 6, 18),
    new THREE.MeshStandardMaterial({ color: '#27272a' })
  );
  gStrap.position.set(0, 0.25, 0);
  guitarProp.add(gStrap);

  torso.add(guitarProp);

  // ==================== LOWER SKELETAL LIMBS & FOOTWEAR ====================

  // Helper to build articulated walking footwear mesh (sole, welt, upper, toe cap)
  const createArticulatedFootwear = () => {
    const footGroup = new THREE.Group();

    // 1. Rubber Tread Outsole
    const outsole = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.035, 0.25), rubberSoleMat);
    outsole.position.set(0, -0.02, 0.025);
    outsole.castShadow = true;
    footGroup.add(outsole);

    // 2. Leather Midsole Welt
    const midsole = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.24), leatherBootMat);
    midsole.position.set(0, 0.005, 0.025);
    footGroup.add(midsole);

    // 3. Main Boot / Shoe Upper
    const shoeUpper = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.085, 0.22), leatherBootMat);
    shoeUpper.position.set(0, 0.045, 0.015);
    shoeUpper.castShadow = true;
    footGroup.add(shoeUpper);

    // 4. Rounded Toe Cap
    const toeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.11, 10), leatherBootMat);
    toeCap.rotation.x = Math.PI / 2;
    toeCap.position.set(0, 0.035, 0.1);
    footGroup.add(toeCap);

    // 5. Contrast Laces / Tongue Accent
    const laces = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.025, 0.09), rubberSoleMat);
    laces.position.set(0, 0.09, 0.04);
    footGroup.add(laces);

    return footGroup;
  };

  // Left Leg (Hip -> Thigh -> Knee -> Shin -> Ankle -> Foot)
  const leftThigh = new THREE.Group();
  leftThigh.position.set(-0.13, -0.12, 0);
  pelvis.add(leftThigh);

  const leftHipJoint = new THREE.Mesh(new THREE.SphereGeometry(0.088, 10, 10), pantsMat);
  leftThigh.add(leftHipJoint);

  const leftThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.078, 0.46, 12), pantsMat);
  leftThighMesh.position.y = -0.23;
  leftThighMesh.castShadow = true;
  leftThigh.add(leftThighMesh);

  const leftShin = new THREE.Group();
  leftShin.position.y = -0.46;
  leftThigh.add(leftShin);

  const leftKneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.076, 10, 10), pantsMat);
  leftShin.add(leftKneeCap);

  const leftShinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.076, 0.066, 0.44, 12), pantsMat);
  leftShinMesh.position.y = -0.22;
  leftShinMesh.castShadow = true;
  leftShin.add(leftShinMesh);

  // Pant Cuff Ring at bottom of leg
  const leftPantCuff = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 16), pantsMat);
  leftPantCuff.rotation.x = Math.PI / 2;
  leftPantCuff.position.y = -0.43;
  leftShin.add(leftPantCuff);

  // Articulated Ankle Joint (Pitch pivot for heel-strike and toe-roll)
  const leftAnkle = new THREE.Group();
  leftAnkle.position.set(0, -0.44, 0.02);
  leftShin.add(leftAnkle);

  const leftFoot = createArticulatedFootwear();
  leftAnkle.add(leftFoot);

  // Right Leg (Hip -> Thigh -> Knee -> Shin -> Ankle -> Foot)
  const rightThigh = new THREE.Group();
  rightThigh.position.set(0.13, -0.12, 0);
  pelvis.add(rightThigh);

  const rightHipJoint = new THREE.Mesh(new THREE.SphereGeometry(0.088, 10, 10), pantsMat);
  rightThigh.add(rightHipJoint);

  const rightThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.078, 0.46, 12), pantsMat);
  rightThighMesh.position.y = -0.23;
  rightThighMesh.castShadow = true;
  rightThigh.add(rightThighMesh);

  const rightShin = new THREE.Group();
  rightShin.position.y = -0.46;
  rightThigh.add(rightShin);

  const rightKneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.076, 10, 10), pantsMat);
  rightShin.add(rightKneeCap);

  const rightShinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.076, 0.066, 0.44, 12), pantsMat);
  rightShinMesh.position.y = -0.22;
  rightShinMesh.castShadow = true;
  rightShin.add(rightShinMesh);

  const rightPantCuff = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 16), pantsMat);
  rightPantCuff.rotation.x = Math.PI / 2;
  rightPantCuff.position.y = -0.43;
  rightShin.add(rightPantCuff);

  // Articulated Ankle Joint
  const rightAnkle = new THREE.Group();
  rightAnkle.position.set(0, -0.44, 0.02);
  rightShin.add(rightAnkle);

  const rightFoot = createArticulatedFootwear();
  rightAnkle.add(rightFoot);

  // ==================== ARTISANAL NAMEPLATE ====================
  const canvas = document.createElement('canvas');
  canvas.width = 380;
  canvas.height = 120;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(28, 26, 23, 0.94)';
    drawRoundedRect(ctx, 8, 8, 364, 104, 14);
    ctx.fill();
    ctx.strokeStyle = '#c49b4d';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#f5f2eb';
    ctx.font = 'bold 26px serif';
    ctx.textAlign = 'center';
    ctx.fillText(persona.name, 190, 52);

    ctx.fillStyle = '#c86236';
    ctx.font = 'italic 16px sans-serif';
    ctx.fillText(`${persona.stageName}`, 190, 80);

    ctx.fillStyle = '#7a8c6e';
    ctx.beginPath();
    ctx.arc(190, 98, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const nameSprite = new THREE.Sprite(spriteMat);
  nameSprite.position.set(0, 2.5, 0);
  nameSprite.scale.set(1.6, 0.52, 1);
  nameSprite.renderOrder = 999;
  nameSprite.name = 'nameSprite';
  root.add(nameSprite);

  // ==================== SELECTION HALO ====================
  const haloGeo = new THREE.RingGeometry(0.65, 0.75, 32);
  const haloMat = new THREE.MeshBasicMaterial({
    color: '#d97706',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.03;
  halo.visible = false;
  root.add(halo);

  // Set Initial Room Position
  const initialHotspot = getInitialHotspotForPersona(persona, index);
  root.position.set(initialHotspot.x, 0, initialHotspot.z);
  if (initialHotspot.facingAngle !== undefined) {
    root.rotation.y = initialHotspot.facingAngle;
  }

  return {
    personaId: persona.id,
    group: root,
    currentRoom: persona.currentRoom,
    currentHotspotName: initialHotspot.name,
    targetPos: new THREE.Vector3(initialHotspot.x, 0, initialHotspot.z),
    waypointQueue: [],
    isMoving: false,
    walkPhase: 0,
    idleTimer: 0,
    currentActionType: initialHotspot.defaultAction,
    actionTimer: 0,
    sittingProgress: initialHotspot.defaultAction === 'sitting' || initialHotspot.defaultAction === 'relaxing_couch' ? 1 : 0,
    targetSeatHeight: initialHotspot.seatHeight || 0.6,
    facingAngle: initialHotspot.facingAngle,
    pelvis,
    torso,
    neck,
    head,
    leftArm,
    leftForearm,
    leftHand,
    rightArm,
    rightForearm,
    rightHand,
    leftThigh,
    leftShin,
    leftAnkle,
    leftFoot,
    rightThigh,
    rightShin,
    rightAnkle,
    rightFoot,
    guitarProp,
    drumstickL,
    drumstickR,
    halo,
    speechBubble: null,
    nameSprite,
    currentActivity: persona.currentActivity || initialHotspot.label,
    lastThought: undefined,
  };
}

/**
 * Generates an obstacle-free waypoint route through doorway openings
 * between different rooms, routing safely around the central dining table.
 * Powered by high-density A* NavMesh pathfinding.
 */
export function planPathThroughDoorways(
  currentPos: THREE.Vector3,
  destination: THREE.Vector3
): THREE.Vector3[] {
  return planNavMeshPath(currentPos, destination);
}

/**
 * Returns a specific hotspot by name or a random natural hotspot for a given room
 */
export function getHotspotByName(hotspotName: string): RoomHotspot | undefined {
  return ROOM_HOTSPOTS.find((h) => h.name === hotspotName);
}

export function getRandomHotspot(roomId: RoomId): RoomHotspot {
  const roomSpots = ROOM_HOTSPOTS.filter((h) => h.roomId === roomId);
  if (roomSpots.length === 0) return ROOM_HOTSPOTS[0];
  return roomSpots[Math.floor(Math.random() * roomSpots.length)];
}

export function getInitialHotspotForPersona(persona: Persona, index: number = 0): RoomHotspot {
  const roomSpots = ROOM_HOTSPOTS.filter((h) => h.roomId === persona.currentRoom);
  if (roomSpots.length === 0) return ROOM_HOTSPOTS[0];
  return roomSpots[index % roomSpots.length];
}

/**
 * Updates an articulated character's real-time nameplate badge with status
 */
export function updateCharacterNameplate(
  ctrl: CharacterController,
  persona: Persona,
  actionBadge?: string
) {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  drawRoundedRect(ctx, 10, 10, 380, 120, 20);
  ctx.fill();

  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 24px serif';
  ctx.textAlign = 'center';
  ctx.fillText(persona.name, 200, 52);

  ctx.fillStyle = '#f59e0b';
  ctx.font = '16px sans-serif';
  ctx.fillText(persona.stageName, 200, 80);

  if (actionBadge) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 14px sans-serif';
    ctx.fillText(actionBadge.slice(0, 32), 200, 108);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  if (ctrl.nameSprite.material) {
    ctrl.nameSprite.material.map = texture;
    ctrl.nameSprite.material.needsUpdate = true;
  }
}

/**
 * Renders an expressive speech or internal thought bubble above the character
 */
export function setCharacterSpeechBubble(
  ctrl: CharacterController,
  text: string,
  isThought: boolean = false
) {
  if (ctrl.speechBubble) {
    ctrl.group.remove(ctrl.speechBubble);
    if (ctrl.speechBubble.material.map) {
      ctrl.speechBubble.material.map.dispose();
    }
    ctrl.speechBubble.material.dispose();
    ctrl.speechBubble = null;
  }

  if (!text || text.trim() === '') return;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (isThought) {
    ctx.fillStyle = 'rgba(30, 27, 24, 0.95)';
    ctx.strokeStyle = '#78716c';
  } else {
    ctx.fillStyle = 'rgba(255, 252, 245, 0.98)';
    ctx.strokeStyle = '#c49b4d';
  }

  drawRoundedRect(ctx, 12, 12, 488, 140, 22);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(236, 152);
  ctx.lineTo(256, 185);
  ctx.lineTo(276, 152);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isThought ? '#e7e5e4' : '#1c1917';
  ctx.font = isThought ? 'italic 18px serif' : 'bold 18px sans-serif';
  ctx.textAlign = 'center';

  const maxLineLength = 38;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length > maxLineLength) {
      lines.push(currentLine.trim());
      currentLine = word;
      if (lines.length >= 3) break;
    } else {
      currentLine += (currentLine ? ' ' : '') + word;
    }
  }
  if (currentLine && lines.length < 3) {
    lines.push(currentLine.trim());
  }

  lines.forEach((line, i) => {
    ctx.fillText(line, 256, 56 + i * 28);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(0, 3.4, 0);
  sprite.scale.set(3.2, 1.25, 1);
  sprite.renderOrder = 1000;

  ctrl.group.add(sprite);
  ctrl.speechBubble = sprite;
}

/**
 * Biomechanical update loop for the character.
 * Simulates real bipedal human kinematics:
 * - Cadence-synchronized stride with opposite arm swing
 * - Knee flexion on swing phase to lift the foot cleanly over the floor
 * - Ankle dorsiflexion on heel strike and plantarflexion on push-off
 * - Pelvic vertical oscillation, lateral weight-shift sway, and pelvic rotation
 * - Torso spinal counter-rotation and forward velocity lean
 * - Smooth blending between sitting, standing, and walking states
 */
export function updateCharacterAnimation(
  ctrl: CharacterController,
  delta: number,
  elapsed: number,
  isSpeaking: boolean,
  emotionalState: EmotionalState,
  speakerPos: THREE.Vector3 | null,
  otherAgentPositions?: THREE.Vector3[]
) {
  const walkSpeed = 2.4; // meters per second
  ctrl.actionTimer += delta;

  // 1. Waypoint Navigation & Heading Steering
  if (ctrl.waypointQueue.length > 0) {
    const currentWaypoint = ctrl.waypointQueue[0];
    const diff = currentWaypoint.clone().sub(ctrl.group.position);
    diff.y = 0;
    const dist = diff.length();

    if (dist < 0.22) {
      // Advance to next waypoint
      ctrl.waypointQueue.shift();
      if (ctrl.waypointQueue.length === 0) {
        ctrl.isMoving = false;
        if (ctrl.facingAngle !== undefined) {
          const faceDiff = Math.atan2(
            Math.sin(ctrl.facingAngle - ctrl.group.rotation.y),
            Math.cos(ctrl.facingAngle - ctrl.group.rotation.y)
          );
          if (Math.abs(faceDiff) < 0.02) {
            ctrl.group.rotation.y = ctrl.facingAngle;
          } else {
            ctrl.group.rotation.y += THREE.MathUtils.clamp(faceDiff, -4.5 * delta, 4.5 * delta);
          }
        }
      }
    } else {
      ctrl.isMoving = true;
      diff.normalize();

      // Heading rotation via shortest angular arc (eliminates spinning)
      const targetAngle = Math.atan2(diff.x, diff.z);
      const angleDiff = Math.atan2(
        Math.sin(targetAngle - ctrl.group.rotation.y),
        Math.cos(targetAngle - ctrl.group.rotation.y)
      );
      ctrl.group.rotation.y += THREE.MathUtils.clamp(angleDiff, -5.5 * delta, 5.5 * delta);

      // Multi-agent collision avoidance steering
      if (otherAgentPositions && otherAgentPositions.length > 0) {
        const separation = computeAgentSeparationForce(ctrl.group.position, otherAgentPositions, 0.95);
        diff.add(separation).normalize();
      }

      // Translate along ground
      ctrl.group.position.addScaledVector(diff, Math.min(dist, walkSpeed * delta));
    }
  } else {
    ctrl.isMoving = false;
    if (ctrl.facingAngle !== undefined) {
      const faceDiff = Math.atan2(
        Math.sin(ctrl.facingAngle - ctrl.group.rotation.y),
        Math.cos(ctrl.facingAngle - ctrl.group.rotation.y)
      );
      if (Math.abs(faceDiff) < 0.015) {
        ctrl.group.rotation.y = ctrl.facingAngle;
      } else {
        ctrl.group.rotation.y += THREE.MathUtils.clamp(faceDiff, -3.5 * delta, 3.5 * delta);
      }
    }
  }

  // 2. Dynamic Locomotion Kinematics (Walking Gait Cycle)
  if (ctrl.isMoving) {
    const walkCadence = 8.5; // radians per second
    ctrl.walkPhase += delta * walkCadence;
    const phase = ctrl.walkPhase;
    const stride = Math.sin(phase);
    const cosStride = Math.cos(phase);

    // Moving upright: smoothly stand up from seat
    ctrl.sittingProgress = THREE.MathUtils.lerp(ctrl.sittingProgress, 0, delta * 8.0);

    // Hip Flexion & Extension
    ctrl.leftThigh.rotation.x = stride * 0.52;
    ctrl.leftThigh.rotation.z = 0.025;
    ctrl.rightThigh.rotation.x = -stride * 0.52;
    ctrl.rightThigh.rotation.z = -0.025;

    // Biomechanical Knee Flexion (Swing phase lifts foot; stance phase stays straight)
    const leftSwingProgress = Math.max(0, -cosStride);
    const leftKneeFlex = Math.sin(leftSwingProgress * Math.PI) * 0.92;
    ctrl.leftShin.rotation.x = 0.05 + leftKneeFlex;

    const rightSwingProgress = Math.max(0, cosStride);
    const rightKneeFlex = Math.sin(rightSwingProgress * Math.PI) * 0.92;
    ctrl.rightShin.rotation.x = 0.05 + rightKneeFlex;

    // Biomechanical Ankle Articulation (Heel-strike dorsiflexion, push-off plantarflexion)
    let leftAnklePitch = 0;
    if (stride > 0.3) {
      leftAnklePitch = -0.28 * ((stride - 0.3) / 0.7);
    } else if (stride < -0.3) {
      leftAnklePitch = 0.38 * ((-stride - 0.3) / 0.7);
    }
    if (ctrl.leftAnkle) {
      ctrl.leftAnkle.rotation.x = leftAnklePitch;
    }

    let rightAnklePitch = 0;
    if (-stride > 0.3) {
      rightAnklePitch = -0.28 * ((-stride - 0.3) / 0.7);
    } else if (-stride < -0.3) {
      rightAnklePitch = 0.38 * ((stride - 0.3) / 0.7);
    }
    if (ctrl.rightAnkle) {
      ctrl.rightAnkle.rotation.x = rightAnklePitch;
    }

    // Contra-lateral Arm Swing with Elbow Flexion
    const leftArmSwing = -stride * 0.52;
    ctrl.leftArm.rotation.x = leftArmSwing;
    ctrl.leftArm.rotation.z = 0.08;
    ctrl.leftForearm.rotation.x = 0.26 + Math.max(0, -stride) * 0.4;

    const rightArmSwing = stride * 0.52;
    ctrl.rightArm.rotation.x = rightArmSwing;
    ctrl.rightArm.rotation.z = -0.08;
    ctrl.rightForearm.rotation.x = 0.26 + Math.max(0, stride) * 0.4;

    // Pelvis Dynamics (Vertical bounce, lateral weight shift, transverse twist)
    ctrl.pelvis.position.y = 1.05 + Math.cos(phase * 2) * 0.038;
    ctrl.pelvis.position.x = Math.sin(phase) * 0.026;
    ctrl.pelvis.rotation.y = -Math.sin(phase) * 0.1;
    ctrl.pelvis.rotation.z = Math.sin(phase) * 0.025;

    // Torso Counter-Balance (Opposite twist, forward momentum lean)
    ctrl.torso.rotation.y = Math.sin(phase) * 0.12;
    ctrl.torso.rotation.x = 0.055;
    ctrl.torso.rotation.z = -Math.sin(phase) * 0.025;

    // Head Stabilization
    ctrl.head.rotation.x = 0.02;
    ctrl.head.rotation.y = -Math.sin(phase) * 0.035;
    return;
  }

  // Restore neutral ankle pitch and pelvis lateral offset when stationary
  if (ctrl.leftAnkle) {
    ctrl.leftAnkle.rotation.x = THREE.MathUtils.lerp(ctrl.leftAnkle.rotation.x, 0, 0.15);
  }
  if (ctrl.rightAnkle) {
    ctrl.rightAnkle.rotation.x = THREE.MathUtils.lerp(ctrl.rightAnkle.rotation.x, 0, 0.15);
  }
  ctrl.pelvis.position.x = THREE.MathUtils.lerp(ctrl.pelvis.position.x, 0, 0.15);
  ctrl.pelvis.rotation.z = THREE.MathUtils.lerp(ctrl.pelvis.rotation.z, 0, 0.15);

  // 3. Physical Articulation for Stationary Actions
  const action = ctrl.currentActionType;
  const isSeatedAction =
    action === 'sitting' ||
    action === 'relaxing_couch' ||
    action === 'working_at_desk' ||
    action === 'playing_acoustic_drums' ||
    action === 'playing_electronic_drums';

  // Toggle dynamic props visibility
  if (ctrl.guitarProp) {
    ctrl.guitarProp.visible = action === 'playing_guitar';
  }
  if (ctrl.drumstickL) {
    ctrl.drumstickL.visible =
      action === 'playing_acoustic_drums' || action === 'playing_electronic_drums';
  }
  if (ctrl.drumstickR) {
    ctrl.drumstickR.visible =
      action === 'playing_acoustic_drums' || action === 'playing_electronic_drums';
  }

  const targetSitting = isSeatedAction ? 1.0 : 0.0;
  ctrl.sittingProgress = THREE.MathUtils.lerp(ctrl.sittingProgress, targetSitting, delta * 4.5);

  const sp = ctrl.sittingProgress;
  const seatH = ctrl.targetSeatHeight || 0.58;
  const breath = Math.sin(elapsed * 2.2 + ctrl.group.position.x);

  if (sp > 0.02) {
    // SEATED KINEMATICS
    ctrl.pelvis.position.y = THREE.MathUtils.lerp(1.05, seatH, sp);
    ctrl.leftThigh.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2 + 0.08, sp);
    ctrl.rightThigh.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2 + 0.08, sp);
    ctrl.leftShin.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 2 - 0.05, sp);
    ctrl.rightShin.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 2 - 0.05, sp);

    if (action === 'playing_acoustic_drums' || action === 'playing_electronic_drums') {
      ctrl.torso.rotation.x = 0.09;
      // Kick pedal and hihat pedal foot action
      const kickTap = Math.sin(elapsed * 12.0) > 0.35 ? 0.12 : 0;
      const hihatTap = Math.sin(elapsed * 6.0) > 0.35 ? 0.08 : 0;
      ctrl.rightShin.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 2 - 0.05 + kickTap, sp);
      ctrl.leftShin.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 2 - 0.05 + hihatTap, sp);

      // Drumsticks swing and rebound
      ctrl.leftArm.rotation.x = -0.95 + Math.sin(elapsed * 9.0) * 0.32;
      ctrl.leftArm.rotation.z = 0.22;
      ctrl.leftForearm.rotation.x = -0.55 + Math.sin(elapsed * 9.0) * 0.28;

      ctrl.rightArm.rotation.x = -1.1 + Math.sin(elapsed * 14.0) * 0.3;
      ctrl.rightArm.rotation.z = -0.28;
      ctrl.rightForearm.rotation.x = -0.55 + Math.sin(elapsed * 14.0) * 0.25;

      // Head rocking to the rhythm
      ctrl.head.rotation.x = 0.16 + Math.abs(Math.sin(elapsed * 7.0)) * 0.15;
      ctrl.head.rotation.y = Math.sin(elapsed * 2.0) * 0.08;
    } else if (action === 'working_at_desk') {
      ctrl.torso.rotation.x = 0.08;
      ctrl.leftArm.rotation.x = -0.75;
      ctrl.leftArm.rotation.z = 0.2;
      ctrl.leftForearm.rotation.x = -0.6 + Math.sin(elapsed * 6.0) * 0.08;

      ctrl.rightArm.rotation.x = -0.75;
      ctrl.rightArm.rotation.z = -0.2;
      ctrl.rightForearm.rotation.x = -0.6 + Math.cos(elapsed * 8.0) * 0.08;

      ctrl.head.rotation.y = Math.sin(elapsed * 0.8) * 0.22;
      ctrl.head.rotation.x = 0.05;
    } else if (action === 'relaxing_couch') {
      ctrl.torso.rotation.x = -0.15;
      ctrl.leftArm.rotation.x = -0.2;
      ctrl.leftArm.rotation.z = 0.35;
      ctrl.leftForearm.rotation.x = -0.4;

      ctrl.rightArm.rotation.x = -0.2;
      ctrl.rightArm.rotation.z = -0.35;
      ctrl.rightForearm.rotation.x = -0.4;

      ctrl.head.rotation.x = -0.05 + breath * 0.03;
      ctrl.head.rotation.y = Math.sin(elapsed * 0.5) * 0.12;
    } else {
      ctrl.torso.rotation.x = 0.02;
      ctrl.leftArm.rotation.x = -0.45;
      ctrl.leftArm.rotation.z = 0.15;
      ctrl.leftForearm.rotation.x = -0.5;

      ctrl.rightArm.rotation.x = -0.45;
      ctrl.rightArm.rotation.z = -0.15;
      ctrl.rightForearm.rotation.x = -0.5;
    }
  } else {
    // STANDING KINEMATICS
    ctrl.pelvis.position.y = THREE.MathUtils.lerp(ctrl.pelvis.position.y, 1.05, 0.15);
    ctrl.leftThigh.rotation.x = THREE.MathUtils.lerp(ctrl.leftThigh.rotation.x, 0, 0.15);
    ctrl.leftShin.rotation.x = THREE.MathUtils.lerp(ctrl.leftShin.rotation.x, 0, 0.15);
    ctrl.rightThigh.rotation.x = THREE.MathUtils.lerp(ctrl.rightThigh.rotation.x, 0, 0.15);
    ctrl.rightShin.rotation.x = THREE.MathUtils.lerp(ctrl.rightShin.rotation.x, 0, 0.15);

    switch (action) {
      case 'playing_synth': {
        ctrl.torso.rotation.x = 0.12;
        ctrl.torso.rotation.y = Math.sin(elapsed * 3.0) * 0.04;

        ctrl.leftArm.rotation.x = -1.05;
        ctrl.leftArm.rotation.z = 0.2;
        ctrl.leftForearm.rotation.x = -0.4 + Math.sin(elapsed * 6.5) * 0.15;

        ctrl.rightArm.rotation.x = -1.1;
        ctrl.rightArm.rotation.z = -0.2;
        ctrl.rightForearm.rotation.x = -0.4 + Math.sin(elapsed * 9.0) * 0.18;

        ctrl.head.rotation.x = 0.2 + Math.abs(Math.sin(elapsed * 4.0)) * 0.12;
        ctrl.head.rotation.y = 0;
        break;
      }

      case 'playing_piano': {
        ctrl.torso.rotation.x = 0.1;
        ctrl.leftArm.rotation.x = -1.15;
        ctrl.leftArm.rotation.z = 0.25;
        ctrl.leftForearm.rotation.x = -0.35 + Math.sin(elapsed * 5.0) * 0.12;

        ctrl.rightArm.rotation.x = -1.15;
        ctrl.rightArm.rotation.z = -0.25;
        ctrl.rightForearm.rotation.x = -0.35 + Math.cos(elapsed * 7.0) * 0.14;

        ctrl.head.rotation.x = 0.15 + Math.abs(Math.sin(elapsed * 3.5)) * 0.08;
        ctrl.head.rotation.y = Math.sin(elapsed * 1.5) * 0.1;
        break;
      }

      case 'warming_fireplace': {
        ctrl.torso.rotation.x = 0.06;
        ctrl.leftArm.rotation.x = -0.85;
        ctrl.leftArm.rotation.z = 0.15 + Math.sin(elapsed * 2.5) * 0.06;
        ctrl.leftForearm.rotation.x = -0.3;

        ctrl.rightArm.rotation.x = -0.85;
        ctrl.rightArm.rotation.z = -0.15 - Math.sin(elapsed * 2.5) * 0.06;
        ctrl.rightForearm.rotation.x = -0.3;

        ctrl.head.rotation.x = 0.22;
        ctrl.head.rotation.y = 0;
        break;
      }

      case 'spinning_vinyl': {
        ctrl.torso.rotation.x = 0.2;
        ctrl.head.rotation.x = 0.35;
        ctrl.head.rotation.y = -0.1;

        ctrl.leftArm.rotation.x = -0.4;
        ctrl.leftArm.rotation.z = 0.2;
        ctrl.leftForearm.rotation.x = -0.5;

        ctrl.rightArm.rotation.x = -1.0;
        ctrl.rightArm.rotation.z = -0.1;
        ctrl.rightForearm.rotation.x = -0.5 + Math.sin(elapsed * 1.2) * 0.1;
        break;
      }

      case 'recording_mic': {
        ctrl.torso.rotation.x = -0.04;
        ctrl.rightArm.rotation.x = -0.25;
        ctrl.rightArm.rotation.z = 1.35;
        ctrl.rightForearm.rotation.x = -1.75;

        const vocalInflection = Math.sin(elapsed * 3.2);
        ctrl.leftArm.rotation.x = -0.6 + vocalInflection * 0.22;
        ctrl.leftArm.rotation.z = 0.3;
        ctrl.leftForearm.rotation.x = -0.5;

        ctrl.head.rotation.x = -0.18;
        ctrl.head.rotation.y = vocalInflection * 0.08;
        break;
      }

      case 'playing_guitar': {
        ctrl.torso.rotation.x = 0.08;
        ctrl.leftArm.rotation.x = -0.8;
        ctrl.leftArm.rotation.z = 0.65;
        ctrl.leftForearm.rotation.x = -1.15;

        ctrl.rightArm.rotation.x = -0.5;
        ctrl.rightArm.rotation.z = -0.25;
        ctrl.rightForearm.rotation.x = -0.9 + Math.sin(elapsed * 7.5) * 0.25;

        ctrl.head.rotation.x = 0.25;
        ctrl.head.rotation.y = 0.2;
        break;
      }

      case 'drinking_tea': {
        const sipCycle = (elapsed * 0.4) % 1.0;
        const isSipping = sipCycle > 0.65 && sipCycle < 0.88;

        ctrl.leftArm.rotation.x = -0.2;
        ctrl.leftArm.rotation.z = 0.1;
        ctrl.leftForearm.rotation.x = -0.3;

        if (isSipping) {
          ctrl.rightArm.rotation.x = THREE.MathUtils.lerp(ctrl.rightArm.rotation.x, -1.2, 0.2);
          ctrl.rightArm.rotation.z = THREE.MathUtils.lerp(ctrl.rightArm.rotation.z, 0.2, 0.2);
          ctrl.rightForearm.rotation.x = THREE.MathUtils.lerp(ctrl.rightForearm.rotation.x, -1.4, 0.2);
          ctrl.head.rotation.x = THREE.MathUtils.lerp(ctrl.head.rotation.x, 0.15, 0.2);
        } else {
          ctrl.rightArm.rotation.x = THREE.MathUtils.lerp(ctrl.rightArm.rotation.x, -0.65, 0.15);
          ctrl.rightArm.rotation.z = THREE.MathUtils.lerp(ctrl.rightArm.rotation.z, 0.15, 0.15);
          ctrl.rightForearm.rotation.x = THREE.MathUtils.lerp(ctrl.rightForearm.rotation.x, -0.8, 0.15);
          ctrl.head.rotation.x = THREE.MathUtils.lerp(ctrl.head.rotation.x, 0.0, 0.15);
        }
        break;
      }

      default: {
        if (isSpeaking) {
          const gesture = Math.sin(elapsed * 5.0);
          ctrl.rightArm.rotation.x = -0.6 + gesture * 0.25;
          ctrl.rightArm.rotation.z = 0.35;
          ctrl.rightForearm.rotation.x = -0.8 + gesture * 0.3;

          ctrl.leftArm.rotation.x = -0.2;
          ctrl.leftForearm.rotation.x = -0.3;
          ctrl.head.rotation.y = Math.sin(elapsed * 2.5) * 0.15;
        } else {
          ctrl.leftArm.rotation.x = breath * 0.04;
          ctrl.leftArm.rotation.z = 0.08;
          ctrl.leftForearm.rotation.x = -0.15;

          ctrl.rightArm.rotation.x = breath * 0.04;
          ctrl.rightArm.rotation.z = -0.08;
          ctrl.rightForearm.rotation.x = -0.15;

          if (speakerPos && speakerPos.distanceTo(ctrl.group.position) < 18) {
            const localSpeaker = ctrl.group.worldToLocal(speakerPos.clone());
            const lookAngle = Math.atan2(localSpeaker.x, localSpeaker.z);
            ctrl.head.rotation.y = THREE.MathUtils.lerp(
              ctrl.head.rotation.y,
              Math.max(-0.6, Math.min(0.6, lookAngle)),
              0.08
            );
          } else {
            ctrl.head.rotation.y = Math.sin(elapsed * 0.8 + ctrl.group.position.z) * 0.12;
          }
        }
        break;
      }
    }
  }

  // Emotional posture nuances
  if (emotionalState === 'exhausted') {
    ctrl.head.rotation.x += 0.18;
    ctrl.torso.rotation.x += 0.08;
  } else if (emotionalState === 'inspired' || emotionalState === 'euphoric') {
    ctrl.head.rotation.x -= 0.12;
    ctrl.torso.rotation.x -= 0.04;
  }
}
