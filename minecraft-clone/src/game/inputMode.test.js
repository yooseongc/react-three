import { detectTouchMode } from './inputMode';
import { cleanSettings,defaultSettings } from './settings';
test('weather, time and controls default to automatic without overwriting explicit preferences',()=>{
 expect(defaultSettings).toMatchObject({dayCycle:true,weatherMode:'auto',inputMode:'auto'});
 expect(cleanSettings({})).toMatchObject({dayCycle:true,weatherMode:'auto',inputMode:'auto'});
 expect(cleanSettings({dayCycle:false,weatherMode:'fog',inputMode:'keyboard'})).toMatchObject({dayCycle:false,weatherMode:'fog',inputMode:'keyboard'});
});
test('touch detection follows input capabilities rather than window size',()=>{
 const media=(coarse,fine)=>q=>({matches:q==='(pointer: coarse)'?coarse:fine});
 expect(detectTouchMode(media(true,false),5)).toBe(true);
 expect(detectTouchMode(media(false,false),5)).toBe(true);
 expect(detectTouchMode(media(false,true),5)).toBe(false);
 expect(detectTouchMode(media(false,true),0)).toBe(false);
 expect(detectTouchMode(undefined,0)).toBe(false);
});
