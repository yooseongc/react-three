import { MAP_CATALOG,mapChoiceQuery,randomSeed } from './mapCatalog';
import { listWorlds,safeWorldQuery } from './transfer';
import { libraryWorlds } from './library';
import { terrainKey } from './mapConfig';

test('six map choices use integrated scenery or their existing building worlds',()=>{
  expect(MAP_CATALOG).toHaveLength(6);
  for(const id of ['forest','meadow','islands','snow']){
    const q=mapChoiceQuery(id,' my garden ',150);
    expect(new URLSearchParams(q).get('gen')).toBe('2');
    expect(new URLSearchParams(q).get('world')).toBe('my garden');
    expect(safeWorldQuery(q)).toBe(q);
  }
  expect(mapChoiceQuery('house','',100)).toBe('?demo=build');
  expect(mapChoiceQuery('flat','',100)).toBe('?');
  expect(()=>mapChoiceQuery('forest',' ',100)).toThrow();
});
test('old saves and small-house saves remain reachable without a scenery selector',()=>{
  localStorage.clear();
  localStorage.setItem(terrainKey('old-garden'),JSON.stringify({version:2,generator:1,seed:'old-garden',edits:[]}));
  localStorage.setItem('voxel-garden.m4-demo.v1',JSON.stringify({version:1,cubes:[]}));
  expect(libraryWorlds(localStorage).map(w=>w.query)).toEqual(expect.arrayContaining(['?world=old-garden','?demo=build']));
  expect(listWorlds(localStorage).find(w=>w.query==='?demo=build').label).toBe('작은 집');
});

test('random seeds produce valid reproducible world addresses at size 400',()=>{
 const a=randomSeed(),b=randomSeed();expect(a).not.toBe(b);expect(a.length).toBeLessThanOrEqual(64);
 const q=mapChoiceQuery('snow',a,400);expect(safeWorldQuery(q)).toBe(q);
 expect(new URLSearchParams(q).get('size')).toBe('400');
 expect(mapChoiceQuery('snow',a,400)).toBe(q);
});
