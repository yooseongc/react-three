import { helpers } from './themeBuildings';

export function generateMoonGarden(seed,config,salt){
 const limit=config.size/2-1,blocks=new Map(),heights=new Map(),water=[],sites=[],trees=[],reserved=new Set(),walkwaySteps=new Set();
 const rand=(x,z,n=0)=>{let h=Math.imul(x^salt,374761393)^Math.imul(z+n*97,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
 const phase=rand(4,7)*6.28,cx=14+Math.floor(rand(2,9)*3),cz=-5;
 const key=(x,z)=>x+','+z;
 const put=(x,y,z,texture)=>{if(Math.abs(x)>limit||Math.abs(z)>limit||y<1||y>64)return;const k=[x,y,z].join(',');blocks.set(k,{key:k,pos:[x,y,z],texture});};
 const box=(x0,x1,y0,y1,z0,z1,t)=>{for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)for(let y=y0;y<=y1;y++)put(x,y,z,t);};
 const height=(x,z)=>heights.get(key(Math.round(x),Math.round(z)))||0;
 const reserve=(x,z,r)=>{for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++)reserved.add(key(x+dx,z+dz));};
 const site=(type,x,z,y,name)=>sites.push({id:type+'-'+sites.length,type,x,z,y,name});
 for(let x=-limit;x<=limit;x++)for(let z=-limit;z<=limit;z++){
  const d=Math.hypot((x-cx)/1.05,z-cz),edge=16+Math.sin((x+z)/6+phase)*1.2,island=Math.hypot(x-cx,z-cz)<5;
  let h=d<edge&&!island?1:4;
  if(d>edge+6)h=4+Math.round(Math.max(0,Math.sin(x/19+phase)*Math.cos(z/21))*3);
  if(Math.hypot(x,z-10)<6)h=4;
  heights.set(key(x,z),h);
  for(let y=1;y<=h;y++)put(x,y,z,y===h?(h===1?'gravel':d<edge+2&&!island?'stone':'grass'):y<h-2?'stone':'dirt');
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
 pad(0,10,3,3,'gravel');pad(-4,0,12,2,'whiteStone');
 h.pavilion(cx,cz,{name:'물 위에 비친 월영정',tile:'jadeTile',curve:true,level:4});
 h.house(-25,-16,{wall:'plaster',tile:'blackTile',name:'대숲 옆 찻집',level:4});
 pad(-23,12,8,6,'gravel',4);
 // Irregular, hollow stone silhouettes: separate views rather than identical columns.
 for(const [x,z,rise] of [[-27,11,5],[-19,14,4],[-25,16,3]]){
  for(let y=5;y<5+rise;y++)for(let dx=-1;dx<=1;dx++)if(!(dx===0&&y===6))put(x+dx,y,z+(y%2),'stone');
  put(x+1,5+rise,z,'slate');reserve(x,z,3);
 }
 site('rockGarden',-23,12,6,'빈틈 사이로 보는 수석 정원');
 const east=[[0,10,4],[0,-5,4],[-8,-10,4],[-8,-24,4],[12,-24,4],[30,-24,4],[37,-10,4],[37,13,4],[cx,17,4],[cx,2,4],[cx,17,4],[8,23,4],[0,10,4]];
 const west=[[0,10,4],[-10,6,4],[-23,5,4],[-34,5,4],[-34,-9,4],[-25,-9,4],[-34,-9,4],[-34,24,4],[-12,24,4],[0,10,4]];
 function trail(a,b,material='whiteStone'){
  const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2);
  for(let i=0;i<=n;i++){
   const f=i/Math.max(1,n),x=Math.round(a[0]+(b[0]-a[0])*f),z=Math.round(a[1]+(b[1]-a[1])*f),y=Math.round(a[2]+(b[2]-a[2])*f);reserve(x,z,4);
   for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
    const xx=x+dx,zz=z+dz,ground=height(xx,zz);if(Math.abs(xx)>limit||Math.abs(zz)>limit)continue;
    if(!wet.has(key(xx,zz)))for(let yy=Math.min(ground,y);yy<y;yy++)put(xx,yy,zz,'stone');
    put(xx,y,zz,wet.has(key(xx,zz))?'wood':material);
    for(let yy=y+1;yy<=Math.max(ground+1,y+3);yy++)blocks.delete([xx,yy,zz].join(','));
    heights.set(key(xx,zz),y);walkwaySteps.add(key(xx,zz));
   }
  }
 }
 for(let i=1;i<east.length;i++)trail(east[i-1],east[i]);
 for(let i=1;i<west.length;i++)trail(west[i-1],west[i],'gravel');
 if(config.size>100){let a=[-34,-9,4];for(let z=-35;z>-limit+8;z-=16){const b=[-30+Math.round(Math.sin(z/21+phase)*5),z,5];trail(a,b,'gravel');a=b;}site('trail',a[0],a[1],6,'대숲 뒤 고요한 산책길');}
 // The round opening frames the lake; keep two metres of headroom on its centreline.
 for(let x=-14;x<=7;x++)for(let y=5;y<=11;y++){
  const d=Math.hypot(x,(y-7.2)*1.05);
  if(d<3.25)continue;put(x,y,0,d<4.3?'whiteStone':'plaster');
 }
 box(-15,8,12,12,0,0,'blackTile');site('moonGate',0,0,7,'연못을 여는 둥근 문');
 // Open-sided covered gallery bends around the north bank with clear centre aisles.
 for(let x=-8;x<=30;x++){
  for(let z=-26;z<=-22;z++)put(x,11-Math.abs(z+24),z,'jadeTile');
  if((x+8)%5===0)for(const z of [-26,-22])if(!walkwaySteps.has(key(x,z)))box(x,x,5,8,z,z,'darkWood');
 }
 for(let z=-23;z<=-10;z++){
  for(let x=-10;x<=-6;x++)put(x,11-Math.abs(x+8),z,'jadeTile');
  if(z%5===0)for(const x of [-10,-6])if(!walkwaySteps.has(key(x,z)))box(x,x,5,8,z,z,'darkWood');
 }
 for(const x of [-4,11,26])put(x,8,-24,'lantern');
 site('corridor',11,-24,6,'물가를 따라 꺾이는 회랑');
 // Perforated garden walls separate the tea court from the lake without sealing paths.
 for(let z=-27;z<=19;z++)if(Math.abs(z-6)>3&&Math.abs(z+10)>3){
  for(let y=5;y<=8;y++)if(!(z%7===0&&y===7))put(-13,y,z,'plaster');put(-13,9,z,'blackTile');
 }
 for(const [x,z] of [[-5,7],[4,7],[34,-18],[34,11],[cx+3,14],[-30,-7],[-30,22]]){const y=height(x,z);put(x,y+1,z,'darkWood');put(x,y+2,z,'lantern');reserve(x,z,2);}
 // A few leaning-looking willows and dense bamboo pockets contrast with empty courts.
 for(let gx=-limit+5;gx<limit-4;gx+=5)for(let gz=-limit+5;gz<limit-4;gz+=5){
  const x=gx+Math.floor(rand(gx,gz)*4)-2,z=gz+Math.floor(rand(gx,gz,1)*4)-2,y=height(x,z);
  if(y<4||reserved.has(key(x,z))||rand(x,z,2)>.42+.2*Math.sin(x/17+phase))continue;
  const bamboo=x<-17&&z<-3;
  if(bamboo){box(x,x,y+1,y+6,z,z,'bamboo');for(let dy=0;dy<3;dy++)put(x+(dy%2?1:-1),y+6-dy,z,'leaves');}
  else{
   box(x,x,y+1,y+5,z,z,'log');
   for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)if(Math.abs(dx)+Math.abs(dz)<4){put(x+dx,y+5,z+dz,'leaves');put(x+dx,y+6,z+dz,'leaves');if(Math.abs(dx)+Math.abs(dz)===3)put(x+dx,y+4,z+dz,'leaves');}
  }
  trees.push({x,z,bamboo});
 }
 site('pond',cx,8,3,'월영정 아래 연못');
 return {seed:String(seed),...config,cubes:[...blocks.values()],heights,water,flowers:[],steam:[],sites,walkwaySteps,spawnHeading:0,garden:{trees,walkRoute:east,westRoute:west,cx,phase}};
}
