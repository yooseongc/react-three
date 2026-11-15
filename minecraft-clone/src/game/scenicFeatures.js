// Editable details tied to each landscape, including their walking connections.
export function addScenicFeatures(terrain,salt){
 const {size,mapType,heights}=terrain,limit=size/2-1,sites=[...terrain.sites];
 const blocks=new Map(terrain.cubes.map(c=>[c.key,c]));
 const put=(x,y,z,texture)=>{x=Math.round(x);y=Math.round(y);z=Math.round(z);if(Math.abs(x)>limit||Math.abs(z)>limit||y<1||y>64)return;const key=`${x},${y},${z}`;blocks.set(key,{key,pos:[x,y,z],texture});};
 const eraseAbove=(x,z,y,top=y+15)=>{for(let h=y+1;h<=top;h++)blocks.delete(`${x},${h},${z}`);};
 const ground=(x,z)=>heights.get(`${Math.round(x)},${Math.round(z)}`)||1;
 const pad=(x,z,r)=>{let y=0;for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++)y=Math.max(y,ground(x+dx,z+dz));for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){eraseAbove(x+dx,z+dz,y,48);for(let h=ground(x+dx,z+dz)+1;h<=y;h++)put(x+dx,h,z+dz,'stone');}return y;};
 const chooseLand=(tx,tz,r)=>{let best=null;for(let x=tx-12;x<=tx+12;x+=2)for(let z=tz-12;z<=tz+12;z+=2){if(Math.abs(x)>limit-r-2||Math.abs(z)>limit-r-2||sites.some(s=>Math.hypot(s.x-x,s.z-z)<16)||Math.hypot(x,z-10)<13)continue;let lo=100,hi=0;for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){const h=ground(x+dx,z+dz);lo=Math.min(lo,h);hi=Math.max(hi,h);}if(lo<3||hi-lo>5)continue;const score=Math.hypot(x-tx,z-tz)+hi-lo;if(!best||score<best.score)best={x,z,score};}return best;};
 if(mapType==='forest'||mapType==='islands'){
  // Choose a genuinely water-filled rectangle; never plant a boat in a hillside.
  let berth=null;
  for(let x=limit-6;x>8&&!berth;x--)for(let z=-limit+12;z<limit-12;z+=3){
   let clear=true;for(let dx=-3;dx<=3&&clear;dx++)for(let dz=-8;dz<=8;dz++)if(ground(x+dx,z+dz)>2||blocks.has(`${x+dx},4,${z+dz}`)){clear=false;break;}
   if(clear){berth={x,z};break;}
  }
  if(berth){const {x,z}=berth;
   for(let dz=-8;dz<=8;dz++){const r=Math.min(3,Math.floor((9-Math.abs(dz))/2)+1);for(let dx=-r;dx<=r;dx++){
    put(x+dx,2,z+dz,'log');put(x+dx,3,z+dz,'wood');if(Math.abs(dx)<r)put(x+dx,4,z+dz,'wood');else{put(x+dx,4,z+dz,'log');if(dz%3===0)put(x+dx,5,z+dz,'log');}
   }}
   for(let y=5;y<=17;y++)put(x,y,z,'log');
   for(let dx=-5;dx<=5;dx++)put(x+dx,15,z,'log');
   for(let y=8;y<=15;y++)for(let dx=-4;dx<=4;dx++)if(dx!==0&&Math.abs(dx)<=Math.ceil((16-y)*.65))put(x+dx,y,z+1,'plaster');
   for(let dz=1;dz<=3;dz++)put(x,17,z-dz,'roof');
   for(let dx=-1;dx<=1;dx++)for(let dz=4;dz<=6;dz++){put(x+dx,5,z+dz,dx?'wood':'glass');put(x+dx,6,z+dz,'roof');}
   for(const dz of [-6,6])for(const dx of [-2,2])put(x+dx,6,z+dz,'lantern');
   sites.push({id:'sailboat',type:'sailboat',x,z,y:9,name:'노을을 싣는 돛배'});
   // A mooring walk reaches the first dry shore, with piles and lit bollards.
   const pierZ=z+8;let shore=x-5;while(shore>-limit+3&&ground(shore,pierZ)<3)shore--;
   if(x-shore<42){for(let px=shore;px<=x;px++)for(let dz=0;dz<=2;dz++){const y=Math.max(4,ground(px,pierZ+dz));put(px,y,pierZ+dz,'wood');eraseAbove(px,pierZ+dz,y);if(px%5===0&&dz!==1){for(let h=2;h<y;h++)put(px,h,pierZ+dz,'log');put(px,y+1,pierZ+dz,'log');put(px,y+2,pierZ+dz,'lantern');}}sites.push({id:'harbour',type:'pier',x:Math.round((shore+x)/2),z:pierZ+1,y:4.5,name:'바다로 이어지는 부두'});}
  }
 }
 if(mapType==='meadow'){
  const spot=chooseLand(24,-26,4);if(spot){const {x,z}=spot,y=pad(x,z,4);
   for(let dy=1;dy<=10;dy++){const r=dy>6?1:2;for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){if(Math.abs(dx)!==r&&Math.abs(dz)!==r)continue;if(dz===r&&dx===0&&dy<3)continue;put(x+dx,y+dy,z+dz,dy===5&&dx===0?'glass':dy>8?'roof':'plaster');}}
   // Four diagonal timber sails are a distinctive silhouette even at a distance.
   for(let i=-5;i<=5;i++){put(x+i,y+8+i,z+3,'wood');put(x+i,y+8-i,z+3,'wood');if(Math.abs(i)>2){put(x+i,y+9+i,z+3,'plaster');put(x+i,y+7-i,z+3,'plaster');}}
   put(x,y+8,z+4,'log');put(x-3,y+2,z+3,'lantern');sites.push({id:'windmill',type:'windmill',x,z,y:y+7,name:'들꽃 언덕의 풍차'});
  }
 }
 if(mapType==='islands'){
  const spot=chooseLand(-24,-22,3)||sites.find(s=>s.type==='gazebo');if(spot){const {x,z}=spot,y=pad(x,z,4);
   const old=sites.findIndex(s=>s.x===x&&s.z===z);if(old>=0)sites.splice(old,1);
   for(let dy=1;dy<=13;dy++)for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){if(Math.abs(dx)+Math.abs(dz)>3)continue;if(Math.abs(dx)===2||Math.abs(dz)===2)put(x+dx,y+dy,z+dz,dy>=10?'glass':dy%5<2?'brick':'plaster');}
   for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++)if(Math.abs(dx)+Math.abs(dz)<=4)put(x+dx,y+14,z+dz,'roof');
   for(const dx of [-1,0,1])put(x+dx,y+11,z,'lantern');put(x,y+1,z+2,'wood');sites.push({id:'lighthouse',type:'lighthouse',x,z,y:y+11,name:'물안개 등대'});
  }
 }
 // Connect cabins to the valley with winding paths. Clear headroom, retain bridges.
 for(const site of sites.filter(s=>s.type==='cabin'||s.type==='windmill')){
  const ex=site.x,ez=site.z+6,steps=Math.ceil(Math.hypot(ex,ez-10)*2);
  for(let i=0;i<=steps;i++){const t=i/Math.max(1,steps),x=Math.round(ex*t+Math.sin(t*Math.PI*2)*2),z=Math.round(10+(ez-10)*t);
   if(sites.some(s=>Math.hypot(s.x-x,s.z-z)<7))continue;
   for(let dx=-1;dx<=1;dx++){const h=ground(x+dx,z);if(h<3)continue;put(x+dx,h,z,mapType==='snow'?'slate':'sand');eraseAbove(x+dx,z,h,h+3);}
   if(i%16===0&&ground(x+2,z)>3){const h=ground(x+2,z);put(x+2,h+1,z,'log');put(x+2,h+2,z,'lantern');}
  }
 }
 // Small tended gardens and fence lines tie homes to their surroundings.
 for(const site of sites.filter(s=>s.type==='cabin')){const {x,z}=site;
  for(let dx=-5;dx<=5;dx++)for(const dz of [-6,6]){const h=ground(x+dx,z+dz);if(h<3||Math.abs(dx)<2&&dz===6)continue;eraseAbove(x+dx,z+dz,h);put(x+dx,h+1,z+dz,'wood');if(dx%2===0)put(x+dx,h+2,z+dz,'log');}
  if(mapType==='meadow')for(let dx=6;dx<=9;dx++)for(let dz=-3;dz<=3;dz++){const h=ground(x+dx,z+dz);if(h>=4){put(x+dx,h,z+dz,'dirt');put(x+dx,h+1,z+dz,dx%2?'leaves':'sand');}}
 }
 return {...terrain,cubes:[...blocks.values()],sites};
}
