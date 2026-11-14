import { generateTerrain,serializeTerrain } from './terrain';
import { parseTransfer } from './transfer';
import { validPosition,ALL_BLOCK_TYPES } from './world';
import { mapLimit } from './mapConfig';
import { roofHeights,roofAt } from './weather';

test('400 terrain, outer landmarks, edge edits and imports preserve the expanded boundary',()=>{
 const config={mapType:'islands',size:400,generator:2},terrain=generateTerrain('willow',config),limit=mapLimit(config);
 expect(limit).toBe(199);expect(terrain.heights.size).toBe(399*399);
 expect(terrain.cubes.every(c=>validPosition(c.pos,limit)&&ALL_BLOCK_TYPES.includes(c.texture))).toBe(true);
 expect(terrain.sites.some(s=>Math.abs(s.x)>100||Math.abs(s.z)>100)).toBe(true);
 const base=new Map(terrain.cubes.map(c=>[c.key,c])),current=new Map(base);
 const pos=[199,30,-199],key=pos.join(',');current.set(key,{key,pos,texture:'lantern'});
 const file={...JSON.parse(serializeTerrain('willow',base,current,config)),format:'voxel-garden',kind:'terrain'};
 expect(file.edits).toEqual([{pos,texture:'lantern'}]);
 const restored=parseTransfer(JSON.stringify(file));expect(restored.size).toBe(400);expect(restored.cubes.at(-1)).toEqual({key,pos,texture:'lantern'});
 expect(validPosition([200,30,0],limit)).toBe(false);
 const roofs=roofHeights(new Map([[key,{pos}]]),limit);expect(roofAt(roofs,199,-199)).toBe(30.5);
},20000);
