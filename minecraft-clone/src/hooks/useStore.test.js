import { useStore } from './useStore';
import { STORAGE_KEY } from '../game/world';
import { createVoxelWorld } from '../game/voxels';

beforeEach(() => {
  localStorage.clear();
  useStore.setState({ cubes: [], world: createVoxelWorld([]), dirty: false, canSave: true, texture: 'wood', undoStack: [], redoStack: [] });
});

test('duplicate positions are rejected and removing a missing block is a no-op', () => {
  useStore.getState().addCube(1, 1, 1);
  useStore.getState().addCube(1, 1, 1);
  expect(useStore.getState().cubes).toHaveLength(1);
  useStore.getState().removeCube(2, 1, 1);
  expect(useStore.getState().cubes).toHaveLength(1);
});

test('save and deletion serialize current state, including an empty world', () => {
  useStore.getState().addCube(1, 1, 1);
  expect(useStore.getState().saveWorld()).toBe(true);
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).cubes[0].texture).toBe('wood');
  useStore.getState().removeCube(1, 1, 1);
  useStore.getState().saveWorld();
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual({ version: 1, cubes: [] });
  expect(useStore.getState().dirty).toBe(false);
});

test('quota errors retain unsaved changes and allow retry', () => {
  useStore.getState().addCube(1, 1, 1);
  const fail = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('quota'); });
  expect(useStore.getState().saveWorld()).toBe(false);
  expect(useStore.getState().dirty).toBe(true);
  expect(useStore.getState().saveStatus).toContain('저장 실패');
  fail.mockRestore();
  expect(useStore.getState().saveWorld()).toBe(true);
});
