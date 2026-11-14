import { exportWorld, parseTransfer, SLOT_PREFIX } from '../game/transfer';
beforeEach(()=>{localStorage.clear();history.replaceState({},'', '/react-three/?slot=test-copy');vi.resetModules();});
afterEach(()=>history.replaceState({},'', '/react-three/'));
test('imported terrain keeps seed and saves a reconstructable delta to its own slot',async()=>{
 const key=SLOT_PREFIX+'test-copy',cube={key:'0,1,0',pos:[0,1,0],texture:'wood'};
 localStorage.setItem(key,JSON.stringify(exportWorld([cube],'willow')));
 localStorage.setItem('voxel-garden.terrain.v1.willow','original');
 const {useStore}=await import('./useStore');expect(useStore.getState().cubes).toEqual([cube]);
 useStore.getState().setTexture('brick');useStore.getState().addCube(1,1,0);useStore.getState().saveWorld();
 const saved=parseTransfer(localStorage.getItem(key));expect(saved.seed).toBe('willow');expect(saved.cubes).toHaveLength(2);
 expect(localStorage.getItem('voxel-garden.terrain.v1.willow')).toBe('original');
});
test('missing or broken copy cannot overwrite any existing world',async()=>{
 localStorage.setItem(SLOT_PREFIX+'test-copy','broken');const {useStore}=await import('./useStore');
 expect(useStore.getState().canSave).toBe(false);expect(useStore.getState().saveWorld()).toBe(false);
 expect(localStorage.getItem(SLOT_PREFIX+'test-copy')).toBe('broken');
});
test('large imported copies restore their boundary and retain edge edits',async()=>{
 const {generateTerrain}=await import('../game/terrain');
 const config={mapType:'islands',size:200},terrain=generateTerrain('large',config);
 const key=SLOT_PREFIX+'test-copy';localStorage.setItem(key,JSON.stringify(exportWorld(terrain.cubes,'large',config)));
 vi.resetModules();
 const {useStore}=await import('./useStore');
 expect(useStore.getState().addCube(99,30,-99)).toBe(true);
 expect(useStore.getState().addCube(100,30,-99)).toBe(false);
 expect(useStore.getState().saveWorld()).toBe(true);
 const saved=parseTransfer(localStorage.getItem(key));
 expect(saved.size).toBe(200);expect(saved.mapType).toBe('islands');
 expect(saved.cubes.some(c=>c.key==='99,30,-99')).toBe(true);
});

test('new scenery copy preserves its generator and lamp removal across reload',async()=>{
 const {generateTerrain}=await import('../game/terrain');
 const config={mapType:'forest',size:100,generator:2},terrain=generateTerrain('willow',config);
 const lamp=terrain.cubes.find(c=>c.texture==='lantern'),key=SLOT_PREFIX+'test-copy';
 localStorage.setItem(key,JSON.stringify(exportWorld(terrain.cubes,'willow',config)));
 vi.resetModules();let {useStore}=await import('./useStore');
 useStore.getState().removeCube(...lamp.pos);expect(useStore.getState().saveWorld()).toBe(true);
 const data=JSON.parse(localStorage.getItem(key));expect(data.generator).toBe(2);expect(data.edits).toEqual([{pos:lamp.pos,texture:null}]);
 vi.resetModules();({useStore}=await import('./useStore'));
 expect(useStore.getState().world.blocks.has(lamp.key)).toBe(false);
 expect(useStore.getState().cubes.length).toBe(terrain.cubes.length-1);
});
