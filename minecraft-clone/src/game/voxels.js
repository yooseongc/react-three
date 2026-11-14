import { activeMap } from './mapConfig';
export const CHUNK_SIZE = 16;
export const voxelKey = (x, y, z) => [x, y, z].join(',');
export const chunkCoords = pos => pos.map(value => Math.floor(value / CHUNK_SIZE));
export const chunkKey = pos => chunkCoords(pos).join(',');

export function createVoxelWorld(cubes) {
  const blocks = new Map();
  const chunks = new Map();
  cubes.forEach(cube => {
    const key = cube.pos.join(',');
    const block = { ...cube, key };
    blocks.set(key, block);
    const id = chunkKey(cube.pos);
    if (!chunks.has(id)) chunks.set(id, { key: id, coords: chunkCoords(cube.pos), blocks: new Map(), revision: 0 });
    chunks.get(id).blocks.set(key, block);
  });
  return { blocks, chunks, lastChanged: [] };
}

export function editVoxel(world, pos, texture) {
  const key = pos.join(',');
  const existing = world.blocks.get(key);
  if ((!texture && !existing) || existing?.texture === texture) return world;
  const blocks = new Map(world.blocks);
  const chunks = new Map(world.chunks);
  const id = chunkKey(pos);
  const previous = chunks.get(id);
  const chunk = { key: id, coords: chunkCoords(pos), blocks: new Map(previous?.blocks), revision: (previous?.revision || 0) + 1 };
  if (texture) {
    const cube = { key, pos: [...pos], texture };
    blocks.set(key, cube); chunk.blocks.set(key, cube);
  } else { blocks.delete(key); chunk.blocks.delete(key); }
  if (chunk.blocks.size) chunks.set(id, chunk);
  else chunks.delete(id);
  const changed = [id];
  // At a corner, only the three face-neighbors are affected, not diagonal chunks.
  pos.forEach((value, axis) => {
    const local = ((value % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    if (local !== 0 && local !== CHUNK_SIZE - 1) return;
    const neighbor = [...chunk.coords];
    neighbor[axis] += local === 0 ? -1 : 1;
    const neighborId = neighbor.join(',');
    const adjacent = chunks.get(neighborId);
    if (adjacent) {
      chunks.set(neighborId, { ...adjacent, revision: adjacent.revision + 1 });
      changed.push(neighborId);
    }
  });
  return { blocks, chunks, lastChanged: changed };
}

export function nearbyBlocks(world, player, radius = 0.3, height = 1.8) {
  // Array compatibility is retained for legacy save fixtures and regression tests.
  if (Array.isArray(world)) return world;
  const result = [];
  for (let x = Math.floor(player.x - radius + 0.5); x <= Math.floor(player.x + radius + 0.5); x++)
    for (let y = Math.floor(player.y + 0.5); y <= Math.floor(player.y + height + 0.5); y++)
      for (let z = Math.floor(player.z - radius + 0.5); z <= Math.floor(player.z + radius + 0.5); z++) {
        const block = world.blocks.get(voxelKey(x, y, z));
        if (block) result.push(block);
      }
  return result;
}

// Grid traversal selects blocks independently of how chunks are triangulated.
export function raycastVoxels(world, origin, direction, reach = 6) {
  const o = [origin.x, origin.y, origin.z];
  const d = [direction.x, direction.y, direction.z];
  const cell = o.map(value => Math.floor(value + 0.5));
  const sign = d.map(Math.sign);
  const delta = d.map(value => value === 0 ? Infinity : Math.abs(1 / value));
  const next = d.map((value, axis) => value === 0 ? Infinity
    : (cell[axis] + (sign[axis] > 0 ? 0.5 : -0.5) - o[axis]) / value);
  let distance = 0;
  let normal = [0, 0, 0];
  let hit = null;
  for (let steps = 0; steps < 64 && distance <= reach; steps++) {
    const cube = world.blocks.get(cell.join(','));
    if (cube) { hit = { block: cube.pos, normal, distance }; break; }
    const axis = next[0] <= next[1] && next[0] <= next[2] ? 0 : next[1] <= next[2] ? 1 : 2;
    distance = next[axis];
    next[axis] += delta[axis];
    cell[axis] += sign[axis];
    normal = [0, 0, 0]; normal[axis] = -sign[axis];
  }
  if (direction.y < 0) {
    const groundDistance = (0.5 - origin.y) / direction.y;
    if (groundDistance >= 0 && groundDistance <= reach && (!hit || groundDistance < hit.distance)) {
      const x = origin.x + direction.x * groundDistance;
      const z = origin.z + direction.z * groundDistance;
      if (Math.abs(x) <= activeMap.size/2 && Math.abs(z) <= activeMap.size/2) return { ground: true, point: [x, 0.5, z], distance: groundDistance };
    }
  }
  return hit;
}
