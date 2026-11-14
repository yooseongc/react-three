import { createHash } from 'node:crypto';
import { generateTerrain,serializeTerrain,restoreTerrain } from './terrain';
import { MAP_TYPES,mapLimit,terrainKey,terrainQuery } from './mapConfig';
import { exportWorld,parseTransfer,safeWorldQuery,listWorlds } from './transfer';
import { validPosition,ALL_BLOCK_TYPES } from './world';
import { roofHeights,roofAt } from './weather';

test('original generator output and storage key are unchanged',()=>{
  const t=generateTerrain('willow');
  expect(createHash('sha256').update(JSON.stringify(t.cubes)).digest('hex')).toBe('013f81ff18f349c436a72e6f6ad648495d356431f7e957ee2809a4b8b5b4e84d');
  expect(terrainKey('willow')).toBe('voxel-garden.terrain.v1.willow');
});
test.each(Object.keys(MAP_TYPES))('%s generation is repeatable and bounded at 150',mapType=>{
  const config={mapType,size:150},a=generateTerrain('test',config),b=generateTerrain('test',config),limit=mapLimit(config);
  expect(a.cubes).toEqual(b.cubes);expect(a.heights.size).toBe(149*149);
  expect(a.cubes.every(c=>validPosition(c.pos,limit))).toBe(true);
  expect(a.heights.get('0,10')).toBeGreaterThanOrEqual(3);
  if(mapType==='snow')expect(a.cubes.some(c=>c.texture==='snow')).toBe(true);
  if(mapType==='islands')expect(a.water.length).toBeGreaterThan(8000);
});
test('large delta export/import preserves edge edits and configuration without a full snapshot',()=>{
  const config={mapType:'snow',size:200},t=generateTerrain('edge',config),cubes=[...t.cubes,{key:'99,30,99',pos:[99,30,99],texture:'brick'}];
  const file=exportWorld(cubes,t.seed,config),raw=JSON.stringify(file);
  expect(raw.length).toBeLessThan(500);expect(file.edits).toHaveLength(1);
  const restored=parseTransfer(raw);expect(restored.size).toBe(200);expect(restored.mapType).toBe('snow');expect(restored.cubes).toEqual(cubes);
  expect(()=>parseTransfer(JSON.stringify({...file,size:10000}))).toThrow();
  expect(()=>parseTransfer(JSON.stringify({...file,mapType:'unknown'}))).toThrow();
});
test('save identity separates maps and rejects applying a delta to another map',()=>{
  const config={mapType:'meadow',size:150},t=generateTerrain('same',config),base=new Map(t.cubes.map(c=>[c.key,c]));
  const raw=serializeTerrain('same',base,base,config);
  expect(()=>restoreTerrain(raw,'same',t.cubes,p=>validPosition(p,74),ALL_BLOCK_TYPES)).toThrow();
  expect(terrainKey('same',config)).not.toBe(terrainKey('same'));
  expect(safeWorldQuery(terrainQuery('a.b🌿',config))).toBe(terrainQuery('a.b🌿',config));
  expect(safeWorldQuery('?world=a&map=evil&size=200')).toBeNull();
  localStorage.clear();localStorage.setItem(terrainKey('a.b🌿',config),raw);
  expect(listWorlds(localStorage)[1].query).toBe(terrainQuery('a.b🌿',config));
});
test('weather roof coverage reaches the expanded world boundary',()=>{
  const roofs=roofHeights(new Map([['edge',{pos:[99,15,-99]}]]),99);
  expect(roofAt(roofs,99,-99)).toBe(15.5);expect(roofAt(roofs,100,-100)).toBe(.5);
});
