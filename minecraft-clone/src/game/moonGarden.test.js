import { generateTerrain,serializeTerrain,restoreTerrain } from './terrain';
import { createVoxelWorld } from './voxels';
import { spawnPosition,stepPlayer,ALL_BLOCK_TYPES,validPosition } from './world';
import { wildlifeHabitat,createWildlife,animalSurface,stepWildlife,WILDLIFE_LIMIT } from './wildlife';
import { createHash } from 'node:crypto';

test.each(['willow','lotus','jade','mist','달빛'])('%s garden connects the gallery, island and tea court',seed=>{
 const t=generateTerrain(seed,{mapType:'moon',generator:4}),world=createVoxelWorld(t.cubes);
 expect(t.sites.map(s=>s.type)).toEqual(expect.arrayContaining(['moonGate','corridor','pavilion','rockGarden','house','pond']));
 let p=spawnPosition(t.cubes);expect(p.y).toBe(4.5);
 for(const [x,z] of [...t.garden.walkRoute.slice(1),...t.garden.westRoute.slice(1)]){
  const budget=Math.ceil(Math.hypot(x-p.x,z-p.z)/4.5*60)+240;
  for(let i=0;i<budget&&Math.hypot(x-p.x,z-p.z)>.15;i++)p=stepPlayer(p,{forward:true,autoStep:t.walkwaySteps.has(Math.round(p.x)+','+Math.round(p.z))},Math.atan2(-(x-p.x),-(z-p.z)),1/60,world);
  expect(Math.hypot(x-p.x,z-p.z),JSON.stringify({seed,target:[x,z],actual:p})).toBeLessThan(.2);
 }
 const habitat=wildlifeHabitat(t),animals=createWildlife(habitat,world.blocks);
 expect(animals.length).toBeLessThanOrEqual(WILDLIFE_LIMIT);
 expect(animals.filter(a=>a.type==='turtle'&&a.active)).toHaveLength(4);
 for(let i=0;i<180;i++)stepWildlife(animals,habitat,world.blocks,{x:0,y:20,z:10},1/60);
 for(const a of animals.filter(a=>a.active))expect(animalSurface(a.type,a.x,a.z,habitat,world.blocks)).toBe(a.y);
 expect(t.cubes.every(c=>validPosition(c.pos)&&ALL_BLOCK_TYPES.includes(c.texture))).toBe(true);
});

test('garden seeds change shoreline and trees, and edited worlds round-trip',()=>{
 const config={mapType:'moon',generator:4},a=generateTerrain('lotus',config),b=generateTerrain('jade',config);
 expect(a.water).not.toEqual(b.water);expect(a.garden.trees).not.toEqual(b.garden.trees);
 const base=new Map(a.cubes.map(c=>[c.key,c])),current=new Map(base);current.delete(a.cubes.at(-1).key);
 expect(new Map(restoreTerrain(serializeTerrain('lotus',base,current,config),'lotus',generateTerrain('lotus',config).cubes,validPosition,ALL_BLOCK_TYPES,config).map(c=>[c.key,c]))).toEqual(current);
});

test('previous garden generation remains unchanged',()=>{
 const t=generateTerrain('willow',{mapType:'moon',generator:3});
 expect(createHash('sha256').update(JSON.stringify(t.cubes)).digest('hex')).toBe('50ae36221de6a9da6bdf39d9f4f317e35f55513b97774f910c6b89111e92d40e');
});

test.each([150,400])('%s garden expands its bamboo walk within map bounds',size=>{
 const t=generateTerrain('willow',{mapType:'moon',generator:4,size}),limit=size/2-1;
 expect(t.sites.some(s=>s.type==='trail'&&s.z<-size*.3)).toBe(true);
 expect(t.garden.trees.some(t=>Math.abs(t.x)>size*.35)).toBe(true);
 expect(t.cubes.every(c=>Math.abs(c.pos[0])<=limit&&Math.abs(c.pos[2])<=limit&&c.pos.every(Number.isInteger)&&c.pos[1]>=1&&c.pos[1]<=64)).toBe(true);
},15000);
