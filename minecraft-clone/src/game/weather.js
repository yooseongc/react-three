export const WEATHER_LABELS = { auto: '자동', clear: '맑음', cloudy: '흐림', rain: '비', fog: '안개', snow: '눈' };
export const weatherState = { cloud: 0, rain: 0, wet: 0, fog: 0, snow: 0, sheltered: false, current: 'clear' };
export function weatherDuration(random=Math.random) { return 180+random()*180; }
export function advanceWeatherSchedule(schedule,delta,running,random=Math.random) {
  if(!running)return schedule;
  const remaining=schedule.remaining-Math.min(.1,Math.max(0,delta));
  if(remaining>0)return {...schedule,remaining};
  const chance=random();
  let mode='cloudy';
  if(schedule.mode==='clear')mode=chance<.3 ? 'fog' : 'cloudy';
  if(schedule.mode==='fog')mode=chance<.6 ? 'clear' : 'cloudy';
  if(schedule.mode==='cloudy')mode=chance<.25 ? 'clear' : chance<.45 ? 'fog' : chance<.75 ? 'rain' : 'snow';
  return {mode,remaining:weatherDuration(random)};
}
export function stepWeather(state, mode, delta) {
  const dt = Math.min(.1, Math.max(0, delta));
  const cloud = {clear:0,cloudy:.75,rain:1,fog:.45,snow:.85}[mode] ?? 0;
  const rain = mode === 'rain' ? 1 : 0;
  return {
    cloud: state.cloud + (cloud-state.cloud)*(1-Math.exp(-dt/1.5)),
    rain: state.rain + (rain-state.rain)*(1-Math.exp(-dt/1.2)),
    wet: state.wet + (rain-state.wet)*(1-Math.exp(-dt/(rain ? 3 : 8))),
    fog: (state.fog || 0) + ((mode==='fog' ? 1 : 0)-(state.fog || 0))*(1-Math.exp(-dt/2)),
    snow: (state.snow || 0) + ((mode==='snow' ? 1 : 0)-(state.snow || 0))*(1-Math.exp(-dt/1.5)),
  };
}
export function roofHeights(blocks) {
  const heights = new Float32Array(99*99).fill(.5);
  for (const {pos:[x,y,z]} of blocks.values()) {
    if (x < -49 || x > 49 || z < -49 || z > 49) continue;
    const index = (z+49)*99+x+49;
    heights[index] = Math.max(heights[index], y+.5);
  }
  return heights;
}
export function roofAt(heights, x, z) {
  const ix=Math.round(x)+49, iz=Math.round(z)+49;
  return ix>=0 && ix<99 && iz>=0 && iz<99 ? heights[iz*99+ix] : .5;
}
