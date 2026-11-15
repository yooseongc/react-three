// Preserve the established mountains, waterways and buildings; add small destinations.
export function polishNature(terrain,salt){
 const {mapType:kind,size}=terrain,limit=size/2-1,blocks=new Map(terrain.cubes.map(c=>[c.key,c])),heights=new Map(terrain.heights),sites=[...terrain.sites],walkwaySteps=new Set(),details=[],trees=[];
 const key=(x,z)=>x+','+z,ground=(x,z)=>heights.get(key(x,z))||1;
 const rnd=(x,z)=>{let h=Math.imul(x^salt,374761393)^Math.imul(z,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
 const put=(x,y,z,texture)=>{if(Math.abs(x)>limit||Math.abs(z)>limit||y<1||y>64)return;const k=[x,y,z].join(',');blocks.set(k,{key:k,pos:[x,y,z],texture});};
 const erase=(x,z,y)=>{for(let yy=y+1;yy<=64;yy++)blocks.delete([x,yy,z].join(','));};
 const occupied=(x,z,r=10)=>terrain.sites.some(s=>Math.hypot(x-s.x,z-s.z)<r);
 function choose(tx,tz,r=4){let best=null;for(let x=Math.max(-limit+r+2,tx-18);x<=Math.min(limit-r-2,tx+18);x+=2)for(let z=Math.max(-limit+r+2,tz-18);z<=Math.min(limit-r-2,tz+18);z+=2){
  if(occupied(x,z,13)||Math.hypot(x,z-10)<10||details.some(s=>Math.hypot(x-s.x,z-s.z)<13))continue;
  let lo=99,hi=0;for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){const h=ground(x+dx,z+dz);lo=Math.min(lo,h);hi=Math.max(hi,h);}if(lo<3||hi-lo>3||hi>25)continue;
  const score=Math.hypot(x-tx,z-tz)+(hi-lo)*3;if(!best||score<best.score)best={x,z,y:Math.round((hi+lo)/2),score};
 }return best;}
 function pad(s,r,t){const {x,z,y}=s;for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){if(dx*dx+dz*dz>(r+.5)**2)continue;const xx=x+dx,zz=z+dz;for(let yy=1;yy<=y;yy++)put(xx,yy,zz,yy===y?t:'stone');erase(xx,zz,y);heights.set(key(xx,zz),y);}}
 function path(s,t='gravel'){
  const count=Math.ceil(Math.hypot(s.x,s.z-10)*2);for(let i=0;i<=count;i++){const f=i/count,x=Math.round(s.x*f+Math.sin(f*Math.PI)*2),z=Math.round(10+(s.z-10)*f),y=Math.round(5+(s.y-5)*f);
   if(occupied(x,z,8))continue;
   for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const xx=x+dx,zz=z+dz,g=ground(xx,zz);if(Math.abs(xx)>limit||Math.abs(zz)>limit)continue;
    const wet=g<3;for(let yy=wet?y:Math.min(g,y);yy<=y;yy++)put(xx,yy,zz,yy===y?(wet?'wood':t):'stone');erase(xx,zz,y);heights.set(key(xx,zz),y);walkwaySteps.add(key(xx,zz));if(wet&&xx%5===0&&zz%3===0)for(let yy=1;yy<y;yy++)put(xx,yy,zz,'log');
   }
  }
 }
 function destination(tx,tz,type,name,build,r=4){const s=choose(tx,tz,r);if(!s)return;pad(s,r,kind==='snow'?'snow':'grass');path(s,kind==='snow'?'slate':'gravel');build(s);details.push({...s,type,name});sites.push({id:'nature-'+details.length,type,x:s.x,z:s.z,y:s.y+1,name});}
 if(kind==='forest'){
  destination(-8,-8,'clearing','버섯과 그루터기의 빈터',s=>{for(const [dx,dz] of [[-3,-2],[3,-2],[-3,2]]){put(s.x+dx,s.y+1,s.z+dz,'log');put(s.x+dx,s.y+2,s.z+dz,'terracotta');}for(let dx=-1;dx<=1;dx++)put(s.x+dx,s.y+1,s.z+3,'log');});
  destination(-28,-5,'lookout','호수 곁 숲지기의 벤치',s=>{for(let dx=-2;dx<=2;dx++){put(s.x+dx,s.y+1,s.z+2,'wood');put(s.x+dx,s.y+2,s.z+3,'darkWood');}put(s.x-3,s.y+2,s.z+2,'lantern');});
  destination(18,22,'garden','바닷바람이 드는 작은 뜰',s=>{for(const dx of [-3,3])for(const dz of [-3,3]){put(s.x+dx,s.y+1,s.z+dz,'leaves');}put(s.x+3,s.y+2,s.z+3,'lantern');});
 }
 if(kind==='meadow'){
  destination(-25,-10,'orchard','들판의 작은 과수원',s=>{for(const [dx,dz] of [[-3,-3],[3,-3],[-3,3],[3,3]]){for(let h=1;h<=3;h++)put(s.x+dx,s.y+h,s.z+dz,'log');for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++)put(s.x+dx+x,s.y+4,s.z+dz+z,'leaves');put(s.x+dx,s.y+3,s.z+dz-1,'terracotta');}},5);
  destination(5,-25,'lookout','풍차를 바라보는 소풍 자리',s=>{for(let dx=-2;dx<=2;dx++){put(s.x+dx,s.y+1,s.z+2,'wood');}put(s.x-2,s.y+1,s.z-2,'log');put(s.x+2,s.y+1,s.z-2,'log');put(s.x,s.y+1,s.z-2,'wood');put(s.x,s.y+2,s.z-2,'lantern');});
  destination(22,18,'garden','들꽃 사이 낮은 울타리',s=>{for(let dx=-4;dx<=4;dx++)for(const dz of [-4,4]){if(Math.abs(dx)<2)continue;put(s.x+dx,s.y+1,s.z+dz,'wood');if(dx%2===0)put(s.x+dx,s.y+2,s.z+dz,'log');}},5);
 }
 if(kind==='islands'){
  destination(-25,28,'beach','유목이 쉬는 모래섬',s=>{pad(s,3,'sand');for(let dx=-2;dx<=2;dx++)put(s.x+dx,s.y+1,s.z+2,'log');put(s.x-2,s.y+2,s.z+2,'lantern');},2);
  destination(26,-26,'lookout','바다를 내려다보는 나무마루',s=>{for(let dx=-3;dx<=3;dx++)for(let dz=-2;dz<=2;dz++){erase(s.x+dx,s.z+dz,s.y);put(s.x+dx,s.y,s.z+dz,'wood');heights.set(key(s.x+dx,s.z+dz),s.y);}for(const dx of [-3,3]){put(s.x+dx,s.y+1,s.z-2,'log');put(s.x+dx,s.y+2,s.z-2,'lantern');}},2);
  destination(22,20,'garden','바닷바람 속 작은 돌뜰',s=>{for(const [dx,dz] of [[-2,-2],[2,-2],[-2,2]]){put(s.x+dx,s.y+1,s.z+dz,'stone');put(s.x+dx,s.y+2,s.z+dz,'leaves');}},2);
 }
 if(kind==='snow'){
  destination(2,-17,'shelter','눈길의 작은 쉼터',s=>{for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++)put(s.x+dx,s.y,s.z+dz,'wood');for(const dx of [-3,3])for(const dz of [-3,3])for(let h=1;h<=4;h++)put(s.x+dx,s.y+h,s.z+dz,'log');for(let dx=-4;dx<=4;dx++)for(let dz=-4;dz<=4;dz++)put(s.x+dx,s.y+5+Math.floor((4-Math.abs(dx))/2),s.z+dz,'snow');for(let dx=-2;dx<=2;dx++)put(s.x+dx,s.y+1,s.z+2,'wood');put(s.x+2,s.y+2,s.z+2,'lantern');},4);
  destination(-23,18,'camp','설송 아래 장작 야영지',s=>{for(const [dx,dz] of [[-2,-2],[2,-2],[-2,2],[2,2]])put(s.x+dx,s.y+1,s.z+dz,'stone');put(s.x,s.y+1,s.z-2,'lantern');for(let dx=-2;dx<=2;dx++)put(s.x+dx,s.y+1,s.z+3,'log');},4);
  destination(27,14,'lookout','얼음 연못을 바라보는 자리',s=>{for(let dx=-2;dx<=2;dx++){put(s.x+dx,s.y+1,s.z+2,'wood');put(s.x+dx,s.y+2,s.z+3,'snow');}put(s.x-3,s.y+2,s.z+2,'lantern');},3);
  let ice=0;for(let x=10;x<=30;x++)for(let z=18;z<=32;z++)if(Math.hypot((x-20)/1.4,z-25)<6&&ground(x,z)===1&&!occupied(x,z,7)&&!walkwaySteps.has(key(x,z))){put(x,3,z,'glass');heights.set(key(x,z),3);ice++;}
  if(ice)sites.push({id:'ice-pond',type:'ice',x:20,z:25,y:4,name:'물결이 잠든 얼음 연못'});
 }
 // A graded path brush must not raise the established arrival clearing.
 for(const [k,c] of blocks)if(Math.hypot(c.pos[0],c.pos[2]-10)<4)blocks.delete(k);
 for(const c of terrain.cubes)if(Math.hypot(c.pos[0],c.pos[2]-10)<4)blocks.set(c.key,c);
 for(let x=-3;x<=3;x++)for(let z=7;z<=13;z++)if(Math.hypot(x,z-10)<4)heights.set(key(x,z),terrain.heights.get(key(x,z)));
 // Cluster flowers and understory around clear terrain; never inside paths or architecture.
 const flowers=[];
 for(const [k,y] of heights){const [x,z]=k.split(',').map(Number);if(y<4||occupied(x,z,9)||walkwaySteps.has(k))continue;
  if(blocks.get([x,y,z].join(','))?.texture!=='grass'||blocks.has([x,y+1,z].join(',')))continue;
  if(Math.sin(x/9+(salt%50)) * Math.cos(z/11)>.25&&rnd(x,z)>.73)flowers.push([x,y+.75,z]);
  if(kind==='forest'&&rnd(x+61,z)>.985&&Math.hypot(x,z-10)>9){put(x,y+1,z,'leaves');}
 }
 for(const c of blocks.values())if(c.texture==='log'){const [x,y,z]=c.pos;if(y===ground(x,z)+1&&!occupied(x,z,10))trees.push({x,z});}
 return {...terrain,generator:4,cubes:[...blocks.values()],heights,sites,flowers,walkwaySteps,nature:{details,trees}};
}
