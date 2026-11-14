import { exportWorld, SLOT_PREFIX } from '../game/transfer';
beforeEach(()=>{localStorage.clear();history.replaceState({},'', '/react-three/?slot=test-copy');vi.resetModules();});
afterEach(()=>history.replaceState({},'', '/react-three/'));
test('imported terrain keeps seed and saves edits to its own full snapshot',async()=>{
 const key=SLOT_PREFIX+'test-copy',cube={key:'0,1,0',pos:[0,1,0],texture:'wood'};
 localStorage.setItem(key,JSON.stringify(exportWorld([cube],'willow')));
 localStorage.setItem('voxel-garden.terrain.v1.willow','original');
 const {useStore}=await import('./useStore');expect(useStore.getState().cubes).toEqual([cube]);
 useStore.getState().setTexture('brick');useStore.getState().addCube(1,1,0);useStore.getState().saveWorld();
 const saved=JSON.parse(localStorage.getItem(key));expect(saved.seed).toBe('willow');expect(saved.cubes).toHaveLength(2);
 expect(localStorage.getItem('voxel-garden.terrain.v1.willow')).toBe('original');
});
test('missing or broken copy cannot overwrite any existing world',async()=>{
 localStorage.setItem(SLOT_PREFIX+'test-copy','broken');const {useStore}=await import('./useStore');
 expect(useStore.getState().canSave).toBe(false);expect(useStore.getState().saveWorld()).toBe(false);
 expect(localStorage.getItem(SLOT_PREFIX+'test-copy')).toBe('broken');
});
