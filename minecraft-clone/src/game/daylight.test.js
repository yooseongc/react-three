import { expect, test } from 'vitest';
import { advanceTime, DAY_SECONDS, formatTime, sampleDay } from './daylight';
import { cleanSettings } from './settings';
test('clock wraps midnight, pauses, and bounds background-frame jumps',()=>{
  expect(advanceTime(23.999,.1,true)).toBeCloseTo(.0023333);
  expect(advanceTime(12,60,false)).toBe(12);
  expect(advanceTime(12,60,true)).toBeCloseTo(12+.1*24/DAY_SECONDS);
  expect(advanceTime(12,-1,true)).toBe(12);
});
test('daylight has continuous midnight and readable night illumination',()=>{
  expect(sampleDay(12).daylight).toBe(1);
  expect(sampleDay(0).daylight).toBe(0);
  expect(sampleDay(0).stars).toBe(1);
  expect(sampleDay(0).ambient).toBeGreaterThan(.5);
  expect(sampleDay(24).elevation).toBeCloseTo(sampleDay(0).elevation);
  expect(sampleDay(6).twilight).toBeCloseTo(1);
  expect(sampleDay(18).twilight).toBeCloseTo(1);
});
test('older settings default to morning cycle; malformed hours are normalized',()=>{
  expect(cleanSettings({}).timeOfDay).toBe(9);
  expect(cleanSettings({timeOfDay:Infinity}).timeOfDay).toBe(9);
  expect(cleanSettings({timeOfDay:-1,dayCycle:false})).toMatchObject({timeOfDay:23,dayCycle:false});
  expect(formatTime(24)).toBe('00:00');
  expect(formatTime(18.25)).toBe('18:15');
});
