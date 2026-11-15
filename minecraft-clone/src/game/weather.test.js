import { expect, test } from 'vitest';
import { advanceWeatherSchedule, roofAt, roofHeights, stepWeather, weatherDuration } from './weather';
import { cleanSettings } from './settings';
import { ambienceMix } from './ambienceMix';
test('weather blends smoothly and dries more slowly than rain stops',()=>{
  let state={cloud:0,rain:0,wet:0};
  for(let i=0;i<200;i++)state=stepWeather(state,'rain',.1);
  expect(state.rain).toBeGreaterThan(.99);expect(state.wet).toBeGreaterThan(.95);
  const next=stepWeather(state,'clear',.1);
  expect(next.rain).toBeLessThan(state.rain);expect(next.wet).toBeGreaterThan(next.rain);
  expect(stepWeather(state,'clear',0)).toEqual(state);
  expect(stepWeather(state,'clear',100)).toEqual(next);
});
test('roof blocks shelter rain; deleting the highest block exposes the lower surface',()=>{
  const blocks=new Map([['ground',{pos:[0,1,0]}],['roof',{pos:[0,5,0]}],['edge',{pos:[-49,64,49]}]]);
  const covered=roofHeights(blocks);
  expect(roofAt(covered,.49,.49)).toBe(5.5);
  expect(roofAt(covered,-49,49)).toBe(64.5);
  expect(roofAt(covered,50,50)).toBe(.5);
  blocks.delete('roof');expect(roofAt(roofHeights(blocks),0,0)).toBe(1.5);
});
test('old and malformed settings recover safely; ambience volume and opt-out persist',()=>{
  expect(cleanSettings({weatherMode:'storm',ambienceVolume:Infinity})).toMatchObject({weatherMode:'auto',ambienceEnabled:true,ambienceVolume:.45});
  expect(cleanSettings({weatherMode:'rain',ambienceEnabled:false,ambienceVolume:2})).toMatchObject({weatherMode:'rain',ambienceEnabled:false,ambienceVolume:1});
  expect(cleanSettings({weatherSound:false}).ambienceEnabled).toBe(false);
});
test('soundscape mixes moods continuously and softens at night and indoors',()=>{
  const day=ambienceMix({cloud:0,rain:0},1,false);
  expect(day.clear).toBe(1);expect(day.rain).toBe(0);
  expect(ambienceMix({cloud:0,rain:0},0,false).clear).toBeLessThan(day.clear);
  const rain=ambienceMix({cloud:1,rain:1},1,false);
  expect(rain.clear).toBe(0);expect(rain.rain).toBe(1);
  expect(ambienceMix({cloud:1,rain:1},1,true).rain).toBe(.55);
});
test('automatic timers pause, clamp background deltas and respect climate duration',()=>{
 expect(weatherDuration(()=>0,'oasis','clear')).toBe(360);expect(weatherDuration(()=>1,'coral','rain')).toBe(90);
 const start={mode:'clear',remaining:180};expect(advanceWeatherSchedule(start,100,false)).toBe(start);
 expect(advanceWeatherSchedule(start,100,true).remaining).toBe(179.9);
 expect(advanceWeatherSchedule({mode:'rain',remaining:0},.1,true,()=>.5).mode).toBe('cloudy');
 expect(advanceWeatherSchedule({mode:'snow',remaining:0},.1,true,()=>.5,{mapType:'snow'}).mode).toBe('cloudy');
 expect(advanceWeatherSchedule({mode:'snow',remaining:100},.1,true,()=>.99,{mapType:'coral'}).mode).not.toBe('snow');
});

test.each(['fog','snow'])('%s is independently persisted and does not create rain or wet ground',mode=>{
  expect(cleanSettings({weatherMode:mode}).weatherMode).toBe(mode);
  let state={cloud:0,rain:0,wet:0,fog:0,snow:0};
  for(let i=0;i<400;i++)state=stepWeather(state,mode,.1);
  expect(state[mode]).toBeGreaterThan(.99);expect(state.rain).toBe(0);expect(state.wet).toBe(0);
  const mix=ambienceMix(state,1,false);
  expect(mix[mode]).toBeGreaterThan(.99);expect(mix.rain).toBe(0);
});
test('overlapping weather transitions never amplify the combined ambience',()=>{
  const mix=ambienceMix({cloud:.8,rain:.6,fog:.5,snow:.3},1,false);
  expect(Object.values(mix).reduce((sum,v)=>sum+v,0)).toBeCloseTo(1);
});
