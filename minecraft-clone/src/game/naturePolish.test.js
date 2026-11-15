import { createHash } from 'node:crypto';
import { generateTerrain,serializeTerrain,restoreTerrain } from './terrain';
import { ALL_BLOCK_TYPES,validPosition,spawnPosition } from './world';
import { createVoxelWorld } from './voxels';
import { createWildlife,wildlifeHabitat,animalSurface } from './wildlife';
const maps=['forest','meadow','islands','snow'];
describe.each(maps)('%s nature polish',mapType=>{
 test.each(['willow','breeze','fern','mist','산책'])('%s preserves landmarks and safe wildlife',seed=>{
  const config={mapType,generator:4},t=generateTerrain(seed,config),old=generateTerrain(seed,{mapType,generator:3}),w=createVoxelWorld(t.cubes),h=wildlifeHabitat(t),a=createWildlife(h,w.blocks);
  expect(t.nature.details.length).toBeGreaterThanOrEqual(2);expect(spawnPosition(t.cubes).y).toBe(spawnPosition(old.cubes).y);
  if(mapType==='snow'){expect(a.filter(v=>v.active&&v.type==='arcticFox')).toHaveLength(4);expect(a.filter(v=>v.active&&v.type==='arcticHare')).toHaveLength(5);expect(t.sites.some(s=>s.type==='ice')).toBe(true);}
  expect(t.sites).toEqual(expect.arrayContaining(old.sites));
  expect(t.cubes.every(c=>ALL_BLOCK_TYPES.includes(c.texture)&&validPosition(c.pos))).toBe(true);
  for(const animal of a.filter(a=>a.active))expect(animalSurface(animal.type,animal.x,animal.z,h,w.blocks)).toBe(animal.y);
  const base=new Map(t.cubes.map(c=>[c.key,c])),edited=new Map(base);edited.delete(t.cubes.at(-1).key);
  expect(new Map(restoreTerrain(serializeTerrain(seed,base,edited,config),seed,t.cubes,validPosition,ALL_BLOCK_TYPES,config).map(c=>[c.key,c]))).toEqual(edited);
 });
 test.each([150,400])('%s map stays within bounds',size=>{
  const t=generateTerrain('willow',{mapType,generator:4,size});expect(t.cubes.every(c=>c.pos.every(Number.isInteger)&&c.pos[1]>=1&&c.pos[1]<=64&&Math.abs(c.pos[0])<size/2&&Math.abs(c.pos[2])<size/2)).toBe(true);
 },15000);
});

test('previous forest generation remains unchanged',()=>{expect(createHash('sha256').update(JSON.stringify(generateTerrain('willow',{mapType:'forest',generator:3}).cubes)).digest('hex')).toBe('62cfd066d1eaa4d258f938d7d5369eba919e1871d28c63078f48f773a60cfee5');});

test('previous meadow generation remains unchanged',()=>{expect(createHash('sha256').update(JSON.stringify(generateTerrain('willow',{mapType:'meadow',generator:3}).cubes)).digest('hex')).toBe('40093a3e4b822e3a4497a620292d1d652128f94a8a1433d7be0ed6615ee98189');});

test('previous islands generation remains unchanged',()=>{expect(createHash('sha256').update(JSON.stringify(generateTerrain('willow',{mapType:'islands',generator:3}).cubes)).digest('hex')).toBe('94534405a3d642adee20d2a6d3b83514ed5f652653c96ecd589fd430a000ba3b');});

test('previous snow generation remains unchanged',()=>{expect(createHash('sha256').update(JSON.stringify(generateTerrain('willow',{mapType:'snow',generator:3}).cubes)).digest('hex')).toBe('d8a018cd644192a9cefc74e925d12ebcf5607fa2f3ecba8a557123b690b0219c');});
