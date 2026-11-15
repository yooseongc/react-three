import { createHash } from 'node:crypto';
import { generateTerrain,serializeTerrain,restoreTerrain } from './terrain';
import { createVoxelWorld } from './voxels';
import { spawnPosition,stepPlayer,ALL_BLOCK_TYPES,validPosition } from './world';
import { wildlifeHabitat,createWildlife,animalSurface,stepWildlife,WILDLIFE_LIMIT } from './wildlife';

test.each(['willow','dune','mirage','caravan','모래'])('%s oasis connects both walking loops and safe wildlife',seed=>{
 const t=generateTerrain(seed,{mapType:'oasis',generator:4}),world=createVoxelWorld(t.cubes);
 expect(t.sites.map(s=>s.type)).toEqual(expect.arrayContaining(['market','pond','ruin','house','lookout']));
 expect(t.oasis.trees.length).toBeGreaterThan(5);
 let p=spawnPosition(t.cubes);expect(p.y).toBe(4.5);
 const route=[...t.oasis.walkRoute.slice(1),...t.oasis.duneRoute.slice(1)];
 for(const [x,z] of route){
  const budget=Math.ceil(Math.hypot(x-p.x,z-p.z)/4.5*60)+240;
  for(let i=0;i<budget&&Math.hypot(x-p.x,z-p.z)>.15;i++)p=stepPlayer(p,{forward:true,autoStep:t.walkwaySteps.has(Math.round(p.x)+','+Math.round(p.z))},Math.atan2(-(x-p.x),-(z-p.z)),1/60,world);
  expect(Math.hypot(x-p.x,z-p.z),JSON.stringify({seed,target:[x,z],actual:p})).toBeLessThan(.2);
 }
 const habitat=wildlifeHabitat(t),animals=createWildlife(habitat,world.blocks);
 expect(animals.length).toBeLessThanOrEqual(WILDLIFE_LIMIT);
 expect(animals.filter(a=>a.type==='camel'&&a.active)).toHaveLength(3);
 for(const a of animals.filter(a=>a.active))expect(animalSurface(a.type,a.x,a.z,habitat,world.blocks)).toBe(a.y);
 expect(animals.filter(a=>a.type==='fennec'&&a.active)).toHaveLength(4);
 expect(t.cubes.every(c=>Math.abs(c.pos[0])<=49&&Math.abs(c.pos[2])<=49&&validPosition(c.pos)&&ALL_BLOCK_TYPES.includes(c.texture))).toBe(true);
});

test('oasis layouts vary by seed and edits reproduce on the same baseline',()=>{
 const config={mapType:'oasis',generator:4},a=generateTerrain('dune',config),b=generateTerrain('mirage',config);
 expect(a.water).not.toEqual(b.water);expect(a.oasis.trees).not.toEqual(b.oasis.trees);
 const base=new Map(a.cubes.map(c=>[c.key,c])),current=new Map(base);current.delete(a.cubes.at(-1).key);
 const raw=serializeTerrain('dune',base,current,config);
 expect(new Map(restoreTerrain(raw,'dune',generateTerrain('dune',config).cubes,validPosition,ALL_BLOCK_TYPES,config).map(c=>[c.key,c]))).toEqual(current);
});

test.each([150,400])('%s oasis keeps trails and trees within the expanded landscape',size=>{
 const t=generateTerrain('willow',{mapType:'oasis',generator:4,size}),limit=size/2-1;
 expect(t.sites.some(s=>s.type==='trail'&&s.z<-size*.3)).toBe(true);
 expect(t.heights.get(`${limit-5},${limit-5}`)).toBeGreaterThanOrEqual(3);
 expect(t.cubes.every(c=>Math.abs(c.pos[0])<=limit&&Math.abs(c.pos[2])<=limit&&c.pos.every(Number.isInteger)&&c.pos[1]>=1&&c.pos[1]<=64)).toBe(true);
},15000);


test('previous oasis generation remains unchanged',()=>{
 const t=generateTerrain('willow',{mapType:'oasis',generator:3});
 expect(createHash('sha256').update(JSON.stringify(t.cubes)).digest('hex')).toBe('d6be3660bbf986ef1495363d6be5a464d918f8c4eec467cebb7e3d19ccb7f45d');
});

test('desert animals move safely and respect a low overhead obstruction',()=>{
 const t=generateTerrain('willow',{mapType:'oasis',generator:4}),world=createVoxelWorld(t.cubes),habitat=wildlifeHabitat(t),animals=createWildlife(habitat,world.blocks);
 const before=animals.filter(a=>['camel','fennec'].includes(a.type)).map(a=>[a.x,a.z]);
 for(let i=0;i<600;i++)stepWildlife(animals,habitat,world.blocks,{x:0,z:10},1/60);
 const desert=animals.filter(a=>['camel','fennec'].includes(a.type));
 expect(desert.some((a,i)=>Math.hypot(a.x-before[i][0],a.z-before[i][1])>.1)).toBe(true);
 for(const a of animals.filter(a=>a.active))expect(animalSurface(a.type,a.x,a.z,habitat,world.blocks)).toBe(a.y);
 const a=animals.find(a=>a.type==='camel'&&a.active),x=Math.round(a.x-1.4),z=Math.round(a.z-1.4),y=habitat.heights.get(`${x},${z}`)+3;
 world.blocks.set(`${x},${y},${z}`,{texture:'sandstone',pos:[x,y,z]});
 expect(animalSurface('camel',a.x,a.z,habitat,world.blocks)).toBe(null);
});
