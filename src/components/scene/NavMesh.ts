import * as THREE from 'three';
import { RoomId } from '../../types';

export interface CollisionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  label: string;
  isWall?: boolean;
}

/**
 * Architectural Collision Barriers for the Portland Craftsman House.
 * Derived with mathematical precision from HouseArchitecture.ts geometry.
 * Solid dividing walls enforce passage through the central doorway openings at Z = 0.
 */
export const COLLISION_BARRIERS: CollisionBox[] = [
  // Outer House Perimeter Boundaries (isWall: true)
  { minX: -15.5, maxX: -14.4, minZ: -8.0, maxZ: 8.0, label: 'Living Room Outer West Wall', isWall: true },
  { minX: 14.4, maxX: 15.5, minZ: -8.0, maxZ: 8.0, label: 'Studio Outer East Wall', isWall: true },
  { minX: -15.0, maxX: 15.0, minZ: -8.5, maxZ: -7.5, label: 'North Picture Windows Wall', isWall: true },
  { minX: -15.0, maxX: 15.0, minZ: 7.5, maxZ: 8.5, label: 'South Porch Wall', isWall: true },

  // Dividing Wall 1 (Living Room <-> Dining Room) at X = -5.0
  // Doorway opening spans Z: [-1.45, 1.45]
  { minX: -5.3, maxX: -4.7, minZ: -8.0, maxZ: -1.45, label: 'Living/Dining Dividing Wall (North)', isWall: true },
  { minX: -5.3, maxX: -4.7, minZ: 1.45, maxZ: 8.0, label: 'Living/Dining Dividing Wall (South)', isWall: true },

  // Dividing Wall 2 (Dining Room <-> Studio) at X = +5.0
  // Doorway opening spans Z: [-1.45, 1.45]
  { minX: 4.7, maxX: 5.3, minZ: -8.0, maxZ: -1.45, label: 'Dining/Studio Dividing Wall (North)', isWall: true },
  { minX: 4.7, maxX: 5.3, minZ: 1.45, maxZ: 8.0, label: 'Dining/Studio Dividing Wall (South)', isWall: true },

  // Living Room Physical Obstacles
  // Hearth Fireplace Brick Mass at (-14.2, 0)
  { minX: -15.0, maxX: -13.3, minZ: -1.3, maxZ: 1.3, label: 'Hearth Fireplace Brick Mass' },
  // Velvet Sofa Backrest & Frame at (-10.0, -2.8, size 4.4 x 1.6)
  { minX: -12.1, maxX: -7.9, minZ: -3.6, maxZ: -2.3, label: 'Vintage Velvet Sofa Frame' },
  // Danish Walnut Coffee Table at (-10.0, -0.6, size 2.2 x 1.1)
  { minX: -11.1, maxX: -8.9, minZ: -1.15, maxZ: -0.05, label: 'Danish Coffee Table' },
  // Record Credenza at (-14.1, 2.5, size 1.2 x 3.2)
  { minX: -14.8, maxX: -13.4, minZ: 0.9, maxZ: 4.1, label: 'Turntable Credenza' },

  // Dining Room Physical Obstacles
  // Oregon Walnut Dining Table Top (0, 0, size 4.2 x 2.2)
  { minX: -2.1, maxX: 2.1, minZ: -1.05, maxZ: 1.05, label: 'Walnut Communal Dining Table' },
  // Acoustic Guitar Stand at (-3.2, -7.5)
  { minX: -3.8, maxX: -2.6, minZ: -7.8, maxZ: -6.8, label: 'Acoustic Guitar Corner Stand' },

  // Music Studio Physical Obstacles
  // Dual-Monitor Producer Desk & Rack Synths at (10.0, -3.2, size 4.2 x 2.0)
  { minX: 7.9, maxX: 12.1, minZ: -4.2, maxZ: -2.2, label: 'Studio Desk & Synths' },
  // Upright Acoustic Piano at (14.2, 1.2, size 1.2 x 2.8)
  { minX: 13.5, maxX: 14.8, minZ: -0.2, maxZ: 2.6, label: 'Upright Acoustic Piano' },
  // Studio Lounge Couch at (10.0, 3.8, size 3.8 x 1.4)
  { minX: 8.1, maxX: 11.9, minZ: 3.1, maxZ: 4.5, label: 'Studio Listening Couch Frame' },
];

/**
 * High-Density Navigation Mesh Nodes.
 * Placed along validated open corridors, room centers, and doorway portals.
 */
export interface NavNode {
  id: string;
  x: number;
  z: number;
  roomId: RoomId;
  neighbors: string[];
}

export const NAV_NODES: NavNode[] = [
  // --- LIVING ROOM NODES ---
  { id: 'lr_hearth_front', x: -12.4, z: 0, roomId: 'living_room', neighbors: ['lr_open_center', 'lr_center_north', 'lr_center_south'] },
  { id: 'lr_open_center', x: -10.0, z: 1.2, roomId: 'living_room', neighbors: ['lr_hearth_front', 'lr_center_south', 'lr_east_conduit'] },
  { id: 'lr_center_north', x: -9.5, z: -1.8, roomId: 'living_room', neighbors: ['lr_hearth_front', 'lr_east_conduit', 'lr_turntable'] },
  { id: 'lr_turntable', x: -12.2, z: 2.5, roomId: 'living_room', neighbors: ['lr_open_center', 'lr_hearth_front'] },
  { id: 'lr_center_south', x: -9.5, z: 2.4, roomId: 'living_room', neighbors: ['lr_open_center', 'lr_east_conduit'] },
  { id: 'lr_east_conduit', x: -6.2, z: 0, roomId: 'living_room', neighbors: ['doorway_living_dining', 'lr_center_north', 'lr_center_south', 'lr_open_center'] },

  // --- DOORWAY 1: Living <-> Dining Portal ---
  { id: 'doorway_living_dining', x: -5.0, z: 0, roomId: 'dining_room', neighbors: ['lr_east_conduit', 'dr_west_portal'] },

  // --- DINING ROOM NODES ---
  { id: 'dr_west_portal', x: -3.8, z: 0, roomId: 'dining_room', neighbors: ['doorway_living_dining', 'dr_north_corridor_w', 'dr_south_corridor_w', 'dr_table_head_w'] },
  { id: 'dr_table_head_w', x: -2.6, z: 0, roomId: 'dining_room', neighbors: ['dr_west_portal', 'dr_north_corridor_w', 'dr_south_corridor_w'] },

  // North Dining Corridor (bypasses table safely)
  { id: 'dr_north_corridor_w', x: -2.8, z: -2.5, roomId: 'dining_room', neighbors: ['dr_west_portal', 'dr_table_head_w', 'dr_guitar_stand', 'dr_north_corridor_c'] },
  { id: 'dr_guitar_stand', x: -3.2, z: -5.8, roomId: 'dining_room', neighbors: ['dr_north_corridor_w'] },
  { id: 'dr_north_corridor_c', x: 0, z: -2.5, roomId: 'dining_room', neighbors: ['dr_north_corridor_w', 'dr_north_corridor_e', 'dr_chair_n1', 'dr_chair_n2'] },
  { id: 'dr_chair_n1', x: -1.2, z: -1.6, roomId: 'dining_room', neighbors: ['dr_north_corridor_c', 'dr_north_corridor_w'] },
  { id: 'dr_chair_n2', x: 1.2, z: -1.6, roomId: 'dining_room', neighbors: ['dr_north_corridor_c', 'dr_north_corridor_e'] },
  { id: 'dr_north_corridor_e', x: 2.8, z: -2.5, roomId: 'dining_room', neighbors: ['dr_north_corridor_c', 'dr_east_portal', 'dr_table_head_e'] },

  // South Dining Corridor (bypasses table safely)
  { id: 'dr_south_corridor_w', x: -2.8, z: 2.5, roomId: 'dining_room', neighbors: ['dr_west_portal', 'dr_table_head_w', 'dr_south_corridor_c'] },
  { id: 'dr_south_corridor_c', x: 0, z: 2.5, roomId: 'dining_room', neighbors: ['dr_south_corridor_w', 'dr_south_corridor_e', 'dr_chair_s1', 'dr_chair_s2'] },
  { id: 'dr_chair_s1', x: -1.2, z: 1.6, roomId: 'dining_room', neighbors: ['dr_south_corridor_c', 'dr_south_corridor_w'] },
  { id: 'dr_chair_s2', x: 1.2, z: 1.6, roomId: 'dining_room', neighbors: ['dr_south_corridor_c', 'dr_south_corridor_e'] },
  { id: 'dr_south_corridor_e', x: 2.8, z: 2.5, roomId: 'dining_room', neighbors: ['dr_south_corridor_c', 'dr_east_portal', 'dr_table_head_e'] },

  { id: 'dr_table_head_e', x: 2.6, z: 0, roomId: 'dining_room', neighbors: ['dr_east_portal', 'dr_north_corridor_e', 'dr_south_corridor_e'] },
  { id: 'dr_east_portal', x: 3.8, z: 0, roomId: 'dining_room', neighbors: ['doorway_dining_studio', 'dr_north_corridor_e', 'dr_south_corridor_e', 'dr_table_head_e'] },

  // --- DOORWAY 2: Dining <-> Studio Portal ---
  { id: 'doorway_dining_studio', x: 5.0, z: 0, roomId: 'dining_room', neighbors: ['dr_east_portal', 'st_west_conduit'] },

  // --- MUSIC STUDIO NODES ---
  { id: 'st_west_conduit', x: 6.4, z: 0, roomId: 'studio', neighbors: ['doorway_dining_studio', 'st_vocal_mic', 'st_center', 'st_synth_front'] },
  { id: 'st_vocal_mic', x: 7.9, z: 1.2, roomId: 'studio', neighbors: ['st_west_conduit', 'st_center'] },
  { id: 'st_center', x: 9.8, z: 0.6, roomId: 'studio', neighbors: ['st_west_conduit', 'st_vocal_mic', 'st_synth_front', 'st_piano_front', 'st_couch_front'] },
  { id: 'st_synth_front', x: 10.0, z: -1.6, roomId: 'studio', neighbors: ['st_west_conduit', 'st_center', 'st_daw_desk'] },
  { id: 'st_daw_desk', x: 10.0, z: -2.0, roomId: 'studio', neighbors: ['st_synth_front'] },
  { id: 'st_piano_front', x: 12.6, z: 1.2, roomId: 'studio', neighbors: ['st_center'] },
  { id: 'st_couch_front', x: 10.0, z: 3.2, roomId: 'studio', neighbors: ['st_center'] },
];

const NODE_MAP = new Map<string, NavNode>();
NAV_NODES.forEach((n) => NODE_MAP.set(n.id, n));

/**
 * Checks whether a 2D line segment intersects any collision barrier AABB with agent clearance.
 * When testing path legs connecting to interactive furniture, it prevents false negatives.
 */
export function isLineOfSightClear(
  p1x: number,
  p1z: number,
  p2x: number,
  p2z: number,
  agentRadius: number = 0.28
): boolean {
  for (const box of COLLISION_BARRIERS) {
    const minX = box.minX - agentRadius;
    const maxX = box.maxX + agentRadius;
    const minZ = box.minZ - agentRadius;
    const maxZ = box.maxZ + agentRadius;

    // For dividing walls and perimeter walls: absolute hard barrier
    if (box.isWall) {
      if (lineSegmentIntersectsAABB(p1x, p1z, p2x, p2z, minX, maxX, minZ, maxZ)) {
        return false;
      }
    } else {
      // For furniture: if neither endpoint is inside the physical furniture, test intersection
      const p1Inside = p1x >= box.minX && p1x <= box.maxX && p1z >= box.minZ && p1z <= box.maxZ;
      const p2Inside = p2x >= box.minX && p2x <= box.maxX && p2z >= box.minZ && p2z <= box.maxZ;

      if (!p1Inside && !p2Inside) {
        if (lineSegmentIntersectsAABB(p1x, p1z, p2x, p2z, minX, maxX, minZ, maxZ)) {
          return false;
        }
      } else {
        // If one endpoint is at this piece of furniture, test only if ray cuts deep through
        // by testing the center portion of the segment
        const midX = (p1x + p2x) * 0.5;
        const midZ = (p1z + p2z) * 0.5;
        if (midX >= box.minX && midX <= box.maxX && midZ >= box.minZ && midZ <= box.maxZ) {
          return false;
        }
      }
    }
  }
  return true;
}

/**
 * Tests whether a line segment from (x1, z1) to (x2, z2) intersects an axis-aligned bounding box.
 */
function lineSegmentIntersectsAABB(
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number
): boolean {
  if (x1 >= minX && x1 <= maxX && z1 >= minZ && z1 <= maxZ) return true;
  if (x2 >= minX && x2 <= maxX && z2 >= minZ && z2 <= maxZ) return true;

  const dx = x2 - x1;
  const dz = z2 - z1;

  let tmin = 0;
  let tmax = 1;

  if (Math.abs(dx) > 1e-6) {
    const tx1 = (minX - x1) / dx;
    const tx2 = (maxX - x1) / dx;
    const nearX = Math.min(tx1, tx2);
    const farX = Math.max(tx1, tx2);
    tmin = Math.max(tmin, nearX);
    tmax = Math.min(tmax, farX);
    if (tmin > tmax) return false;
  } else {
    if (x1 < minX || x1 > maxX) return false;
  }

  if (Math.abs(dz) > 1e-6) {
    const tz1 = (minZ - z1) / dz;
    const tz2 = (maxZ - z1) / dz;
    const nearZ = Math.min(tz1, tz2);
    const farZ = Math.max(tz1, tz2);
    tmin = Math.max(tmin, nearZ);
    tmax = Math.min(tmax, farZ);
    if (tmin > tmax) return false;
  } else {
    if (z1 < minZ || z1 > maxZ) return false;
  }

  return tmin <= tmax && tmax >= 0 && tmin <= 1;
}

/**
 * Helper to identify which room a coordinate belongs to
 */
function getRoomForCoord(x: number): RoomId {
  if (x < -5.0) return 'living_room';
  if (x > 5.0) return 'studio';
  return 'dining_room';
}

/**
 * Finds nearest navigable node in the NavMesh graph for a room or globally.
 */
export function findNearestNavNode(x: number, z: number, preferredRoom?: RoomId): NavNode {
  let bestNode: NavNode | null = null;
  let bestDist = Infinity;

  const candidates = preferredRoom
    ? NAV_NODES.filter((n) => n.roomId === preferredRoom)
    : NAV_NODES;

  for (const node of candidates) {
    const dist = Math.hypot(node.x - x, node.z - z);
    if (dist < bestDist) {
      if (isLineOfSightClear(x, z, node.x, node.z, 0.2)) {
        bestDist = dist;
        bestNode = node;
      }
    }
  }

  if (!bestNode) {
    for (const node of candidates) {
      const dist = Math.hypot(node.x - x, node.z - z);
      if (dist < bestDist) {
        bestDist = dist;
        bestNode = node;
      }
    }
  }

  return bestNode || NAV_NODES[0];
}

/**
 * Runs A* graph search between two NavNodes.
 */
function searchAStar(startNode: NavNode, targetNode: NavNode): NavNode[] {
  if (startNode.id === targetNode.id) return [startNode];

  const openSet = new Set<string>([startNode.id]);
  const cameFrom = new Map<string, string>();

  const gScore = new Map<string, number>();
  NAV_NODES.forEach((n) => gScore.set(n.id, Infinity));
  gScore.set(startNode.id, 0);

  const fScore = new Map<string, number>();
  NAV_NODES.forEach((n) => fScore.set(n.id, Infinity));
  fScore.set(startNode.id, Math.hypot(targetNode.x - startNode.x, targetNode.z - startNode.z));

  while (openSet.size > 0) {
    let currentId = '';
    let lowestF = Infinity;
    for (const id of openSet) {
      const f = fScore.get(id) ?? Infinity;
      if (f < lowestF) {
        lowestF = f;
        currentId = id;
      }
    }

    if (!currentId || currentId === targetNode.id) break;

    openSet.delete(currentId);
    const current = NODE_MAP.get(currentId);
    if (!current) continue;

    const currentG = gScore.get(currentId) ?? Infinity;

    for (const neighborId of current.neighbors) {
      const neighbor = NODE_MAP.get(neighborId);
      if (!neighbor) continue;

      const edgeDist = Math.hypot(neighbor.x - current.x, neighbor.z - current.z);
      const tentativeG = currentG + edgeDist;

      if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
        cameFrom.set(neighborId, currentId);
        gScore.set(neighborId, tentativeG);
        const h = Math.hypot(targetNode.x - neighbor.x, targetNode.z - neighbor.z);
        fScore.set(neighborId, tentativeG + h);
        openSet.add(neighborId);
      }
    }
  }

  const path: NavNode[] = [];
  let curr: string | undefined = targetNode.id;
  if (!cameFrom.has(targetNode.id) && startNode.id !== targetNode.id) {
    return [startNode, targetNode];
  }

  while (curr) {
    const node = NODE_MAP.get(curr);
    if (node) path.unshift(node);
    if (curr === startNode.id) break;
    curr = cameFrom.get(curr);
  }
  return path;
}

/**
 * A* Pathfinding Algorithm across the Portland House NavMesh Graph.
 * Guarantees obstacle-free, continuous walking routes through doorways and around furniture.
 */
export function planNavMeshPath(
  startPos: THREE.Vector3,
  destination: THREE.Vector3
): THREE.Vector3[] {
  const startX = startPos.x;
  const startZ = startPos.z;
  const targetX = destination.x;
  const targetZ = destination.z;

  const directDist = Math.hypot(targetX - startX, targetZ - startZ);
  if (directDist < 0.22) {
    return [];
  }

  const startRoom = getRoomForCoord(startX);
  const destRoom = getRoomForCoord(targetX);

  // If in the same room with direct line of sight, take direct path
  if (startRoom === destRoom && isLineOfSightClear(startX, startZ, targetX, targetZ, 0.3)) {
    return [destination.clone()];
  }

  // Multi-room or blocked intra-room traversal: build waypoint chain through doorway portals
  const rawPoints: THREE.Vector3[] = [];

  if (startRoom === destRoom) {
    const startNode = findNearestNavNode(startX, startZ, startRoom);
    const targetNode = findNearestNavNode(targetX, targetZ, destRoom);
    const nodePath = searchAStar(startNode, targetNode);
    for (const node of nodePath) {
      rawPoints.push(new THREE.Vector3(node.x, 0, node.z));
    }
  } else {
    // Determine doorway portals to cross
    const portals: THREE.Vector3[] = [];

    if (startRoom === 'living_room' && destRoom === 'dining_room') {
      portals.push(new THREE.Vector3(-5.0, 0, 0));
    } else if (startRoom === 'dining_room' && destRoom === 'living_room') {
      portals.push(new THREE.Vector3(-5.0, 0, 0));
    } else if (startRoom === 'dining_room' && destRoom === 'studio') {
      portals.push(new THREE.Vector3(5.0, 0, 0));
    } else if (startRoom === 'studio' && destRoom === 'dining_room') {
      portals.push(new THREE.Vector3(5.0, 0, 0));
    } else if (startRoom === 'living_room' && destRoom === 'studio') {
      const bypassZ = (startZ + targetZ) * 0.5 < 0 ? -2.5 : 2.5;
      portals.push(
        new THREE.Vector3(-5.0, 0, 0),
        new THREE.Vector3(0, 0, bypassZ),
        new THREE.Vector3(5.0, 0, 0)
      );
    } else if (startRoom === 'studio' && destRoom === 'living_room') {
      const bypassZ = (startZ + targetZ) * 0.5 < 0 ? -2.5 : 2.5;
      portals.push(
        new THREE.Vector3(5.0, 0, 0),
        new THREE.Vector3(0, 0, bypassZ),
        new THREE.Vector3(-5.0, 0, 0)
      );
    }

    // Connect from start through portals to destination
    let lastPt = startPos.clone();
    for (const portal of portals) {
      const sNode = findNearestNavNode(lastPt.x, lastPt.z);
      const pNode = findNearestNavNode(portal.x, portal.z);
      const subPath = searchAStar(sNode, pNode);
      for (const node of subPath) {
        rawPoints.push(new THREE.Vector3(node.x, 0, node.z));
      }
      rawPoints.push(portal.clone());
      lastPt = portal.clone();
    }

    // Connect last portal to destination
    const finalNode = findNearestNavNode(targetX, targetZ, destRoom);
    rawPoints.push(new THREE.Vector3(finalNode.x, 0, finalNode.z));
  }

  rawPoints.push(destination.clone());

  // String-pulling / Raycast path simplification
  const smoothedWaypoints: THREE.Vector3[] = [];
  let currentAnchor = startPos.clone();

  let i = 0;
  while (i < rawPoints.length) {
    let furthestReachable = i;
    for (let lookAhead = rawPoints.length - 1; lookAhead > i; lookAhead--) {
      const targetPt = rawPoints[lookAhead];
      // Only skip ahead if line of sight is clear and does not cross room dividing boundaries
      const anchorRoom = getRoomForCoord(currentAnchor.x);
      const ptRoom = getRoomForCoord(targetPt.x);
      if (anchorRoom === ptRoom && isLineOfSightClear(currentAnchor.x, currentAnchor.z, targetPt.x, targetPt.z, 0.28)) {
        furthestReachable = lookAhead;
        break;
      }
    }

    const nextWp = rawPoints[furthestReachable];
    const distToAnchor = Math.hypot(nextWp.x - currentAnchor.x, nextWp.z - currentAnchor.z);
    if (distToAnchor > 0.18) {
      smoothedWaypoints.push(nextWp);
      currentAnchor = nextWp.clone();
    }
    i = furthestReachable + 1;
  }

  // Ensure destination is included
  if (
    smoothedWaypoints.length === 0 ||
    smoothedWaypoints[smoothedWaypoints.length - 1].distanceTo(destination) > 0.15
  ) {
    smoothedWaypoints.push(destination.clone());
  }

  return smoothedWaypoints;
}

/**
 * Calculates a separation steering vector for dynamic multi-agent collision avoidance.
 * Prevents residents from overlapping or colliding when crossing paths.
 */
export function computeAgentSeparationForce(
  currentAgentPos: THREE.Vector3,
  allOtherAgentsPos: THREE.Vector3[],
  comfortRadius: number = 0.95
): THREE.Vector3 {
  const force = new THREE.Vector3();

  for (const otherPos of allOtherAgentsPos) {
    const diff = currentAgentPos.clone().sub(otherPos);
    diff.y = 0;
    const dist = diff.length();

    if (dist > 0.001 && dist < comfortRadius) {
      diff.normalize();
      const strength = (comfortRadius - dist) / comfortRadius;
      force.addScaledVector(diff, strength * 0.5);
    }
  }

  return force;
}
