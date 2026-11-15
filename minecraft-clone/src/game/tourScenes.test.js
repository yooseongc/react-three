import { chooseTourScene, advanceScene } from './tourScenes';
test('a tour visits every landscape and changes time and weather without adjacent repeats',()=>{
 let randomState=17;const random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
 let previous={mapType:'forest',weather:'clear',hour:9},deck=[];const first=['forest'],allWeather=new Set(),allHours=new Set();
 for(let i=0;i<60;i++){const next=chooseTourScene(previous,deck,random);expect(next.mapType).not.toBe(previous.mapType);expect(next.weather).not.toBe(previous.weather);expect(next.hour).not.toBe(previous.hour);expect(next.duration).toBeGreaterThanOrEqual(35);expect(next.duration).toBeLessThanOrEqual(55);if(i<3)first.push(next.mapType);allWeather.add(next.weather);allHours.add(next.hour);deck=next.remaining;previous=next;}
 expect(new Set(first).size).toBe(4);expect(allWeather.size).toBe(5);expect(allHours.size).toBe(6);
});
test('paused and background tours do not consume the scene timer',()=>{
 expect(advanceScene(10,5,false)).toBe(10);expect(advanceScene(10,5,true,true)).toBe(10);expect(advanceScene(10,.1,true)).toBe(10.1);expect(advanceScene(10,60,true)).toBe(10.25);
});
