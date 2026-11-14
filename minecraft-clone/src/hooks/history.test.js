import { useStore, HISTORY_LIMIT } from './useStore';
import { createVoxelWorld } from '../game/voxels';
const away={x:40,y:20,z:40};
beforeEach(()=>{localStorage.clear();useStore.setState({cubes:[],world:createVoxelWorld([]),undoStack:[],redoStack:[],historyNotice:'',dirty:false,canSave:true,texture:'brick'});});
test('undo and redo preserve material, dirty state, and boundary chunk updates',()=>{
  const s=useStore.getState();s.addCube(-1,2,0);s.addCube(0,2,0);s.removeCube(-1,2,0);
  expect(s.undoEdit(away)).toBe(true);
  expect(useStore.getState().world.blocks.get('-1,2,0').texture).toBe('brick');
  expect(useStore.getState().world.lastChanged).toContain('0,0,0');
  s.saveWorld();expect(useStore.getState().dirty).toBe(false);
  expect(s.redoEdit(away)).toBe(true);expect(useStore.getState().dirty).toBe(true);
  expect(useStore.getState().world.blocks.has('-1,2,0')).toBe(false);
});
test('blocked restoration retains history and can be retried after moving',()=>{
  const s=useStore.getState();s.addCube(0,1,0);s.removeCube(0,1,0);
  expect(s.undoEdit({x:0,y:.5,z:0})).toBe(false);
  expect(useStore.getState().undoStack).toHaveLength(2);
  expect(s.undoEdit(away)).toBe(true);
  s.undoEdit(away);
  expect(s.redoEdit({x:0,y:.5,z:0})).toBe(false);
  expect(useStore.getState().redoStack).toHaveLength(2);
});
test('only successful new edits clear redo, and history has a fixed limit',()=>{
  const s=useStore.getState();s.addCube(0,1,0);s.undoEdit(away);
  s.addCube(50,1,0);expect(useStore.getState().redoStack).toHaveLength(1);
  s.removeCube(8,1,0);expect(useStore.getState().redoStack).toHaveLength(1);
  s.addCube(1,1,0);expect(useStore.getState().redoStack).toHaveLength(0);
  for(let i=0;i<110;i++){s.addCube(2,1,0);s.removeCube(2,1,0);}
  expect(useStore.getState().undoStack).toHaveLength(HISTORY_LIMIT);
});
test('world mismatch refuses replay instead of overwriting a changed cell',()=>{
  const s=useStore.getState();s.addCube(0,1,0);
  useStore.setState({world:createVoxelWorld([{pos:[0,1,0],texture:'glass'}])});
  expect(s.undoEdit(away)).toBe(false);expect(useStore.getState().world.blocks.get('0,1,0').texture).toBe('glass');
});
