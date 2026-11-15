import { createHash } from 'node:crypto';
import { generateTerrain,serializeTerrain,restoreTerrain } from './terrain';
import { createVoxelWorld } from './voxels';
import { spawnPosition,stepPlayer,ALL_BLOCK_TYPES,validPosition } from './world';
import { wildlifeHabitat,createWildlife,animalSurface,stepWildlife,WILDLIFE_LIMIT } from './wildlife';

test.each(['willow','lagoon','tide','shell','산호'])('%s coral connects both walking loops and safe wildlife',seed=>{
 const t=generateTerrain(seed,{mapType:'coral',generator:4}),world=createVoxelWorld(t.cubes);
 expect(t.sites.map(s=>s.type)).toEqual(expect.arrayContaining(['bungalow','pavilion','pier','reef','lookout']));
 expect(t.coral.trees.length).toBeGreaterThan(5);
 let p=spawnPosition(t.cubes);expect(p.y).toBe(4.5);
 const route=[...t.coral.walkRoute.slice(1),...t.coral.pierRoute.slice(1)];
 for(const [x,z] of route){
  const budget=Math.ceil(Math.hypot(x-p.x,z-p.z)/4.5*60)+240;
  for(let i=0;i<budget&&Math.hypot(x-p.x,z-p.z)>.15;i++)p=stepPlayer(p,{forward:true,autoStep:t.walkwaySteps.has(Math.round(p.x)+','+Math.round(p.z))},Math.atan2(-(x-p.x),-(z-p.z)),1/60,world);
  expect(Math.hypot(x-p.x,z-p.z),JSON.stringify({seed,target:[x,z],actual:p})).toBeLessThan(.2);
 }
 const habitat=wildlifeHabitat(t),animals=createWildlife(habitat,world.blocks);
 expect(animals.length).toBeLessThanOrEqual(WILDLIFE_LIMIT);
 expect(animals.filter(a=>a.type==='seaTurtle'&&a.active)).toHaveLength(3);
 for(const a of animals.filter(a=>a.active))expect(animalSurface(a.type,a.x,a.z,habitat,world.blocks)).toBe(a.y);
 expect(animals.filter(a=>a.type==='crab'&&a.active)).toHaveLength(5);
 expect(t.cubes.every(c=>Math.abs(c.pos[0])<=49&&Math.abs(c.pos[2])<=49&&validPosition(c.pos)&&ALL_BLOCK_TYPES.includes(c.texture))).toBe(true);
});

test('coral layouts vary by seed and edits reproduce on the same baseline',()=>{
 const config={mapType:'coral',generator:4},a=generateTerrain('lagoon',config),b=generateTerrain('tide',config);
 expect(a.water).not.toEqual(b.water);expect(a.coral.trees).not.toEqual(b.coral.trees);
 const base=new Map(a.cubes.map(c=>[c.key,c])),current=new Map(base);current.delete(a.cubes.at(-1).key);
 const raw=serializeTerrain('lagoon',base,current,config);
 expect(new Map(restoreTerrain(raw,'lagoon',generateTerrain('lagoon',config).cubes,validPosition,ALL_BLOCK_TYPES,config).map(c=>[c.key,c]))).toEqual(current);
});

test.each([150,400])('%s coral keeps trails and trees within the expanded landscape',size=>{
 const t=generateTerrain('willow',{mapType:'coral',generator:4,size}),limit=size/2-1;
 expect(t.coral.islands.some(i=>Math.abs(i.x)>size*.3)).toBe(true);
 expect(t.coral.reefs.length).toBeGreaterThan(20);
 expect(t.coral.islands.length).toBeGreaterThan(4);
 expect(t.cubes.every(c=>Math.abs(c.pos[0])<=limit&&Math.abs(c.pos[2])<=limit&&c.pos.every(Number.isInteger)&&c.pos[1]>=1&&c.pos[1]<=64)).toBe(true);
},15000);



test('previous coral generation remains unchanged',()=>{
 const t=generateTerrain('willow',{mapType:'coral',generator:3});
 expect(createHash('sha256').update(JSON.stringify(t.cubes)).digest('hex')).toBe('ff1ba66b4864f690293a47cde153770b0bf8c4b9e89f38cb2dadeaf6baa8c82b');
});
test('marine animals move without entering land or coral blocks',()=>{
 const t=generateTerrain('willow',{mapType:'coral',generator:4}),world=createVoxelWorld(t.cubes),h=wildlifeHabitat(t),animals=createWildlife(h,world.blocks);
 const before=animals.map(a=>[a.x,a.z]);
 for(let i=0;i<600;i++)stepWildlife(animals,h,world.blocks,{x:0,y:4.5,z:10},1/60);
 expect(animals.some((a,i)=>a.type==='seaTurtle'&&Math.hypot(a.x-before[i][0],a.z-before[i][1])>.1)).toBe(true);
 for(const a of animals.filter(a=>a.active))expect(animalSurface(a.type,a.x,a.z,h,world.blocks)).toBe(a.y);
 const a=animals.find(a=>a.type==='seaTurtle'&&a.active),x=Math.round(a.x-.8),z=Math.round(a.z-.8);
 world.blocks.set(`${x},2,${z}`,{texture:'coralPink',pos:[x,2,z]});expect(animalSurface('seaTurtle',a.x,a.z,h,world.blocks)).toBe(null);
});
