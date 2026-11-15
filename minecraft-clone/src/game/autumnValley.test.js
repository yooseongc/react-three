import { generateTerrain,serializeTerrain,restoreTerrain } from './terrain';
import { createVoxelWorld } from './voxels';
import { spawnPosition,stepPlayer,ALL_BLOCK_TYPES,validPosition } from './world';
import { terrainKey } from './mapConfig';
import { createHash } from 'node:crypto';

test.each(['willow','amber','maple','mist','가을'])('%s valley has a walkable loop through its landmarks',seed=>{
 const t=generateTerrain(seed,{mapType:'autumn',generator:4}),world=createVoxelWorld(t.cubes);
 expect(t.sites.map(s=>s.type)).toEqual(expect.arrayContaining(['house','mill','overlook','grove','riverbank','cave']));
 expect(t.valley.trees.length).toBeGreaterThan(30);
 expect(new Set(t.valley.trees.map(t=>t.trunk)).size).toBeGreaterThan(2);
 let p=spawnPosition(t.cubes);expect(p.y).toBe(4.5);
 const route=t.valley.walkRoute.slice(1).flatMap(p=>p[0]===-29&&p[1]===15?[p,[-29,26],p]:[p]);
 for(const [x,z] of route){
  const budget=Math.ceil(Math.hypot(x-p.x,z-p.z)/4.5*60)+240;
  for(let i=0;i<budget&&Math.hypot(x-p.x,z-p.z)>.15;i++){
   p=stepPlayer(p,{forward:true,autoStep:t.walkwaySteps.has(Math.round(p.x)+','+Math.round(p.z))||t.caves.some(c=>Math.abs(p.x-c.x)<2&&p.z>=c.minZ-2&&p.z<=c.maxZ+2)},Math.atan2(-(x-p.x),-(z-p.z)),1/60,world);
  }
  expect(Math.hypot(x-p.x,z-p.z),JSON.stringify({seed,target:[x,z],actual:p})).toBeLessThan(.2);
 }
 expect(t.cubes.every(c=>Math.abs(c.pos[0])<=49&&Math.abs(c.pos[2])<=49&&c.pos[1]>=1&&c.pos[1]<=64&&ALL_BLOCK_TYPES.includes(c.texture))).toBe(true);
 expect(t.rotors.some(r=>r.type==='water')).toBe(true);
});

test('valley seeds change waterways and tree clusters and reproduce edited saves',()=>{
 const config={mapType:'autumn',generator:4},a=generateTerrain('amber',config),b=generateTerrain('maple',config);
 expect(a.water).not.toEqual(b.water);expect(a.valley.trees).not.toEqual(b.valley.trees);
 const edited=a.cubes.filter(c=>c.key!==a.chimneys[0].anchor);
 const base=new Map(a.cubes.map(c=>[c.key,c])),current=new Map(edited.map(c=>[c.key,c]));
 const restored=restoreTerrain(serializeTerrain('amber',base,current,config),'amber',generateTerrain('amber',config).cubes,validPosition,ALL_BLOCK_TYPES,config);
 expect(restored).toEqual(edited);
 expect(terrainKey('amber',config)).not.toBe(terrainKey('amber',{...config,generator:3}));
});

test('generation 3 autumn remains unchanged',()=>{
 const t=generateTerrain('willow',{mapType:'autumn',generator:3});
 expect(createHash('sha256').update(JSON.stringify(t.cubes)).digest('hex')).toBe('53784e840c904fc5c3b9915e872b6d30952804d446a09e4f2adf448f9963ad27');
});

test.each([150,400])('%s valley expands its river trail and stays within bounds',size=>{
 const t=generateTerrain('willow',{mapType:'autumn',generator:4,size}),limit=size/2-1;
 expect(t.sites.some(s=>s.type==='trail'&&s.z<-size*.3)).toBe(true);
 expect(t.valley.trees.some(t=>Math.abs(t.x)>size*.35)).toBe(true);
 expect(t.cubes.every(c=>Math.abs(c.pos[0])<=limit&&Math.abs(c.pos[2])<=limit&&c.pos[1]>=1&&c.pos[1]<=64)).toBe(true);
},15000);
