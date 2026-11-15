import { stepCameraOffset } from './stepCamera';
import { stepPlayer,spawnPosition } from './world';

test('a physical step stays solid while its initial camera rise is softened',()=>{
 const blocks=[{pos:[0,1,9],texture:'stone'}];
 let p=spawnPosition([]),offset=0,previousEye=p.y+1.62,sawStep=false;
 for(let i=0;i<40;i++){
  p=stepPlayer(p,{forward:true,autoStep:true},0,1/60,blocks);
  offset=stepCameraOffset(offset,p.stepRise,1/60);
  const eye=p.y+1.62+offset;
  if(p.stepRise){sawStep=true;expect(p.y).toBe(1.5);expect(eye-previousEye).toBeGreaterThan(0);expect(eye-previousEye).toBeLessThan(.2);}
  previousEye=eye;
 }
 expect(sawStep).toBe(true);
});

test('the eye settles without overshoot at different frame rates',()=>{
 const results=[30,60,120].map(fps=>{let offset=-1;for(let i=0;i<fps/2;i++){const next=stepCameraOffset(offset,0,1/fps);expect(next).toBeGreaterThanOrEqual(offset);expect(next).toBeLessThanOrEqual(0);offset=next;}return offset;});
 expect(results[0]).toBeCloseTo(results[1],6);expect(results[1]).toBeCloseTo(results[2],6);expect(Math.abs(results[0])).toBeLessThan(.005);
});

test('jumping and flight clear the step offset; repeated stairs cannot lower eyes into the floor',()=>{
 expect(stepCameraOffset(-.6,0,1/60,true)).toBe(0);
 expect(stepCameraOffset(0,0,1/60)).toBe(0);
 expect(stepCameraOffset(-.8,1,1/60)).toBeGreaterThan(-1);
});
