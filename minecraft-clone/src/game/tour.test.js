import { Quaternion, Vector3 } from 'three';
import { easeTourRotation, TOUR_TURN_RATE } from './tour';
import { createTourRoute, tourPose, nextTourStop, newTourQuery, tourReturnQuery } from './tour';
import { generateTerrain } from './terrain';
import { isTourQuery } from './tourSession';

test.each(['forest','meadow','islands','snow'])('%s route loops within bounds and clears all terrain and roofs',type=>{
 const terrain=generateTerrain('tour-check',{mapType:type,size:100,generator:2}),route=createTourRoute(terrain);
 const tops=new Map();for(const c of terrain.cubes){const [x,y,z]=c.pos;tops.set(`${x},${z}`,Math.max(tops.get(`${x},${z}`)||0,y+.5));}
 expect(route.shots.length).toBeGreaterThan(2);
 for(let cursor=0;cursor<route.count;cursor+=.5){const {position:p,target}=tourPose(route,cursor);
  expect(Math.abs(p.x)).toBeLessThanOrEqual(42);expect(Math.abs(p.z)).toBeLessThanOrEqual(42);
  expect(p.y).toBeGreaterThan((tops.get(`${Math.round(p.x)},${Math.round(p.z)}`)||3)+2);
  expect(target.toArray().every(Number.isFinite)).toBe(true);
  const next=tourPose(route,cursor+.5).position;expect(next.distanceTo(p)).toBeLessThan(1);
 }
 expect(tourPose(route,0).position.distanceTo(tourPose(route,route.count).position)).toBe(0);
 expect(nextTourStop(route,route.count-1)).toBe(route.shots[0].index);
});
test('temporary tour queries preserve only valid local return worlds',()=>{
 const q=newTourQuery('?slot=original',()=>.7);expect(isTourQuery(q)).toBe(true);
 expect(tourReturnQuery(q)).toBe('?slot=original');
 expect(tourReturnQuery('?return=https://example.com')).toBe('?');
 expect(isTourQuery('?world=x&tour=1&slot=original')).toBe(false);
 expect(isTourQuery('?demo=build')).toBe(false);
});

test('large gaze changes stay within the turn limit and settle without overshooting',()=>{
 const current=new Quaternion(),target=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),Math.PI);
 for(let i=0;i<1200;i++){
  const previous=current.clone(),remaining=current.angleTo(target);
  easeTourRotation(current,target,1/60);
  expect(previous.angleTo(current)).toBeLessThanOrEqual(TOUR_TURN_RATE/60+1e-8);
  expect(current.angleTo(target)).toBeLessThanOrEqual(remaining+1e-8);
 }
 expect(current.angleTo(target)).toBeLessThan(.001);
});
test('camera easing ignores zero delta and bounds a resumed long frame',()=>{
 const q=new Quaternion(),target=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),2);
 expect(easeTourRotation(q.clone(),target,0).angleTo(q)).toBe(0);
 expect(easeTourRotation(q.clone(),target,10).angleTo(q)).toBeLessThanOrEqual(TOUR_TURN_RATE*.05+1e-8);
});
