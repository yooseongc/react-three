import { FLOOR, loadWorld, overlapsPlayer, parseWorld, spawnPosition, stepPlayer, STORAGE_KEY } from './world';

const block = (x, y, z, texture = 'dirt') => ({ pos: [x, y, z], texture });
const storage = values => ({
  getItem: key => values[key] ?? null,
  setItem: (key, value) => { values[key] = value; },
});
const simulate = (p, input, cubes = [], frames = 120) => {
  for (let i = 0; i < frames; i++) p = stepPlayer(p, input, 0, 1 / 60, cubes);
  return p;
};

test('legacy saves migrate while duplicates and invalid blocks are removed', () => {
  const parsed = parseWorld(JSON.stringify([block(1, 1, 1), block(1, 1, 1), block(0, -1, 0), block(2, 1, 1, 'unknown'), null]));
  expect(parsed.cubes).toEqual([{ ...block(1, 1, 1), key: '1,1,1' }]);
  expect(parsed.repaired).toBe(true);
});

test('empty saved worlds stay empty', () => {
  expect(loadWorld(storage({ world: '[]' })).cubes).toEqual([]);
});

test('broken current saves are backed up byte-for-byte and do not prevent startup', () => {
  const values = { [STORAGE_KEY]: '{broken' };
  const loaded = loadWorld(storage(values));
  expect(loaded.cubes.length).toBeGreaterThan(0);
  expect(loaded.canSave).toBe(true);
  expect(values[STORAGE_KEY + '.backup']).toBe('{broken');
  expect(values[STORAGE_KEY]).toBe('{broken');
});

test('legacy original remains intact', () => {
  const values = { world: '{broken' };
  expect(loadWorld(storage(values)).canSave).toBe(true);
  expect(values.world).toBe('{broken');
});

test('storage denial or failed backup disables writes without throwing', () => {
  expect(loadWorld(null).canSave).toBe(false);
  expect(loadWorld({ getItem: () => '{broken', setItem: () => { throw Error('quota'); } }).canSave).toBe(false);
});

test('player lands on ground and cannot jump again in midair', () => {
  const initial = spawnPosition([]);
  const first = stepPlayer(initial, { jump: true }, 0, 1 / 60, []);
  expect(first.y).toBeGreaterThan(FLOOR);
  const second = stepPlayer(first, { jump: true }, 0, 1 / 60, []);
  expect(second.vy).toBeLessThan(first.vy);
  const landed = simulate(second, {});
  expect(landed.y).toBe(FLOOR);
  expect(landed.grounded).toBe(true);
});

test('horizontal movement stops at walls even with slow frames', () => {
  let p = { ...spawnPosition([]), z: 3 };
  const cubes = [block(0, 1, 0), block(0, 2, 0)];
  for (let i = 0; i < 120; i++) p = stepPlayer(p, { forward: true, sprint: true }, 0, 0.15, cubes);
  expect(p.z).toBeCloseTo(0.8);
  expect(cubes.some(c => overlapsPlayer(c.pos, p))).toBe(false);
});

test('player lands on blocks, then falls if support is removed', () => {
  const cubes = [block(0, 1, 0)];
  let p = { ...spawnPosition([]), y: 4, z: 0, grounded: false };
  p = simulate(p, {}, cubes);
  expect(p.y).toBe(1.5);
  expect(p.grounded).toBe(true);
  expect(simulate(p, {}).y).toBe(FLOOR);
});

test('head collision stops upward motion', () => {
  const p = stepPlayer({ ...spawnPosition([]), z: 0 }, { jump: true }, 0, 0.05, [block(0, 3, 0)]);
  expect(p.y + 1.8).toBeLessThanOrEqual(2.501);
  expect(p.vy).toBeLessThanOrEqual(0);
});

test('diagonal speed equals straight speed and opposite keys cancel', () => {
  const p = spawnPosition([]);
  const straight = stepPlayer(p, { forward: true }, 0, 0.05, []);
  const diagonal = stepPlayer(p, { forward: true, right: true }, 0, 0.05, []);
  expect(Math.hypot(diagonal.x, diagonal.z - p.z)).toBeCloseTo(p.z - straight.z);
  expect(stepPlayer(p, { forward: true, backward: true }, 0, 0.05, []).z).toBe(p.z);
});

test('spawn sits above saved blocks at spawn point', () => {
  expect(spawnPosition([block(0, 5, 10)]).y).toBe(5.5);
});
