import { checkpoint,checkpoints,copyWorld,deleteWorld,worldMeta,nameWorld,worldKey } from './library';
beforeEach(()=>localStorage.clear());
test('copies have independent payloads and names',()=>{
  const data={version:1,cubes:[]},a=copyWorld(localStorage,data,'작은 숲'),b=copyWorld(localStorage,data,'다른 숲');
  expect(a).not.toBe(b);nameWorld(localStorage,a,'새 이름');expect(worldMeta(localStorage,b).name).toBe('다른 숲');
  expect(()=>deleteWorld(localStorage,a,a)).toThrow();deleteWorld(localStorage,a,b);
  expect(localStorage.getItem(worldKey(a))).toBeNull();expect(localStorage.getItem(worldKey(b))).not.toBeNull();
});
test('checkpoints retain two immutable snapshots and quota errors preserve the previous ones',()=>{
  checkpoint(localStorage,'?',{format:'voxel-garden',n:1});checkpoint(localStorage,'?',{format:'voxel-garden',n:2});checkpoint(localStorage,'?',{format:'voxel-garden',n:3});
  expect(checkpoints(localStorage,'?').map(x=>x.data.n)).toEqual([3,2]);
  const failing={getItem:k=>localStorage.getItem(k),setItem:()=>{throw Error('quota');}};
  expect(()=>checkpoint(failing,'?',{n:4})).toThrow();expect(checkpoints(localStorage,'?')[0].data.n).toBe(3);
});
