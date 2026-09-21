import * as THREE from 'three';
import { OutdoorEvent } from '../../types';
import { soundEngine } from '../../audio/soundEngine';

export interface CarEntity {
  group: THREE.Group;
  speed: number;
  direction: 1 | -1; // 1 = Eastbound (left to right, X increases), -1 = Westbound
  laneZ: number;
  wheels: THREE.Mesh[];
  headlightL: THREE.SpotLight;
  headlightR: THREE.SpotLight;
  headlightBeamL: THREE.Mesh;
  headlightBeamR: THREE.Mesh;
  taillightL: THREE.Mesh;
  taillightR: THREE.Mesh;
  colorName: string;
}

export interface OutdoorEnvironmentManager {
  rootGroup: THREE.Group;
  streetLamps: THREE.PointLight[];
  porchLight: THREE.PointLight;
  windowGlows: THREE.Mesh[];
  update: (delta: number, elapsed: number, isNight: boolean, nightFactor: number) => void;
  onRandomEvent?: (event: OutdoorEvent) => void;
  setEventListener: (listener: (event: OutdoorEvent) => void) => void;
  setOnEventCallback: (listener: (event: OutdoorEvent) => void) => void;
  dispose: () => void;
}

/**
 * Builds the outdoor 3D environment for the Portland Craftsman House.
 * Features:
 * - Elevated stone masonry foundation elevating the house 1.4m above the ground
 * - Covered craftsman front porch with tapered columns, cedar decking, and craftsman door
 * - Front steps with craftsman handrails stepping down from the porch to the yard
 * - Curving flagstone walkway, contoured lush lawn, native Pacific Northwest pine/fir trees
 * - Concrete sidewalk with curb and vintage cast-iron street lamps
 * - Two-lane asphalt street with road markings
 * - Moving procedural 3D cars with rotating wheels and dynamic headlights
 * - Programmatic random events (fireflies at night, passing vehicles, cyclists, etc.)
 */
export function createOutdoorEnvironment(scene: THREE.Scene): OutdoorEnvironmentManager {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'outdoor-environment';
  scene.add(rootGroup);

  const streetLamps: THREE.PointLight[] = [];
  const windowGlows: THREE.Mesh[] = [];
  let eventListener: ((event: OutdoorEvent) => void) | null = null;

  // Common Materials with craftsman / Pacific Northwest aesthetic
  const stoneFoundationMat = new THREE.MeshStandardMaterial({
    color: '#423832',
    roughness: 0.95,
    metalness: 0.05,
  });

  const cedarWoodMat = new THREE.MeshStandardMaterial({
    color: '#6d4529',
    roughness: 0.65,
    metalness: 0.05,
  });

  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: '#2a1a10',
    roughness: 0.5,
    metalness: 0.1,
  });

  const lawnGrassMat = new THREE.MeshStandardMaterial({
    color: '#2f4a25',
    roughness: 0.9,
  });

  const flagstoneMat = new THREE.MeshStandardMaterial({
    color: '#6b665c',
    roughness: 0.85,
  });

  const asphaltMat = new THREE.MeshStandardMaterial({
    color: '#1a1918',
    roughness: 0.9,
    metalness: 0.1,
  });

  const concreteMat = new THREE.MeshStandardMaterial({
    color: '#716e67',
    roughness: 0.8,
  });

  // ==================== 1. ELEVATED FOUNDATION ====================
  // Ground is at y = -1.4. House floor is at y = 0.
  // Foundation walls sit from y = -1.4 to 0.0 under the house perimeter:
  // House spans X: [-15.2, 15.2], Z: [-8.2, 8.0]
  const foundationHeight = 1.4;
  const foundationY = -foundationHeight / 2; // -0.7

  // North wall foundation
  const foundNorth = new THREE.Mesh(
    new THREE.BoxGeometry(30.6, foundationHeight, 0.8),
    stoneFoundationMat
  );
  foundNorth.position.set(0, foundationY, -8.1);
  foundNorth.receiveShadow = true;
  rootGroup.add(foundNorth);

  // West wall foundation
  const foundWest = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, foundationHeight, 16.4),
    stoneFoundationMat
  );
  foundWest.position.set(-15.1, foundationY, 0);
  foundWest.receiveShadow = true;
  rootGroup.add(foundWest);

  // East wall foundation
  const foundEast = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, foundationHeight, 16.4),
    stoneFoundationMat
  );
  foundEast.position.set(15.1, foundationY, 0);
  foundEast.receiveShadow = true;
  rootGroup.add(foundEast);

  // South wall foundation (with gap for front porch)
  const foundSouthL = new THREE.Mesh(
    new THREE.BoxGeometry(8.2, foundationHeight, 0.8),
    stoneFoundationMat
  );
  foundSouthL.position.set(-11.1, foundationY, 8.1);
  foundSouthL.receiveShadow = true;
  rootGroup.add(foundSouthL);

  const foundSouthR = new THREE.Mesh(
    new THREE.BoxGeometry(8.2, foundationHeight, 0.8),
    stoneFoundationMat
  );
  foundSouthR.position.set(11.1, foundationY, 8.1);
  foundSouthR.receiveShadow = true;
  rootGroup.add(foundSouthR);

  // Ashlar Stone Course detailing
  for (let sy = -1.2; sy < 0; sy += 0.35) {
    const course = new THREE.Mesh(
      new THREE.BoxGeometry(30.8, 0.02, 0.04),
      new THREE.MeshBasicMaterial({ color: '#251e19' })
    );
    course.position.set(0, sy, 8.52);
    rootGroup.add(course);
  }

  // ==================== 2. CRAFTSMAN FRONT PORCH & FRONT STEPS ====================
  // Porch platform extends at Y = -0.05, X: [-7.0, 7.0] (width 14m), Z: [8.0, 11.2] (depth 3.2m)
  const porchDeck = new THREE.Mesh(
    new THREE.BoxGeometry(14.2, 0.25, 3.4),
    cedarWoodMat
  );
  porchDeck.position.set(0, -0.125, 9.6);
  porchDeck.receiveShadow = true;
  rootGroup.add(porchDeck);

  // Porch foundation stone pedestal below deck
  const porchFound = new THREE.Mesh(
    new THREE.BoxGeometry(14.0, foundationHeight - 0.25, 3.2),
    stoneFoundationMat
  );
  porchFound.position.set(0, -0.25 - (foundationHeight - 0.25) / 2, 9.6);
  porchFound.receiveShadow = true;
  rootGroup.add(porchFound);

  // Front exterior door (Craftsman dark walnut with stained glass)
  const frontDoorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 3.6, 0.2),
    darkTrimMat
  );
  frontDoorFrame.position.set(0, 1.8, 7.95);
  rootGroup.add(frontDoorFrame);

  const frontDoor = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 3.2, 0.12),
    cedarWoodMat
  );
  frontDoor.position.set(0, 1.6, 8.02);
  rootGroup.add(frontDoor);

  // Stained glass window panel in front door
  const doorGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 1.0),
    new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      emissive: '#d97706',
      emissiveIntensity: 0.6,
      roughness: 0.2,
    })
  );
  doorGlass.position.set(0, 2.2, 8.09);
  rootGroup.add(doorGlass);
  windowGlows.push(doorGlass);

  // Craftsman Front Porch Columns (Tapered wood columns on stone pedestals)
  const columnPositions = [-6.2, -2.4, 2.4, 6.2];
  columnPositions.forEach((cx) => {
    // Stone base pedestal
    const stoneBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.9, 0.85),
      stoneFoundationMat
    );
    stoneBase.position.set(cx, 0.45, 11.0);
    stoneBase.castShadow = true;
    rootGroup.add(stoneBase);

    // Tapered timber column
    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 2.7, 8),
      cedarWoodMat
    );
    column.position.set(cx, 2.25, 11.0);
    column.castShadow = true;
    rootGroup.add(column);
  });

  // Porch Railings between columns
  [-4.3, 4.3].forEach((rx) => {
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.1, 0.14), darkTrimMat);
    topRail.position.set(rx, 0.85, 11.0);
    rootGroup.add(topRail);

    // Balusters
    for (let bx = rx - 1.2; bx <= rx + 1.2; bx += 0.35) {
      const baluster = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.06), cedarWoodMat);
      baluster.position.set(bx, 0.45, 11.0);
      rootGroup.add(baluster);
    }
  });

  // Porch Overhang Roof
  const porchRoof = new THREE.Mesh(
    new THREE.BoxGeometry(15.2, 0.35, 4.2),
    new THREE.MeshStandardMaterial({ color: '#2b231d', roughness: 0.7 })
  );
  porchRoof.position.set(0, 3.75, 10.0);
  porchRoof.castShadow = true;
  rootGroup.add(porchRoof);

  // Craftsman Hanging Porch Lantern
  const lanternChain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.6),
    new THREE.MeshBasicMaterial({ color: '#18181b' })
  );
  lanternChain.position.set(0, 3.3, 9.6);
  rootGroup.add(lanternChain);

  const lanternBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.5, 0.35),
    new THREE.MeshStandardMaterial({
      color: '#fbbf24',
      emissive: '#d97706',
      emissiveIntensity: 0.8,
      roughness: 0.2,
    })
  );
  lanternBody.position.set(0, 2.85, 9.6);
  rootGroup.add(lanternBody);

  const porchLight = new THREE.PointLight('#fef3c7', 2.2, 14, 1.2);
  porchLight.position.set(0, 2.7, 9.6);
  porchLight.castShadow = true;
  porchLight.shadow.bias = -0.002;
  rootGroup.add(porchLight);

  // --- Craftsman Front Steps ---
  // Steps lead from Porch (Z = 11.2, Y = 0.0) down to Yard (Z = 14.2, Y = -1.4)
  // 5 wide steps centered between columns (X: [-2.0, 2.0], width 4m)
  const numSteps = 5;
  const stepRise = 1.4 / numSteps; // ~0.28m
  const stepTread = 3.0 / numSteps; // ~0.6m

  for (let s = 0; s < numSteps; s++) {
    const stepY = -0.14 - s * stepRise;
    const stepZ = 11.5 + s * stepTread;
    const stepMesh = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, stepRise, stepTread * 1.2),
      cedarWoodMat
    );
    stepMesh.position.set(0, stepY, stepZ);
    stepMesh.receiveShadow = true;
    stepMesh.castShadow = true;
    rootGroup.add(stepMesh);

    // Stone step riser trim
    const stoneRiser = new THREE.Mesh(
      new THREE.BoxGeometry(4.25, stepRise, 0.05),
      stoneFoundationMat
    );
    stoneRiser.position.set(0, stepY, stepZ + stepTread * 0.55);
    rootGroup.add(stoneRiser);
  }

  // Step Side Railings
  [-2.15, 2.15].forEach((hx) => {
    // Sloped Handrail
    const handrail = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 3.6),
      darkTrimMat
    );
    handrail.position.set(hx, 0.25, 12.8);
    handrail.rotation.x = 0.42; // slope down
    rootGroup.add(handrail);

    // Newel Post at bottom of steps
    const newelPost = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 1.1, 0.24),
      darkTrimMat
    );
    newelPost.position.set(hx, -0.85, 14.5);
    newelPost.castShadow = true;
    rootGroup.add(newelPost);
  });

  // ==================== 3. FRONT LAWN & FLOWERBEDS ====================
  // Main ground terrain at Y = -1.4
  // Spans X: [-48, 48], Z: [7, 22] (front yard), and around the house
  const yardGround = new THREE.Mesh(
    new THREE.PlaneGeometry(96, 24),
    lawnGrassMat
  );
  yardGround.rotation.x = -Math.PI / 2;
  yardGround.position.set(0, -1.41, 14.5);
  yardGround.receiveShadow = true;
  rootGroup.add(yardGround);

  // Side and back lawn terrain
  const perimeterLawn = new THREE.Mesh(
    new THREE.PlaneGeometry(96, 32),
    lawnGrassMat
  );
  perimeterLawn.rotation.x = -Math.PI / 2;
  perimeterLawn.position.set(0, -1.41, -12);
  perimeterLawn.receiveShadow = true;
  rootGroup.add(perimeterLawn);

  // Curving Flagstone Walkway (from steps Z: 14.5 to sidewalk Z: 21.5)
  for (let z = 14.6; z <= 21.2; z += 0.85) {
    const curveOffset = Math.sin((z - 14.5) * 0.5) * 0.4;
    const stone = new THREE.Mesh(
      new THREE.BoxGeometry(2.4 + Math.random() * 0.3, 0.04, 0.7),
      flagstoneMat
    );
    stone.position.set(curveOffset, -1.38, z);
    stone.rotation.y = (Math.random() - 0.5) * 0.08;
    stone.receiveShadow = true;
    rootGroup.add(stone);
  }

  // Pacific Northwest Douglas Fir & Pine Trees
  const treePositions = [
    { x: -18, z: 12, h: 14, r: 3.8 },
    { x: -24, z: 18, h: 18, r: 4.5 },
    { x: -32, z: 9, h: 16, r: 4.2 },
    { x: 19, z: 13, h: 15, r: 4.0 },
    { x: 27, z: 17, h: 19, r: 4.8 },
    { x: 34, z: 10, h: 16, r: 4.2 },
    { x: -22, z: -12, h: 17, r: 4.4 },
    { x: 23, z: -13, h: 16, r: 4.2 },
  ];

  treePositions.forEach((tp) => {
    // Tree Trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.55, tp.h * 0.4, 8),
      new THREE.MeshStandardMaterial({ color: '#2a1a0f', roughness: 0.9 })
    );
    trunk.position.set(tp.x, -1.4 + (tp.h * 0.4) / 2, tp.z);
    trunk.castShadow = true;
    rootGroup.add(trunk);

    // Multi-tiered Evergreen Conical Foliage
    const tiers = 4;
    for (let t = 0; t < tiers; t++) {
      const tierH = tp.h * 0.28;
      const tierR = tp.r * (1 - t * 0.22);
      const tierY = -1.4 + tp.h * 0.25 + t * (tp.h * 0.18);
      const foliage = new THREE.Mesh(
        new THREE.ConeGeometry(tierR, tierH, 8),
        new THREE.MeshStandardMaterial({
          color: t % 2 === 0 ? '#1b321c' : '#223c24',
          roughness: 0.85,
        })
      );
      foliage.position.set(tp.x, tierY, tp.z);
      foliage.castShadow = true;
      rootGroup.add(foliage);
    }
  });

  // PNW Garden Ferns, Mossy Basalt Boulders along foundation
  [-11, -8, 8, 12].forEach((bx) => {
    // Basalt Rock
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.7 + Math.random() * 0.4),
      new THREE.MeshStandardMaterial({ color: '#3f3e3a', roughness: 0.95 })
    );
    rock.position.set(bx, -1.1, 10.5);
    rock.scale.set(1.2, 0.7, 1.0);
    rock.castShadow = true;
    rootGroup.add(rock);

    // Fern fronds around rock
    for (let f = 0; f < 5; f++) {
      const frond = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 1.0, 4),
        new THREE.MeshStandardMaterial({ color: '#386629', roughness: 0.8 })
      );
      frond.position.set(bx + (f - 2) * 0.35, -1.0, 10.8 + (Math.random() - 0.5) * 0.4);
      frond.rotation.z = (f - 2) * 0.25;
      frond.rotation.x = 0.3;
      rootGroup.add(frond);
    }
  });

  // Low Craftsman Timber Fence along front lawn
  [-22, 22].forEach((fx) => {
    for (let postX = fx - 10; postX <= fx + 10; postX += 2.5) {
      if (Math.abs(postX) < 4.5) continue; // Gap for walkway
      const fencePost = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 1.1, 0.14),
        cedarWoodMat
      );
      fencePost.position.set(postX, -0.85, 20.8);
      rootGroup.add(fencePost);
    }
    const fenceRail = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.08, 0.06),
      cedarWoodMat
    );
    fenceRail.position.set(fx, -0.6, 20.8);
    rootGroup.add(fenceRail);
  });

  // ==================== 4. SIDEWALK, CURB & STREETLAMPS ====================
  // Sidewalk: X: [-48, 48], Z: [21.5, 23.5], Y: -1.35
  const sidewalk = new THREE.Mesh(
    new THREE.BoxGeometry(96, 0.1, 2.0),
    concreteMat
  );
  sidewalk.position.set(0, -1.35, 22.5);
  sidewalk.receiveShadow = true;
  rootGroup.add(sidewalk);

  // Scored sidewalk expansion joints
  for (let sx = -46; sx <= 46; sx += 2.5) {
    const joint = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.01, 2.0),
      new THREE.MeshBasicMaterial({ color: '#4a4640' })
    );
    joint.position.set(sx, -1.29, 22.5);
    rootGroup.add(joint);
  }

  // Concrete Curb (drops 0.15m down to asphalt street at Z = 23.5)
  const curb = new THREE.Mesh(
    new THREE.BoxGeometry(96, 0.25, 0.2),
    concreteMat
  );
  curb.position.set(0, -1.42, 23.6);
  curb.receiveShadow = true;
  rootGroup.add(curb);

  // Vintage Cast-Iron Craftsman Streetlights
  [-16, 16].forEach((lx) => {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.14, 5.5, 8),
      new THREE.MeshStandardMaterial({ color: '#18181b', metalness: 0.85, roughness: 0.3 })
    );
    pole.position.set(lx, 1.4, 22.8);
    pole.castShadow = true;
    rootGroup.add(pole);

    // Lamp Lantern Head
    const lampHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.25, 0.7, 6),
      new THREE.MeshStandardMaterial({
        color: '#fef08a',
        emissive: '#eab308',
        emissiveIntensity: 0.9,
        roughness: 0.2,
      })
    );
    lampHead.position.set(lx, 4.3, 22.8);
    rootGroup.add(lampHead);

    // Streetlight Pool
    const lampLight = new THREE.PointLight('#fef08a', 2.8, 22, 1.2);
    lampLight.position.set(lx, 4.3, 22.8);
    lampLight.castShadow = true;
    lampLight.shadow.bias = -0.001;
    rootGroup.add(lampLight);
    streetLamps.push(lampLight);
  });

  // ==================== 5. TWO-LANE ASPHALT STREET ====================
  // Street: X: [-48, 48], Z: [23.8, 35.8] (width 12m), Y: -1.52
  const streetRoad = new THREE.Mesh(
    new THREE.BoxGeometry(96, 0.1, 12.0),
    asphaltMat
  );
  streetRoad.position.set(0, -1.55, 29.8);
  streetRoad.receiveShadow = true;
  rootGroup.add(streetRoad);

  // Double Yellow Center Line (at Z = 29.8)
  [-0.15, 0.15].forEach((offsetZ) => {
    for (let lx = -46; lx <= 46; lx += 4.0) {
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(2.8, 0.12),
        new THREE.MeshBasicMaterial({ color: '#ca8a04' })
      );
      line.rotation.x = -Math.PI / 2;
      line.position.set(lx, -1.49, 29.8 + offsetZ);
      rootGroup.add(line);
    }
  });

  // White Shoulder Road Lines
  [24.2, 35.4].forEach((edgeZ) => {
    const edgeLine = new THREE.Mesh(
      new THREE.PlaneGeometry(92, 0.14),
      new THREE.MeshBasicMaterial({ color: '#e2e8f0' })
    );
    edgeLine.rotation.x = -Math.PI / 2;
    edgeLine.position.set(0, -1.49, edgeZ);
    rootGroup.add(edgeLine);
  });

  // ==================== 6. MOVING 3D CARS ON THE STREET ====================
  // Procedural vehicles that drive continuously along Eastbound (Z = 27.2) and Westbound (Z = 32.4) lanes
  const cars: CarEntity[] = [];

  const carSpecs = [
    {
      name: 'Vintage Volvo 240 Wagon',
      color: '#1e3a24', // Portland pine green
      speed: 7.5,
      direction: 1 as const,
      laneZ: 27.2,
      startX: -38,
    },
    {
      name: 'Classic Cream Sedan',
      color: '#f5efe0', // Cream white
      speed: 6.8,
      direction: -1 as const,
      laneZ: 32.4,
      startX: 32,
    },
    {
      name: 'Pacific Northwest Blue Pickup',
      color: '#1e293b', // Dark slate blue
      speed: 8.2,
      direction: 1 as const,
      laneZ: 27.2,
      startX: 12,
    },
    {
      name: 'Vintage Amber Compact',
      color: '#c2410c', // Terracotta amber
      speed: 7.0,
      direction: -1 as const,
      laneZ: 32.4,
      startX: -14,
    },
  ];

  carSpecs.forEach((spec) => {
    const carGroup = new THREE.Group();
    carGroup.name = `car-${spec.name}`;
    carGroup.position.set(spec.startX, -1.1, spec.laneZ);
    if (spec.direction === -1) {
      carGroup.rotation.y = Math.PI; // Face west
    }

    const bodyMat = new THREE.MeshStandardMaterial({
      color: spec.color,
      roughness: 0.35,
      metalness: 0.6,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      roughness: 0.1,
      metalness: 0.9,
    });

    // Lower Chassis
    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.7, 2.1),
      bodyMat
    );
    chassis.position.set(0, 0.45, 0);
    chassis.castShadow = true;
    carGroup.add(chassis);

    // Cabin / Roof
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.75, 1.8),
      bodyMat
    );
    cabin.position.set(-0.2, 1.1, 0);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Windshield & Windows
    const windshield = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.65, 1.6),
      glassMat
    );
    windshield.position.set(1.02, 1.1, 0);
    carGroup.add(windshield);

    const rearWindow = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.65, 1.6),
      glassMat
    );
    rearWindow.position.set(-1.42, 1.1, 0);
    carGroup.add(rearWindow);

    // Chrome Bumpers
    const frontBumper = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.22, 2.15),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.95, roughness: 0.1 })
    );
    frontBumper.position.set(2.25, 0.28, 0);
    carGroup.add(frontBumper);

    const rearBumper = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.22, 2.15),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.95, roughness: 0.1 })
    );
    rearBumper.position.set(-2.25, 0.28, 0);
    carGroup.add(rearBumper);

    // Wheels (4 rubber tires with steel rims)
    const wheelMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.8 });
    const wheels: THREE.Mesh[] = [];

    const wheelOffsets = [
      { x: 1.3, z: 1.05 },
      { x: 1.3, z: -1.05 },
      { x: -1.3, z: 1.05 },
      { x: -1.3, z: -1.05 },
    ];

    wheelOffsets.forEach((wo) => {
      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.34, 0.24, 16),
        wheelMat
      );
      tire.rotation.x = Math.PI / 2;
      tire.position.set(wo.x, 0.24, wo.z);
      tire.castShadow = true;
      carGroup.add(tire);
      wheels.push(tire);

      const hubcap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.26, 12),
        rimMat
      );
      hubcap.rotation.x = Math.PI / 2;
      hubcap.position.set(wo.x, 0.24, wo.z);
      carGroup.add(hubcap);
    });

    // Twin Front Headlights
    const hlMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });
    const hlMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.28), hlMat);
    hlMeshL.position.set(2.22, 0.52, 0.65);
    carGroup.add(hlMeshL);

    const hlMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.28), hlMat);
    hlMeshR.position.set(2.22, 0.52, -0.65);
    carGroup.add(hlMeshR);

    // Spotlights for Night Driving
    const spotL = new THREE.SpotLight('#fef08a', 2.0, 24, Math.PI / 7, 0.4);
    spotL.position.set(2.25, 0.52, 0.65);
    spotL.target.position.set(12, 0, 0.65);
    carGroup.add(spotL);
    carGroup.add(spotL.target);

    const spotR = new THREE.SpotLight('#fef08a', 2.0, 24, Math.PI / 7, 0.4);
    spotR.position.set(2.25, 0.52, -0.65);
    spotR.target.position.set(12, 0, -0.65);
    carGroup.add(spotR);
    carGroup.add(spotR.target);

    // Volumetric Headlight Beams (subtle transparent cones)
    const beamGeo = new THREE.ConeGeometry(1.6, 9.0, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: '#fef08a',
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const beamL = new THREE.Mesh(beamGeo, beamMat);
    beamL.rotation.z = -Math.PI / 2;
    beamL.position.set(6.5, 0.3, 0.65);
    carGroup.add(beamL);

    const beamR = new THREE.Mesh(beamGeo, beamMat.clone());
    beamR.rotation.z = -Math.PI / 2;
    beamR.position.set(6.5, 0.3, -0.65);
    carGroup.add(beamR);

    // Twin Rear Taillights
    const tlMat = new THREE.MeshBasicMaterial({ color: '#dc2626' });
    const taillightL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.28), tlMat);
    taillightL.position.set(-2.22, 0.52, 0.65);
    carGroup.add(taillightL);

    const taillightR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.28), tlMat);
    taillightR.position.set(-2.22, 0.52, -0.65);
    carGroup.add(taillightR);

    rootGroup.add(carGroup);

    cars.push({
      group: carGroup,
      speed: spec.speed,
      direction: spec.direction,
      laneZ: spec.laneZ,
      wheels,
      headlightL: spotL,
      headlightR: spotR,
      headlightBeamL: beamL,
      headlightBeamR: beamR,
      taillightL,
      taillightR,
      colorName: spec.name,
    });
  });

  // ==================== 7. NIGHT FIREFLIES & DAY BIRDS ====================
  // Fireflies Particle Cloud
  const fireflyCount = 45;
  const fireflyGeo = new THREE.BufferGeometry();
  const fireflyPos = new Float32Array(fireflyCount * 3);
  for (let i = 0; i < fireflyCount; i++) {
    fireflyPos[i * 3] = (Math.random() - 0.5) * 36;
    fireflyPos[i * 3 + 1] = -1.2 + Math.random() * 2.2;
    fireflyPos[i * 3 + 2] = 9.0 + Math.random() * 12.0;
  }
  fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));

  const fireflyMat = new THREE.PointsMaterial({
    color: '#bef264',
    size: 0.22,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  const fireflies = new THREE.Points(fireflyGeo, fireflyMat);
  rootGroup.add(fireflies);

  // Programmatic Random Events state
  let lastEventTime = 0;
  const eventCooldown = 28; // seconds between spontaneous neighborhood occurrences

  const randomEventCatalog: Array<{ title: string; desc: string; type: OutdoorEvent['type'] }> = [
    {
      title: 'Vintage Volvo Cruiser',
      desc: 'A forest green 1988 Volvo wagon rumbles peacefully down SE Hawthorne Blvd.',
      type: 'traffic',
    },
    {
      title: 'Portland Rain Mist',
      desc: 'Fresh Pacific Northwest rain droplets glisten against the craftsman front porch cedar decking.',
      type: 'weather',
    },
    {
      title: 'Evening Fireflies',
      desc: 'Bioluminescent green fireflies rise rhythmically from the front yard sword ferns.',
      type: 'wildlife',
    },
    {
      title: 'Evening Cyclist',
      desc: 'A local cyclist in yellow rain gear glides silently past in the bike lane with a dynamo beacon.',
      type: 'neighborhood',
    },
    {
      title: 'Pine Needle Breeze',
      desc: 'A gentle gust sweeps through the towering Douglas firs, sending dry cedar scent across the porch.',
      type: 'neighborhood',
    },
  ];

  // Frame update loop
  const update = (delta: number, elapsed: number, isNight: boolean, nightFactor: number) => {
    // 1. Update Cars on the Street
    cars.forEach((car) => {
      // Move along X axis
      car.group.position.x += car.direction * car.speed * delta;

      // Wheel rotation
      const wheelDeltaRot = (car.speed / 0.34) * delta * car.direction;
      car.wheels.forEach((w) => {
        w.rotation.y += wheelDeltaRot;
      });

      // Wrap around road bounds
      if (car.direction === 1 && car.group.position.x > 48) {
        car.group.position.x = -48;
        // Occasional pass-by sound
        if (Math.random() < 0.35) soundEngine.playCarPassBy(0.18);
      } else if (car.direction === -1 && car.group.position.x < -48) {
        car.group.position.x = 48;
        if (Math.random() < 0.35) soundEngine.playCarPassBy(0.18);
      }

      // Headlights and taillights intensity based on nightFactor
      const hlIntensity = nightFactor * 2.8;
      car.headlightL.intensity = hlIntensity;
      car.headlightR.intensity = hlIntensity;
      (car.headlightBeamL.material as THREE.MeshBasicMaterial).opacity = nightFactor * 0.18;
      (car.headlightBeamR.material as THREE.MeshBasicMaterial).opacity = nightFactor * 0.18;
    });

    // 2. Update Streetlamps & Porch Light
    const lampIntensity = nightFactor * 3.2;
    streetLamps.forEach((lamp) => {
      lamp.intensity = lampIntensity;
    });
    porchLight.intensity = Math.max(0.4, nightFactor * 2.6);

    // 3. Update Front Door Stained Glass Glow
    windowGlows.forEach((g) => {
      const mat = g.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = 0.3 + nightFactor * 0.9;
      }
    });

    // 4. Update Fireflies (gentle floating drift at dusk/night)
    if (nightFactor > 0.25) {
      fireflyMat.opacity = THREE.MathUtils.lerp(fireflyMat.opacity, (nightFactor - 0.25) * 1.3, 0.05);
      const positions = fireflyGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < fireflyCount; i++) {
        const idx = i * 3;
        positions[idx + 1] += Math.sin(elapsed * 2.0 + i) * 0.003;
        positions[idx] += Math.cos(elapsed * 1.2 + i * 2) * 0.002;
      }
      fireflyGeo.attributes.position.needsUpdate = true;
    } else {
      fireflyMat.opacity = THREE.MathUtils.lerp(fireflyMat.opacity, 0, 0.08);
    }

    // 5. Trigger Programmatic Random Events
    if (elapsed - lastEventTime > eventCooldown) {
      lastEventTime = elapsed;
      const pick = randomEventCatalog[Math.floor(Math.random() * randomEventCatalog.length)];
      if (eventListener) {
        eventListener({
          id: `evt-${Date.now()}`,
          title: pick.title,
          description: pick.desc,
          timestamp: Date.now(),
          type: pick.type,
        });
      }
    }
  };

  const setEventListener = (listener: (event: OutdoorEvent) => void) => {
    eventListener = listener;
  };

  const dispose = () => {
    scene.remove(rootGroup);
    cars.forEach((car) => {
      scene.remove(car.group);
    });
  };

  return {
    rootGroup,
    streetLamps,
    porchLight,
    windowGlows,
    update,
    setEventListener,
    setOnEventCallback: setEventListener,
    dispose,
  };
}
