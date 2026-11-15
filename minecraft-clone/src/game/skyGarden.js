import { helpers } from './themeBuildings';
export function generateSkyGarden(seed,config,salt){
 const limit=config.size/2-1,blocks=new Map(),heights=new Map(),water=[],flowers=[],sites=[],trees=[],walkwaySteps=new Set(),reserved=new Set();
 const rand=(x,z)=>{let h=Math.imul(x^salt,374761393)^Math.imul(z,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
 const phase=rand(7,9)*6.28,islands=[{x:0,z:10,r:13,y:26},{x:-26,z:-19,r:12,y:30},{x:25,z:-20,r:13,y:34},{x:27,z:27,r:11,y:23},{x:-27,z:28,r:10,y:28}];
 if(config.size>100)for(let x=-limit+15;x<limit-12;x+=36)for(let z=-limit+15;z<limit-12;z+=40)if(Math.hypot(x,z)>65&&rand(x,z)>.3)islands.push({x,z,r:8+rand(z,x)*4,y:24+Math.floor(rand(x+3,z)*10)});
 const key=(x,z)=>x+','+z;
 const put=(x,y,z,texture)=>{if(Math.abs(x)>limit||Math.abs(z)>limit||y<1||y>64)return;const k=[x,y,z].join(',');blocks.set(k,{key:k,pos:[x,y,z],texture});};
 const box=(x0,x1,y0,y1,z0,z1,t)=>{for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)for(let y=y0;y<=y1;y++)put(x,y,z,t);};
 const height=(x,z)=>heights.get(key(Math.round(x),Math.round(z)))||0;
 const reserve=(x,z,r)=>{for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++)reserved.add(key(x+dx,z+dz));};
 const site=(type,x,z,y,name)=>sites.push({id:type+'-'+sites.length,type,x,z,y,name});

 for(let x=-limit;x<=limit;x++)for(let z=-limit;z<=limit;z++){
  let top=0,bottom=0;for(const i of islands){const d=Math.hypot(x-i.x,z-i.z),r=i.r+Math.sin(x*.4+phase)+Math.cos(z*.3-phase);if(d<r){top=i.y+(d<i.r*.45?1:0);bottom=Math.max(1,top-3-Math.floor((1-d/r)*8));}}
  if(Math.hypot(x,z-10)<5)top=26;
  heights.set(key(x,z),top);if(top)for(let y=bottom;y<=top;y++)put(x,y,z,y===top?'grass':y===top-1?'dirt':'whiteStone');
 }
 function pad(x,z,rx,rz,t='whiteStone',level=26){for(let dx=-rx;dx<=rx;dx++)for(let dz=-rz;dz<=rz;dz++){const xx=x+dx,zz=z+dz;for(let y=Math.max(1,level-2);y<=Math.max(height(xx,zz),level);y++){if(y<=level)put(xx,y,zz,y===level?t:'whiteStone');else blocks.delete([xx,y,zz].join(','));}heights.set(key(xx,zz),level);reserve(xx,zz,2);}return level;}
 const h=helpers({put,box,pad,site,height,heights,blocks});
 h.pavilion(-26,-19,{tile:'jadeTile',name:'구름을 바라보는 정자',level:30});
 // The observatory entrance and telescope face the connecting terrace.
 pad(25,-20,7,7,'whiteStone',34);
 for(let dx=-6;dx<=6;dx++)for(let dz=-6;dz<=6;dz++)for(let dy=1;dy<=8;dy++){const d=Math.hypot(dx,dz,dy-1);if(d>5.5&&d<6.6&&!(dz>3&&Math.abs(dx)<2&&dy<4))put(25+dx,34+dy,-20+dz,dy<3?'whiteStone':'glass');}
 box(25,25,35,37,-21,-21,'darkWood');box(25,28,38,38,-21,-21,'slate');put(29,38,-21,'glass');site('observatory',25,-20,38,'별빛을 담는 유리 관측소');
 pad(27,27,4,4,'gravel',23);for(const dx of [-3,3])for(const dz of [-3,3])put(27+dx,24,27+dz,'cherryLeaves');site('garden',27,27,25,'낮은 구름의 꽃 뜰');
 pad(-27,28,4,3,'whiteStone',28);box(-30,-25,29,29,30,30,'wood');site('lookout',-27,28,30,'노을을 기다리는 벤치');
 const route=[[0,10,26],[-10,1,26],[-19,-9,29],[-26,-13,30],[-19,-9,29],[-5,-17,31],[12,-13,33],[25,-12,34],[25,-16,34],[25,-12,34],[36,0,29],[32,15,24],[27,27,23],[12,30,25],[-12,31,27],[-27,28,28],[-17,20,27],[0,10,26]];
 const bridgeCells=new Set();
 for(let n=1;n<route.length;n++){const a=route[n-1],b=route[n],count=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2);for(let j=0;j<=count;j++){const f=j/count,x=Math.round(a[0]+(b[0]-a[0])*f),z=Math.round(a[1]+(b[1]-a[1])*f),y=Math.round(a[2]+(b[2]-a[2])*f);reserve(x,z,4);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const xx=x+dx,zz=z+dz,g=height(xx,zz);if(!g)bridgeCells.add(key(xx,zz));put(xx,y,zz,'whiteStone');for(let yy=y+1;yy<=Math.max(g+3,y+3);yy++)blocks.delete([xx,yy,zz].join(','));heights.set(key(xx,zz),y);walkwaySteps.add(key(xx,zz));}}}
 // Side rails only border suspended paths, never their walking cells or junctions.
 for(const k of bridgeCells){const [x,z]=k.split(',').map(Number),y=height(x,z);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])if(!walkwaySteps.has(key(x+dx,z+dz))&&!height(x+dx,z+dz)){put(x+dx,y,z+dz,'whiteStone');put(x+dx,y+1,z+dz,(x+z)%7===0?'lantern':'whiteStone');}}
 for(const i of islands)for(let dx=-7;dx<=7;dx+=4)for(let dz=-7;dz<=7;dz+=4){const x=i.x+dx,z=i.z+dz,y=height(x,z);if(!y||reserved.has(key(x,z))||rand(x,z)<.45)continue;const trunk=3+Math.floor(rand(z,x)*3);box(x,x,y+1,y+trunk,z,z,'log');for(let xx=-2;xx<=2;xx++)for(let zz=-2;zz<=2;zz++)for(let yy=0;yy<2;yy++)if(Math.abs(xx)+Math.abs(zz)<4)put(x+xx,y+trunk+yy,z+zz,'cherryLeaves');trees.push({x,z,trunk});}
 for(const [k,y] of heights){if(!y||walkwaySteps.has(k))continue;const [x,z]=k.split(',').map(Number);if(blocks.get([x,y,z].join(','))?.texture==='grass'&&!blocks.has([x,y+1,z].join(','))&&rand(x+19,z)>.78)flowers.push([x,y+.75,z]);}
 return {seed:String(seed),...config,cubes:[...blocks.values()],heights,water,flowers,sites,walkwaySteps,spawnHeading:.6,sky:{islands,trees,walkRoute:route}};
}
