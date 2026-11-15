// Seeded dunes, a shaded settlement and a shoreline walk around one oasis.
export function generateDesertOasis(seed,config,salt){
 const limit=config.size/2-1,blocks=new Map(),heights=new Map(),water=[],sites=[],trees=[],reserved=new Set(),walkwaySteps=new Set();
 const rand=(x,z,n=0)=>{let h=Math.imul(x^salt,374761393)^Math.imul(z+n*97,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
 const phase=rand(4,8)*6.28,lake={x:18,z:-8,rx:12+rand(2,7)*2,rz:17+rand(8,4)*2};
 const key=(x,z)=>x+','+z;
 const put=(x,y,z,texture)=>{if(Math.abs(x)>limit||Math.abs(z)>limit||y<1||y>64)return;const k=[x,y,z].join(',');blocks.set(k,{key:k,pos:[x,y,z],texture});};
 const box=(x0,x1,y0,y1,z0,z1,t)=>{for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)for(let y=y0;y<=y1;y++)put(x,y,z,t);};
 const height=(x,z)=>heights.get(key(Math.round(x),Math.round(z)))||0;
 const reserve=(x,z,r)=>{for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++)reserved.add(key(x+dx,z+dz));};
 const site=(type,x,z,y,name)=>sites.push({id:type+'-'+sites.length,type,x,z,y,name});

 for(let x=-limit;x<=limit;x++)for(let z=-limit;z<=limit;z++){
  const edge=Math.max(0,Math.min(1,(Math.hypot(x,z)-32)/22));
  let h=4+Math.round(edge*(2+3*Math.sin(x/15+z/29+phase)+2*Math.cos(z/18-phase))),top='sand';h=Math.max(3,h);
  const d=Math.hypot((x-lake.x)/lake.rx,(z-lake.z)/lake.rz),shore=1+.035*Math.sin(z*.7+phase)+.03*Math.sin(x*.6);
  if(d<shore){h=1;top='sand';}else if(d<1.25){h=3;top='sand';}else if(d<1.43+.1*Math.sin(z*.35+phase)){h=4;top='grass';}
  if(Math.hypot(x,z-10)<5){h=4;top='sand';}
  heights.set(key(x,z),h);for(let y=1;y<=h;y++)put(x,y,z,y===h?top:y<h-2?'sandstone':'sand');
  if(h===1)water.push([x,2.8,z]);
 }
 const wet=new Set(water.map(([x,,z])=>key(x,z)));
 const pad=(x,z,rx,rz,t='wood',level=4)=>{
  for(let dx=-rx;dx<=rx;dx++)for(let dz=-rz;dz<=rz;dz++){
   const xx=x+dx,zz=z+dz;if(Math.abs(xx)>limit||Math.abs(zz)>limit)continue;
   for(let y=1;y<=Math.max(level,height(xx,zz));y++){if(y<=level)put(xx,y,zz,y===level?t:'sandstone');else blocks.delete([xx,y,zz].join(','));}
   heights.set(key(xx,zz),level);reserve(xx,zz,2);
  }return level;
 };

 // Flat roofs, parapets and deep doorways distinguish the desert village.
 function adobe(x,z,rx,rz,roof,name){
  const y=pad(x,z,rx+1,rz+1,'sandstone',4);
  for(let dx=-rx;dx<=rx;dx++)for(let dz=-rz;dz<=rz;dz++){
   put(x+dx,y,z+dz,'terracotta');
   if(Math.abs(dx)===rx||Math.abs(dz)===rz)for(let dy=1;dy<roof;dy++){
    if(dz===rz&&Math.abs(dx)<=1&&dy<=3)continue;
    if(dy===3&&((Math.abs(dx)===rx&&dz===0)||(dz===-rz&&Math.abs(dx)===2)))continue;
    put(x+dx,y+dy,z+dz,'sandstone');
   }
   put(x+dx,y+roof,z+dz,'sandstone');
   if((Math.abs(dx)===rx||Math.abs(dz)===rz)&&(dx+dz)%2===0)put(x+dx,y+roof+1,z+dz,'sandstone');
  }
  box(x-rx+1,x-rx+2,5,5,z-rz+1,z-rz+2,'wood');put(x-rx+1,6,z-rz+1,'lantern');
  site('house',x,z,y+3,name);
 }
 pad(-15,-5,19,16,'sand',4);
 adobe(-25,-16,5,4,7,'모래빛 대상 여관');adobe(-9,-19,4,3,5,'향신료 상인의 집');adobe(-27,5,4,3,4,'호숫가 도공의 집');
 // Two offset stalls form a shaded alley; counters leave a clear central walk.
 for(const [x,z] of [[-15,-5],[-15,5]]){
  pad(x,z,5,3,'sandstone',4);
  for(const dx of [-5,5])for(const dz of [-3,3])box(x+dx,x+dx,5,8,z+dz,z+dz,'darkWood');
  for(let dx=-5;dx<=5;dx++)box(x+dx,x+dx,9,9,z-3,z+3,dx%2?'terracotta':'ochreWall');
  box(x-4,x+4,5,5,z-2,z-2,'wood');
  for(const dx of [-3,0,3])put(x+dx,6,z-2,dx===0?'lantern':dx<0?'coralPink':'ochreWall');
 }
 site('market',-15,0,6,'천막 그늘의 시장 골목');
 // Broken colonnade on the high north-west terrace, approached by shallow steps.
 const ruinY=7+Math.floor(rand(4,6)*2);pad(-25,-34,10,6,'sandstone',ruinY);
 for(const x of [-32,-25,-18]){box(x,x,ruinY+1,ruinY+6,-37,-37,'sandstone');box(x-1,x+1,ruinY+6,ruinY+6,-37,-37,'limestone');}
 box(-32,-25,ruinY+7,ruinY+7,-37,-37,'sandstone');box(-20,-18,ruinY+7,ruinY+7,-37,-37,'sandstone');
 box(-31,-29,ruinY+1,ruinY+2,-33,-32,'sandstone');put(-19,ruinY+1,-31,'limestone');
 site('ruin',-25,-34,ruinY+3,'모래에 잠긴 옛 회랑');
 const route=[[0,10,4],[-6,10,4],[-15,10,4],[-15,0,4],[-15,-10,4],[-25,-10,4],[-34,-10,4],[-34,-26,ruinY],[-25,-26,ruinY],[-25,-33,ruinY],[-25,-26,ruinY],[-7,-29,5],[9,-33,4],[29,-31,4],[39,-17,4],[39,3,4],[28,17,4],[13,20,4],[0,10,4]];
 const dunes=[[0,10,4],[-12,22,4],[-15,34,7],[0,36,7],[13,20,4],[0,10,4]];
 function trail(a,b,t='sandstone'){
  const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2);
  for(let i=0;i<=n;i++){
   const f=i/Math.max(1,n),x=Math.round(a[0]+(b[0]-a[0])*f),z=Math.round(a[1]+(b[1]-a[1])*f),y=Math.round(a[2]+(b[2]-a[2])*f);reserve(x,z,4);
   for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
    const xx=x+dx,zz=z+dz,ground=height(xx,zz);if(Math.abs(xx)>limit||Math.abs(zz)>limit)continue;
    if(!wet.has(key(xx,zz)))for(let yy=Math.min(ground,y);yy<y;yy++)put(xx,yy,zz,'sandstone');
    const existing=blocks.get([xx,y,zz].join(','))?.texture;
    put(xx,y,zz,walkwaySteps.has(key(xx,zz))&&existing?existing:t);
    for(let yy=y+1;yy<=Math.max(ground+3,y+3);yy++)blocks.delete([xx,yy,zz].join(','));
    heights.set(key(xx,zz),y);walkwaySteps.add(key(xx,zz));
   }
  }
 }

 for(let i=1;i<route.length;i++)trail(route[i-1],route[i]);
 for(let i=1;i<dunes.length;i++)trail(dunes[i-1],dunes[i],'sand');
 pad(-15,34,3,3,'sandstone',7);site('lookout',-15,34,8,'오아시스가 보이는 사구');
 if(config.size>100){let a=[9,-33,4];for(let z=-45;z>-limit+8;z-=16){const b=[Math.round(9+Math.sin(z/24+phase)*7),z,5];trail(a,b,'sand');a=b;}site('trail',a[0],a[1],6,'모래 능선의 대상길');}
 // Palms follow the green shore, not a repeated grid over the desert.
 for(let gx=-limit+5;gx<limit-4;gx+=4)for(let gz=-limit+5;gz<limit-4;gz+=4){
  const x=gx+Math.floor(rand(gx,gz)*3),z=gz+Math.floor(rand(gx,gz,1)*3),y=height(x,z);
  const d=Math.hypot((x-lake.x)/lake.rx,(z-lake.z)/lake.rz);
  if(reserved.has(key(x,z))||y<3||d<1.15||d>1.85||rand(x,z,2)>.65)continue;
  const trunk=5+Math.floor(rand(x,z,3)*3);box(x,x,y+1,y+trunk,z,z,'log');
  for(let k=-3;k<=3;k++){put(x+k,y+trunk-Math.floor(Math.abs(k)/3),z,'palmLeaves');put(x,y+trunk-Math.floor(Math.abs(k)/3),z+k,'palmLeaves');}
  for(const dx of [-1,1])for(const dz of [-1,1])put(x+dx,y+trunk,z+dz,'palmLeaves');trees.push({x,z,trunk});
 }
 for(const [x,z] of [[-3,9],[-18,11],[-18,-7],[-38,-26],[8,-31],[36,2],[12,23]]){const y=height(x,z);put(x,y+1,z,'darkWood');put(x,y+2,z,'lantern');}
 site('pond',lake.x,lake.z,3,'야자 그늘의 푸른 샘');
 return {seed:String(seed),...config,cubes:[...blocks.values()],heights,water,flowers:[],sites,walkwaySteps,spawnHeading:.85,oasis:{trees,lake,walkRoute:route,duneRoute:dunes,ruinY}};
}
