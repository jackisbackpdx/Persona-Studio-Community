import * as THREE from 'three';

/**
 * Procedural Portland Craftsman Artist Commune House
 * Features:
 * - 3 interconnected rooms (Living Room, Central Dining Room, Music Sound Lab)
 * - Real dividing architectural walls with open cased craftsman timber doorways
 * - Realistic warm Douglas fir / amber oak hardwood floors
 * - Brick fireplace with glowing hearth and mantel in living room
 * - Mid-century bespoke furniture, record crates, turntable, and plants
 * - Solid Oregon walnut dining table with craftsman chairs & tea service
 * - Realistic music production studio with dual-display desk, monitors, analog synth, upright piano, and mic
 */

export function buildPortlandCommuneHouse(scene: THREE.Scene) {
  // Common Materials with sophisticated Portland craftsman palette
  const floorWoodMat = new THREE.MeshStandardMaterial({
    color: '#85512b',
    roughness: 0.55,
    metalness: 0.08,
  });

  const wallCreamMat = new THREE.MeshStandardMaterial({
    color: '#262420',
    roughness: 0.9,
    metalness: 0.02,
  });

  const accentSageMat = new THREE.MeshStandardMaterial({
    color: '#1e2420',
    roughness: 0.85,
  });

  const craftsmanTrimMat = new THREE.MeshStandardMaterial({
    color: '#3d2516',
    roughness: 0.45,
    metalness: 0.1,
  });

  const brickMat = new THREE.MeshStandardMaterial({
    color: '#6e3422',
    roughness: 0.95,
  });

  // ==================== 1. HARDWOOD FLOOR ====================
  // 30 wide x 16 deep
  const floorGeo = new THREE.BoxGeometry(30, 0.4, 16);
  const floor = new THREE.Mesh(floorGeo, floorWoodMat);
  floor.position.set(0, -0.2, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  // Procedural wood floor plank lines
  for (let x = -14; x <= 14; x += 1.2) {
    const seam = new THREE.Mesh(
      new THREE.BoxGeometry(0.015, 0.01, 16),
      new THREE.MeshBasicMaterial({ color: '#2a170d' })
    );
    seam.position.set(x, 0.005, 0);
    scene.add(seam);
  }

  // Baseboard perimeter trim
  const baseboardMat = craftsmanTrimMat;
  const backBaseboard = new THREE.Mesh(new THREE.BoxGeometry(30, 0.25, 0.1), baseboardMat);
  backBaseboard.position.set(0, 0.125, -7.9);
  scene.add(backBaseboard);

  // ==================== 2. EXTERIOR WALLS ====================
  // Back wall with craftsman picture windows
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(30, 5, 0.4), wallCreamMat);
  backWall.position.set(0, 2.5, -8);
  backWall.receiveShadow = true;
  scene.add(backWall);

  // Left exterior wall (Living room side)
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 16), wallCreamMat);
  leftWall.position.set(-15, 2.5, 0);
  leftWall.receiveShadow = true;
  scene.add(leftWall);

  // Right exterior wall (Studio side)
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 16), accentSageMat);
  rightWall.position.set(15, 2.5, 0);
  rightWall.receiveShadow = true;
  scene.add(rightWall);

  // Craftsman Picture Windows on back wall (looking into misty PNW pines)
  [-9, 0, 9].forEach((wx) => {
    // Window frame
    const winFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 2.4, 0.12),
      craftsmanTrimMat
    );
    winFrame.position.set(wx, 3.0, -7.78);
    scene.add(winFrame);

    // Window glass with warm diffuse light & slight rainy reflection
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 2.0),
      new THREE.MeshStandardMaterial({
        color: '#7fa3a8',
        emissive: '#1e3038',
        emissiveIntensity: 0.35,
        roughness: 0.2,
        metalness: 0.3,
      })
    );
    glass.position.set(wx, 3.0, -7.71);
    scene.add(glass);

    // Mullions (cross bars)
    const mullionH = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 0.08), craftsmanTrimMat);
    mullionH.position.set(wx, 3.0, -7.68);
    scene.add(mullionH);

    const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.0, 0.08), craftsmanTrimMat);
    mullionV.position.set(wx, 3.0, -7.68);
    scene.add(mullionV);
  });

  // ==================== 3. INTERIOR DIVIDING WALLS WITH OPEN DOORWAYS ====================
  // The user explicitly requested:
  // "the rooms shouldn't all be contained within one wall, there needs to be openings within the walls that lead to different rooms."

  // --- WALL 1: Between Living Room and Dining Room (at X = -5) ---
  // Doorway opening spans Z: -1.6 to +1.6 (width = 3.2m). People walk freely through here!
  // Back partition (Z: -8 to -1.6) -> depth = 6.4, center Z = -4.8
  const wall1Back = new THREE.Mesh(new THREE.BoxGeometry(0.35, 5, 6.4), wallCreamMat);
  wall1Back.position.set(-5, 2.5, -4.8);
  wall1Back.receiveShadow = true;
  scene.add(wall1Back);

  // Front partition (Z: +1.6 to +8) -> depth = 6.4, center Z = +4.8
  const wall1Front = new THREE.Mesh(new THREE.BoxGeometry(0.35, 5, 6.4), wallCreamMat);
  wall1Front.position.set(-5, 2.5, 4.8);
  wall1Front.receiveShadow = true;
  scene.add(wall1Front);

  // Doorway Lintel / Arch beam overhead (from Y: 3.2 to 5.0)
  const wall1Lintel = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.8, 3.2), wallCreamMat);
  wall1Lintel.position.set(-5, 4.1, 0);
  scene.add(wall1Lintel);

  // Craftsman Wood Casing Trim around Doorway 1
  const trimPostL1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 3.2, 0.12), craftsmanTrimMat);
  trimPostL1.position.set(-5, 1.6, -1.6);
  scene.add(trimPostL1);

  const trimPostR1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 3.2, 0.12), craftsmanTrimMat);
  trimPostR1.position.set(-5, 1.6, 1.6);
  scene.add(trimPostR1);

  const trimHeader1 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.16, 3.4), craftsmanTrimMat);
  trimHeader1.position.set(-5, 3.2, 0);
  scene.add(trimHeader1);

  // --- WALL 2: Between Dining Room and Music Studio (at X = +5) ---
  // Doorway opening spans Z: -1.6 to +1.6 (width = 3.2m). People walk freely through here!
  const wall2Back = new THREE.Mesh(new THREE.BoxGeometry(0.35, 5, 6.4), accentSageMat);
  wall2Back.position.set(5, 2.5, -4.8);
  wall2Back.receiveShadow = true;
  scene.add(wall2Back);

  const wall2Front = new THREE.Mesh(new THREE.BoxGeometry(0.35, 5, 6.4), accentSageMat);
  wall2Front.position.set(5, 2.5, 4.8);
  wall2Front.receiveShadow = true;
  scene.add(wall2Front);

  // Doorway Lintel over Doorway 2
  const wall2Lintel = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.8, 3.2), accentSageMat);
  wall2Lintel.position.set(5, 4.1, 0);
  scene.add(wall2Lintel);

  // Craftsman Wood Casing Trim around Doorway 2
  const trimPostL2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 3.2, 0.12), craftsmanTrimMat);
  trimPostL2.position.set(5, 1.6, -1.6);
  scene.add(trimPostL2);

  const trimPostR2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 3.2, 0.12), craftsmanTrimMat);
  trimPostR2.position.set(5, 1.6, 1.6);
  scene.add(trimPostR2);

  const trimHeader2 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.16, 3.4), craftsmanTrimMat);
  trimHeader2.position.set(5, 3.2, 0);
  scene.add(trimHeader2);

  // ==================== 4. ROOM RUGS & FLOOR TEXTURES ====================
  // Living Room: Artisanal Moroccan Kilim Rug
  const kilimRugGeo = new THREE.PlaneGeometry(6.4, 5.2);
  const kilimRugMat = new THREE.MeshStandardMaterial({
    color: '#8b4528',
    roughness: 0.95,
  });
  const kilimRug = new THREE.Mesh(kilimRugGeo, kilimRugMat);
  kilimRug.rotation.x = -Math.PI / 2;
  kilimRug.position.set(-10, 0.015, -0.5);
  scene.add(kilimRug);

  // Diamond pattern trim on kilim rug
  const rugInner = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 4.4),
    new THREE.MeshStandardMaterial({ color: '#3d3027', roughness: 0.95 })
  );
  rugInner.rotation.x = -Math.PI / 2;
  rugInner.position.set(-10, 0.02, -0.5);
  scene.add(rugInner);

  // Dining Room: Circular braided jute rug
  const diningRug = new THREE.Mesh(
    new THREE.CircleGeometry(3.6, 32),
    new THREE.MeshStandardMaterial({ color: '#594532', roughness: 0.95 })
  );
  diningRug.rotation.x = -Math.PI / 2;
  diningRug.position.set(0, 0.015, 0);
  scene.add(diningRug);

  // Studio: Acoustic vintage oriental runner
  const studioRug = new THREE.Mesh(
    new THREE.PlaneGeometry(6.8, 6.8),
    new THREE.MeshStandardMaterial({ color: '#2b1b2f', roughness: 0.85 })
  );
  studioRug.rotation.x = -Math.PI / 2;
  studioRug.position.set(10, 0.015, -0.5);
  scene.add(studioRug);

  // ==================== 5. LIVING ROOM CRAFTSMAN DETAILS ====================
  // --- Craftsman Brick Fireplace ---
  const fireBase = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.4, 0.8), brickMat);
  fireBase.position.set(-10, 1.7, -7.5);
  fireBase.castShadow = true;
  scene.add(fireBase);

  // Fireplace Hearth step
  const hearthStep = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.18, 1.2),
    new THREE.MeshStandardMaterial({ color: '#3a2b25', roughness: 0.7 })
  );
  hearthStep.position.set(-10, 0.09, -7.1);
  scene.add(hearthStep);

  // Fireplace Chamber opening (black interior)
  const fireOpening = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1.6, 0.5),
    new THREE.MeshBasicMaterial({ color: '#0a0807' })
  );
  fireOpening.position.set(-10, 1.0, -7.3);
  scene.add(fireOpening);

  // Glowing Embers & Log
  const fireLog = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 1.2, 8),
    new THREE.MeshStandardMaterial({
      color: '#ff5722',
      emissive: '#d84315',
      emissiveIntensity: 0.8,
    })
  );
  fireLog.rotation.z = Math.PI / 2;
  fireLog.position.set(-10, 0.35, -7.2);
  scene.add(fireLog);

  // Cozy Hearth Light (warm flickering fire glow)
  const fireLight = new THREE.PointLight('#ff7043', 2.0, 9);
  fireLight.position.set(-10, 0.8, -6.8);
  fireLight.name = 'fireLight';
  scene.add(fireLight);

  // Heavy Timber Mantelpiece
  const mantel = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 0.9), craftsmanTrimMat);
  mantel.position.set(-10, 2.7, -7.4);
  scene.add(mantel);

  // Clock & ceramic vases on mantel
  const vase1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.16, 0.45, 12),
    new THREE.MeshStandardMaterial({ color: '#788a68', roughness: 0.4 })
  );
  vase1.position.set(-10.8, 3.03, -7.4);
  scene.add(vase1);

  // --- Mid-Century Tailored Sofa ---
  const sofaMat = new THREE.MeshStandardMaterial({ color: '#4a5b44', roughness: 0.85 }); // Moss green vintage velvet
  const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.5, 1.8), sofaMat);
  sofaBase.position.set(-10, 0.35, -2.8);
  sofaBase.castShadow = true;
  scene.add(sofaBase);

  const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.8, 0.45), sofaMat);
  sofaBack.position.set(-10, 0.85, -3.5);
  sofaBack.castShadow = true;
  scene.add(sofaBack);

  const sofaArmL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.65, 1.8), sofaMat);
  sofaArmL.position.set(-12.1, 0.7, -2.8);
  scene.add(sofaArmL);

  const sofaArmR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.65, 1.8), sofaMat);
  sofaArmR.position.set(-7.9, 0.7, -2.8);
  scene.add(sofaArmR);

  // Cushions
  [-1.1, 0, 1.1].forEach((cx) => {
    const cushion = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.18, 1.2),
      new THREE.MeshStandardMaterial({ color: '#7a8c6e', roughness: 0.8 })
    );
    cushion.position.set(-10 + cx, 0.65, -2.7);
    scene.add(cushion);
  });

  // --- Danish Modern Coffee Table ---
  const tableMat = new THREE.MeshStandardMaterial({ color: '#5c381e', roughness: 0.4 });
  const coffeeTable = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 1.4), tableMat);
  coffeeTable.position.set(-10, 0.45, -0.6);
  coffeeTable.castShadow = true;
  scene.add(coffeeTable);

  // Tapered table legs
  [[-1.1, -0.5], [1.1, -0.5], [-1.1, 0.5], [1.1, 0.5]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.02, 0.45),
      craftsmanTrimMat
    );
    leg.position.set(-10 + lx, 0.225, -0.6 + lz);
    scene.add(leg);
  });

  // Mugs & vinyl sleeve on coffee table
  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.07, 0.14, 12),
    new THREE.MeshStandardMaterial({ color: '#d8c4a0', roughness: 0.3 })
  );
  mug.position.set(-9.7, 0.57, -0.5);
  scene.add(mug);

  // --- Mid-century Vinyl Credenza & Turntable ---
  const credenza = new THREE.Mesh(
    new THREE.BoxGeometry(3.0, 0.9, 0.9),
    new THREE.MeshStandardMaterial({ color: '#3d2516', roughness: 0.5 })
  );
  credenza.position.set(-14.1, 0.55, 2.5);
  credenza.castShadow = true;
  scene.add(credenza);

  // Turntable on credenza
  const turntableBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.1, 0.7),
    new THREE.MeshStandardMaterial({ color: '#1a1816', roughness: 0.2 })
  );
  turntableBase.position.set(-14.1, 1.05, 2.5);
  turntableBase.userData = { actionTag: 'play_synth' };
  scene.add(turntableBase);

  const platter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, 0.03, 24),
    new THREE.MeshStandardMaterial({ color: '#111111', metalness: 0.6 })
  );
  platter.position.set(-14.1, 1.12, 2.5);
  scene.add(platter);

  // Record sleeves in crate
  const recordCrate = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.4, 0.6),
    new THREE.MeshStandardMaterial({ color: '#684024', roughness: 0.7 })
  );
  recordCrate.position.set(-14.1, 0.55, 0.6);
  scene.add(recordCrate);

  // Potted Fiddle Leaf Fig Plant
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.28, 0.65, 16),
    new THREE.MeshStandardMaterial({ color: '#9e5638', roughness: 0.9 })
  );
  pot.position.set(-14.0, 0.35, -5.8);
  scene.add(pot);

  const plantStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 1.6),
    new THREE.MeshStandardMaterial({ color: '#2e3a1f' })
  );
  plantStem.position.set(-14.0, 1.2, -5.8);
  scene.add(plantStem);

  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      new THREE.MeshStandardMaterial({ color: '#2b5123', roughness: 0.4 })
    );
    leaf.scale.set(1.2, 0.1, 0.8);
    leaf.rotation.y = (i * Math.PI) / 3;
    leaf.rotation.z = 0.25;
    leaf.position.set(-14.0, 0.9 + i * 0.2, -5.8);
    scene.add(leaf);
  }

  // Brass Arc Floor Lamp
  const lampPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 2.6),
    new THREE.MeshStandardMaterial({ color: '#b58e3b', metalness: 0.8, roughness: 0.3 })
  );
  lampPole.position.set(-7.5, 1.3, -4.5);
  scene.add(lampPole);

  const lampShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.5, 0.3, 16),
    new THREE.MeshStandardMaterial({ color: '#eae4d3', roughness: 0.5 })
  );
  lampShade.position.set(-7.5, 2.6, -4.5);
  scene.add(lampShade);

  const livingLampLight = new THREE.PointLight('#fef3c7', 1.4, 8);
  livingLampLight.position.set(-7.5, 2.5, -4.5);
  scene.add(livingLampLight);

  // ==================== 6. DINING ROOM CRAFTSMAN DETAILS ====================
  // Solid Oregon Walnut Communal Dining Table
  const diningTable = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.16, 2.2),
    new THREE.MeshStandardMaterial({ color: '#4a2c17', roughness: 0.4 })
  );
  diningTable.position.set(0, 1.1, 0);
  diningTable.castShadow = true;
  diningTable.userData = { actionTag: 'dining_table' };
  scene.add(diningTable);

  // Table trestle legs
  [-1.6, 1.6].forEach((tx) => {
    const trestle = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 1.0, 1.8),
      craftsmanTrimMat
    );
    trestle.position.set(tx, 0.52, 0);
    trestle.castShadow = true;
    scene.add(trestle);
  });

  // Craftsman Wooden Dining Chairs (4 around the table)
  const chairPositions: Array<[number, number, number]> = [
    [-1.2, 0, -1.5],
    [1.2, 0, -1.5],
    [-1.2, Math.PI, 1.5],
    [1.2, Math.PI, 1.5],
  ];

  chairPositions.forEach(([cx, rot, cz]) => {
    const chairGroup = new THREE.Group();
    chairGroup.position.set(cx, 0, cz);
    chairGroup.rotation.y = rot;

    // Seat
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.08, 0.7),
      new THREE.MeshStandardMaterial({ color: '#54331c', roughness: 0.6 })
    );
    seat.position.y = 0.55;
    chairGroup.add(seat);

    // Legs
    [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.025, 0.55),
        craftsmanTrimMat
      );
      leg.position.set(lx, 0.275, lz);
      chairGroup.add(leg);
    });

    // Backrest
    const backPost1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6), craftsmanTrimMat);
    backPost1.position.set(-0.28, 0.85, -0.3);
    chairGroup.add(backPost1);

    const backPost2 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6), craftsmanTrimMat);
    backPost2.position.set(0.28, 0.85, -0.3);
    chairGroup.add(backPost2);

    const backSlat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.16, 0.04), craftsmanTrimMat);
    backSlat.position.set(0, 1.05, -0.3);
    chairGroup.add(backSlat);

    scene.add(chairGroup);
  });

  // Ceramic Teapot & Artisan Mugs on dining table
  const teapot = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    new THREE.MeshStandardMaterial({ color: '#56664d', roughness: 0.4 })
  );
  teapot.position.set(0, 1.32, 0);
  scene.add(teapot);

  [-0.6, 0.6].forEach((mx) => {
    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.06, 0.13, 12),
      new THREE.MeshStandardMaterial({ color: '#c7b299', roughness: 0.5 })
    );
    mug.position.set(mx, 1.25, 0.2);
    scene.add(mug);
  });

  // Acoustic Guitar Leaning against back wall
  const guitarBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 1.0, 0.2),
    new THREE.MeshStandardMaterial({ color: '#a0522d', roughness: 0.35 })
  );
  guitarBody.position.set(-3.2, 0.6, -7.5);
  guitarBody.rotation.z = 0.15;
  guitarBody.userData = { actionTag: 'play_synth' };
  scene.add(guitarBody);

  const guitarNeck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.9),
    new THREE.MeshStandardMaterial({ color: '#2b1b0d' })
  );
  guitarNeck.position.set(-3.35, 1.45, -7.5);
  guitarNeck.rotation.z = 0.15;
  scene.add(guitarNeck);

  // Craftsman Blown-Glass Hanging Chandelier over dining table
  const diningChandelier = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.6, 0.4, 16),
    new THREE.MeshStandardMaterial({
      color: '#fffae0',
      emissive: '#eab308',
      emissiveIntensity: 0.5,
      roughness: 0.2,
    })
  );
  diningChandelier.position.set(0, 3.6, 0);
  scene.add(diningChandelier);

  const chandelierCord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 1.4),
    new THREE.MeshBasicMaterial({ color: '#1e1b18' })
  );
  chandelierCord.position.set(0, 4.3, 0);
  scene.add(chandelierCord);

  // Dining light source
  const diningLight = new THREE.PointLight('#fffbeb', 1.8, 12);
  diningLight.position.set(0, 3.4, 0);
  scene.add(diningLight);

  // ==================== 7. MUSIC PRODUCTION STUDIO DETAILS ====================
  // Solid Walnut 2-Tier Studio Producer Desk
  const deskMain = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.12, 2.0),
    new THREE.MeshStandardMaterial({ color: '#2e1c12', roughness: 0.4 })
  );
  deskMain.position.set(10, 1.05, -3.2);
  deskMain.castShadow = true;
  scene.add(deskMain);

  // Upper monitor & speaker shelf
  const deskShelf = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.08, 0.9),
    new THREE.MeshStandardMaterial({ color: '#382216', roughness: 0.4 })
  );
  deskShelf.position.set(10, 1.35, -3.8);
  deskShelf.castShadow = true;
  scene.add(deskShelf);

  // Desk metal legs
  [-1.9, 1.9].forEach((dx) => {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.05, 1.6),
      new THREE.MeshStandardMaterial({ color: '#171717', metalness: 0.8 })
    );
    leg.position.set(10 + dx, 0.525, -3.2);
    scene.add(leg);
  });

  // Dual Ultra-wide Curved Monitors (Displaying active DAW audio waveforms)
  [-0.9, 0.9].forEach((mx, i) => {
    // Monitor screen frame
    const monitorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.95, 0.06),
      new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.3 })
    );
    monitorFrame.position.set(10 + mx, 1.95, -3.75);
    monitorFrame.rotation.y = i === 0 ? 0.12 : -0.12;
    monitorFrame.userData = { actionTag: 'open_daw' };
    scene.add(monitorFrame);

    // Glowing DAW display
    const screenGeo = new THREE.PlaneGeometry(1.5, 0.85);
    const screenMat = new THREE.MeshStandardMaterial({
      color: i === 0 ? '#1e3a5f' : '#2d1c3a',
      emissive: i === 0 ? '#0284c7' : '#9333ea',
      emissiveIntensity: 0.55,
      roughness: 0.2,
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(10 + mx, 1.95, -3.71);
    screen.rotation.y = i === 0 ? 0.12 : -0.12;
    screen.userData = { actionTag: 'open_daw' };
    scene.add(screen);
  });

  // Yamaha HS-style Studio Monitors (Speakers with white cones)
  [-1.8, 1.8].forEach((sx, i) => {
    const speaker = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.85, 0.5),
      new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.4 })
    );
    speaker.position.set(10 + sx, 1.8, -3.7);
    speaker.rotation.y = i === 0 ? 0.25 : -0.25;
    scene.add(speaker);

    // White woofer cone
    const cone = new THREE.Mesh(
      new THREE.CircleGeometry(0.14, 16),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 })
    );
    cone.position.set(10 + sx + (i === 0 ? 0.03 : -0.03), 1.68, -3.44);
    cone.rotation.y = i === 0 ? 0.25 : -0.25;
    scene.add(cone);
  });

  // Vintage Analog Synthesizer (Minimoog / Prophet style with wood end-cheeks)
  const synthGroup = new THREE.Group();
  synthGroup.position.set(10, 1.15, -2.4);
  synthGroup.userData = { actionTag: 'play_synth' };

  // Main metal chassis
  const synthChassis = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.14, 0.85),
    new THREE.MeshStandardMaterial({ color: '#27272a', metalness: 0.5, roughness: 0.4 })
  );
  synthGroup.add(synthChassis);

  // Walnut wood end cheeks
  [-1.22, 1.22].forEach((wx) => {
    const cheek = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.2, 0.88),
      new THREE.MeshStandardMaterial({ color: '#5c381e', roughness: 0.4 })
    );
    cheek.position.set(wx, 0.03, 0);
    synthGroup.add(cheek);
  });

  // Keyboard Keys (White & Black keys)
  const keyBed = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.04, 0.35),
    new THREE.MeshStandardMaterial({ color: '#fdfbf7', roughness: 0.2 })
  );
  keyBed.position.set(0, 0.08, 0.2);
  synthGroup.add(keyBed);

  // Knobs panel
  const synthFace = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.05, 0.38),
    new THREE.MeshStandardMaterial({ color: '#18181b', metalness: 0.7 })
  );
  synthFace.position.set(0, 0.09, -0.18);
  synthGroup.add(synthFace);

  scene.add(synthGroup);

  // Upright Polished Wood Piano against Studio Wall
  const piano = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 2.2, 2.8),
    new THREE.MeshStandardMaterial({ color: '#31180d', roughness: 0.35 })
  );
  piano.position.set(14.2, 1.1, 1.2);
  piano.castShadow = true;
  piano.userData = { actionTag: 'play_synth' };
  scene.add(piano);

  const pianoKeyboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.1, 2.4),
    new THREE.MeshStandardMaterial({ color: '#f8fafc' })
  );
  pianoKeyboard.position.set(13.4, 1.0, 1.2);
  scene.add(pianoKeyboard);

  // Boom Microphone Stand & Neumann-style Condenser Mic
  const micPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 1.8),
    new THREE.MeshStandardMaterial({ color: '#09090b', metalness: 0.9 })
  );
  micPole.position.set(7.6, 0.9, 0.6);
  scene.add(micPole);

  const micBoom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.9),
    new THREE.MeshStandardMaterial({ color: '#09090b', metalness: 0.9 })
  );
  micBoom.rotation.z = Math.PI / 4;
  micBoom.position.set(7.9, 1.95, 0.6);
  scene.add(micBoom);

  const micHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.22, 16),
    new THREE.MeshStandardMaterial({ color: '#c0c0c0', metalness: 0.95, roughness: 0.2 })
  );
  micHead.position.set(8.2, 2.2, 0.6);
  scene.add(micHead);

  // Acoustic Wood Slat Diffusers on Studio Back Wall
  for (let s = 0; s < 10; s++) {
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 3.6, 0.06),
      craftsmanTrimMat
    );
    slat.position.set(7.5 + s * 0.55, 2.2, -7.75);
    scene.add(slat);
  }

  // Corner Bass Trap
  const bassTrap = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 4.4, 0.8),
    new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.95 })
  );
  bassTrap.position.set(14.5, 2.2, -7.5);
  scene.add(bassTrap);

  // Studio Warm Ambient Light & Track Glow
  const studioLight = new THREE.PointLight('#f59e0b', 1.8, 12);
  studioLight.position.set(10, 3.6, -1.5);
  scene.add(studioLight);

  const studioAccentLight = new THREE.PointLight('#38bdf8', 1.2, 8);
  studioAccentLight.position.set(12, 2.2, -3.2);
  scene.add(studioAccentLight);

  // ==================== 8. AUTHENTIC ACOUSTIC LUDWIG DRUM KIT ====================
  // Located at x: 7.2, z: -5.8
  const drumKitGroup = new THREE.Group();
  drumKitGroup.position.set(7.2, 0, -5.8);
  drumKitGroup.userData = { actionTag: 'play_acoustic_drums' };

  const chromeMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', metalness: 0.95, roughness: 0.1 });
  const drumShellMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.35 }); // Warm Vintage Mahogany
  const drumHeadMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 });
  const cymbalBrassMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.9, roughness: 0.2 });

  // 1. Bass / Kick Drum (22" diameter, resting on angle with chrome legs)
  const bassDrum = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.56, 24),
    drumShellMat
  );
  bassDrum.rotation.x = Math.PI / 2;
  bassDrum.position.set(0, 0.58, 0);
  bassDrum.castShadow = true;
  drumKitGroup.add(bassDrum);

  // Front & Back Chrome Rims
  [-0.28, 0.28].forEach((rz) => {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.022, 8, 24), chromeMat);
    rim.position.set(0, 0.58, rz);
    drumKitGroup.add(rim);

    const head = new THREE.Mesh(new THREE.CircleGeometry(0.54, 24), drumHeadMat);
    head.position.set(0, 0.58, rz + (rz > 0 ? 0.005 : -0.005));
    if (rz < 0) head.rotation.y = Math.PI;
    drumKitGroup.add(head);
  });

  // Bass Drum Chrome Spurs (Legs)
  [-0.48, 0.48].forEach((lx) => {
    const spur = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45), chromeMat);
    spur.position.set(lx, 0.25, 0.18);
    spur.rotation.z = lx > 0 ? -0.45 : 0.45;
    drumKitGroup.add(spur);
  });

  // Kick Pedal with Felt Beater
  const kickPedal = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.28), chromeMat);
  kickPedal.position.set(0, 0.03, 0.42);
  drumKitGroup.add(kickPedal);

  // 2. Snare Drum on Chrome Basket Stand (x: -0.48, z: 0.5)
  const snareStandPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7), chromeMat);
  snareStandPole.position.set(-0.48, 0.35, 0.5);
  drumKitGroup.add(snareStandPole);

  const snare = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 20), drumShellMat);
  snare.position.set(-0.48, 0.76, 0.5);
  snare.castShadow = true;
  drumKitGroup.add(snare);

  const snareRim = new THREE.Mesh(new THREE.TorusGeometry(0.305, 0.016, 8, 20), chromeMat);
  snareRim.rotation.x = Math.PI / 2;
  snareRim.position.set(-0.48, 0.87, 0.5);
  drumKitGroup.add(snareRim);

  const snareHead = new THREE.Mesh(new THREE.CircleGeometry(0.295, 20), drumHeadMat);
  snareHead.rotation.x = -Math.PI / 2;
  snareHead.position.set(-0.48, 0.875, 0.5);
  drumKitGroup.add(snareHead);

  // 3. High & Mid Rack Toms (Mounted on bass drum)
  [-0.22, 0.24].forEach((tx, i) => {
    const tomMount = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.28), chromeMat);
    tomMount.position.set(tx * 0.7, 1.16, 0.05);
    drumKitGroup.add(tomMount);

    const rad = i === 0 ? 0.24 : 0.26;
    const tom = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, 0.24, 18), drumShellMat);
    tom.position.set(tx, 1.28, 0.1);
    tom.rotation.x = 0.25;
    tom.rotation.z = i === 0 ? 0.15 : -0.15;
    drumKitGroup.add(tom);

    const tomHead = new THREE.Mesh(new THREE.CircleGeometry(rad - 0.01, 18), drumHeadMat);
    tomHead.rotation.x = -Math.PI / 2 + 0.25;
    tomHead.position.set(tx, 1.4, 0.1);
    drumKitGroup.add(tomHead);
  });

  // 4. Floor Tom (Deep drum on 3 chrome legs at x: 0.65, z: 0.45)
  const floorTom = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.44, 20), drumShellMat);
  floorTom.position.set(0.65, 0.62, 0.45);
  drumKitGroup.add(floorTom);

  const floorHead = new THREE.Mesh(new THREE.CircleGeometry(0.35, 20), drumHeadMat);
  floorHead.rotation.x = -Math.PI / 2;
  floorHead.position.set(0.65, 0.845, 0.45);
  drumKitGroup.add(floorHead);

  [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].forEach((ang) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.68), chromeMat);
    leg.position.set(0.65 + Math.cos(ang) * 0.38, 0.34, 0.45 + Math.sin(ang) * 0.38);
    drumKitGroup.add(leg);
  });

  // 5. Hi-Hat Stand & Brass Cymbals (x: -0.9, z: 0.4)
  const hihatPole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.15), chromeMat);
  hihatPole.position.set(-0.9, 0.58, 0.4);
  drumKitGroup.add(hihatPole);

  const hihatBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.01, 0.03, 20), cymbalBrassMat);
  hihatBottom.position.set(-0.9, 0.98, 0.4);
  drumKitGroup.add(hihatBottom);

  const hihatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.01, 0.03, 20), cymbalBrassMat);
  hihatTop.position.set(-0.9, 1.01, 0.4);
  drumKitGroup.add(hihatTop);

  // 6. Crash Cymbal & Boom Stand (x: -0.85, z: -0.35)
  const crashPole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.45), chromeMat);
  crashPole.position.set(-0.85, 0.72, -0.35);
  drumKitGroup.add(crashPole);

  const crashBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.45), chromeMat);
  crashBoom.position.set(-0.75, 1.5, -0.25);
  crashBoom.rotation.z = -0.4;
  drumKitGroup.add(crashBoom);

  const crashCymbal = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.01, 0.03, 22), cymbalBrassMat);
  crashCymbal.position.set(-0.65, 1.62, -0.2);
  crashCymbal.rotation.z = -0.18;
  drumKitGroup.add(crashCymbal);

  // 7. Ride Cymbal & Boom Stand (x: 0.85, z: -0.15)
  const ridePole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.35), chromeMat);
  ridePole.position.set(0.85, 0.68, -0.15);
  drumKitGroup.add(ridePole);

  const rideCymbal = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.01, 0.035, 24), cymbalBrassMat);
  rideCymbal.position.set(0.72, 1.45, -0.05);
  rideCymbal.rotation.z = 0.22;
  drumKitGroup.add(rideCymbal);

  // 8. Round Padded Drum Throne Stool (z: 1.0, right where the drummer sits)
  const thronePole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.48), chromeMat);
  thronePole.position.set(0, 0.24, 1.0);
  drumKitGroup.add(thronePole);

  const throneSeat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.12, 18),
    new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.85 })
  );
  throneSeat.position.set(0, 0.54, 1.0);
  throneSeat.castShadow = true;
  drumKitGroup.add(throneSeat);

  scene.add(drumKitGroup);

  // ==================== 9. ELECTRONIC DRUM / DJ RIG ====================
  // Located at x: 13.2, z: -5.8
  const edrumGroup = new THREE.Group();
  edrumGroup.position.set(13.2, 0, -5.8);
  edrumGroup.userData = { actionTag: 'play_electronic_drums' };

  const rackMat = new THREE.MeshStandardMaterial({ color: '#171717', metalness: 0.8, roughness: 0.3 });
  const meshPadMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.5 }); // White mesh head
  const padRimMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.3 });
  const rubberCymbalMat = new THREE.MeshStandardMaterial({ color: '#262626', roughness: 0.7 });

  // Curved Aluminum Rack Posts
  [-0.75, 0.75].forEach((rx) => {
    const vPost = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 1.1), rackMat);
    vPost.position.set(rx, 0.55, 0);
    edrumGroup.add(vPost);

    const legFoot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.55), rackMat);
    legFoot.position.set(rx, 0.02, 0);
    edrumGroup.add(legFoot);
  });

  // Cross Bars
  const crossBar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.5), rackMat);
  crossBar.rotation.z = Math.PI / 2;
  crossBar.position.set(0, 0.88, 0);
  edrumGroup.add(crossBar);

  // Snare Trigger Pad (Center-Left)
  const snarePadGroup = new THREE.Group();
  snarePadGroup.position.set(-0.35, 0.78, 0.45);
  const snarePadRim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 18), padRimMat);
  snarePadGroup.add(snarePadRim);
  const snarePadMesh = new THREE.Mesh(new THREE.CircleGeometry(0.19, 18), meshPadMat);
  snarePadMesh.rotation.x = -Math.PI / 2;
  snarePadMesh.position.y = 0.042;
  snarePadGroup.add(snarePadMesh);
  edrumGroup.add(snarePadGroup);

  // 3 Tom Trigger Pads
  [-0.35, 0.35, 0.65].forEach((tx, i) => {
    const tomGroup = new THREE.Group();
    tomGroup.position.set(tx, i === 2 ? 0.68 : 1.15, i === 2 ? 0.42 : 0.08);
    tomGroup.rotation.x = i === 2 ? 0.1 : 0.35;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.07, 16), padRimMat);
    tomGroup.add(rim);
    const head = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), meshPadMat);
    head.rotation.x = -Math.PI / 2;
    head.position.y = 0.038;
    tomGroup.add(head);
    edrumGroup.add(tomGroup);
  });

  // Rubber Cymbal Trigger Pads (Hi-Hat & Crash/Ride)
  [-0.68, 0.68].forEach((cx, i) => {
    const cymbalArm = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.45), rackMat);
    cymbalArm.position.set(cx, 1.25, 0);
    cymbalArm.rotation.z = i === 0 ? 0.3 : -0.3;
    edrumGroup.add(cymbalArm);

    const cymbal = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.01, 0.025, 18), rubberCymbalMat);
    cymbal.position.set(cx + (i === 0 ? -0.08 : 0.08), 1.45, 0.12);
    cymbal.rotation.x = 0.25;
    edrumGroup.add(cymbal);
  });

  // Sound Module Brain / DJ Controller Console with Glowing Display
  const brainModule = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.12, 0.32),
    new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.3 })
  );
  brainModule.position.set(-0.72, 1.05, 0.2);
  brainModule.rotation.x = 0.45;
  edrumGroup.add(brainModule);

  const brainScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 0.14),
    new THREE.MeshStandardMaterial({
      color: '#0284c7',
      emissive: '#38bdf8',
      emissiveIntensity: 0.9,
      roughness: 0.2,
    })
  );
  brainScreen.position.set(-0.72, 1.11, 0.25);
  brainScreen.rotation.x = -Math.PI / 2 + 0.45;
  edrumGroup.add(brainScreen);

  // Dual DJ Platters / Jog Wheels integrated next to sound module
  [-0.08, 0.08].forEach((px) => {
    const platter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.015, 16),
      new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.85 })
    );
    platter.position.set(-0.72 + px, 1.08, 0.14);
    platter.rotation.x = 0.45;
    edrumGroup.add(platter);
  });

  // Electronic Drum Throne (seat for drummer)
  const eThrone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.1, 16),
    new THREE.MeshStandardMaterial({ color: '#27272a', roughness: 0.8 })
  );
  eThrone.position.set(0, 0.54, 1.0);
  eThrone.castShadow = true;
  edrumGroup.add(eThrone);

  const eThronePole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.48), rackMat);
  eThronePole.position.set(0, 0.24, 1.0);
  edrumGroup.add(eThronePole);

  scene.add(edrumGroup);

  // ==================== 10. CRAFTSMAN GUITAR ON FLOOR STAND ====================
  // Located at x: 6.2, z: -2.8 (Studio doorway corner)
  const guitarStandGroup = new THREE.Group();
  guitarStandGroup.position.set(6.2, 0, -2.8);
  guitarStandGroup.rotation.y = Math.PI / 4;
  guitarStandGroup.userData = { actionTag: 'playing_guitar' };

  // Tubular A-Frame Metal Stand
  const standMat = new THREE.MeshStandardMaterial({ color: '#262626', roughness: 0.4 });
  const standBase = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.018, 6, 16, Math.PI), standMat);
  standBase.rotation.x = Math.PI / 2;
  standBase.position.set(0, 0.03, 0);
  guitarStandGroup.add(standBase);

  const standStem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.75), standMat);
  standStem.position.set(0, 0.38, -0.05);
  guitarStandGroup.add(standStem);

  // Sunburst Acoustic Dreadnought Guitar
  const standGuitar = new THREE.Group();
  standGuitar.position.set(0, 0.28, 0.02);
  standGuitar.rotation.x = -0.18;

  // Guitar Lower Bout & Upper Bout
  const lowerBout = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, 0.12, 16),
    new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.35 })
  );
  lowerBout.rotation.x = Math.PI / 2;
  lowerBout.position.set(0, 0.22, 0);
  lowerBout.scale.set(1.0, 1.15, 1.0);
  standGuitar.add(lowerBout);

  const upperBout = new THREE.Mesh(
    new THREE.CylinderGeometry(0.21, 0.21, 0.11, 16),
    new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.35 })
  );
  upperBout.rotation.x = Math.PI / 2;
  upperBout.position.set(0, 0.54, 0);
  standGuitar.add(upperBout);

  // Rosette & Soundhole
  const soundHole = new THREE.Mesh(
    new THREE.CircleGeometry(0.065, 16),
    new THREE.MeshBasicMaterial({ color: '#171717' })
  );
  soundHole.position.set(0, 0.48, 0.062);
  standGuitar.add(soundHole);

  // Guitar Neck & Fretboard
  const gNeck = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.58, 0.04),
    new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.5 })
  );
  gNeck.position.set(0, 0.95, 0.01);
  standGuitar.add(gNeck);

  // Headstock with Tuning Pegs
  const gHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.16, 0.035),
    new THREE.MeshStandardMaterial({ color: '#78350f' })
  );
  gHead.position.set(0, 1.3, 0.02);
  gHead.rotation.x = -0.15;
  standGuitar.add(gHead);

  guitarStandGroup.add(standGuitar);
  scene.add(guitarStandGroup);
}
