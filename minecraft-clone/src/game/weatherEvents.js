// Rare accents layered over the base weather; music continues using the base mood.
export const EVENT_LABELS={sandstorm:'모래바람',blizzard:'눈보라',seaMist:'해무',thunder:'먼 번개'};
export const freshWeatherEvent=()=>({kind:'',age:0,duration:0,wait:8,strength:0});
export function eligibleEvent(map,weather,hour){
 if(map==='oasis'&&['clear','cloudy'].includes(weather))return 'sandstorm';
 if(map==='snow'&&weather==='snow')return 'blizzard';
 if(['forest','islands','canal','coral'].includes(map)&&weather==='fog'&&hour>=4&&hour<10)return 'seaMist';
 if(['forest','onsen','coral','islands','meadow'].includes(map)&&weather==='rain')return 'thunder';
 return '';
}
export function advanceWeatherEvent(event,{map,weather,hour,delta,running,enabled=true},random=Math.random){
 if(!enabled)return freshWeatherEvent();
 if(!running)return event;
 const dt=Math.min(.1,Math.max(0,delta)),eligible=eligibleEvent(map,weather,hour);
 if(event.kind){
  const age=eligible===event.kind?event.age+dt:Math.max(event.age+dt,event.duration-8);
  if(age>=event.duration)return {...freshWeatherEvent(),wait:180+random()*120};
  return {...event,age,strength:Math.min(eligible===event.kind?1:event.strength,age/6,(event.duration-age)/8)};
 }
 const wait=event.wait-dt;
 if(wait>0)return {...event,wait};
 if(!eligible||random()>.18)return {...event,wait:60+random()*60};
 return {kind:eligible,age:0,duration:24+random()*21,wait:0,strength:0};
}
export function windAt(time,rain=0,snow=0,event={}){
 const gust=.7+.3*Math.sin(time*.37)*Math.sin(time*.13);
 const force=(.22+rain*.55+snow*.25+(event.kind==='sandstorm'||event.kind==='blizzard'?event.strength*1.1:0))*gust;
 return {x:force,z:force*.45,strength:force};
}
// A broad, dim cloud glow, never a rapid full-screen strobe.
export function distantFlash(event){
 if(event.kind!=='thunder')return 0;
 const phase=event.age%17;
 return phase>9&&phase<11?Math.sin((phase-9)*Math.PI/2)*event.strength*.12:0;
}
