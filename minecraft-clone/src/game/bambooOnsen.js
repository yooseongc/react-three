import { helpers } from './themeBuildings';

export function generateBambooOnsen(seed,config,salt){
 const limit=config.size/2-1,blocks=new Map(),heights=new Map(),water=[],sites=[],trees=[],steam=[],reserved=new Set(),walkwaySteps=new Set();
 const rand=(x,z,n=0)=>{let h=Math.imul(x^salt,374761393)^Math.imul(z+n*97,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
 const phase=rand(4,8)*6.28,innY=5+Math.floor(rand(8,2)*2),baths=[{x:20,z:-18,rx:9,rz:7},{x:27,z:13,rx:6,rz:5}];
 const key=(x,z)=>x+','+z;
 const put=(x,y,z,texture)=>{if(Math.abs(x)>limit||Math.abs(z)>limit||y<1||y>64)return;const k=[x,y,z].join(',');blocks.set(k,{key:k,pos:[x,y,z],texture});};
 const box=(x0,x1,y0,y1,z0,z1,t)=>{for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)for(let y=y0;y<=y1;y++)put(x,y,z,t);};
 const height=(x,z)=>heights.get(key(Math.round(x),Math.round(z)))||0;
 const reserve=(x,z,r)=>{for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++)reserved.add(key(x+dx,z+dz));};
 const site=(type,x,z,y,name)=>sites.push({id:type+'-'+sites.length,type,x,z,y,name});
 for(let x=-limit;x<=limit;x++)for(let z=-limit;z<=limit;z++){
  let h=4+Math.round(Math.max(0,Math.sin(x/20+phase)*Math.cos(z/21))*4),top='grass';
  const cold=Math.hypot((x-4)/1.3,z-32);
  if(cold<6+Math.sin(x/4+phase)*.5){h=1;top='gravel';}
  for(const b of baths){const d=Math.hypot((x-b.x)/b.rx,(z-b.z)/b.rz);
   if(d<1){h=1;top='stone';}else if(d<1.45){h=4;top='stone';}
  }
  if(Math.hypot(x,z-10)<6){h=4;top='grass';}
  heights.set(key(x,z),h);for(let y=1;y<=h;y++)put(x,y,z,y===h?top:y<h-2?'stone':'dirt');
  if(h===1)water.push([x,2.8,z]);
 }
 const wet=new Set(water.map(([x,,z])=>key(x,z)));
 const pad=(x,z,rx,rz,t='wood',level=4)=>{
  for(let dx=-rx;dx<=rx;dx++)for(let dz=-rz;dz<=rz;dz++){
   const xx=x+dx,zz=z+dz;if(Math.abs(xx)>limit||Math.abs(zz)>limit)continue;
   for(let y=1;y<=Math.max(level,height(xx,zz));y++){if(y<=level)put(xx,y,zz,y===level?t:'stone');else blocks.delete([xx,y,zz].join(','));}
   heights.set(key(xx,zz),level);reserve(xx,zz,2);
  }return level;
 };
 const h=helpers({put,box,pad,site,height,heights,blocks});
 pad(0,10,3,3,'gravel');
 // Low forecourt keeps the tea house visible from the entrance.
 pad(-8,1,8,8,'grass',4);
 h.house(-16,-20,{wall:'darkWood',tile:'blackTile',floors:2,name:'대숲 여관',level:innY});
 h.house(-8,0,{wall:'ochreWall',tile:'blackTile',name:'김이 오르는 찻집',level:4});
 h.pavilion(0,-18,{name:'탕으로 가는 쉼마루',tile:'blackTile',level:5});
 // Broad inn porch, striped fabric-free wooden eaves and stools beside the alley.
 pad(-16,-14,6,1,'wood',innY);for(const x of [-21,-11]){box(x,x,innY+1,innY+3,-15,-15,'darkWood');put(x,innY+3,-14,'lantern');}
 box(-22,-10,innY+4,innY+4,-16,-13,'blackTile');
 for(const b of baths){
  for(let x=b.x-b.rx-3;x<=b.x+b.rx+3;x++)for(let z=b.z-b.rz-3;z<=b.z+b.rz+3;z++){
   const d=Math.hypot((x-b.x)/b.rx,(z-b.z)/b.rz);
   if(d>1&&d<1.3&&!(Math.abs(x-b.x)<=2&&z>b.z)&&rand(x,z,6)>.4)box(x,x,5,5+Math.floor(rand(x,z,7)*3),z,z,'stone');
   if(d<1.55)reserve(x,z,1);
  }
  for(const dx of [-3,2])steam.push([b.x+dx,3,b.z]);
  site('bath',b.x,b.z,3,b.rx>6?'바위가 감싼 노천탕':'대숲 안 작은 온천');
 }
 // Cool pond stays separate from the hot pools and their steam.
 site('pond',4,32,3,'오리가 쉬는 계곡 연못');
 const route=[[0,10,4],[-8,7,4],[-16,7,4],[-16,-12,innY],[0,-12,5],[4,-29,5],[20,-30,5],[35,-25,4],[35,-4,4],[20,-5,4],[20,-9,4],[20,-14,1],[20,-9,4],[20,-5,4],[16,-4,4],[16,13,4],[16,23,4],[5,22,4],[-8,22,4],[-15,10,4],[-29,15,5],[-15,10,4],[0,10,4]];
 const forest=[[0,10,4],[-16,7,4],[-33,-6,5],[-38,5,5],[-29,15,5],[-15,10,4],[0,10,4]];
 function trail(a,b,t='wood'){
  const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2);
  for(let i=0;i<=n;i++){
   const f=i/Math.max(1,n),x=Math.round(a[0]+(b[0]-a[0])*f),z=Math.round(a[1]+(b[1]-a[1])*f),y=Math.round(a[2]+(b[2]-a[2])*f);reserve(x,z,4);
   for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
    const xx=x+dx,zz=z+dz,ground=height(xx,zz);if(Math.abs(xx)>limit||Math.abs(zz)>limit)continue;
    if(!wet.has(key(xx,zz)))for(let yy=Math.min(ground,y);yy<y;yy++)put(xx,yy,zz,'stone');
    const existing=blocks.get([xx,y,zz].join(','))?.texture;
    put(xx,y,zz,walkwaySteps.has(key(xx,zz))&&existing?existing:t);
    for(let yy=y+1;yy<=Math.max(ground+3,y+3);yy++)blocks.delete([xx,yy,zz].join(','));
    heights.set(key(xx,zz),y);walkwaySteps.add(key(xx,zz));
   }
  }
 }
 for(let i=1;i<route.length;i++)trail(route[i-1],route[i],i>=10&&i<=12?'slate':'wood');
 for(let i=1;i<forest.length;i++)trail(forest[i-1],forest[i],'gravel');
 if(config.size>100){let a=[4,-29,5];for(let z=-42;z>-limit+8;z-=16){const b=[Math.round(Math.sin(z/19+phase)*5),z,5];trail(a,b,'gravel');a=b;}site('trail',a[0],a[1],6,'대숲 깊은 산책길');}
 for(let x=-41;x<=-17;x++)for(let z=14;z<=44;z++)reserved.add(key(x,z));
 // Bamboo screens frame the smaller bath without closing the walking deck.
 for(let z=6;z<=20;z++)for(const x of [37,38]){box(x,x,4,7,z,z,'bamboo');reserve(x,z,2);}
 for(const [x,z] of [[-3,12],[-19,8],[-19,-10],[7,-26],[32,-8],[13,18],[-26,12]]){const y=height(x,z);put(x,y+1,z,'darkWood');put(x,y+2,z,'lantern');reserve(x,z,2);}
 for(let gx=-limit+4;gx<limit-3;gx+=3)for(let gz=-limit+4;gz<limit-3;gz+=3){
  const x=gx+Math.floor(rand(gx,gz)*3)-1,z=gz+Math.floor(rand(gx,gz,1)*3)-1,y=height(x,z);
  if(y<4||reserved.has(key(x,z))||rand(x,z,2)>.45+.35*Math.sin(x/14+phase)*Math.cos(z/19))continue;
  const trunk=5+Math.floor(rand(x,z,3)*4);box(x,x,y+1,y+trunk,z,z,'bamboo');
  for(let dy=0;dy<3;dy++)for(const dx of [-1,1])put(x+dx,y+trunk-dy,z+(dy%2),'leaves');
  trees.push({x,z,trunk});
 }
 site('grove',-33,2,7,'바람 소리만 남은 대숲');
 return {seed:String(seed),...config,cubes:[...blocks.values()],heights,water,flowers:[],steam,sites,walkwaySteps,spawnHeading:Math.atan2(8,3),onsen:{trees,baths,walkRoute:route,forestRoute:forest,innY}};
}
