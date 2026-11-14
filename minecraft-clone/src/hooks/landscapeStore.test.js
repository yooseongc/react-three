import { generateTerrain, serializeTerrain } from '../game/terrain';
const key='voxel-garden.terrain.v1.willow';
beforeEach(()=>{localStorage.clear();history.replaceState({},'', '/react-three/?world=willow');vi.resetModules();});
afterEach(()=>{history.replaceState({},'', '/react-three/');vi.restoreAllMocks();});
test('valid landscape saves do not create recovery backups or touch the personal world',async()=>{
 const t=generateTerrain('willow'),base=new Map(t.cubes.map(c=>[c.key,c])),current=new Map(base);
 current.delete('0,5,10');
 localStorage.setItem(key,serializeTerrain('willow',base,current));localStorage.setItem('voxel-garden.world.v1','personal-original');
 const {useStore}=await import('./useStore');
 expect(useStore.getState().world.blocks.has('0,5,10')).toBe(false);
 expect(localStorage.getItem(key+'.backup')).toBeNull();
 useStore.getState().saveWorld();
 expect(localStorage.getItem('voxel-garden.world.v1')).toBe('personal-original');
});
test('corrupt landscape save is backed up before regeneration',async()=>{
 localStorage.setItem(key,'{broken');const {useStore}=await import('./useStore');
 expect(localStorage.getItem(key+'.backup')).toBe('{broken');
 expect(useStore.getState().world.blocks.has('0,5,10')).toBe(true);
 expect(useStore.getState().notice).toContain('복원');
});
test('storage failure disables saving and still provides terrain',async()=>{
 vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw Error('denied')});
 const {useStore}=await import('./useStore');
 expect(useStore.getState().canSave).toBe(false);expect(useStore.getState().cubes.length).toBeGreaterThan(30000);
});
test('another seed does not load the willow edits',async()=>{
 localStorage.setItem(key,'willow-untouched');history.replaceState({},'', '/react-three/?world=cedar');
 const {useStore}=await import('./useStore');useStore.getState().saveWorld();
 expect(localStorage.getItem(key)).toBe('willow-untouched');
 expect(JSON.parse(localStorage.getItem('voxel-garden.terrain.v1.cedar')).seed).toBe('cedar');
});
