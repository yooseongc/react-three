import { nearbyBlocks } from './voxels';
import { MAP_LIMIT } from './mapConfig';

export const BLOCK_TYPES = ['dirt', 'grass', 'glass', 'wood', 'log', 'sand', 'stone', 'leaves', 'brick', 'plaster', 'roof', 'slate', 'snow'];
export const ALL_BLOCK_TYPES = BLOCK_TYPES;
export const BLOCK_LABELS = ['흙', '잔디', '유리', '목재', '원목', '모래', '돌', '잎', '벽돌', '회벽', '기와', '판석', '눈'];
export const BLOCK_COLORS = ['#ba8a60', '#a0bd65', '#b3e4e9', '#e0bf84', '#947252', '#d8c591', '#848f91', '#5e8b4c', '#b36b52', '#e7dfc8', '#697e86', '#9eaaa6', '#e5eff1'];
export const WORLD_LIMIT = MAP_LIMIT;
export const FLOOR = 0.5;
export const PLAYER_RADIUS = 0.3;
export const PLAYER_HEIGHT = 1.8;
export const STORAGE_KEY = 'voxel-garden.world.v1';

export const starterWorld = () => [
  [-2, 1, 1, 'log'], [-2, 2, 1, 'log'], [-1, 1, 1, 'wood'],
  [0, 1, 1, 'wood'], [1, 1, 1, 'wood'], [2, 1, 1, 'log'],
  [2, 2, 1, 'log'], [0, 2, 1, 'glass'],
].map(([x, y, z, texture]) => ({ key: [x, y, z].join(','), pos: [x, y, z], texture }));

export function validPosition(pos, limit=WORLD_LIMIT) {
  return Array.isArray(pos) && pos.length === 3 && pos.every(Number.isInteger)
    && Math.abs(pos[0]) <= limit && Math.abs(pos[2]) <= limit
    && pos[1] >= 1 && pos[1] <= 64;
}

export function parseWorld(raw) {
  const data = JSON.parse(raw);
  const source = Array.isArray(data) ? data : data?.version === 1 ? data.cubes : null;
  if (!Array.isArray(source)) throw new Error('지원하지 않는 저장 형식');
  const seen = new Set();
  const cubes = [];
  for (const cube of source) {
    if (!cube || !validPosition(cube.pos) || !ALL_BLOCK_TYPES.includes(cube.texture)) continue;
    const key = cube.pos.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    cubes.push({ key, pos: [...cube.pos], texture: cube.texture });
  }
  return { cubes, repaired: cubes.length !== source.length };
}

// Preserve the exact original before repairing or replacing a damaged current save.
export function loadWorld(storage, storageKey = STORAGE_KEY, legacyKey = 'world', fallback = starterWorld) {
  try {
    const current = storage.getItem(storageKey);
    const raw = current ?? (legacyKey ? storage.getItem(legacyKey) : null);
    if (raw === null) return { cubes: fallback(), notice: '', canSave: true };
    try {
      const parsed = parseWorld(raw);
      if (parsed.repaired && current !== null) storage.setItem(storageKey + '.backup', raw);
      return { cubes: parsed.cubes, canSave: true, notice: parsed.repaired
        ? '잘못되거나 중복된 블록을 정리했습니다. 원본 저장은 보존했습니다.'
        : current === null ? '이전 월드를 불러왔습니다. 이전 저장 원본은 보존됩니다.' : '' };
    } catch (error) {
      if (current !== null) storage.setItem(storageKey + '.backup', raw);
      return { cubes: fallback(), canSave: true,
        notice: '저장을 읽을 수 없어 연습 월드를 열었습니다. 원본은 보존했습니다.' };
    }
  } catch (error) {
    return { cubes: fallback(), canSave: false,
      notice: '브라우저 저장소에 접근할 수 없습니다. 이번 플레이는 저장되지 않습니다.' };
  }
}

export function overlapsPlayer(pos, player, margin = 0.001) {
  return Math.abs(pos[0] - player.x) < 0.5 + PLAYER_RADIUS - margin
    && Math.abs(pos[2] - player.z) < 0.5 + PLAYER_RADIUS - margin
    && pos[1] + 0.5 > player.y + margin
    && pos[1] - 0.5 < player.y + PLAYER_HEIGHT - margin;
}

export function spawnPosition(cubes) {
  let y = FLOOR;
  cubes.forEach(({ pos }) => {
    if (Math.abs(pos[0]) < 0.8 && Math.abs(pos[2] - 10) < 0.8) y = Math.max(y, pos[1] + 0.5);
  });
  return { x: 0, y, z: 10, vy: 0, grounded: true };
}

// Fixed-size substeps keep collision stable even when frames are slow.
export function stepPlayer(player, input, yaw, delta, cubes) {
  const p = { ...player };
  const forward = input.moveForward ?? (Number(!!input.forward) - Number(!!input.backward));
  const side = input.moveRight ?? (Number(!!input.right) - Number(!!input.left));
  const vertical = input.flying ? Number(!!input.ascend) - Number(!!input.descend) : 0;
  const length = Math.max(1, Math.hypot(forward, side, vertical));
  const speed = input.sprint ? 7 : 4.5;
  const vx = (side * Math.cos(yaw) - forward * Math.sin(yaw)) / length * speed;
  const vz = (-forward * Math.cos(yaw) - side * Math.sin(yaw)) / length * speed;
  if (input.flying) p.vy = vertical / length * speed;
  else if (input.jump && p.grounded) { p.vy = 8; p.grounded = false; }
  const dt = Math.min(Math.max(delta, 0), 0.05);
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    for (const [axis, velocity] of [['x', vx], ['z', vz]]) {
      if (!velocity) continue;
      p[axis] = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, p[axis] + velocity * h));
      for (const { pos } of nearbyBlocks(cubes, p)) {
        if (overlapsPlayer(pos, p, 0)) {
          p[axis] = pos[axis === 'x' ? 0 : 2] - Math.sign(velocity) * (0.5 + PLAYER_RADIUS);
        }
      }
    }
    if (!input.flying) p.vy -= 24 * h;
    p.y += p.vy * h;
    p.grounded = false;
    for (const { pos } of nearbyBlocks(cubes, p)) {
      if (!overlapsPlayer(pos, p, 0)) continue;
      if (p.vy <= 0) { p.y = pos[1] + 0.5; p.grounded = true; }
      else p.y = pos[1] - 0.5 - PLAYER_HEIGHT;
      p.vy = 0;
    }
    if (p.y <= FLOOR) { p.y = FLOOR; p.vy = 0; p.grounded = true; }
    if (p.y > 70) { p.y = 70; p.vy = 0; }
  }
  return p;
}
