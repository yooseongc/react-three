import { chooseClimateWeather, climateDuration, climateFor } from './climate';
import { MAP_LIMIT } from './mapConfig';
export const WEATHER_LABELS = { auto: '자동', clear: '맑음', cloudy: '흐림', rain: '비', fog: '안개', snow: '눈' };
export const weatherState = { cloud: 0, rain: 0, wet: 0, fog: 0, snow: 0, sheltered: false, current: 'clear' };
export function weatherDuration(random=Math.random,mapType='forest',mode='clear',hour=9) { return climateDuration(mapType,mode,random,hour); }
export function createWeatherSchedule(mapType='forest',hour=9,random=Math.random){
 const mode=chooseClimateWeather(mapType,hour,random);
 return {mode,remaining:weatherDuration(random,mapType,mode,hour)};
}
export function advanceWeatherSchedule(schedule,delta,running,random=Math.random,{mapType='forest',hour=9}={}) {
 if(!running)return schedule;
 // Returning to automatic weather never keeps an incompatible manual preset.
 if(!climateFor(mapType).weights[schedule.mode])return createWeatherSchedule(mapType,hour,random);
 const remaining=schedule.remaining-Math.min(.1,Math.max(0,delta));
 if(remaining>0)return {...schedule,remaining};
 const allowed=schedule.mode==='clear'?['clear','cloudy','fog']:schedule.mode==='fog'?['clear','cloudy','fog']:null;
 const mode=['rain','snow'].includes(schedule.mode)?'cloudy':chooseClimateWeather(mapType,hour,random,allowed);
 return {mode,remaining:weatherDuration(random,mapType,mode,hour)};
}
export function stepWeather(state, mode, delta) {
  const dt = Math.min(.1, Math.max(0, delta));
  const cloud = {clear:0,cloudy:.75,rain:1,fog:.45,snow:.85}[mode] ?? 0;
  const rain = mode === 'rain' ? 1 : 0;
  return {
    cloud: state.cloud + (cloud-state.cloud)*(1-Math.exp(-dt/8)),
    rain: state.rain + (rain-state.rain)*(1-Math.exp(-dt/3)),
    wet: state.wet + (rain-state.wet)*(1-Math.exp(-dt/(rain ? 3 : 8))),
    fog: (state.fog || 0) + ((mode==='fog' ? 1 : 0)-(state.fog || 0))*(1-Math.exp(-dt/6)),
    snow: (state.snow || 0) + ((mode==='snow' ? 1 : 0)-(state.snow || 0))*(1-Math.exp(-dt/1.5)),
  };
}
export function roofHeights(blocks,limit=MAP_LIMIT) {
  const width=limit*2+1;
  const heights = new Float32Array(width*width).fill(.5);
  for (const {pos:[x,y,z]} of blocks.values()) {
    if (x < -limit || x > limit || z < -limit || z > limit) continue;
    const index = (z+limit)*width+x+limit;
    heights[index] = Math.max(heights[index], y+.5);
  }
  return heights;
}
export function roofAt(heights, x, z) {
  const width=Math.sqrt(heights.length),limit=(width-1)/2;
  const ix=Math.round(x)+limit, iz=Math.round(z)+limit;
  return ix>=0 && ix<width && iz>=0 && iz<width ? heights[iz*width+ix] : .5;
}
