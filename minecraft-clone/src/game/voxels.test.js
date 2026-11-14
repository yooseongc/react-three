import { createVoxelWorld, editVoxel, chunkKey, nearbyBlocks, raycastVoxels } from './voxels';
import { buildChunkMesh } from './meshing';
import { createBenchmarkWorld } from './demo';
import { stepPlayer, spawnPosition, parseWorld } from './world';

const cube = (x, y, z, texture = 'dirt') => ({ key: [x, y, z].join(','), pos: [x, y, z], texture });
const faces = world => [...world.chunks.values()].reduce((sum, chunk) => sum
  + buildChunkMesh(chunk, world.blocks).reduce((total, batch) => total + batch.faces, 0), 0);

test('chunk coordinates floor correctly on both sides of zero and boundaries', () => {
  expect(chunkKey([-1, 15, -16])).toBe('-1,0,-1');
  expect(chunkKey([-17, 16, 16])).toBe('-2,1,1');
  expect(chunkKey([0, 1, 0])).toBe('0,0,0');
});

test.each([[15,16],[-1,0],[-17,-16]])('shared faces across x=%i/%i disappear and return after removal', (a,b) => {
  let world = createVoxelWorld([cube(a, 2, 3), cube(b, 2, 3)]);
  expect(faces(world)).toBe(10);
  world = editVoxel(world, [a, 2, 3], null);
  expect(faces(world)).toBe(6);
  world = editVoxel(world, [a, 2, 3], 'dirt');
  expect(faces(world)).toBe(10);
});

test('interior edits preserve all unrelated chunk identities; corner edits invalidate three face neighbors', () => {
  const world = createVoxelWorld([cube(15,15,15), cube(16,15,15), cube(15,16,15), cube(15,15,16), cube(16,16,16), cube(-20,2,-20)]);
  const interior = editVoxel(world, [2,2,2], 'wood');
  expect(interior.lastChanged).toEqual(['0,0,0']);
  expect(interior.chunks.get('1,0,0')).toBe(world.chunks.get('1,0,0'));
  const corner = editVoxel(world, [15,15,15], null);
  expect(new Set(corner.lastChanged)).toEqual(new Set(['0,0,0','1,0,0','0,1,0','0,0,1']));
  expect(corner.chunks.get('1,1,1')).toBe(world.chunks.get('1,1,1'));
  expect(corner.chunks.get('-2,0,-2')).toBe(world.chunks.get('-2,0,-2'));
  expect(world.blocks.has('15,15,15')).toBe(true);
});

test('glass does not hide adjacent opaque faces; shared glass interfaces disappear', () => {
  expect(faces(createVoxelWorld([cube(15,2,0,'glass'), cube(16,2,0,'glass')]))).toBe(10);
  expect(faces(createVoxelWorld([cube(15,2,0,'dirt'), cube(16,2,0,'glass')]))).toBe(11);
});

test('mesh winding, normals and full texture UVs are correct for every cube face', () => {
  const world = createVoxelWorld([cube(0,1,0)]);
  const batch = buildChunkMesh([...world.chunks.values()][0], world.blocks)[0];
  expect(batch.faces).toBe(6);
  for (let face=0; face<6; face++) {
    const p = batch.positions.slice(face*12, face*12+12);
    const a = [p[3]-p[0],p[4]-p[1],p[5]-p[2]], b = [p[6]-p[0],p[7]-p[1],p[8]-p[2]];
    const cross = [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
    const normal = batch.normals.slice(face*12,face*12+3);
    expect(cross.reduce((sum,n,i)=>sum+n*normal[i],0)).toBe(1);
    expect(batch.uvs.slice(face*8,face*8+8)).toEqual([0,0,1,0,1,1,0,1]);
  }
});

test('16384 solid blocks produce 9216 exposed faces across 16 chunks', () => {
  const world = createVoxelWorld(createBenchmarkWorld());
  expect(world.blocks.size).toBe(16384);
  expect(world.chunks.size).toBe(16);
  expect(faces(world)).toBe(9216);
});

test('ray selection crosses negative coordinates and chunk boundaries at exact reach', () => {
  const world = createVoxelWorld([cube(-16,2,0), cube(16,2,0)]);
  expect(raycastVoxels(world,{x:-10,y:2,z:0},{x:-1,y:0,z:0})).toEqual({block:[-16,2,0],normal:[1,0,0],distance:5.5});
  expect(raycastVoxels(world,{x:10,y:2,z:0},{x:1,y:0,z:0},5.49)).toBeNull();
  expect(raycastVoxels(world,{x:10,y:2,z:0},{x:1,y:0,z:0},5.5).block).toEqual([16,2,0]);
});

test('ray resolves all six face normals and prefers the first block over the floor', () => {
  const world = createVoxelWorld([cube(0,2,0)]);
  for(const n of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) {
    const origin={x:n[0]*3,y:2+n[1]*3,z:n[2]*3};
    const d={x:-n[0],y:-n[1],z:-n[2]};
    expect(raycastVoxels(world,origin,d).normal).toEqual(n);
  }
  const empty = createVoxelWorld([]);
  expect(raycastVoxels(empty,{x:1,y:2,z:1},{x:0,y:-1,z:0}).point).toEqual([1,0.5,1]);
  expect(raycastVoxels(empty,{x:1,y:2,z:1},{x:0,y:1,z:0})).toBeNull();
});

test('indexed collision matches prior movement and queries only nearby occupied cells', () => {
  const cubes = [cube(0,1,0),cube(0,2,0),cube(40,1,40)];
  const world = createVoxelWorld(cubes);
  let a={...spawnPosition([]),z:3}, b={...a};
  for(let i=0;i<120;i++) {a=stepPlayer(a,{forward:true},0,1/60,cubes);b=stepPlayer(b,{forward:true},0,1/60,world);}
  expect(b).toEqual(a);
  expect(b.z).toBeCloseTo(0.8);
  expect(nearbyBlocks(world,{x:0,y:0.5,z:0})).toHaveLength(2);
});

test('legacy serialization round-trips coordinates, materials and negative chunks', () => {
  const world=createVoxelWorld([cube(-17,16,-1,'glass'),cube(15,2,16,'wood')]);
  const restored=createVoxelWorld(parseWorld(JSON.stringify({version:1,cubes:[...world.blocks.values()]})).cubes);
  expect([...restored.blocks.values()]).toEqual([...world.blocks.values()]);
  expect([...restored.chunks.keys()]).toEqual([...world.chunks.keys()]);
});

test.each([0,1,2])('edits on axis %i invalidate its boundary neighbor and expose the missing face', axis => {
  const a=[2,2,2],b=[2,2,2];a[axis]=15;b[axis]=16;
  let world=createVoxelWorld([cube(...a),cube(...b)]);
  expect(faces(world)).toBe(10);
  world=editVoxel(world,a,null);
  expect(world.lastChanged).toHaveLength(2);
  expect(faces(world)).toBe(6);
});

test('indexed player lands and jumps on a platform; removing support allows falling', () => {
  let world=createVoxelWorld([cube(0,4,10)]);
  let p=spawnPosition([...world.blocks.values()]);
  p=stepPlayer(p,{jump:true},0,1/60,world);
  expect(p.y).toBeGreaterThan(4.5);
  for(let i=0;i<90;i++)p=stepPlayer(p,{},0,1/60,world);
  expect(p.y).toBeCloseTo(4.5,2);
  world=editVoxel(world,[0,4,10],null);
  for(let i=0;i<90;i++)p=stepPlayer(p,{},0,1/60,world);
  expect(p.y).toBe(0.5);
});

test.each([59,60,120,144])('ground contact stays stable at %i FPS so jump input is never lost on platforms', fps => {
  const world=createVoxelWorld([cube(0,4,10)]);
  let p=spawnPosition([...world.blocks.values()]);
  for(let i=0;i<30;i++) {
    p=stepPlayer(p,{},0,1/fps,world);
    expect(p.grounded).toBe(true);
    expect(p.y).toBe(4.5);
  }
  expect(stepPlayer(p,{jump:true},0,1/fps,world).vy).toBeGreaterThan(0);
});
