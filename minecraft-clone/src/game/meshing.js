import { voxelKey } from './voxels';

const FACES = [
  { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
  { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
  { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },
  { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
];

export function buildChunkMesh(chunk, blocks) {
  const batches = new Map();
  for (const cube of chunk.blocks.values()) {
    for (const { n, u, v } of FACES) {
      const neighbor = blocks.get(voxelKey(...cube.pos.map((p, i) => p + n[i])));
      // Glass/glass interfaces disappear; opaque faces remain visible through glass.
      if (neighbor && (neighbor.texture !== 'glass' || cube.texture === 'glass')) continue;
      if (!batches.has(cube.texture)) batches.set(cube.texture, { texture: cube.texture, positions: [], normals: [], uvs: [], indices: [], faces: 0 });
      const batch = batches.get(cube.texture);
      const offset = batch.positions.length / 3;
      for (const [s, t] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        batch.positions.push(...cube.pos.map((p, i) => p + (n[i] + s * u[i] + t * v[i]) / 2));
        batch.normals.push(...n);
        batch.uvs.push((s + 1) / 2, (t + 1) / 2);
      }
      batch.indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
      batch.faces++;
    }
  }
  return [...batches.values()];
}
