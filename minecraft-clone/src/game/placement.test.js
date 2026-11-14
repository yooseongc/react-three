import { placementPosition, placementError } from './placement';
import { createVoxelWorld } from './voxels';

const empty = createVoxelWorld([]);
test('preview position follows each face, negative coordinates and ground rounding', () => {
  for (const normal of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) {
    expect(placementPosition({block:[-1,16,0],normal})).toEqual([-1,16,0].map((n,i)=>n+normal[i]));
  }
  expect(placementPosition({ground:true,point:[-1.2,.5,3.3]})).toEqual([-1,1,3]);
  expect(placementPosition(null)).toBeNull();
});
test('placement rejects missing targets, bounds, occupied cells and the player', () => {
  expect(placementError(empty,null)).toContain('6칸');
  expect(placementError(empty,[50,1,0])).toContain('범위');
  expect(placementError(empty,[0,65,0])).toContain('범위');
  expect(placementError(createVoxelWorld([{pos:[0,1,0],texture:'wood'}]),[0,1,0])).toContain('이미');
  expect(placementError(empty,[0,1,0],{x:0,y:.5,z:0})).toContain('플레이어');
  expect(placementError(empty,[0,1,0],{x:0,y:1.5,z:0})).toBe('');
});
