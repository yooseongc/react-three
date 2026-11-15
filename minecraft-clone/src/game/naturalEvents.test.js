import { advanceNature } from './naturalEvents';
const initial={time:0,afterRain:0};
const scene={weather:'clear',hour:22,mapType:'snow',running:true,delta:.1};
test('aurora, fireflies and meteors obey sky, time and habitat conditions',()=>{
 expect(advanceNature(initial,scene).aurora).toBeGreaterThan(0);
 expect(advanceNature(initial,{...scene,hour:12}).aurora).toBe(0);
 expect(advanceNature(initial,{...scene,weather:'snow'}).aurora).toBe(0);
 expect(advanceNature(initial,{...scene,mapType:'moon'}).fireflies).toBe(true);
 expect(advanceNature(initial,{...scene,sheltered:true}).fireflies).toBe(false);
 expect(advanceNature({time:37,afterRain:0},scene).meteor).toBeGreaterThan(0);
 expect(advanceNature({time:40,afterRain:0},scene).meteor).toBe(-1);
});
test('a rainbow follows rain only in clear daylight, and paused time freezes events',()=>{
 const rain=advanceNature(initial,{...scene,weather:'rain'});
 expect(advanceNature(rain,{...scene,hour:10}).rainbow).toBeGreaterThan(0);
 expect(advanceNature(initial,{...scene,hour:10}).rainbow).toBe(0);
 expect(advanceNature(rain,{...scene,hour:10,weather:'cloudy'}).rainbow).toBe(0);
 const paused=advanceNature({time:37,afterRain:30},{...scene,running:false,delta:600});expect(paused.time).toBe(37);expect(paused.afterRain).toBe(30);
});
