// Distinct islands frame a shallow coral lagoon and a walkable coastal circuit.
export function generateCoralIslands(seed,config,salt){
 const limit=config.size/2-1,blocks=new Map(),heights=new Map(),water=[],sites=[],trees=[],reefs=[],reserved=new Set(),walkwaySteps=new Set();
 const rand=(x,z,n=0)=>{let h=Math.imul(x^salt,374761393)^Math.imul(z+n*97,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
 const phase=rand(4,8)*6.28;
 const islands=[{x:-5,z:12,rx:20,rz:16,h:5,kind:'beach'},{x:-27,z:-23,rx:13,rz:14,h:10,kind:'rock'},{x:25,z:-23,rx:15,rz:12,h:7,kind:'grove'},{x:29,z:28,rx:12,rz:10,h:4,kind:'cove'}];
 if(config.size>100)for(let x=-limit+18;x<limit-12;x+=40)for(let z=-limit+18;z<limit-12;z+=42){if(Math.hypot(x,z)<65)continue;islands.push({x:x+Math.floor(rand(x,z)*8),z,rx:9+rand(x,z,1)*7,rz:10+rand(x,z,2)*7,h:4+Math.floor(rand(x,z,3)*4),kind:rand(x,z,4)>.6?'rock':'grove'});}
 const key=(x,z)=>x+','+z;
 const put=(x,y,z,texture)=>{if(Math.abs(x)>limit||Math.abs(z)>limit||y<1||y>64)return;const k=[x,y,z].join(',');blocks.set(k,{key:k,pos:[x,y,z],texture});};
 const box=(x0,x1,y0,y1,z0,z1,t)=>{for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)for(let y=y0;y<=y1;y++)put(x,y,z,t);};
 const height=(x,z)=>heights.get(key(Math.round(x),Math.round(z)))||0;
 const reserve=(x,z,r)=>{for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++)reserved.add(key(x+dx,z+dz));};
 const site=(type,x,z,y,name)=>sites.push({id:type+'-'+sites.length,type,x,z,y,name});

 for(let x=-limit;x<=limit;x++)for(let z=-limit;z<=limit;z++){
  let h=1,top='sand';
  for(const island of islands){
   const d=Math.hypot((x-island.x)/island.rx,(z-island.z)/island.rz),edge=1+.06*Math.sin(x*.4+phase)+.04*Math.cos(z*.5-phase);
   if(d>edge)continue;
   const level=d>edge-.18?3:Math.max(4,Math.round(island.h-(d/.82)**2*(island.h-4)));
   if(level>h){h=level;top=h<=4?'sand':island.kind==='rock'?'stone':'grass';}
  }
  if(Math.hypot(x,z-10)<5){h=4;top='sand';}
  heights.set(key(x,z),h);for(let y=1;y<=h;y++)put(x,y,z,y===h?top:y<h-2?'stone':'sand');
  if(h===1)water.push([x,2.8,z]);
 }
 const wet=new Set(water.map(([x,,z])=>key(x,z)));
 // Decks over water have visible piles and open water underneath, not solid foundations.
 function deck(x,z,rx,rz,level=4){
  for(let dx=-rx;dx<=rx;dx++)for(let dz=-rz;dz<=rz;dz++){
   const xx=x+dx,zz=z+dz,g=height(xx,zz);reserve(xx,zz,2);
   if(!wet.has(key(xx,zz)))for(let y=1;y<level;y++)put(xx,y,zz,'stone');
   put(xx,level,zz,'wood');for(let y=level+1;y<=Math.max(g+3,level+3);y++)blocks.delete([xx,y,zz].join(','));heights.set(key(xx,zz),level);
  }
  for(const dx of [-rx,rx])for(const dz of [-rz,rz])box(x+dx,x+dx,1,level-1,z+dz,z+dz,'log');
 }
 function bungalow(x,z,turn,name){
  deck(x,z,5,5);
  const p=(dx,y,dz,t)=>put(x+(turn?-dz:dx),y,z+(turn?dx:dz),t);
  for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++){
   if(Math.abs(dx)===3||Math.abs(dz)===3)for(let y=5;y<=7;y++){
    if(dz===3&&Math.abs(dx)<=1)continue;if(y===6&&((Math.abs(dx)===3&&Math.abs(dz)<=1)||(dz===-3&&Math.abs(dx)<=1)))continue;
    p(dx,y,dz,'wood');
   }
  }
  for(let dx=-4;dx<=4;dx++)for(let dz=-4;dz<=4;dz++)p(dx,8+Math.floor((4-Math.abs(dx))/2),dz,'palmLeaves');
  for(const dx of [-3,3]){p(dx,5,4,'log');p(dx,6,4,'lantern');}
  p(-2,5,-2,'darkWood');p(2,5,-2,'wood');p(2,6,-2,'lantern');
  site('bungalow',x,z,7,name);
 }
 bungalow(36,-6,true,'만을 향한 수상 숙소');bungalow(28,32,false,'파도 곁 작은 방갈로');
 deck(-10,15,5,4);for(const dx of [-4,4])for(const dz of [-3,3])box(-10+dx,-10+dx,5,8,15+dz,15+dz,'log');
 for(let dx=-5;dx<=5;dx++)for(let dz=-4;dz<=4;dz++)put(-10+dx,9+Math.floor((5-Math.abs(dx))/3),15+dz,'palmLeaves');
 box(-13,-7,5,5,18,18,'darkWood');put(-13,6,18,'lantern');site('pavilion',-10,15,7,'해변의 그늘 쉼터');
 deck(-26,-20,3,2,9);
 const route=[[0,10,4],[-10,10,4],[-18,-3,4],[-26,-10,5],[-26,-20,9],[-26,-10,5],[-8,-20,4],[16,-24,4],[25,-15,5],[31,-6,4],[36,-6,4],[31,-6,4],[32,15,4],[22,26,4],[22,38,4],[28,38,4],[28,34,4],[28,38,4],[22,38,4],[16,24,4],[0,10,4]];
 const pier=[[0,10,4],[0,-3,4],[8,-8,4],[8,-15,4],[8,-8,4],[0,-3,4],[0,10,4]];
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

 for(let i=1;i<route.length;i++)trail(route[i-1],route[i]);
 for(let i=1;i<pier.length;i++)trail(pier[i-1],pier[i]);
 deck(8,-15,3,2);site('pier',8,-15,5,'산호 만을 내려다보는 부두');
 site('lookout',-26,-20,10,'바람을 맞는 바위 전망대');
 // Piles along sea crossings; keep both feet and camera clearance on every walkway.
 for(const k of walkwaySteps){const [x,z]=k.split(',').map(Number);if(wet.has(k)&&x%5===0&&z%3===0)box(x,x,1,height(x,z)-1,z,z,'log');}
 if(config.size>100){const outer=islands.find(i=>i.z<-55)||islands[4];site('island',outer.x,outer.z,height(outer.x,outer.z)+1,'먼 바다의 야자섬');}
 for(let gx=-limit+5;gx<limit-4;gx+=4)for(let gz=-limit+5;gz<limit-4;gz+=4){
  const x=gx+Math.floor(rand(gx,gz)*3),z=gz+Math.floor(rand(gx,gz,1)*3),y=height(x,z);
  if(y<3||y>7||reserved.has(key(x,z))||blocks.get([x,y,z].join(','))?.texture==='stone'||rand(x,z,2)>.6)continue;
  const trunk=4+Math.floor(rand(x,z,3)*4);box(x,x,y+1,y+trunk,z,z,'log');
  for(let k=-3;k<=3;k++){put(x+k,y+trunk-Math.floor(Math.abs(k)/3),z,'palmLeaves');put(x,y+trunk-Math.floor(Math.abs(k)/3),z+k,'palmLeaves');}
  for(const dx of [-1,1])for(const dz of [-1,1])put(x+dx,y+trunk,z+dz,'palmLeaves');trees.push({x,z,trunk});
 }
 // Cluster coral on the lagoon floor, with open channels for fish and turtles.
 for(let x=-limit+3;x<=limit-3;x++)for(let z=-limit+3;z<=limit-3;z++){
  if(height(x,z)!==1||reserved.has(key(x,z)))continue;
  const patch=Math.sin(x/5+phase)*Math.cos(z/7-phase);
  if(patch>.45&&rand(x,z,8)>.65&&islands.some(i=>Math.hypot((x-i.x)/i.rx,(z-i.z)/i.rz)<1.35)){
   put(x,2,z,rand(x,z,9)>.5?'coralPink':'coralBlue');reefs.push([x,2,z]);
  }
 }
 for(const [x,z] of [[-3,12],[-13,8],[-29,-10],[11,-15],[29,-15],[29,17],[18,26]]){const y=height(x,z);if(y<3)continue;put(x,y+1,z,'darkWood');put(x,y+2,z,'lantern');}
 site('reef',15,0,3,'분홍빛 산호가 모인 만');
 return {seed:String(seed),...config,cubes:[...blocks.values()],heights,water,flowers:[],sites,walkwaySteps,spawnHeading:0,coral:{trees,islands,reefs,walkRoute:route,pierRoute:pier}};
}
