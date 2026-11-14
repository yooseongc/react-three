import { expect, test } from 'vitest';
import { clearTouchInput, stickAxes, touchInput } from './touch';
import { stepPlayer } from './world';
import { createVoxelWorld } from './voxels';

test('stick deadzone, proportional input and diagonal limit',()=>{
  expect(stickAxes(3,4)).toEqual({moveForward:0,moveRight:0});
  expect(stickAxes(0,-22)).toEqual({moveForward:.5,moveRight:0});
  const axes=stickAxes(100,-100);
  expect(Math.hypot(axes.moveForward,axes.moveRight)).toBeCloseTo(1);
});
test('analog movement follows heading and preserves half-speed input',()=>{
  const p={x:0,y:.5,z:0,vy:0,grounded:true},world=createVoxelWorld([]);
  const half=stepPlayer(p,{moveForward:.5},0,.05,world);
  const full=stepPlayer(p,{moveForward:1},0,.05,world);
  expect(half.z).toBeCloseTo(full.z/2);
  const turned=stepPlayer(p,{moveForward:1},Math.PI/2,.05,world);
  expect(turned.x).toBeLessThan(0);expect(turned.z).toBeCloseTo(0);
});
test('reset clears held movement, jump and queued look deltas',()=>{
  Object.assign(touchInput,{moveForward:1,moveRight:1,ascend:true,descend:true,jump:true,lookX:300,lookY:100});
  clearTouchInput();
  expect(Object.values(touchInput).every(value=>!value)).toBe(true);
});
