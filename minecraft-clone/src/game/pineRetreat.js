import { helpers } from './themeBuildings';

export function generatePineRetreat(seed,config,salt){
 const limit=config.size/2-1,blocks=new Map(),heights=new Map(),water=[],sites=[],trees=[],reserved=new Set(),walkwaySteps=new Set();
 const rand=(x,z,n=0)=>{let h=Math.imul(x^salt,374761393)^Math.imul(z+n*97,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
 const phase=rand(2,8)*6.28,courtY=8+Math.floor(rand(4,9)*3),pondX=20+Math.floor(rand(8,3)*4);
 const key=(x,z)=>x+','+z;
 const put=(x,y,z,texture)=>{if(Math.abs(x)>limit||Math.abs(z)>limit||y<1||y>64)return;const k=[x,y,z].join(',');blocks.set(k,{key:k,pos:[x,y,z],texture});};
 const box=(x0,x1,y0,y1,z0,z1,t)=>{for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)for(let y=y0;y<=y1;y++)put(x,y,z,t);};
 const height=(x,z)=>heights.get(key(Math.round(x),Math.round(z)))||0;
 const reserve=(x,z,r)=>{for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++)reserved.add(key(x+dx,z+dz));};
 const site=(type,x,z,y,name)=>sites.push({id:type+'-'+sites.length,type,x,z,y,name});
 for(let x=-limit;x<=limit;x++)for(let z=-limit;z<=limit;z++){
  const d=Math.hypot((x-pondX)/1.15,z+8),hill=Math.max(0,1-Math.hypot((x+23)/35,(z+23)/32));
  let h=Math.round(4+(courtY-3)*hill+Math.max(0,Math.sin(x/21+phase)*Math.cos(z/23))*2);
  if(d<9+Math.sin((x+z)/5+phase)*.7)h=1;else if(d<12)h=3;
  if(Math.hypot(x,z-10)<6)h=4;
  heights.set(key(x,z),h);for(let y=1;y<=h;y++)put(x,y,z,y===h?(h===1?'gravel':h===3?'stone':'grass'):y<h-2?'stone':'dirt');
  if(h===1)water.push([x,2.8,z]);
 }
 const wet=new Set(water.map(([x,,z])=>key(x,z)));
 const pad=(x,z,rx,rz,t='gravel',level=4)=>{
  for(let dx=-rx;dx<=rx;dx++)for(let dz=-rz;dz<=rz;dz++){
   const xx=x+dx,zz=z+dz;if(Math.abs(xx)>limit||Math.abs(zz)>limit)continue;
   for(let y=1;y<=Math.max(level,height(xx,zz));y++){if(y<=level)put(xx,y,zz,y===level?t:'stone');else blocks.delete([xx,y,zz].join(','));}
   heights.set(key(xx,zz),level);reserve(xx,zz,2);
  }return level;
 };
 const h=helpers({put,box,pad,site,height,heights,blocks});
 pad(0,10,3,3,'gravel');pad(-20,-11,13,8,'gravel',courtY);
 h.house(-22,-24,{wall:'plaster',tile:'blackTile',name:'솔향이 머무는 안채',level:courtY});
 h.pavilion(-31,-23,{name:'마당을 향해 열린 사랑채',tile:'blackTile',level:courtY});
 // A long timber porch and low stone plinth unify the two wings.
 pad(-25,-18,10,1,'wood',courtY);for(const x of [-33,-17]){box(x,x,courtY+1,courtY+3,-18,-18,'darkWood');put(x,courtY+3,-17,'lantern');}
 site('byeolseo',-22,-24,courtY+3,'소나무 언덕의 별서');site('courtyard',-20,-9,courtY+1,'하늘을 담은 빈 마당');
 h.pavilion(pondX,5,{name:'물가의 작은 정자',tile:'blackTile',level:4});
 const route=[[0,10,4],[-8,7,5],[-8,-1,courtY],[-20,-8,courtY],[-22,-17,courtY],[-31,-17,courtY],[-22,-17,courtY],[-20,-8,courtY],[-5,-10,courtY],[3,-22,5],[pondX,-22,4],[pondX+14,-15,4],[pondX+14,10,4],[pondX,11,4],[pondX+14,10,4],[pondX+12,23,4],[7,25,4],[0,10,4]];
 const forest=[[0,10,4],[-14,20,4],[-31,20,4],[-40,7,5],[-40,-10,7],[-32,-10,courtY],[-20,-8,courtY],[-8,-1,courtY],[-8,7,5],[0,10,4]];
 function trail(a,b,t='gravel'){
  const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2);
  for(let i=0;i<=n;i++){
   const f=i/Math.max(1,n),x=Math.round(a[0]+(b[0]-a[0])*f),z=Math.round(a[1]+(b[1]-a[1])*f),y=Math.round(a[2]+(b[2]-a[2])*f);reserve(x,z,4);
   for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
    const xx=x+dx,zz=z+dz,ground=height(xx,zz);if(Math.abs(xx)>limit||Math.abs(zz)>limit)continue;
    if(!wet.has(key(xx,zz)))for(let yy=Math.min(ground,y);yy<y;yy++)put(xx,yy,zz,'stone');
    const existing=blocks.get([xx,y,zz].join(','))?.texture;
    put(xx,y,zz,wet.has(key(xx,zz))?'wood':(walkwaySteps.has(key(xx,zz))||existing==='wood')&&existing?existing:t);
    for(let yy=y+1;yy<=Math.max(ground+1,y+3);yy++)blocks.delete([xx,yy,zz].join(','));
    heights.set(key(xx,zz),y);walkwaySteps.add(key(xx,zz));
   }
  }
 }
 for(let i=1;i<route.length;i++)trail(route[i-1],route[i],i<3?'whiteStone':'gravel');
 for(let i=1;i<forest.length;i++)trail(forest[i-1],forest[i],'dirt');
 if(config.size>100){let a=[-40,-10,courtY];for(let z=-34;z>-limit+8;z-=16){const b=[-36+Math.round(Math.sin(z/20+phase)*5),z,7];trail(a,b,'dirt');a=b;}site('trail',a[0],a[1],8,'능선을 따라가는 솔숲길');}
 // Low walls define the empty courtyard, with openings wherever a trail passes.
 for(let x=-33;x<=-7;x++)if(!walkwaySteps.has(key(x,-3))){put(x,courtY+1,-3,'stone');put(x,courtY+2,-3,'blackTile');}
 for(let z=-19;z<=-3;z++)for(const x of [-33,-7])if(!walkwaySteps.has(key(x,z))){put(x,courtY+1,z,'stone');put(x,courtY+2,z,'blackTile');}
 // Small gate at the foot of the ascent; the central passage stays open.
 for(const x of [-11,-5]){box(x,x,Math.min(5,height(x,6)),5,6,6,'stone');box(x,x,6,9,6,6,'darkWood');}h.roof(-8,6,10,4,1,'blackTile');site('gate',-8,6,7,'돌계단 앞 작은 대문');
 for(const [x,z] of [[-3,4],[-12,2],[-16,-6],[-28,-5],[pondX+4,12],[-33,17]]){const y=height(x,z);put(x,y+1,z,'stone');put(x,y+2,z,'lantern');put(x,y+3,z,'blackTile');reserve(x,z,2);}
 // Grouped pines have varied, offset crowns, leaving the courtyard deliberately empty.
 for(let gx=-limit+5;gx<limit-4;gx+=6)for(let gz=-limit+5;gz<limit-4;gz+=6){
  const x=gx+Math.floor(rand(gx,gz)*4)-2,z=gz+Math.floor(rand(gx,gz,1)*4)-2,y=height(x,z);
  if(y<4||reserved.has(key(x,z))||rand(x,z,2)>.45+.25*Math.sin(x/17+phase)*Math.cos(z/21))continue;
  const trunk=4+Math.floor(rand(x,z,3)*3),lean=rand(x,z,4)>.5?1:-1;
  box(x,x,y+1,y+trunk,z,z,'log');put(x+lean,y+trunk,z,'log');
  for(let tier=0;tier<3;tier++){const r=3-tier,cx=x+(tier===0?lean:0);for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++)if(Math.abs(dx)+Math.abs(dz)<=r+1)put(cx+dx,y+trunk+tier,z+dz,'leaves');}
  trees.push({x,z,trunk,lean});
 }
 for(const [x,z] of [[-18,24],[pondX-11,-16],[pondX+10,1]]){if(reserved.has(key(x,z)))continue;const y=height(x,z);box(x-1,x+1,y+1,y+2,z,z,'stone');put(x,y+3,z,'slate');}
 site('pond',pondX,-8,3,'솔가지가 비치는 연못');site('grove',-31,20,8,'바람이 지나는 소나무 숲');
 return {seed:String(seed),...config,cubes:[...blocks.values()],heights,water,flowers:[],steam:[],sites,walkwaySteps,spawnHeading:Math.atan2(8,3),retreat:{trees,walkRoute:route,forestRoute:forest,courtY,pondX}};
}
