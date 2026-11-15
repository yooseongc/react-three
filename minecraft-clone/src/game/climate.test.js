import { CLIMATES,climateFor,climateWeights,chooseClimateWeather,climateDuration } from './climate';
import { MAP_TYPES } from './mapConfig';
import { advanceWeatherSchedule } from './weather';
const seeded=()=>{let s=7123;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};};
test('every landscape has a complete positive climate profile',()=>{
 expect(Object.keys(CLIMATES).sort()).toEqual(Object.keys(MAP_TYPES).sort());
 for(const p of Object.values(CLIMATES)){expect(Object.keys(p.weights)).toEqual(['clear','cloudy','rain','fog','snow']);expect(Object.values(p.weights).reduce((a,b)=>a+b,0)).toBe(100);}
 expect(climateFor('unknown')).toBe(CLIMATES.forest);
});
test('dawn raises fog chances and midday lowers them without changing forbidden weather',()=>{
 expect(climateWeights('forest',6).fog).toBeGreaterThan(climateWeights('forest',9).fog);
 expect(climateWeights('forest',13).fog).toBeLessThan(climateWeights('forest',9).fog);
 expect(climateWeights('oasis',6).fog).toBe(0);expect(climateWeights('forest',30)).toEqual(climateWeights('forest',6));
});
test.each(Object.keys(MAP_TYPES))('%s scheduling stays within its climate and moves through cloud cover',mapType=>{
 const random=seeded();let schedule={mode:'clear',remaining:0};
 for(let i=0;i<2000;i++){
  const previous=schedule.mode;schedule=advanceWeatherSchedule({...schedule,remaining:0},.1,true,random,{mapType,hour:i%24});
  expect(climateFor(mapType).weights[schedule.mode]).toBeGreaterThan(0);expect(schedule.remaining).toBeGreaterThanOrEqual(30);expect(schedule.remaining).toBeLessThanOrEqual(600);
  if(['rain','snow'].includes(schedule.mode))expect(previous).toBe('cloudy');
  if(['rain','snow'].includes(previous))expect(schedule.mode).toBe('cloudy');
 }
});
test('long-run automatic weather is drier in the desert and snow is exclusive to the frozen map',()=>{
 function sample(mapType){const random=seeded(),totals={clear:0,cloudy:0,rain:0,fog:0,snow:0};let s={mode:'clear',remaining:0};for(let i=0;i<10000;i++){s=advanceWeatherSchedule({...s,remaining:0},.1,true,random,{mapType,hour:i%24});totals[s.mode]+=s.remaining;}const total=Object.values(totals).reduce((a,b)=>a+b,0);return Object.fromEntries(Object.entries(totals).map(([k,v])=>[k,v/total]));}
 const desert=sample('oasis'),forest=sample('forest'),snow=sample('snow');
 expect(desert.clear).toBeGreaterThan(.8);expect(desert.rain).toBeLessThan(.02);expect(forest.rain).toBeGreaterThan(desert.rain*5);
 expect(snow.snow).toBeGreaterThan(.1);expect(snow.rain).toBe(0);expect(forest.snow).toBe(0);
});
test('showers are short, snowy weather lasts longer, and random boundaries stay valid',()=>{
 expect(climateDuration('coral','rain',()=>1)).toBeLessThan(climateDuration('forest','rain',()=>0));
 expect(climateDuration('snow','snow',()=>0)).toBeGreaterThan(climateDuration('coral','rain',()=>1));
 for(const map of Object.keys(MAP_TYPES))for(const r of [0,1])expect(climateFor(map).weights[chooseClimateWeather(map,6,()=>r)]).toBeGreaterThan(0);
});
