export const undergroundState={inside:false,name:''};

// A raised rock/terrace shell provides real overhead terrain even in shallow maps.
// The entry is a descending walk with a lit, reversible route to the surface.
export function addUnderground(terrain){
 if(!['autumn','onsen','canal'].includes(terrain.mapType))return terrain;
 const city=terrain.mapType==='canal',x=city?0:-29,z=city?-41:30,entryZ=city?-29:15,dir=city?-1:1;
 const blocks=new Map(terrain.cubes.map(c=>[c.key,c])),heights=new Map(terrain.heights),water=[...terrain.water],crystals=[],steam=[...(terrain.steam||[])];
 const key=(x,y,z)=>[x,y,z].join(',');
 const put=(x,y,z,texture)=>blocks.set(key(x,y,z),{key:key(x,y,z),pos:[x,y,z],texture});
 const erase=(x,y,z)=>blocks.delete(key(x,y,z));
 const roof=city?8:12,rx=city?8:10,rz=city?7:11;
 for(let dx=-rx;dx<=rx;dx++)for(let dz=-rz;dz<=rz;dz++){
  const xx=x+dx,zz=z+dz;if(Math.abs(xx)>terrain.size/2-1||Math.abs(zz)>terrain.size/2-1)continue;
  const d=Math.hypot(dx/rx,dz/rz);if(d>1.1)continue;
  const top=city?roof:Math.max(7,Math.round(roof-Math.max(0,d-.5)*7));
  for(let y=1;y<=top;y++)put(xx,y,zz,city?(y===top?'limestone':'brick'):(y===top?'grass':'stone'));
  for(let y=top+1;y<=40;y++)erase(xx,y,zz);
  heights.set(xx+','+zz,top);
 }
 const ceiling=city?7:9;
 for(let dx=-6;dx<=6;dx++)for(let dz=-5;dz<=5;dz++)if(city||Math.hypot(dx/7,dz/6)<1){
  const xx=x+dx,zz=z+dz,arch=city?ceiling:ceiling-(Math.abs(dx)>4?1:0)-(Math.abs(dz)>3?1:0);
  put(xx,3,zz,city?'slate':'stone');for(let y=4;y<=arch;y++)erase(xx,y,zz);
  if((city&&Math.abs(dx)<2)||(terrain.mapType==='onsen'&&Math.hypot(dx,dz)<3.3)){
   put(xx,1,zz,'stone');erase(xx,2,zz);erase(xx,3,zz);water.push([xx,2.8,zz]);
  }
 }
 // City watercourse has a crosswalk, giving both banks a dry return route.
 if(city)for(let dx=-6;dx<=6;dx++)put(x+dx,3,z,'wood');
 const start=Math.max(4,terrain.heights.get(x+','+entryZ)||4),steps=Math.abs(z-entryZ)-4;
 for(let i=0;i<=steps+1;i++){
  const zz=entryZ+i*dir,y=Math.max(3,start-Math.ceil(i*(start-3)/Math.max(1,steps-1)));
  for(let dx=-1;dx<=1;dx++){
   for(let h=1;h<=y;h++)put(x+dx,h,zz,h===y?'slate':'stone');
   for(let h=y+1;h<=y+3;h++)erase(x+dx,h,zz);
   // Open the first steps to the sky so the portal is approachable from outside.
   if(i<4)for(let h=y+4;h<=40;h++)erase(x+dx,h,zz);
  }
  if(i%3===0)put(x+2,y+1,zz,'lantern');
 }
 // Last stair meets a dry landing, including in the water-channel map.
 for(let dz=-5;dz<=-3;dz++)for(let dx=-1;dx<=1;dx++)if(!city)put(x+dx,3,z+dz,'slate');
 if(city)for(let zz=z;zz<=z+5;zz++)for(let dx=-1;dx<=1;dx++)put(x+dx,3,zz,'wood');
 for(const dx of [-5,5])for(const dz of [-3,3]){put(x+dx,4,z+dz,'lantern');if(city){for(let y=5;y<=7;y++)put(x+dx,y,z+dz,'brick');}}
 if(terrain.mapType==='autumn')for(const [dx,dz] of [[-4,-2],[4,1],[-2,4]]){put(x+dx,4,z+dz,'glass');crystals.push({pos:[x+dx,5,z+dz],anchor:key(x+dx,4,z+dz),texture:'glass'});}
 if(!city)for(const [dx,dz] of [[-5,-1],[5,2],[-3,3]]){put(x+dx,ceiling,z+dz,'stone');put(x+dx,ceiling-1,z+dz,'stone');}
 if(terrain.mapType==='onsen')steam.push([x,3,z],[x+1,3,z+1]);
 const name=city?'물빛 아래 지하 수로':terrain.mapType==='onsen'?'바위 품의 지하 온천':'단풍 아래 수정 동굴';
 const cave={x,z,entry:[x,start+.5,entryZ],minX:x-7,maxX:x+7,minZ:Math.min(z-5,entryZ),maxZ:Math.max(z+5,entryZ),floor:3,ceiling,name};
 // Lantern-marked approach on the surface, with one-block steps where needed.
 const n=Math.ceil(Math.hypot(x,entryZ-10)*2);
 for(let i=0;i<=n;i++){const xx=Math.round(x*i/n),zz=Math.round(10+(entryZ-10)*i/n);if(Math.hypot(xx,zz-10)<4)continue;if((terrain.sites||[]).some(s=>Math.hypot(s.x-xx,s.z-zz)<6))continue;const h=Math.max(4,terrain.heights.get(xx+','+zz)||4);put(xx,h,zz,city?'limestone':'gravel');for(let dy=1;dy<=3;dy++)erase(xx,h+dy,zz);}
 return {...terrain,cubes:[...blocks.values()],heights,water:[...new Map(water.map(p=>[p[0]+","+p[2],p])).values()],steam,crystals,caves:[cave],sites:[...(terrain.sites||[]),{id:'underground-entry',type:'cave',x,z:entryZ,y:start+1,name:name+' 입구'}]};
}
export function undergroundAt(terrain,pos,blocks){
 for(const c of terrain?.caves||[]){if(pos.x<c.minX||pos.x>c.maxX||pos.z<c.minZ||pos.z>c.maxZ||pos.y<2||pos.y>c.ceiling+.4)continue;
  for(let y=Math.ceil(pos.y);y<=c.ceiling+4;y++)if(blocks.has([Math.round(pos.x),y,Math.round(pos.z)].join(',')))return c;
 }return null;
}
