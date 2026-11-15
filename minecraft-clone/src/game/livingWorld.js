import { addUnderground } from './underground.js';
// Version 3 adds block-anchored details and underground rooms without rewriting older saves.
export function addLivingWorld(terrain){
 const blocks=new Map(terrain.cubes.map(c=>[c.key,c])),rotors=[],chimneys=[];
 const put=(x,y,z,texture)=>{const key=[x,y,z].join(',');blocks.set(key,{key,pos:[x,y,z],texture});};
 for(const s of terrain.sites||[]){
  if(s.type==='windmill'){
   const y=s.y+1,z=s.z+3;
   for(let i=-5;i<=5;i++)for(const dy of [i,-i,...(Math.abs(i)>2?[i+1,-i-1]:[])])blocks.delete([s.x+i,y+dy,z].join(','));
   put(s.x,y,z,'log');rotors.push({type:'wind',pos:[s.x,y,z],anchor:[s.x,y,z].join(','),texture:'log'});
  }
  if(s.type==='mill'){
   const x=s.x+1,y=s.y-1;
   for(let dy=-4;dy<=4;dy++)for(let dz=-4;dz<=4;dz++)if(['darkWood','lantern'].includes(blocks.get([x,y+dy,s.z+dz].join(','))?.texture))blocks.delete([x,y+dy,s.z+dz].join(','));
   put(x,y,s.z,'log');rotors.push({type:'water',pos:[x,y,s.z],anchor:[x,y,s.z].join(','),texture:'log'});
  }
  if(['house','cabin'].includes(s.type)&&chimneys.length<24){
   const x=s.x+2,z=s.z-1;let y=0;
   for(let h=1;h<60;h++)if(blocks.has([x,h,z].join(',')))y=h;
   if(y<4||y>55)continue;
   for(let h=1;h<=3;h++)put(x,y+h,z,'brick');
   chimneys.push({pos:[x,y+3.6,z],anchor:[x,y+3,z].join(','),texture:'brick'});
  }
 }
 return addUnderground({...terrain,cubes:[...blocks.values()],rotors,chimneys});
}
export function anchorIntact(detail,blocks){return blocks.get(detail.anchor)?.texture===detail.texture;}
export function detailNearby(pos,camera,radius=60){return Math.hypot(pos[0]-camera.x,pos[1]-camera.y,pos[2]-camera.z)<radius;}
