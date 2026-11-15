import { createHash } from 'node:crypto';
import { generateTerrain,serializeTerrain,restoreTerrain } from './terrain';
import { validPosition,ALL_BLOCK_TYPES,spawnPosition } from './world';
import { createVoxelWorld } from './voxels';
import { wildlifeHabitat,createWildlife,animalSurface } from './wildlife';
test.each(['willow','breeze','cloud','stars','구름'])('%s sky terraces and animals stay valid',seed=>{
 const t=generateTerrain(seed,{mapType:'sky',generator:4}),world=createVoxelWorld(t.cubes),h=wildlifeHabitat(t),animals=createWildlife(h,world.blocks);
 expect(spawnPosition(t.cubes).y).toBe(26.5);expect(new Set(t.sky.islands.map(i=>i.y)).size).toBeGreaterThan(3);
 expect(t.flowers.length).toBeGreaterThan(30);expect(t.sites.map(s=>s.type)).toEqual(expect.arrayContaining(['observatory','pavilion','garden','lookout']));
 expect(animals.filter(a=>a.active&&a.type==='butterfly')).toHaveLength(5);
 for(const a of animals.filter(a=>a.active))expect(animalSurface(a.type,a.x,a.z,h,world.blocks)).toBe(a.y);
 expect(t.cubes.every(c=>validPosition(c.pos)&&ALL_BLOCK_TYPES.includes(c.texture)&&Math.abs(c.pos[0])<=49&&Math.abs(c.pos[2])<=49)).toBe(true);
 const base=new Map(t.cubes.map(c=>[c.key,c])),edited=new Map(base);edited.delete(t.cubes.at(-1).key);const config={mapType:'sky',generator:4};
 expect(new Map(restoreTerrain(serializeTerrain(seed,base,edited,config),seed,t.cubes,validPosition,ALL_BLOCK_TYPES,config).map(c=>[c.key,c]))).toEqual(edited);
});
test.each([150,400])('%s sky expands floating islands within bounds',size=>{
 const t=generateTerrain('willow',{mapType:'sky',generator:4,size});expect(t.sky.islands.length).toBeGreaterThan(5);
 expect(t.cubes.every(c=>c.pos.every(Number.isInteger)&&c.pos[1]>=1&&c.pos[1]<=64&&Math.abs(c.pos[0])<size/2&&Math.abs(c.pos[2])<size/2)).toBe(true);
},15000);

test('previous sky generation remains unchanged',()=>{expect(createHash('sha256').update(JSON.stringify(generateTerrain('willow',{mapType:'sky',generator:3}).cubes)).digest('hex')).toBe('302d06d45f237c8402b40f431191023620a7d4c77b36a5abb7854b0006e8b0b0');});
