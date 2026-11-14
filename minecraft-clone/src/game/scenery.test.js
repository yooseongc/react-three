import {generateTerrain} from './terrain';
import {exportWorld,parseTransfer,safeWorldQuery,listWorlds} from './transfer';
import {terrainKey,terrainQuery} from './mapConfig';
import {validPosition,ALL_BLOCK_TYPES} from './world';
test.each(['forest','meadow','islands','snow'])('new %s landscape has water, stone ridges and a clear spawn',mapType=>{
 const t=generateTerrain('willow',{mapType,generator:2});
 expect(t.water.length).toBeGreaterThan(300);expect(t.heights.get('0,10')).toBe(5);
 expect(t.cubes.every(c=>validPosition(c.pos,49)&&ALL_BLOCK_TYPES.includes(c.texture))).toBe(true);
 expect(new Set(t.cubes.map(c=>c.key)).size).toBe(t.cubes.length);
 expect(t.cubes.filter(c=>c.pos[0]===0&&c.pos[2]===10).at(-1).pos[1]).toBe(5);
 expect(t.sites.filter(s=>s.type!=='bridge').length).toBeGreaterThanOrEqual(2);
 expect(t.cubes.some(c=>c.texture==='lantern')).toBe(true);
 for(const site of t.sites.filter(s=>s.type==='cabin')){
   const blocks=new Map(t.cubes.map(c=>[c.key,c])),floor=site.y-.5;
   expect(blocks.has([site.x,floor+1,site.z+3].join(','))).toBe(false);
   expect(blocks.has([site.x,floor+2,site.z+3].join(','))).toBe(false);
   expect(blocks.has([site.x,floor,site.z+3].join(','))).toBe(true);
 }
});
test('new landscape edits roundtrip with a separate identity and unknown generations are rejected',()=>{
 const config={mapType:'forest',size:100,generator:2},t=generateTerrain('willow',config);
 const cubes=t.cubes.slice(1),file=exportWorld(cubes,t.seed,config),restored=parseTransfer(JSON.stringify(file));
 expect(restored.cubes).toEqual(cubes);expect(restored.generator).toBe(2);
 expect(terrainKey(t.seed,config)).not.toBe(terrainKey(t.seed));
 expect(safeWorldQuery(terrainQuery(t.seed,config))).toBe('?world=willow&gen=2');
 expect(safeWorldQuery('?world=a&gen=99')).toBeNull();
 localStorage.setItem(terrainKey(t.seed,config),JSON.stringify(file));
 expect(listWorlds(localStorage).some(w=>w.query==='?world=willow&gen=2')).toBe(true);
});
