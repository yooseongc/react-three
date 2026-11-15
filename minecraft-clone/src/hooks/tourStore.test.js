beforeEach(()=>{localStorage.clear();vi.resetModules();history.replaceState({},'', '/react-three/?world=tour-save&map=forest&size=100&gen=2&tour=1');});
afterEach(()=>{history.replaceState({},'', '/react-three/');vi.resetModules();});
test('temporary tour never restores or overwrites world saves, recent world, or preferences',async()=>{
 const key='voxel-garden.terrain.v3.forest.100.tour-save';
 localStorage.setItem(key,'broken existing save');localStorage.setItem('voxel-garden.recent.v1','?slot=original');
 localStorage.setItem('voxel-garden.settings.v1',JSON.stringify({dayCycle:false,weatherMode:'snow'}));
 const before={...localStorage};const {useStore}=await import('./useStore');const s=useStore.getState();
 expect(s.canSave).toBe(false);expect(s.dayCycle).toBe(true);expect(['clear','cloudy','rain','fog','snow']).toContain(s.weatherMode);
 expect(s.saveWorld()).toBe(false);s.updateSettings({timeOfDay:18,ambienceEnabled:false});
 expect({...localStorage}).toEqual(before);expect(s.cubes.length).toBeGreaterThan(10000);
});
