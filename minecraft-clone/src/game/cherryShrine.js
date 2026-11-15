import { helpers } from './themeBuildings';

export function generateCherryShrine(seed,config,salt){
 const limit=config.size/2-1,blocks=new Map(),heights=new Map(),water=[],sites=[],trees=[],reserved=new Set(),walkwaySteps=new Set();
 const rand=(x,z,n=0)=>{let h=Math.imul(x^salt,374761393)^Math.imul(z+n*97,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
 const phase=rand(2,5)*6.28,sx=Math.floor(rand(5,2)*5)-2,pondX=23+Math.floor(rand(3,8)*4),courtY=10+Math.floor(rand(9,4)*3);
 const key=(x,z)=>x+','+z;
 const put=(x,y,z,texture)=>{if(Math.abs(x)>limit||Math.abs(z)>limit||y<1||y>64)return;const k=[x,y,z].join(',');blocks.set(k,{key:k,pos:[x,y,z],texture});};
 const box=(x0,x1,y0,y1,z0,z1,t)=>{for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)for(let y=y0;y<=y1;y++)put(x,y,z,t);};
 const height=(x,z)=>heights.get(key(Math.round(x),Math.round(z)))||0;
 const reserve=(x,z,r)=>{for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++)reserved.add(key(x+dx,z+dz));};
 const site=(type,x,z,y,name)=>sites.push({id:type+'-'+sites.length,type,x,z,y,name});
 for(let x=-limit;x<=limit;x++)for(let z=-limit;z<=limit;z++){
  const pond=Math.hypot((x-pondX)/1.15,z-18),ridge=Math.min(7,Math.max(0,-z-7)*.15);
  let h=Math.round(4+ridge+Math.max(0,Math.sin(x/19+phase)*Math.cos(z/23))*3);
  h=Math.max(h,Math.round(4+(courtY-4)*Math.max(0,1-Math.hypot((x-sx)/26,(z+30)/27))));
  if(pond<8.7+Math.sin((x+z)/5+phase)*.7)h=1;else if(pond<12)h=3;
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
 pad(sx,-25,12,13,'gravel',courtY);pad(0,10,3,3,'gravel',4);
 // Raised main hall: a deep porch, exposed posts and two spreading tile roofs.
 const hz=-33;
 pad(sx,hz,7,5,'whiteStone',courtY);
 box(sx-6,sx+6,courtY,courtY,hz-4,hz+4,'wood');
 for(let x=-6;x<=6;x++)for(let z=-4;z<=3;z++)if(Math.abs(x)===6||z===-4||z===3){
  if(z===3&&Math.abs(x)<=1)continue;
  for(let dy=1;dy<=5;dy++)put(sx+x,courtY+dy,hz+z,dy===3&&Math.abs(x)%3===1?'glass':Math.abs(x)%3===0?'vermilion':'plaster');
 }
 for(const x of [-6,-3,3,6])box(sx+x,sx+x,courtY+1,courtY+5,hz+5,hz+5,'vermilion');
 h.roof(sx,hz,courtY+6,8,6,'blackTile',true);h.roof(sx,hz,courtY+9,5,4,'blackTile',true);
 for(const x of [-3,3])put(sx+x,courtY+4,hz+4,'lantern');
 box(sx-2,sx+2,courtY+1,courtY+1,hz-2,hz-2,'darkWood');put(sx,courtY+2,hz-2,'lantern');
 site('shrine',sx,hz,courtY+4,'벚꽃 그늘의 본당');
 h.pavilion(pondX,3,{name:'연못을 바라보는 쉼터',tile:'blackTile',level:5});
 h.house(-23,14,{wall:'plaster',tile:'blackTile',name:'숲 가장자리 찻집',level:4});
 // The outward path climbs through gates; the return path reveals the pond.
 const route=[[0,10,4],[0,2,4],[sx,-8,6],[sx,-17,courtY],[sx,-25,courtY],[sx,-28,courtY],[sx,-25,courtY],[20,-25,courtY],[pondX+8,-10,6],[pondX+8,8,5],[pondX,8,5],[pondX+8,8,5],[pondX+14,8,4],[pondX+14,29,4],[9,29,4],[0,10,4]];
 const west=[[sx,-25,courtY],[-22,-25,9],[-32,-10,6],[-32,21,4],[-23,21,4],[-32,21,4],[-20,30,4],[0,10,4]];
 function trail(a,b,material='gravel'){
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
 for(let i=1;i<route.length;i++)trail(route[i-1],route[i],i<5?'whiteStone':'gravel');
 for(let i=1;i<west.length;i++)trail(west[i-1],west[i],'dirt');
 if(config.size>100){let a=[-32,-10,6];for(let z=-38;z>-limit+8;z-=16){const b=[-27+Math.round(Math.sin(z/20+phase)*5),z,9];trail(a,b,'dirt');a=b;}site('trail',a[0],a[1],10,'벚꽃 너머 산길');}
 // Gates frame the ascent without obstructing its three-block clear centre.
 for(const [x,z,y] of [[0,2,4],[sx,-8,6]]){
  for(const dx of [-4,4]){box(x+dx,x+dx,height(x+dx,z),y,z,z,'stone');box(x+dx,x+dx,y+1,y+6,z,z,'vermilion');}
  box(x-5,x+5,y+5,y+5,z,z,'vermilion');box(x-6,x+6,y+7,y+7,z,z,'blackTile');
  put(x-6,y+8,z,'blackTile');put(x+6,y+8,z,'blackTile');site('gate',x,z,y+3,'햇살이 드는 붉은 문');
 }
 // Low courtyard walls leave openings for both woodland loops.
 for(let x=sx-12;x<=sx+12;x++)if(Math.abs(x-sx)>3){put(x,courtY+1,-13,'stone');put(x,courtY+2,-13,'blackTile');}
 for(let z=-38;z<=-13;z++)if(Math.abs(z+25)>3)for(const x of [sx-12,sx+12]){put(x,courtY+1,z,'stone');put(x,courtY+2,z,'blackTile');}
 for(const [x,z] of [[-5,6],[5,6],[sx-4,-15],[sx+4,-15],[sx-8,-23],[sx+8,-23],[pondX+11,11],[-29,22]]){const y=height(x,z);put(x,y+1,z,'stone');put(x,y+2,z,'lantern');put(x,y+3,z,'blackTile');reserve(x,z,2);}
 // Basin and stone seats are tucked beside the procession route.
 pad(-9,-5,2,2,'gravel',5);box(-10,-8,6,6,-6,-4,'stone');put(-9,7,-5,'glass');site('basin',-9,-5,6,'손 씻는 돌 수반');
 for(let gx=-limit+5;gx<limit-4;gx+=5)for(let gz=-limit+5;gz<limit-4;gz+=5){
  const x=gx+Math.floor(rand(gx,gz)*4)-2,z=gz+Math.floor(rand(gx,gz,1)*4)-2,y=height(x,z);
  const density=.35+.35*(.5+.5*Math.sin(x/13+phase)*Math.cos(z/18));
  if(y<4||reserved.has(key(x,z))||rand(x,z,2)>density)continue;
  const trunk=4+Math.floor(rand(x,z,3)*3),radius=2+Math.floor(rand(x,z,4)*2),leaf=rand(x,z,5)>.16?'cherryLeaves':'leaves';
  box(x,x,y+1,y+trunk,z,z,'log');
  for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++)for(let dy=-1;dy<=2;dy++)if(dx*dx+dz*dz+dy*dy*2<=radius*radius+1)put(x+dx,y+trunk+dy,z+dz,leaf);
  trees.push({x,z,trunk,radius,leaf});
 }
 site('pond',pondX,18,3,'벚꽃이 비치는 연못');site('courtyard',sx,-21,courtY+1,'돌계단 위 조용한 안뜰');
 return {seed:String(seed),...config,cubes:[...blocks.values()],heights,water,flowers:[],steam:[],sites,walkwaySteps,spawnHeading:0,shrine:{trees,walkRoute:route,westRoute:west,courtY,pondX,sx}};
}
