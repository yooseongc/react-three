import { exportWorld, parseTransfer, safeWorldQuery, listWorlds, MAX_IMPORT_BYTES } from './transfer';
import { loadSettings, cleanSettings, SETTINGS_KEY } from './settings';
const cubes=[{key:'0,1,0',pos:[0,1,0],texture:'brick'}];
test('flat and terrain exports round-trip including empty worlds and unicode seed',()=>{
 for(const seed of [null,'물빛🌿'])for(const blocks of [[],cubes]){
 const file=exportWorld(blocks,seed);expect(parseTransfer(JSON.stringify(file))).toEqual(file);
 }
});
test('legacy saves are imported as strict flat copies',()=>{
 expect(parseTransfer(JSON.stringify(cubes)).kind).toBe('flat');
 expect(parseTransfer(JSON.stringify({version:1,cubes})).cubes).toEqual(cubes);
});
test.each(['{broken',JSON.stringify({format:'other',version:1,cubes}),JSON.stringify(exportWorld([...cubes,...cubes])),JSON.stringify(exportWorld([{pos:[0,500,0],texture:'brick'}])),JSON.stringify(exportWorld([{pos:[0,1,0],texture:'unknown'}])),JSON.stringify({...exportWorld(cubes,'willow'),generator:2}),JSON.stringify({...exportWorld(cubes,'willow'),seed:''})])('rejects malformed or incompatible data: %s',raw=>{
 expect(()=>parseTransfer(raw)).toThrow();
});
test('import limits bound parsing and world size',()=>{
 expect(()=>parseTransfer(' '.repeat(MAX_IMPORT_BYTES+1))).toThrow();
 expect(()=>parseTransfer(JSON.stringify(exportWorld(Array(150001).fill(null))))).toThrow();
});
test('world links cannot navigate to outside origins or unknown modes',()=>{
 for(const value of ['https://evil.test','//evil.test','?slot=../x','?world=a&demo=build','?demo=benchmark',null])expect(safeWorldQuery(value)).toBeNull();
 expect(safeWorldQuery('?world=숲')).toBe('?world='+encodeURIComponent('숲'));
 expect(safeWorldQuery('?slot=abc-123')).toBe('?slot=abc-123');
});
test('world listing ignores backups and unrelated keys',()=>{
 localStorage.clear();localStorage.setItem('voxel-garden.terrain.v1.willow','{}');localStorage.setItem('voxel-garden.terrain.v1.willow.backup','{}');localStorage.setItem('unrelated','{}');
 expect(listWorlds(localStorage)).toHaveLength(2);
});
test('settings clamp sensitivity and recover from corrupt or denied storage',()=>{
 expect(cleanSettings({sensitivity:999,shadows:false,soundEnabled:'yes'})).toEqual({sensitivity:2,shadows:false,soundEnabled:true,showMinimap:true,dayCycle:true,timeOfDay:9,landscapeMotion:true,weatherMode:'auto',ambienceEnabled:true,ambienceVolume:.45});
 expect(loadSettings(null).sensitivity).toBe(1);
 localStorage.setItem(SETTINGS_KEY,'broken');expect(loadSettings(localStorage).soundEnabled).toBe(true);
});
