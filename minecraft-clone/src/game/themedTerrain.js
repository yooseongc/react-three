import { buildTheme } from './themeBuildings.js';
export function generateThemedTerrain(seed,config,salt){
 const {mapType:kind,size}=config,limit=size/2-1,phase=(salt%1000)/157;
 const blocks=new Map(),heights=new Map(),water=[],flowers=[],sites=[],steam=[];
 const rnd=(x,z)=>{let h=Math.imul(x^salt,374761393)^Math.imul(z,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
 const put=(x,y,z,t)=>{x=Math.round(x);y=Math.round(y);z=Math.round(z);if(Math.abs(x)>limit||Math.abs(z)>limit||y<1||y>64)return;const key=`${x},${y},${z}`;blocks.set(key,{key,pos:[x,y,z],texture:t});};
 const height=(x,z)=>heights.get(`${Math.round(x)},${Math.round(z)}`)||0;
 const dist=(x,period)=>Math.abs(((x%period)+period*1.5)%period-period/2);
 const islands=[[0,10,15],[-25,-17,12],[24,-18,13],[27,27,12],[-27,28,11]];
 for(let x=-limit;x<=limit;x++)for(let z=-limit;z<=limit;z++){
  let h=4,top='grass';
  if(kind==='canal'){h=dist(x+12,32)<4||dist(z+6,32)<3?1:4;top=h===1?'sand':'limestone';}
  if(kind==='onsen'){h=Math.round(5+Math.max(0,Math.sin(x/19+phase)*Math.cos(z/18))*5);const d=Math.hypot(x-19,z+17);if(d<11)h=4;if(d<7)h=1;}
  if(kind==='oasis'){h=Math.round(5+3*Math.sin(x/13+phase)*Math.cos(z/17));const d=Math.hypot((x-18)/1.25,z+9);if(d<11)h=Math.max(1,Math.round(d-6));top=h<=3?'sand':'redSand';}
  if(kind==='autumn'){h=Math.round(6+4*Math.sin(x/19+phase)*Math.cos(z/21));const d=Math.abs(x+12-6*Math.sin(z/18));if(d<4)h=1;top=h<3?'stone':'grass';}
  if(kind==='coral'){h=1;for(const [cx,cz,r] of [[0,10,15],[-26,-20,12],[24,-22,11],[24,27,9]])h=Math.max(h,Math.round(6-Math.hypot(x-cx,z-cz)/r*4));if(limit>60)h=Math.max(h,Math.round(1+4*Math.max(0,Math.sin(x/19+phase)*Math.cos(z/23))));top=h<=3?'sand':'grass';}
  if(kind==='sky'){h=0;for(const [cx,cz,r] of islands)if(Math.hypot(x-cx,z-cz)<r)h=26; if(limit>60&&Math.sin(x/24+phase)*Math.cos(z/28)>.65)h=26;top='grass';}
  if(kind==='shrine'){h=4+Math.round(Math.max(0,-z-15)/10);if(Math.hypot(x-25,z-23)<8)h=1;}
  if(kind==='moon'){h=Math.hypot((x-15)/1.4,z+5)<13?1:4;}
  if(kind==='pine'){h=4+Math.round(Math.max(0,-x-20)/12);if(Math.hypot((x-18)/1.3,z+13)<10)h=1;}
  if(Math.hypot(x,z-10)<6){h=kind==='sky'?26:4;top=kind==='canal'?'limestone':'grass';}
  h=Math.max(0,Math.min(34,h));heights.set(`${x},${z}`,h);
  const bottom=kind==='sky'?Math.max(1,h-3-Math.floor(rnd(x,z)*5)):1;
  for(let y=bottom;y<=h;y++)put(x,y,z,y===h?top:y<h-2?'stone':'dirt');
  if(h&&h+.5<2.8)water.push([x,2.8,z]);
  if(h>3&&top==='grass'&&rnd(x,z)>.97)flowers.push([x,h+.75,z]);
 }
 const box=(x0,x1,y0,y1,z0,z1,t)=>{for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)put(x,y,z,t);};
 const pad=(x,z,rx,rz,material='slate',level)=>{
  let y=level??0;if(level===undefined)for(let dx=-rx;dx<=rx;dx++)for(let dz=-rz;dz<=rz;dz++)y=Math.max(y,height(x+dx,z+dz));y=Math.max(kind==='sky'?26:4,y);
  for(let dx=-rx;dx<=rx;dx++)for(let dz=-rz;dz<=rz;dz++){
   const xx=x+dx,zz=z+dz;if(Math.abs(xx)>limit||Math.abs(zz)>limit)continue;
   const from=kind==='sky'?Math.max(20,height(xx,zz)-3):Math.min(y,Math.max(1,height(xx,zz)));
   for(let h=from;h<=y;h++)put(xx,h,zz,h===y?material:'stone');
   for(let h=y+1;h<=Math.min(64,y+22);h++)blocks.delete(`${xx},${h},${zz}`);
   heights.set(`${xx},${zz}`,y);
  }return y;
 };
 const path=(a,b,t='gravel',width=1)=>{const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2);for(let i=0;i<=n;i++){const x=Math.round(a[0]+(b[0]-a[0])*i/Math.max(1,n)),z=Math.round(a[1]+(b[1]-a[1])*i/Math.max(1,n));for(let dx=-width;dx<=width;dx++){if(Math.abs(x+dx)>limit||Math.abs(z)>limit)continue;let y=height(x+dx,z);if(y<3)y=kind==='sky'?26:4;put(x+dx,y,z,t);heights.set(`${x+dx},${z}`,y);for(let h=y+1;h<=y+3;h++)blocks.delete(`${x+dx},${h},${z}`);}}};
 const tree=(x,z,leaf='leaves',form='round')=>{
  const h=height(x,z);if(h<3||Math.hypot(x,z-10)<7)return;
  const trunk=form==='palm'?6:form==='bamboo'?7:4+Math.floor(rnd(x,z)*2);
  box(x,x,h+1,h+trunk,z,z,form==='bamboo'?'bamboo':'log');
  if(form==='palm'){for(let i=1;i<=4;i++)for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1]])put(x+dx*i,h+trunk-Math.floor(i/3),z+dz*i,'palmLeaves');}
  else if(form==='bamboo'){for(let i=0;i<4;i++)put(x+(i%2?1:-1),h+trunk-i,z,'leaves');}
  else if(form==='pine'){for(let dy=0;dy<3;dy++)for(let dx=-3+dy;dx<=3-dy;dx++)for(let dz=-3+dy;dz<=3-dy;dz++)if(Math.abs(dx)+Math.abs(dz)<5-dy)put(x+dx,h+trunk+dy,z+dz,leaf);}
  else for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=0;dy<=2;dy++)if(Math.abs(dx)+Math.abs(dz)+dy<=4)put(x+dx,h+trunk+dy,z+dz,leaf);
 };
 // Plants follow the terrain; architecture clears only its own footprint afterwards.
 for(let x=-limit+6;x<limit-5;x+=kind==='onsen'?3:7)for(let z=-limit+6;z<limit-5;z+=kind==='onsen'?3:7){
  if(kind==='canal')continue;
  if(kind==='oasis'||kind==='coral'){if(height(x,z)>=3&&height(x,z)<=6&&rnd(x,z)>.68)tree(x,z,'palmLeaves','palm');}
  else if(kind==='onsen'){if(rnd(x,z)>.65&&Math.hypot(x-19,z+17)>11&&Math.abs(x)>3)tree(x,z,'leaves','bamboo');}
  else if(kind==='autumn'){if(rnd(x,z)>.2)tree(x,z,rnd(x+1,z)>.5?'mapleLeaves':'goldenLeaves');}
  else if(kind==='shrine'){if(rnd(x,z)>.45&&Math.abs(x)>6)tree(x,z,'cherryLeaves');}
  else if(kind==='pine'){if(rnd(x,z)>.65)tree(x,z,'leaves','pine');}
  else if(rnd(x,z)>.8)tree(x,z,kind==='sky'?'cherryLeaves':'leaves');
 }
 const site=(type,x,z,y,name)=>sites.push({id:type+'-'+sites.length,type,x,z,y,name});
 const ctx={kind,size,limit,salt,rnd,put,box,pad,path,tree,height,blocks,heights,water,flowers,sites,steam,site};
 buildTheme(ctx);
 // Always leave two blocks of clear headroom at the arrival platform.
 for(let x=-2;x<=2;x++)for(let z=8;z<=12;z++){const h=height(x,z);for(let y=h+1;y<=h+3;y++)blocks.delete(`${x},${y},${z}`);}
 return {seed:String(seed),...config,cubes:[...blocks.values()],heights,water,flowers,sites,steam};
}
