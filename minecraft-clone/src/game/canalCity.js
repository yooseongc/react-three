// District-first city layout. Reservations are shared by water, streets and buildings.
export function generateCanalCity(seed,config,salt){
 const limit=config.size/2-1,blocks=new Map(),heights=new Map(),water=[],sites=[],buildings=[],reserved=new Set(),walkwaySteps=new Set();
 const rand=(x,z,n=0)=>{let h=Math.imul(x^salt,374761393)^Math.imul(z+n*97,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
 const phase=rand(3,7)*6.28,shift=Math.floor(rand(9,1)*5)-2;
 const channel=z=>Math.round(-11+shift+Math.sin(z/23+phase)*3);
 const cross=x=>Math.round(-10+Math.sin(x/24+phase)*2);
 const coast=x=>Math.round(limit*.62+Math.sin(x/17+phase)*2);
 const mainWidth=5+Math.floor(rand(1,9)*2),marketX=17+Math.floor(rand(2,1)*5),marketZ=8+Math.floor(rand(3,2)*4),towerX=-29+Math.floor(rand(4,2)*5),towerZ=16;
 const put=(x,y,z,t)=>{if(Math.abs(x)>limit||Math.abs(z)>limit||y<1||y>64)return;const key=[x,y,z].join(',');blocks.set(key,{key,pos:[x,y,z],texture:t});};
 const box=(x0,x1,y0,y1,z0,z1,t)=>{for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)for(let y=y0;y<=y1;y++)put(x,y,z,t);};
 const site=(type,x,z,y,name)=>sites.push({id:type+'-'+sites.length,type,x,z,y,name});
 const reserve=(x0,x1,z0,z1)=>{for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)reserved.add(x+','+z);};
 for(let x=-limit;x<=limit;x++)for(let z=-limit;z<=limit;z++){
  const wet=Math.abs(x-channel(z))<=mainWidth||Math.abs(z-cross(x))<=2||z>coast(x);
  const spawn=x>=-2&&x<=4&&z>=6&&z<=14,h=wet&&!spawn?1:4;
  heights.set(x+','+z,h);for(let y=1;y<=h;y++)put(x,y,z,y===h?(h===1?'sand':(x+z)%7===0?'whiteStone':'limestone'):'stone');
  if(h===1)water.push([x,2.8,z]);
  if(Math.abs(x-channel(z))<=mainWidth+4||Math.abs(z-cross(x))<=5||z>coast(x)-4)reserved.add(x+','+z);
 }
 const pave=(x0,x1,z0,z1,t='limestone')=>{reserve(x0,x1,z0,z1);for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++){put(x,4,z,t);heights.set(x+','+z,4);}};
 reserve(4,22,-48,-27);
 pave(-2,4,6,14);pave(marketX-8,marketX+8,marketZ-8,marketZ+6,'whiteStone');pave(towerX-7,towerX+7,9,24);
 const roads=[];
 const road=(a,b)=>{const count=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1]));for(let i=0;i<=count;i++){const x=Math.round(a[0]+(b[0]-a[0])*i/Math.max(1,count)),z=Math.round(a[1]+(b[1]-a[1])*i/Math.max(1,count));reserve(x-1,x+1,z-1,z+1);if(heights.get(x+','+z)===4)put(x,4,z,'slate');}roads.push([a,b]);};
 road([0,10],[marketX+10,10]);road([marketX+10,10],[marketX+10,-29]);road([marketX+10,-25],[-30,-25]);road([-30,-25],[-30,18]);road([-30,10],[0,10]);road([marketX+10,10],[marketX+10,coast(marketX+10)-1]);
 // Larger maps grow connected streets and varied neighbourhoods, not empty margins.
 if(config.size>100){for(let x=-limit+15;x<limit-10;x+=26)road([x,-limit+5],[x,coast(x)-2]);for(let z=-limit+15;z<coast(0)-4;z+=26)road([-limit+5,z],[limit-5,z]);}
 const bridge=(cx,cz,axis,radius)=>{
  for(let i=-radius;i<=radius;i++){const y=4+Math.max(0,3-Math.floor(Math.abs(i)/2));for(let w=-2;w<=2;w++){
   const x=cx+(axis==='x'?i:w),z=cz+(axis==='x'?w:i);put(x,y,z,'whiteStone');reserve(x,x,z,z);
   if(Math.abs(w)<2){heights.set(x+','+z,y);walkwaySteps.add(x+','+z);}else if(i%3===0)put(x,y+1,z,'whiteStone');
  }}site('bridge',cx,cz,8,'운하를 건너는 흰 다리');
 };
 bridge(channel(10),10,'x',mainWidth+5);bridge(channel(-25),-25,'x',mainWidth+5);
 bridge(marketX+10,cross(marketX+10),'z',6);bridge(-30,cross(-30),'z',6);
 if(config.size>100){for(let z=-limit+15;z<coast(0)-4;z+=26)bridge(channel(z),z,'x',mainWidth+5);for(let x=-limit+15;x<limit-10;x+=26)if(Math.abs(x-channel(cross(x)))>mainWidth+8)bridge(x,cross(x),'z',6);}
 const lamp=(x,z,y=4)=>{put(x,y+1,z,'darkWood');put(x,y+2,z,'lantern');};
 // A long arcade frames the market; open arches reveal the square through columns.
 const arcadeZ=marketZ-6;
 for(let x=marketX-8;x<=marketX+8;x++){
  box(x,x,9,9,arcadeZ-2,arcadeZ+2,'limestone');box(x,x,10,10,arcadeZ-2,arcadeZ+2,'terracotta');
  const a=(x-marketX+8)%4;box(x,x,5,8,arcadeZ-2,arcadeZ-2,a===2?'glass':'plaster');
  if(a===0)box(x,x,5,8,arcadeZ+2,arcadeZ+2,'whiteStone');else if(a===1||a===3)put(x,8,arcadeZ+2,'whiteStone');
 }
 for(const dx of [-5,1,6]){const x=marketX+dx,z=marketZ+4;for(const a of [-1,1])put(x+a,5,z,'darkWood');box(x-1,x+1,6,6,z,z,'wood');for(let xx=x-2;xx<=x+2;xx++)box(xx,xx,8,8,z-1,z+1,(xx-x)%2?'ochreWall':'terracotta');for(const a of [-2,2])box(x+a,x+a,5,7,z-1,z-1,'darkWood');put(x,7,z,'coralPink');}
 site('market',marketX,marketZ,6,'아케이드 아래의 아침 시장');
 // Tower and clock are an asymmetrical landmark, visible across both main bridges.
 const th=24+Math.floor(rand(7,2)*5);
 for(let y=5;y<=th;y++)for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)if(Math.abs(dx)===2||Math.abs(dz)===2){if(dz===2&&dx===0&&y<=6)continue;put(towerX+dx,y,towerZ+dz,y%6===0?'limestone':'plaster');}
 for(const dz of [-3,3]){box(towerX-2,towerX+2,th-6,th-2,towerZ+dz,towerZ+dz,'whiteStone');put(towerX,th-4,towerZ+dz,'darkWood');put(towerX+1,th-4,towerZ+dz,'darkWood');put(towerX,th-3,towerZ+dz,'darkWood');}
 for(let y=th+1;y<=th+4;y++)for(const dx of [-2,2])for(const dz of [-2,2])put(towerX+dx,y,towerZ+dz,'limestone');put(towerX,th+3,towerZ,'lantern');box(towerX-3,towerX+3,th+5,th+5,towerZ-3,towerZ+3,'terracotta');box(towerX-1,towerX+1,th+6,th+7,towerZ-1,towerZ+1,'terracotta');site('belltower',towerX,towerZ,th-3,'골목 너머 시계 종탑');
 // A small fountain and shaded seats make the square a destination at walking height.
 for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)if(Math.abs(dx)===2||Math.abs(dz)===2)put(towerX+4+dx,5,22+dz,'whiteStone');put(towerX+4,5,22,'glass');put(towerX+4,6,22,'whiteStone');
 site('plaza',towerX,22,5,'종소리 광장');
 const palette=['plaster','ochreWall','roseWall','tealWall'];
 function building(x,z,rx,rz,floors,turn,roof){
  const at=(u,v)=>turn===0?[x+u,z+v]:turn===1?[x-v,z+u]:turn===2?[x-u,z-v]:[x+v,z-u];
  const cells=[];for(let u=-rx-1;u<=rx+1;u++)for(let v=-rz-1;v<=rz+2;v++){const [xx,zz]=at(u,v);if(Math.abs(xx)>limit-1||Math.abs(zz)>limit-1||heights.get(xx+','+zz)!==4||reserved.has(xx+','+zz))return false;cells.push([xx,zz]);}
  for(const [xx,zz] of cells)reserved.add(xx+','+zz);
  const wall=palette[Math.floor(rand(x,z,3)*4)],top=4+floors*4;
  const p=(u,y,v,t)=>{const [xx,zz]=at(u,v);put(xx,y,zz,t);};
  for(let u=-rx;u<=rx;u++)for(let v=-rz;v<=rz;v++){
   for(let f=0;f<floors;f++)p(u,4+f*4,v,'wood');
   for(let y=5;y<top;y++)if(Math.abs(u)===rx||Math.abs(v)===rz){if(v===rz&&u===0&&y<7)continue;const win=(y-4)%4===2&&((Math.abs(v)===rz&&Math.abs(u)===rx-1)||(Math.abs(u)===rx&&v===0));p(u,y,v,win?'glass':(y-4)%4===0?'limestone':wall);}
   const rise=roof===0?Math.max(0,rx-Math.abs(u)):roof===1?Math.min(rx-Math.abs(u),rz-Math.abs(v)):0;p(u,top+rise,v,roof===2?'whiteStone':'terracotta');
  }
  // Roof overhang and cornice give each facade a readable silhouette.
  for(let u=-rx-1;u<=rx+1;u++)for(const v of [-rz-1,rz+1])p(u,top,v,'terracotta');
  if(roof===2){for(let u=-rx;u<=rx;u++)for(const v of [-rz,rz])p(u,top+1,v,'limestone');p(-rx+1,top+1,-rz+1,'darkWood');p(-rx+1,top+2,-rz+1,'leaves');}
  for(let f=1;f<floors;f++){for(let step=1;step<=4;step++){const v=rz-step;p(rx-1,f*4+step,v,'wood');for(let dy=1;dy<=2;dy++){const [xx,zz]=at(rx-1,v);blocks.delete([xx,f*4+step+dy,zz].join(','));}}}
  p(-rx+1,5,-rz+1,'wood');p(-rx+1,6,-rz+1,'lantern');p(rx-1,5,-rz+1,'darkWood');
  for(const u of [-rx+1,rx-1]){p(u,5,rz+1,'darkWood');p(u,6,rz+1,'leaves');}
  if(floors>1&&rx>=3){for(let u=-1;u<=1;u++){p(u,8,rz+1,'wood');if(u)p(u,9,rz+1,'darkWood');}p(0,9,rz,'glass');}
  buildings.push({x,z,rx,rz,floors,turn,roof,wall});site('house',x,z,7,floors===3?'운하를 바라보는 세 층 집':roof===2?'옥상 정원이 있는 집':'골목의 작은 집');return true;
 }
 // Seeded lot packing: dimensions, orientations and density vary across districts.
 for(const [x,z] of [[marketX+7,marketZ+8],[towerX-5,22],[marketX+6,22]])reserve(x-2,x+2,z-2,z+3);
 const candidates=[];for(let x=-limit+7;x<limit-6;x+=3)for(let z=-limit+7;z<coast(x)-7;z+=3)candidates.push({x,z,score:rand(x,z,11)});
 candidates.sort((a,b)=>b.score-a.score);
 const cap=Math.round(config.size*config.size/300);
 for(const {x,z,score} of candidates){if(buildings.length>=cap)break;if(score<.25)continue;const rx=2+Math.floor(rand(x,z,4)*3),rz=3+Math.floor(rand(x,z,5)*2),floors=1+Math.floor(rand(x,z,6)*3),turn=x>channel(z)?1:3;building(x,z,rx,rz,floors,rand(x,z,9)>.7?0:turn,Math.floor(rand(x,z,8)*3));}
 // The waterfront has piles, cargo, mooring lights and a long view to open sea.
 const harbourX=marketX+10,shore=coast(harbourX);
 pave(harbourX-4,harbourX+4,shore-3,shore,'slate');
 for(let z=shore;z<=Math.min(limit-3,shore+12);z++)for(let dx=-1;dx<=1;dx++){put(harbourX+dx,4,z,'wood');heights.set(harbourX+dx+','+z,4);if(z%4===0&&dx){box(harbourX+dx,harbourX+dx,1,5,z,z,'log');}}
 lamp(harbourX-3,shore-1);lamp(harbourX+3,shore-1);box(harbourX-3,harbourX-2,5,6,shore-2,shore-1,'darkWood');site('harbour',harbourX,shore+5,5,'바닷바람 선착장');
 const boats=[{x:channel(0),z:0},{x:harbourX-6,z:shore+7}];
 for(const b of boats){for(let dz=-4;dz<=4;dz++)for(let dx=-1;dx<=1;dx++){if(Math.abs(dz)===4&&dx)continue;put(b.x+dx,2,b.z+dz,'darkWood');if(dx||Math.abs(dz)>2)put(b.x+dx,3,b.z+dz,'darkWood');}put(b.x,3,b.z,'vermilion');put(b.x,4,b.z+3,'lantern');site('gondola',b.x,b.z,3,'물길에 쉬는 곤돌라');}
 for(let z=-limit+8;z<coast(0)-3;z+=10){const x=channel(z)+mainWidth+3;if(heights.get(x+','+z)===4&&Math.hypot(x,z-10)>4)lamp(x,z);}
 // Small trees and benches occupy selected courtyards rather than a regular forest grid.
 for(const [x,z] of [[marketX+7,marketZ+8],[towerX-5,22],[marketX+6,22]]){if(heights.get(x+','+z)!==4)continue;box(x,x,5,7,z,z,'log');for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)put(x+dx,8,z+dz,'leaves');for(let dx=-2;dx<=0;dx++)put(x+dx,5,z+2,'wood');}
 site('promenade',0,10,5,'대운하 산책길');
 return {seed:String(seed),...config,cubes:[...blocks.values()],heights,water,flowers:[],sites,steam:[],spawnHeading:-Math.PI/2,walkwaySteps,undergroundPlan:{x:13,z:-40,entryZ:-28},city:{buildings,roads,market:[marketX,marketZ],tower:[towerX,towerZ],channelShift:shift,phase,mainWidth,walkRoute:[[0,10],[marketX+10,10],[marketX+10,-25],[-30,-25],[-30,10],[0,10]],harbour:[harbourX,shore]}};
}
