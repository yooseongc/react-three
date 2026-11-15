import { CatmullRomCurve3, Vector3 } from 'three';
import { MAP_TYPES, terrainQuery,latestGenerator } from './mapConfig';
import { randomSeed } from './mapCatalog';
import { safeWorldQuery } from './transfer';
import { hashSeed } from './terrain';

export function newTourQuery(returnQuery='?', random=Math.random) {
 const types=Object.keys(MAP_TYPES),mapType=types[Math.floor(random()*types.length)];
 return terrainQuery(randomSeed(),{mapType,size:100,generator:latestGenerator(mapType)})+'&tour=1&return='+encodeURIComponent(safeWorldQuery(returnQuery)||'?');
}
export function tourReturnQuery(search) {return safeWorldQuery(new URLSearchParams(search).get('return'))||'?';}
export const tourView={name:'',shot:0,seek:0};

// A closed flight path: visit landmarks in seeded order, then linger over water.
// Precompute a conservative canopy envelope so camera height never clips roofs/trees.
export function createTourRoute(terrain) {
 let seed=hashSeed(terrain.seed+'-tour');
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const sites=[...(terrain.sites||[])];
 for(let i=sites.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[sites[i],sites[j]]=[sites[j],sites[i]];}
 const featured=sites.filter(s=>['sailboat','windmill','lighthouse','cabin','belltower','bath','market','mill','bungalow','observatory','shrine','moonGate','byeolseo','cave'].includes(s.type));
 const stops=[...featured,...sites.filter(s=>!featured.includes(s))].slice(0,6).map(s=>({...s}));
 if(terrain.water.length){const w=terrain.water[Math.floor(random()*terrain.water.length)];stops.push({x:w[0],y:w[1],z:w[2],name:'물빛을 따라서'});}
 if(stops.length<2)stops.push({x:-15,y:5,z:0,name:'바람이 지나는 길'},{x:15,y:5,z:15,name:'느린 산책'});
 const limit=terrain.size/2-8,clamp=n=>Math.max(-limit,Math.min(limit,n));
 const points=[];
 for(const stop of stops){const nearEdge=Math.max(Math.abs(stop.x),Math.abs(stop.z))>limit-20;const angle=nearEdge?Math.atan2(-stop.z,-stop.x)-.65:random()*Math.PI*2;for(let i=0;i<3;i++){const a=angle+i*.65;points.push(new Vector3(clamp(stop.x+Math.cos(a)*24),0,clamp(stop.z+Math.sin(a)*24)));}}
 const curve=new CatmullRomCurve3(points,true,'centripetal');
 const count=Math.max(240,Math.ceil(curve.getLength()*2));
 const samples=curve.getSpacedPoints(count).slice(0,-1);
 const tops=new Map();
 for(const c of terrain.cubes){const [x,y,z]=c.pos,k=x+','+z;tops.set(k,Math.max(tops.get(k)||0,y+.5));}
 for(const p of samples){p.x=clamp(p.x);p.z=clamp(p.z);let h=3;for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++)h=Math.max(h,tops.get(`${Math.round(p.x)+dx},${Math.round(p.z)+dz}`)||0);p.y=h+4;for(const stop of stops){const d=Math.hypot(p.x-stop.x,p.z-stop.z);if(d<36)p.y=Math.max(p.y,stop.y+5-Math.max(0,d-24)*.5);}}
 // Circular two-way slope envelope: gradual climbs begin before tall obstacles.
 for(let pass=0;pass<2;pass++){
  for(let i=0;i<count*2;i++){const a=samples[i%count],b=samples[(i+1)%count];b.y=Math.max(b.y,a.y-.12);}
  for(let i=count*2-1;i>=0;i--){const a=samples[i%count],b=samples[(i+count-1)%count];b.y=Math.max(b.y,a.y-.12);}
 }
 const shots=stops.map((stop,index)=>{
  const goal=points[index*3+1];let nearest=0,distance=Infinity;
  samples.forEach((p,i)=>{const d=Math.hypot(p.x-goal.x,p.z-goal.z);if(d<distance){distance=d;nearest=i;}});
  return {index:nearest,stop};
 }).sort((a,b)=>a.index-b.index);
 return {samples,shots,count};
}
export function tourPose(route,cursor) {
 const n=route.count,t=((cursor%n)+n)%n,i=Math.floor(t),fraction=t-i;
 const position=route.samples[i].clone().lerp(route.samples[(i+1)%n],fraction);
 const ahead=route.samples[(i+18)%n].clone();ahead.y-=3;
 const shot=route.shots.reduce((best,s)=>Math.abs(s.index-t)<Math.abs(best.index-t)?s:best,route.shots[0]);
 const distance=Math.hypot(position.x-shot.stop.x,position.z-shot.stop.z);
 // Ease the gaze toward nearby landmarks instead of snapping when labels change.
 const weight=Math.max(0,Math.min(.92,(44-distance)/18));
 ahead.lerp(new Vector3(shot.stop.x,shot.stop.y+1,shot.stop.z),weight);
 return {position,target:ahead,name:shot.stop.name};
}
export function nextTourStop(route,cursor){return (route.shots.find(s=>s.index>cursor+4)||route.shots[0]).index;}
