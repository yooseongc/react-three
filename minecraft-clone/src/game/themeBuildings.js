// Full voxel structures: every wall, roof, arch and furnishing remains editable.
function helpers(c){
 const {put,box,pad,site}=c;
 const approach=(x,z,y)=>{for(let step=0;step<7;step++){const zz=z+step,ground=c.height(x,zz),level=Math.max(ground,y-step);for(let dx=-1;dx<=1;dx++){put(x+dx,level,zz,'whiteStone');c.heights.set((x+dx)+','+zz,level);for(let dy=1;dy<=3;dy++)c.blocks.delete((x+dx)+','+(level+dy)+','+zz);}}};
 const roof=(x,z,y,rx,rz,t='blackTile',curve=false)=>{for(let dx=-rx;dx<=rx;dx++)for(let dz=-rz;dz<=rz;dz++){const rise=Math.floor((rx-Math.abs(dx))/2)+(curve&&Math.abs(dx)===rx?1:0);put(x+dx,y+rise,z+dz,t);}};
 const lantern=(x,y,z)=>{put(x,y,z,'darkWood');put(x,y+1,z,'lantern');};
 const pavilion=(x,z,{wall='darkWood',tile='blackTile',name='연못 정자',open=true,curve=false,level}={})=>{
  const y=pad(x,z,5,4,'whiteStone',level);box(x-3,x+3,y,y,z-3,z+3,'wood');
  for(const dx of [-3,3])for(const dz of [-3,3])box(x+dx,x+dx,y+1,y+4,z+dz,z+dz,wall);
  if(!open)for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++)for(let h=1;h<=3;h++)if(Math.abs(dx)===3||Math.abs(dz)===3){if(dz===3&&Math.abs(dx)<2&&h<3)continue;put(x+dx,y+h,z+dz,h===2&&Math.abs(dx)<2?'glass':wall);}
  roof(x,z,y+5,5,4,tile,curve);box(x-2,x+2,y+1,y+1,z-2,z-2,'darkWood');put(x,y+3,z,'lantern');approach(x,z+4,y);site('pavilion',x,z,y+3,name);return y;
 };
 const house=(x,z,{wall='plaster',tile='terracotta',floors=1,name='작은 집',level}={})=>{
  const y=pad(x,z,5,4,'limestone',level),top=floors*4;
  for(let dx=-4;dx<=4;dx++)for(let dz=-3;dz<=3;dz++){
   put(x+dx,y,z+dz,'wood');if(floors>1)put(x+dx,y+4,z+dz,'wood');
   for(let dy=1;dy<top;dy++){if(Math.abs(dx)!==4&&Math.abs(dz)!==3)continue;if(dz===3&&dx===0&&dy<=2)continue;const win=dy%4===2&&((Math.abs(dz)===3&&Math.abs(dx)%3===2)||(Math.abs(dx)===4&&Math.abs(dz)===1));put(x+dx,y+dy,z+dz,win?'glass':wall);}
  }
  if(floors>1)for(let step=1;step<=4;step++){put(x+3,y+step,z+3-step,'wood');for(let dy=1;dy<=2;dy++)c.blocks.delete((x+3)+','+(y+step+dy)+','+(z+3-step));}
  roof(x,z,y+top,5,4,tile);box(x-2,x,y+1,y+1,z-2,z-2,'darkWood');put(x+2,y+1,z-2,'wood');put(x+2,y+2,z-2,'lantern');lantern(x-4,y+1,z+4);approach(x,z+4,y);site('house',x,z,y+3,name);return y;
 };
 const bridge=(x,z,axis='x',length=15,t='whiteStone')=>{for(let i=-length;i<=length;i++){const y=4+Math.max(0,3-Math.floor(Math.abs(i)/2));for(let w=-1;w<=1;w++){const xx=x+(axis==='x'?i:w),zz=z+(axis==='x'?w:i);put(xx,y,zz,t);if(w!==0&&i%3===0){put(xx,y+1,zz,t);}}}site('bridge',x,z,7.5,'물길 위 아치 다리');};
 return {roof,lantern,pavilion,house,bridge};
}
function canal(c,h){
 const {limit,put,box,pad,path,site,rnd}=c;
 // Canal blocks repeat over larger worlds; the arrival plaza stays clear.
 for(let x=-limit+12;x<limit-10;x++)if([0,12].includes(((x+2)%32+32)%32))for(let z=-limit+10;z<limit-9;z++)if(((z-10)%32+32)%32===0&&Math.hypot(x,z-10)>12){h.house(x,z,{floors:2,wall:['plaster','ochreWall','roseWall','tealWall'][Math.floor(rnd(x,z)*4)],name:'운하의 작은 집',level:4});path([x,z+5],[x,z+8],'limestone',1);}
 pad(0,10,7,6,'limestone',4);for(const x of [-6,6])for(const z of [5,15])h.lantern(x,5,z);
 path([-c.limit,10],[c.limit,10],'limestone');
 // Bridges on the central promenade connect every separated bank.
 for(let x=-limit+5;x<limit-5;x++)if(((x+12)%32+32)%32===0)h.bridge(x,10,'x',7);
 const x=-28,z=-22,y=pad(x,z,5,5,'whiteStone',4);
 for(let dy=1;dy<=19;dy++)for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)if(Math.abs(dx)===2||Math.abs(dz)===2){if(dy>13&&Math.abs(dx)<2&&Math.abs(dz)===2)continue;put(x+dx,y+dy,z+dz,dy%6===0?'limestone':'roseWall');}
 box(x-1,x+1,y+15,y+16,z-1,z+1,'lantern');h.roof(x,z,y+20,4,4,'terracotta');site('belltower',x,z,y+14,'물빛 종탑');path([-28,-16],[-28,10],'limestone');
 // A narrow gondola rests on the broad canal, separate from the walkways.
 const gx=-12,gz=-20;for(let dz=-5;dz<=5;dz++)for(let dx=-1;dx<=1;dx++)if(Math.abs(dz)<5||dx===0){put(gx+dx,2,gz+dz,'darkWood');if(dx||Math.abs(dz)>3)put(gx+dx,3,gz+dz,'darkWood');}box(gx-1,gx+1,3,3,gz-2,gz-2,'vermilion');put(gx,4,gz+4,'lantern');site('gondola',gx,gz,3,'운하에 쉬는 곤돌라');site('plaza',0,10,4.5,'햇살 광장');
}
function onsen(c,h){
 const {put,path,site,steam}=c;
 h.house(-16,-16,{wall:'darkWood',tile:'blackTile',name:'대숲 온천 여관'});
 h.house(-18,20,{wall:'ochreWall',tile:'blackTile',name:'찻집'});
 path([0,10],[-16,-11],'wood');path([0,10],[-18,25],'wood');path([0,10],[19,-8],'wood');
 for(let a=0;a<Math.PI*2;a+=.12){const x=Math.round(19+Math.cos(a)*7),z=Math.round(-17+Math.sin(a)*7);put(x,3,z,'stone');put(x,4,z,'slate');}
 for(const x of [16,21])steam.push([x,3,-17]);
 h.pavilion(19,-4,{name:'탕 앞 쉼터',tile:'blackTile'});site('bath',19,-17,3,'대숲 노천탕');
}
function oasis(c,h){
 const {put,box,pad,path,site,tree}=c;
 for(const [x,z] of [[-19,-16],[-20,14],[9,29]]){h.house(x,z,{wall:'sandstone',tile:'sandstone',name:'오아시스의 흙집'});path([0,10],[x,z+5],'sandstone');}
 const y=pad(-5,-15,6,4,'sandstone');for(const x of [-10,0])box(x,x,y+1,y+4,-18,-12,'darkWood');
 for(let x=-10;x<=0;x++)box(x,x,y+5,y+5,-18,-12,x%2?'terracotta':'ochreWall');
 box(-9,-1,y+1,y+1,-17,-16,'wood');for(const x of [-8,-5,-2])put(x,y+2,-16,x===-5?'lantern':'coralPink');
 path([0,10],[-5,-10],'sandstone');site('market',-5,-15,y+3,'그늘진 향신료 시장');
 for(const [x,z] of [[8,-21],[29,-15],[25,3],[6,0]])tree(x,z,'palmLeaves','palm');
 const ry=pad(-27,-33,7,2,'sandstone');for(const dx of [-6,0,6])box(-27+dx,-27+dx,ry+1,ry+6,-33,-33,'sandstone');box(-33,-21,ry+6,ry+7,-33,-33,'sandstone');site('ruin',-27,-33,ry+4,'모래바람의 옛 문');
}
function autumn(c,h){
 const {put,path,site,height}=c;const y=h.house(-25,-15,{wall:'ochreWall',tile:'terracotta',name:'단풍 물레방앗간'});
 for(let dy=-4;dy<=4;dy++)for(let dz=-4;dz<=4;dz++){const r=Math.hypot(dy,dz);if((r>3&&r<4.6)||dy===0||dz===0)put(-19,y+4+dy,-15+dz,'darkWood');}
 put(-19,y+4,-15,'lantern');site('mill',-20,-15,y+5,'붉은 잎 아래 물레방아');path([0,10],[-25,-10],'gravel');path([0,10],[23,25],'gravel');h.pavilion(23,21,{tile:'terracotta',name:'단풍 계곡 전망대'});
 for(const z of [10,-27])h.bridge(Math.round(-12+6*Math.sin(z/18)),z,'x',7,'wood');for(const z of [-4,12,27])h.lantern(5,height(5,z)+1,z);
}
function coral(c,h){
 const {put,box,path,site,rnd}=c;
 for(const [x,z] of [[-26,-20],[24,-22],[24,27]]){const y=h.house(x,z,{wall:'wood',tile:'palmLeaves',name:'야자 지붕의 물가 오두막'});for(const dx of [-4,4])for(const dz of [-3,3])box(x+dx,x+dx,1,y-1,z+dz,z+dz,'log');path([x,z+5],[x,z+13],'wood');h.lantern(x,y+1,z+5);site('bungalow',x,z,y+3,'산호빛 바다의 오두막');}
 path([0,10],[0,-18],'wood');for(const x of [-2,2]){box(x,x,1,4,-18,-18,'log');h.lantern(x,5,-18);}site('pier',0,-18,4,'산호 바다 선착장');
 for(let x=-40;x<=40;x+=2)for(let z=-38;z<=38;z+=2)if(c.height(x,z)===1&&rnd(x+9,z)>.72)put(x,2,z,rnd(x,z)>.5?'coralPink':'coralBlue');h.pavilion(8,14,{tile:'palmLeaves',name:'파도 소리 쉼터'});
}
function sky(c,h){
 const {put,box,pad,path,site}=c;
 for(const [x,z] of [[-25,-17],[24,-18],[27,27],[-27,28]]){path([0,10],[x,z],'whiteStone',1);const n=Math.ceil(Math.hypot(x,z-10));for(let i=4;i<n;i+=5){const xx=Math.round(x*i/n),zz=Math.round(10+(z-10)*i/n);for(const dx of [-2,2]){put(xx+dx,27,zz,'whiteStone');put(xx+dx,28,zz,'lantern');}}}
 const y=pad(24,-18,7,7,'whiteStone',26);for(let dx=-6;dx<=6;dx++)for(let dz=-6;dz<=6;dz++)for(let dy=0;dy<=7;dy++){const d=Math.hypot(dx,dz,dy);if(d>5.6&&d<6.6&&!(dz>4&&Math.abs(dx)<2&&dy<3))put(24+dx,y+1+dy,-18+dz,dy<2?'whiteStone':'glass');}
 box(24,24,27,29,-18,-18,'darkWood');box(24,27,30,30,-18,-18,'slate');put(28,30,-18,'glass');site('observatory',24,-18,30,'구름 위 별 관측소');h.pavilion(-25,-17,{tile:'jadeTile',name:'하늘바람 정자',level:26});
 for(const [x,z] of [[-27,28],[27,27]]){pad(x,z,4,4,'gravel',26);for(let dx=-3;dx<=3;dx++)put(x+dx,27,z,'cherryLeaves');h.lantern(x,28,z);site('garden',x,z,27,'떠 있는 꽃 정원');}
}
function shrine(c,h){
 const {put,box,pad,path,site,height}=c;path([0,18],[0,-23],'gravel',2);
 for(const z of [1,-13]){const y=height(0,z);for(const x of [-4,4])box(x,x,y+1,y+6,z,z,'vermilion');box(-5,5,y+5,y+5,z,z,'vermilion');box(-6,6,y+7,y+7,z,z,'blackTile');put(-6,y+8,z,'blackTile');put(6,y+8,z,'blackTile');}
 const y=h.pavilion(0,-28,{wall:'vermilion',tile:'blackTile',open:false,curve:true,name:'벚꽃 그늘의 신사'});box(-1,1,y+1,y+1,-23,-23,'darkWood');put(0,y+2,-23,'lantern');site('shrine',0,-28,y+4,'벚꽃 신사');
 for(const z of [-19,-7,7])for(const x of [-6,6]){const yy=height(x,z);put(x,yy+1,z,'stone');put(x,yy+2,z,'lantern');box(x-1,x+1,yy+3,yy+3,z,z,'blackTile');}
 const gy=pad(-22,18,8,6,'gravel');for(let z=13;z<=23;z+=3)box(-29,-15,gy,gy,z,z,'whiteStone');box(-24,-22,gy+1,gy+2,17,18,'stone');site('garden',-22,18,gy+2,'돌과 모래의 뜰');
}
function moon(c,h){
 const {put,box,pad,path,site}=c;const y=pad(0,2,7,1,'whiteStone',4);
 for(let x=-7;x<=7;x++)for(let dy=1;dy<=8;dy++)if(Math.hypot(x,dy-3.5)>3.4)put(x,y+dy,2,dy===8?'blackTile':'plaster');path([0,10],[0,-15],'gravel');site('moonGate',0,2,y+4,'달을 닮은 문');
 h.pavilion(22,-6,{wall:'darkWood',tile:'jadeTile',curve:true,name:'물에 비친 월영정',level:4});const points=[[0,-15],[7,-15],[7,-7],[16,-7],[16,-2],[22,-2]];
 for(let i=1;i<points.length;i++){path(points[i-1],points[i],'whiteStone');const [x,z]=points[i];for(const dx of [-2,2])box(x+dx,x+dx,5,8,z,z,'darkWood');h.roof(x,z,9,3,3,'jadeTile',true);}
 for(const [x,z] of [[-17,-20],[-23,20]]){const by=pad(x,z,3,3,'gravel');box(x-1,x+1,by+1,by+3,z,z,'stone');box(x,x,by+4,by+5,z,z+1,'slate');}for(const x of [-32,34]){box(x,x,5,7,-30,30,'plaster');box(x,x,8,8,-30,30,'blackTile');}site('corridor',10,-7,7,'물길을 꺾어 걷는 회랑');
}
function pine(c,h){
 const {put,box,pad,path,site,height}=c;const y=h.house(-19,-17,{wall:'plaster',tile:'blackTile',name:'솔향이 머무는 별서'});for(const x of [-23,-15])box(x,x,y+1,y+3,-14,-14,'darkWood');box(-24,-14,y,y,-13,-11,'wood');pad(-9,8,12,7,'gravel',4);path([0,10],[-19,-10],'gravel');h.pavilion(18,-13,{tile:'blackTile',wall:'darkWood',name:'솔바람 연못 정자',level:4});path([0,10],[18,-8],'wood');
 for(let x=-32;x<=32;x++)if(Math.abs(x)>3){const yy=height(x,26);put(x,yy+1,26,'stone');put(x,yy+2,26,'slate');}for(const x of [-32,32])for(let z=-30;z<=26;z++){const yy=height(x,z);put(x,yy+1,z,'stone');put(x,yy+2,z,'slate');}for(const [x,z] of [[-8,-8],[8,21]])h.lantern(x,height(x,z)+1,z);site('byeolseo',-19,-17,y+3,'솔바람 별서');site('courtyard',-9,8,5,'비워 둔 마당');
}
const BUILDERS={canal,onsen,oasis,autumn,coral,sky,shrine,moon,pine};
export function buildTheme(c){BUILDERS[c.kind]?.(c,helpers(c));}
