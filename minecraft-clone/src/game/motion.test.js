import { expect, test } from 'vitest';
import { advanceMotion } from './motion';
import { cleanSettings, loadSettings, SETTINGS_KEY } from './settings';

test('landscape clock pauses without catch-up and clamps resumed frames',()=>{
  expect(advanceMotion(10,100,false)).toBe(10);
  expect(advanceMotion(10,100,true)).toBe(10.1);
  expect(advanceMotion(10,-1,true)).toBe(10);
  expect(advanceMotion(10,1/60,true)).toBeCloseTo(10+1/60);
});
test('old settings enable scenery; explicit motion opt-out survives save and reload',()=>{
  expect(cleanSettings({timeOfDay:18}).landscapeMotion).toBe(true);
  expect(cleanSettings({landscapeMotion:'false'}).landscapeMotion).toBe(true);
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(cleanSettings({landscapeMotion:false,dayCycle:true})));
  expect(loadSettings(localStorage)).toMatchObject({landscapeMotion:false,dayCycle:true});
});
