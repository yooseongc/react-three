import { freshWeatherEvent,eligibleEvent,advanceWeatherEvent,windAt,distantFlash } from './weatherEvents';
const scene={map:'oasis',weather:'clear',hour:9,delta:.1,running:true};
test('rare events only occur in suitable climates and weather',()=>{
 expect(eligibleEvent('oasis','clear',13)).toBe('sandstorm');
 expect(eligibleEvent('snow','snow',22)).toBe('blizzard');
 expect(eligibleEvent('coral','fog',6)).toBe('seaMist');
 expect(eligibleEvent('coral','fog',13)).toBe('');
 expect(eligibleEvent('forest','rain',19)).toBe('thunder');
 for(const map of ['oasis','snow','sky','shrine','moon','pine'])expect(eligibleEvent(map,'rain',13)).toBe('');
});
test('events pause, opt out, cap frame delta and enforce a cooldown',()=>{
 const start={...freshWeatherEvent(),wait:0};
 expect(advanceWeatherEvent(start,{...scene,running:false})).toBe(start);
 const event=advanceWeatherEvent(start,scene,()=>0);
 expect(event.kind).toBe('sandstorm');
 expect(advanceWeatherEvent(event,{...scene,delta:100}).age).toBe(.1);
 expect(advanceWeatherEvent(event,{...scene,enabled:false}).kind).toBe('');
 const end=advanceWeatherEvent({...event,age:24},scene,()=>0);
 expect(end.kind).toBe('');expect(end.wait).toBeGreaterThanOrEqual(180);
 expect(advanceWeatherEvent(event,{...scene,map:'coral'}).age).toBe(16);
 expect(advanceWeatherEvent(event,{...scene,map:'coral'}).strength).toBe(0);
});
test('rare roll fails most of the time and fades at both ends',()=>{
 const start={...freshWeatherEvent(),wait:0};
 expect(advanceWeatherEvent(start,scene,()=>.5).kind).toBe('');
 let e=advanceWeatherEvent(start,scene,()=>0);const levels=[];
 for(let i=0;i<240;i++){e=advanceWeatherEvent(e,scene,()=>0);levels.push(e.strength);}
 expect(levels[0]).toBeLessThan(.02);expect(levels[80]).toBe(1);expect(levels[235]).toBeLessThan(.1);
});
test('wind is bounded and grows in precipitation and blizzards; lightning is dim and infrequent',()=>{
 for(let t=0;t<200;t+=.1){const calm=windAt(t),rain=windAt(t,1),snow=windAt(t,0,1,{kind:'blizzard',strength:1});expect(rain.strength).toBeGreaterThan(calm.strength);expect(snow.strength).toBeLessThan(1.6);const flash=distantFlash({kind:'thunder',age:t,strength:1});expect(flash).toBeGreaterThanOrEqual(0);expect(flash).toBeLessThanOrEqual(.12);}
 expect(distantFlash({kind:'sandstorm',age:10,strength:1})).toBe(0);
 expect(distantFlash({kind:'thunder',age:5,strength:1})).toBe(0);
});
