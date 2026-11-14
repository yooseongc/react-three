export const AMBIENCE_TRACKS=['clear','cloudy','rain','fog','snow'];
export function ambienceMix({cloud,rain,fog=0,snow=0}, daylight, sheltered) {
  const level=(sheltered ? .55 : 1)*(.75+daylight*.25);
  const special=rain+fog+snow;
  const scale=1/Math.max(1,special);
  const base=Math.max(0,1-special);
  const clear=(1-cloud)*base;
  return {
    clear: clear*(.25+daylight*.75)*level,
    cloudy: (cloud*base+clear*(1-daylight)*.75)*level,
    rain: rain*scale*level,
    fog: fog*scale*level,
    snow: snow*scale*level,
  };
}
