import { generateTerrain,serializeTerrain,restoreTerrain } from './terrain';
import { createVoxelWorld } from './voxels';
import { spawnPosition,stepPlayer,ALL_BLOCK_TYPES,validPosition } from './world';
import { wildlifeHabitat,createWildlife,animalSurface,WILDLIFE_LIMIT } from './wildlife';
import { createHash } from 'node:crypto';

test.each(['willow','pinecone','breeze','mist','솔향'])('%s retreat connects both walking loops and safe wildlife',seed=>{
 const t=generateTerrain(seed,{mapType:'pine',generator:4}),world=createVoxelWorld(t.cubes);
 expect(t.sites.map(s=>s.type)).toEqual(expect.arrayContaining(['byeolseo','gate','pond','courtyard','grove','house']));
 expect(t.retreat.trees.length).toBeGreaterThan(25);
 let p=spawnPosition(t.cubes);expect(p.y).toBe(4.5);
 const route=[...t.retreat.walkRoute.slice(1),...t.retreat.forestRoute.slice(1)];
 for(const [x,z] of route){
  const budget=Math.ceil(Math.hypot(x-p.x,z-p.z)/4.5*60)+240;
  for(let i=0;i<budget&&Math.hypot(x-p.x,z-p.z)>.15;i++)p=stepPlayer(p,{forward:true,autoStep:t.walkwaySteps.has(Math.round(p.x)+','+Math.round(p.z))},Math.atan2(-(x-p.x),-(z-p.z)),1/60,world);
  expect(Math.hypot(x-p.x,z-p.z),JSON.stringify({seed,target:[x,z],actual:p})).toBeLessThan(.2);
 }
 const habitat=wildlifeHabitat(t),animals=createWildlife(habitat,world.blocks);
 expect(animals.length).toBeLessThanOrEqual(WILDLIFE_LIMIT);
 expect(animals.filter(a=>a.type==='magpie'&&a.active)).toHaveLength(4);
 for(const a of animals.filter(a=>a.active))expect(animalSurface(a.type,a.x,a.z,habitat,world.blocks)).toBe(a.y);
 expect(t.cubes.every(c=>Math.abs(c.pos[0])<=49&&Math.abs(c.pos[2])<=49&&validPosition(c.pos)&&ALL_BLOCK_TYPES.includes(c.texture))).toBe(true);
});

test('retreat layouts vary by seed and edits reproduce on the same baseline',()=>{
 const config={mapType:'pine',generator:4},a=generateTerrain('pinecone',config),b=generateTerrain('breeze',config);
 expect(a.water).not.toEqual(b.water);expect(a.retreat.trees).not.toEqual(b.retreat.trees);
 const base=new Map(a.cubes.map(c=>[c.key,c])),current=new Map(base);current.delete(a.cubes.at(-1).key);
 const raw=serializeTerrain('pinecone',base,current,config);
 expect(new Map(restoreTerrain(raw,'pinecone',generateTerrain('pinecone',config).cubes,validPosition,ALL_BLOCK_TYPES,config).map(c=>[c.key,c]))).toEqual(current);
});

test('previous pine generation remains unchanged',()=>{
 const t=generateTerrain('willow',{mapType:'pine',generator:3});
 expect(createHash('sha256').update(JSON.stringify(t.cubes)).digest('hex')).toBe('e38f8f6657c7f174c2434b4de25b32d6e453b59446612e64af0d61d0658bc16a');
});

test.each([150,400])('%s retreat keeps trails and trees within the expanded landscape',size=>{
 const t=generateTerrain('willow',{mapType:'pine',generator:4,size}),limit=size/2-1;
 expect(t.sites.some(s=>s.type==='trail'&&s.z<-size*.3)).toBe(true);
 expect(t.retreat.trees.some(t=>Math.abs(t.x)>size*.35)).toBe(true);
 expect(t.cubes.every(c=>Math.abs(c.pos[0])<=limit&&Math.abs(c.pos[2])<=limit&&c.pos.every(Number.isInteger)&&c.pos[1]>=1&&c.pos[1]<=64)).toBe(true);
},15000);
