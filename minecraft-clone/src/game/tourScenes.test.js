import { climateFor } from './climate';
import { MAP_TYPES } from './mapConfig';
import { chooseTourScene, advanceScene } from './tourScenes';
test('a tour visits every landscape and varies maps and time while honoring climate',()=>{
 let randomState=17;const random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
 let previous={mapType:'forest',weather:'clear',hour:9},deck=[];const first=['forest'],allWeather=new Set(),allHours=new Set();
 for(let i=0;i<600;i++){const next=chooseTourScene(previous,deck,random);expect(next.mapType).not.toBe(previous.mapType);expect(climateFor(next.mapType).weights[next.weather]).toBeGreaterThan(0);expect(next.hour).not.toBe(previous.hour);expect(next.duration).toBeGreaterThanOrEqual(35);expect(next.duration).toBeLessThanOrEqual(55);if(i<Object.keys(MAP_TYPES).length-1)first.push(next.mapType);allWeather.add(next.weather);allHours.add(next.hour);deck=next.remaining;previous=next;}
 expect(new Set(first).size).toBe(Object.keys(MAP_TYPES).length);expect(allWeather.size).toBe(5);expect(allHours.size).toBe(6);
});
test('paused and background tours do not consume the scene timer',()=>{
 expect(advanceScene(10,5,false)).toBe(10);expect(advanceScene(10,5,true,true)).toBe(10);expect(advanceScene(10,.1,true)).toBe(10.1);expect(advanceScene(10,60,true)).toBe(10.25);
});

test('first tour scene uses the requested map climate, including tropical and desert worlds',()=>{
 for(const map of Object.keys(MAP_TYPES))for(let i=0;i<20;i++){
  const scene=chooseTourScene({},[],()=>i/20,map);expect(scene.mapType).toBe(map);expect(climateFor(map).weights[scene.weather]).toBeGreaterThan(0);
 }
});
