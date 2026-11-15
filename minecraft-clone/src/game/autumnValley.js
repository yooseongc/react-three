import { helpers } from './themeBuildings';

// Compose a valley, clearings and a connected walk before placing the forest.
export function generateAutumnValley(seed,config,salt){
 const limit=config.size/2-1,blocks=new Map(),heights=new Map(),water=[],flowers=[],sites=[],steam=[];
 const reserved=new Set(),walkwaySteps=new Set(),trees=[];
 const rnd=(x,z,n=0)=>{let h=Math.imul(x^salt,374761393)^Math.imul(z+n*97,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
 const phase=rnd(3,9)*Math.PI*2,shift=Math.round(rnd(8,1)*4)-2;
 const river=z=>-12+shift+Math.sin(z/19+phase)*5+Math.sin(z/43)*2;
 const width=z=>3+3*Math.exp(-(((z-12)/19)**2));
 const key=(x,z)=>x+','+z;
 const put=(x,y,z,texture)=>{if(Math.abs(x)>limit||Math.abs(z)>limit||y<1||y>64)return;const k=[x,y,z].join(',');blocks.set(k,{key:k,pos:[x,y,z],texture});};
 const box=(x0,x1,y0,y1,z0,z1,t)=>{for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)for(let y=y0;y<=y1;y++)put(x,y,z,t);};
 const height=(x,z)=>heights.get(key(Math.round(x),Math.round(z)))||0;
 const reserve=(x,z,r)=>{for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++)reserved.add(key(x+dx,z+dz));};
 const site=(type,x,z,y,name)=>sites.push({id:type+'-'+sites.length,type,x,z,y,name});
 for(let x=-limit;x<=limit;x++)for(let z=-limit;z<=limit;z++){
  const d=Math.abs(x-river(z)),w=width(z),feeder=z>=-22&&z<=-18&&x>=-21&&x<=Math.max(-7,river(z));
  const wet=d<w||feeder;
  const ridge=Math.min(7,Math.max(0,d-w-5)*.21);
  let h=wet?1:Math.round(3+ridge+Math.max(0,Math.sin(x/17+phase)*Math.cos(z/23))*3);
  if(Math.hypot(x,z-10)<6)h=4;
  const top=h<=2?'gravel':d<w+2?'stone':'grass';
  heights.set(key(x,z),h);
  for(let y=1;y<=h;y++)put(x,y,z,y===h?top:y<h-2?'stone':'dirt');
  if(h===1)water.push([x,2.8,z]);
 }
 const wetCells=new Set(water.map(([x,,z])=>key(x,z)));
 const pad=(x,z,rx,rz,t='grass',level=4)=>{
  for(let dx=-rx;dx<=rx;dx++)for(let dz=-rz;dz<=rz;dz++){
   const xx=x+dx,zz=z+dz;if(Math.abs(xx)>limit||Math.abs(zz)>limit)continue;
   for(let y=1;y<=Math.max(level,height(xx,zz));y++){if(y<=level)put(xx,y,zz,y===level?t:'stone');else blocks.delete([xx,y,zz].join(','));}
   heights.set(key(xx,zz),level);reserve(xx,zz,2);
  }return level;
 };
 const lookoutX=23+Math.floor(rnd(5,8)*4),lookoutY=11+Math.floor(rnd(6,4)*3);
 pad(0,10,3,3,'gravel',4);
 // A riverside mill with a low deck, sluice and attached timber store.
 const h=helpers({put,box,pad,site,height,blocks,heights});
 h.house(-27,-20,{wall:'ochreWall',tile:'terracotta',name:'계곡 물레방앗간',level:4});
 box(-31,-24,5,5,-15,-15,'wood');
 for(const x of [-31,-24])box(x,x,6,8,-15,-15,'log');
 box(-32,-23,9,9,-16,-14,'terracotta');
 // Rotor metadata aligns its lowest blade with the mill race surface.
 site('mill',-22,-20,8,'여울 옆 물레방아');
 box(-20,-20,3,4,-24,-23,'stone');box(-22,-20,5,5,-24,-24,'wood');
 h.pavilion(lookoutX,0,{name:'단풍 능선 전망대',tile:'terracotta',level:lookoutY});
 site('overlook',lookoutX,5,lookoutY+2,'굽은 강이 보이는 능선');
 // Explicit levels make the trail climb gradually instead of following noisy peaks.
 const walkRoute=[[0,10,4],[6,5,5],[15,5,8],[lookoutX,5,lookoutY],[15,5,8],[6,5,5],[4,-9,5],[1,-27,6],[-38,-27,6],[-38,-11,5],[-29,-11,4],[-29,15,6],[-24,10,5],[0,10,4]];
 function trail(a,b){
  const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2);
  for(let i=0;i<=n;i++){
   const f=i/Math.max(1,n),x=Math.round(a[0]+(b[0]-a[0])*f),z=Math.round(a[1]+(b[1]-a[1])*f),y=Math.round(a[2]+(b[2]-a[2])*f);
   reserve(x,z,4);
   for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
    const xx=x+dx,zz=z+dz,ground=height(xx,zz),wet=wetCells.has(key(xx,zz));
    if(Math.abs(xx)>limit||Math.abs(zz)>limit)continue;
    if(!wet)for(let yy=Math.min(ground,y);yy<y;yy++)put(xx,yy,zz,'stone');
    put(xx,y,zz,wet?'wood':dx===0&&dz===0?'gravel':'dirt');
    for(let yy=y+1;yy<=Math.max(ground+1,y+4);yy++)blocks.delete([xx,yy,zz].join(','));
    heights.set(key(xx,zz),y);walkwaySteps.add(key(xx,zz));
   }
  }
 }
 for(let i=1;i<walkRoute.length;i++)trail(walkRoute[i-1],walkRoute[i]);
 // The large map extends the walk along the river, rather than stretching the same clearing.
 if(config.size>100){
  const north=[[1,-27,6]];
  for(let z=-40;z>-limit+8;z-=12)north.push([Math.round(river(z)+width(z)+7),z,5]);
  for(let i=1;i<north.length;i++)trail(north[i-1],north[i]);
  site('trail',north.at(-1)[0],north.at(-1)[1],6,'계곡 상류 숲길');
 }
 // Keep the existing crystal cave entrance and its descending path unobstructed.
 for(let x=-41;x<=-17;x++)for(let z=14;z<=44;z++)reserved.add(key(x,z));
 for(const z of [-27,10]){
  const cx=Math.round(river(z)),y=z===-27?6:5;
  site('bridge',cx,z,y+2,z<0?'협곡을 건너는 나무다리':'넓은 여울의 낮은 다리');
  for(let x=cx-Math.ceil(width(z))-1;x<=cx+Math.ceil(width(z))+1;x++)for(const dz of [-3,3])if(x%3===0){box(x,x,1,y+1,z+dz,z+dz,'log');}
 }
 // Clustered, jittered candidates with variable crowns replace the old seven-block grid.
 for(let gx=-limit+5;gx<limit-4;gx+=5)for(let gz=-limit+5;gz<limit-4;gz+=5){
  const x=gx+Math.floor(rnd(gx,gz)*4)-2,z=gz+Math.floor(rnd(gx,gz,1)*4)-2,y=height(x,z);
  const cluster=.5+.5*Math.sin(x/14+phase)*Math.cos(z/17-phase);
  if(y<3||reserved.has(key(x,z))||rnd(x,z,2)> .25+cluster*.65)continue;
  const radius=2+Math.floor(rnd(x,z,3)*2),trunk=3+Math.floor(rnd(x,z,4)*4);
  const leaf=rnd(Math.floor(x/12),Math.floor(z/12),5)>.45?'mapleLeaves':'goldenLeaves';
  box(x,x,y+1,y+trunk,z,z,'log');
  for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++)for(let dy=-1;dy<=2;dy++)if(dx*dx+dz*dz+dy*dy*2<=radius*radius+1)put(x+dx,y+trunk+dy,z+dz,leaf);
  trees.push({x,z,trunk,radius,leaf});
 }
 // Scattered bank stones and small leaf-coloured shrubs leave open meadow pockets.
 for(let x=-limit+3;x<limit-2;x+=3)for(let z=-limit+3;z<limit-2;z+=3){
  if(reserved.has(key(x,z))||height(x,z)<3)continue;
  const d=Math.abs(x-river(z));
  if(d<width(z)+4&&rnd(x,z,8)>.72)put(x,height(x,z)+1,z,'stone');
  else if(rnd(x,z,9)>.975)put(x,height(x,z)+1,z,rnd(x,z,10)>.5?'goldenLeaves':'mapleLeaves');
 }
 for(const [x,z] of [[8,8],[lookoutX-3,7],[-34,-10],[-26,12]]){const y=height(x,z);put(x,y+1,z,'darkWood');put(x,y+2,z,'lantern');}
 site('grove',4,-9,7,'붉은 잎 사이 숲길');site('riverbank',-3,12,5,'노란 잎이 비치는 여울');
 return {seed:String(seed),...config,cubes:[...blocks.values()],heights,water,flowers,sites,steam,walkwaySteps,spawnHeading:-.87,valley:{phase,shift,trees,walkRoute,lookout:[lookoutX,0,lookoutY],mill:[-27,-20,4]}};
}
