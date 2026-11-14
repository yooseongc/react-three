import buildingDemo from './building-demo.json';

export const demoMode = new URLSearchParams(window.location.search).get('demo');
export const isDemo = demoMode === 'chunks' || demoMode === 'benchmark' || demoMode === 'build';
// Captured from the M4 browser build exercise: 125 placements, 29 scaffold removals.
export const createBuildingDemo = () => buildingDemo.map(cube => ({ ...cube, pos: [...cube.pos] }));

export function createBenchmarkWorld() {
  const cubes = [];
  for (let x = -32; x < 32; x++)
    for (let z = -32; z < 32; z++)
      for (let y = 1; y <= 4; y++) cubes.push({ key: [x, y, z].join(','), pos: [x, y, z], texture: y === 4 ? 'grass' : 'dirt' });
  return cubes;
}

export function createDemoWorld() {
  const cubes = createBenchmarkWorld();
  const add = (x, y, z, texture) => cubes.push({ key: [x, y, z].join(','), pos: [x, y, z], texture });
  // A small construction across x=0 and x=16 lets players try chunk-boundary edits.
  for (let x = -4; x <= 20; x++) {
    for (let z = -5; z <= -3; z++) add(x, 5, z, 'wood');
    if (x % 4 === 0) for (let y = 6; y <= 9; y++) add(x, y, -4, 'log');
    add(x, 10, -4, 'wood');
  }
  for (let x = 1; x <= 3; x++) for (let y = 6; y <= 8; y++) add(x, y, -4, 'glass');
  for (let y = 5; y <= 18; y++) add(16, y, -8, 'log');
  return cubes;
}

export const decorationPositions = [];
for (let x = -28; x <= 28; x += 4) for (let z = -28; z <= 28; z += 4) {
  if (Math.abs(x) < 5 || (z >= -10 && z <= 2)) continue;
  decorationPositions.push([x + 0.2, 4.7, z + 0.2]);
}
