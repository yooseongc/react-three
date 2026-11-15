import { generateTerrain } from './terrain';
import { createVoxelWorld } from './voxels';
import { stepPlayer,spawnPosition } from './world';
import { exportWorld,parseTransfer,listWorlds,safeWorldQuery } from './transfer';
import { terrainKey,terrainQuery } from './mapConfig';
import { createHash } from 'node:crypto';

test.each(['willow','lagoon','bell','mist','garden'])('%s city has a clear walking loop across distinct districts',seed=>{
 const t=generateTerrain(seed,{mapType:'canal',size:100,generator:4}),world=createVoxelWorld(t.cubes);
 expect(t.city.buildings.length).toBeGreaterThanOrEqual(8);
 expect(new Set(t.city.buildings.map(b=>b.floors)).size).toBeGreaterThanOrEqual(2);
 expect(new Set(t.city.buildings.map(b=>b.roof)).size).toBeGreaterThanOrEqual(2);
 expect(t.sites.map(s=>s.type)).toEqual(expect.arrayContaining(['market','belltower','plaza','harbour','gondola','cave']));
 let p=spawnPosition(t.cubes);expect(p.y).toBe(4.5);
 const [hx,hz]=t.city.harbour;
 const route=[t.city.walkRoute[1],[hx,hz+5],t.city.walkRoute[1],...t.city.walkRoute.slice(2)];
 for(const [x,z] of route){
  const distance=Math.hypot(x-p.x,z-p.z),budget=Math.ceil(distance/4.5*60)+180;
  for(let i=0;i<budget&&Math.hypot(x-p.x,z-p.z)>.12;i++){
   const yaw=Math.atan2(-(x-p.x),-(z-p.z));
   p=stepPlayer(p,{forward:true,autoStep:t.walkwaySteps.has(Math.round(p.x)+','+Math.round(p.z))},yaw,1/60,world);
  }
  expect(Math.hypot(x-p.x,z-p.z),JSON.stringify({seed,target:[x,z],actual:p})).toBeLessThan(.2);
 }
 expect(t.cubes.every(c=>Math.abs(c.pos[0])<=49&&Math.abs(c.pos[2])<=49&&c.pos[1]>=1&&c.pos[1]<=64)).toBe(true);
});
test('seed changes city layout and waterways, while identical seeds reproduce it',()=>{
 const maps=['willow','lagoon','bell'].map(seed=>generateTerrain(seed,{mapType:'canal',size:100,generator:4}));
 expect(new Set(maps.map(t=>JSON.stringify(t.city))).size).toBe(3);
 expect(new Set(maps.map(t=>JSON.stringify(t.water))).size).toBe(3);
 expect(generateTerrain('willow',{mapType:'canal',generator:4}).cubes).toEqual(maps[0].cubes);
});
test('new city edits round-trip separately from the previous city',()=>{
 const config={mapType:'canal',generator:4,size:100},t=generateTerrain('city',config),cubes=t.cubes.filter(c=>c.key!==t.chimneys[0].anchor),file=exportWorld(cubes,t.seed,config);
 expect(parseTransfer(JSON.stringify(file)).cubes).toEqual(cubes);expect(terrainKey(t.seed,config)).not.toBe(terrainKey(t.seed,{...config,generator:3}));
 localStorage.clear();localStorage.setItem(terrainKey(t.seed,config),JSON.stringify(file));expect(listWorlds(localStorage).some(w=>w.query===terrainQuery(t.seed,config))).toBe(true);expect(safeWorldQuery(terrainQuery(t.seed,config))).toBe(terrainQuery(t.seed,config));
});

test('generation 3 city remains byte-for-byte unchanged',()=>{
 const t=generateTerrain('willow',{mapType:'canal',generator:3});
 expect(createHash('sha256').update(JSON.stringify(t.cubes)).digest('hex')).toBe('1c55444941722500cd5b5fd4270fdd951e1d4a9960c7da4f38923cb5ec247f25');
});

test.each([150,400])('city districts expand within the %s map boundary',size=>{
 const t=generateTerrain('willow',{mapType:'canal',generator:4,size});
 const limit=size/2-1;
 expect(t.city.buildings.length).toBeGreaterThan(size===400?200:20);
 expect(t.city.buildings.some(b=>Math.abs(b.x)>size*.35)).toBe(true);
 expect(t.cubes.every(c=>Math.abs(c.pos[0])<=limit&&Math.abs(c.pos[2])<=limit&&c.pos[1]>=1&&c.pos[1]<=64)).toBe(true);
 expect(t.city.roads.some(([a,b])=>Math.abs(a[0]-b[0])>size*.8)).toBe(true);
});
