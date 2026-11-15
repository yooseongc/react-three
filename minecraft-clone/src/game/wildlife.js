import { hashSeed, randomAt, WATER_LEVEL } from './terrain';
import { mapConfig, mapLimit } from './mapConfig';

export const WILDLIFE_SPECIES={
  rabbit:{count:8,speed:.75,radius:.27},
  duck:{count:4,speed:.55,radius:.27},
  fox:{count:2,speed:.95,radius:.38},
  sheep:{count:2,speed:.4,radius:.42},
  deer:{count:3,speed:.85,radius:.85},
  horse:{count:3,speed:.7,radius:1.16},
  gull:{count:4,speed:2.2,radius:1.1},
  fish:{count:6,speed:.65,radius:.5},
  squirrel:{count:0,speed:1.05,radius:.23},
  pheasant:{count:0,speed:.65,radius:.45},
  turtle:{count:0,speed:.18,radius:.4},
  magpie:{count:0,speed:.7,radius:.45},
  arcticFox:{count:0,speed:.8,radius:.4},
  arcticHare:{count:0,speed:.8,radius:.27},
  butterfly:{count:0,speed:.4,radius:.35},
  crab:{count:0,speed:.38,radius:.45},
  seaTurtle:{count:0,speed:.32,radius:.8},
  camel:{count:0,speed:.55,radius:1.4},
  fennec:{count:0,speed:.9,radius:.4},
  macaque:{count:0,speed:.5,radius:.43},
};
export const WILDLIFE_LIMIT=32;
export function wildlifePopulation(mapType='forest'){
 const overrides={canal:{rabbit:0,fox:0,sheep:0,deer:0,horse:0,gull:4},onsen:{horse:0,gull:0,deer:2},oasis:{rabbit:2,fox:2,sheep:0,deer:0,horse:0,gull:0},autumn:{horse:0,gull:0,deer:4},coral:{rabbit:2,fox:0,sheep:0,deer:0,horse:0,gull:4},sky:{duck:0,fish:0,fox:0,sheep:0,deer:0,horse:0,gull:0},shrine:{rabbit:4,fox:2,sheep:0,deer:2,horse:0,gull:0},moon:{rabbit:4,fox:0,sheep:0,deer:0,horse:0,gull:0},pine:{rabbit:4,fox:0,sheep:0,deer:2,horse:0,gull:0},forest:{horse:0,gull:3},meadow:{deer:2,gull:0,fish:5},islands:{rabbit:4,fox:0,deer:0,horse:0},snow:{deer:4,horse:0,gull:0,fish:3}}[mapType]||{};
 if(mapType==='autumn')Object.assign(overrides,{rabbit:5,sheep:0,deer:5,squirrel:5});
 if(mapType==='shrine')Object.assign(overrides,{duck:3,fish:5,deer:3,squirrel:3,pheasant:4});
 if(mapType==='moon')Object.assign(overrides,{fish:8,squirrel:2,turtle:4});
 if(mapType==='pine')Object.assign(overrides,{duck:3,fish:5,deer:3,squirrel:3,magpie:4});
 if(mapType==='snow')Object.assign(overrides,{rabbit:0,duck:0,fox:0,sheep:0,horse:0,deer:5,arcticFox:4,arcticHare:5});
 if(mapType==='islands')Object.assign(overrides,{rabbit:3,duck:2,sheep:0,gull:5,fish:8,crab:5,seaTurtle:2});
 if(mapType==='meadow')Object.assign(overrides,{rabbit:5,duck:3,fox:1,sheep:5,pheasant:3,butterfly:4});
 if(mapType==='forest')Object.assign(overrides,{rabbit:5,duck:3,fish:5,sheep:0,deer:3,squirrel:5,butterfly:4});
 if(mapType==='sky')Object.assign(overrides,{rabbit:5,magpie:4,butterfly:5});
 if(mapType==='coral')Object.assign(overrides,{rabbit:0,duck:0,fish:8,crab:5,seaTurtle:3});
 if(mapType==='oasis')Object.assign(overrides,{rabbit:0,fox:0,duck:3,fish:6,camel:3,fennec:4});
 if(mapType==='onsen')Object.assign(overrides,{rabbit:4,duck:2,fish:4,fox:0,sheep:0,deer:2,squirrel:3,macaque:4});
 return Object.entries(WILDLIFE_SPECIES).flatMap(([type,{count}])=>Array(overrides[type]??count).fill(type)).slice(0,WILDLIFE_LIMIT);
}
export const WILDLIFE_RANGE=45;
function random(animal){animal.random=(Math.imul(animal.random,1664525)+1013904223)>>>0;return animal.random/4294967296;}

export function wildlifeHabitat(terrain) {
  if(!terrain)return null;
  const limit=mapLimit(mapConfig(terrain));
  const baths=terrain.onsen?.baths||[];
  const hotCell=(x,z)=>baths.some(b=>Math.hypot((x-b.x)/b.rx,(z-b.z)/b.rz)<1.05);
  const aquatic=terrain.water.filter(([x,,z])=>!hotCell(x,z)&&(!terrain.onsen||Math.hypot((x-4)/1.3,z-32)<8));
  const salt=hashSeed(terrain.seed), water=new Set(aquatic.map(([x,,z])=>`${x},${z}`));
  const grass=[...terrain.heights].map(([key,y])=>{const [x,z]=key.split(',').map(Number);return {x,y:y+.5,z};})
    .filter(p=>p.y>WATER_LEVEL && Math.abs(p.x)<limit-4 && Math.abs(p.z)<limit-4);
  const waterCells=aquatic.map(([x,,z])=>({x,y:WATER_LEVEL,z}));
  // A few animals are discoverable near the starting trail; remaining homes vary with seed.
  const nearby=[...grass].sort((a,b)=>Math.hypot(a.x,a.z-10)-Math.hypot(b.x,b.z-10));
  grass.sort((a,b)=>randomAt(salt,a.x,a.z)-randomAt(salt,b.x,b.z));
  waterCells.sort((a,b)=>randomAt(salt+7,a.x,a.z)-randomAt(salt+7,b.x,b.z));
  const coastal=waterCells.filter(p=>terrain.mapType==='islands'||p.x>limit*.45);
  const deepWater=waterCells.filter(p=>(terrain.heights.get(`${p.x},${p.z}`)||1)===1);
  const ceiling=terrain.cubes.reduce((h,c)=>Math.max(h,c.pos[1]+6),12);
  const treeEdges=new Set();
  for(const tree of terrain.valley?.trees||terrain.shrine?.trees||terrain.garden?.trees||terrain.retreat?.trees||terrain.onsen?.trees||terrain.nature?.trees||[])for(let dx=-5;dx<=5;dx++)for(let dz=-5;dz<=5;dz++)if(dx*dx+dz*dz<=25)treeEdges.add(`${tree.x+dx},${tree.z+dz}`);
  const woodland=grass.filter(p=>treeEdges.has(`${p.x},${p.z}`)),clearings=grass.filter(p=>!treeEdges.has(`${p.x},${p.z}`));
  const shore=new Set();
  if(terrain.mapType==='moon')for(const p of waterCells)for(let dx=-4;dx<=4;dx++)for(let dz=-4;dz<=4;dz++)if(dx*dx+dz*dz<=16)shore.add(`${p.x+dx},${p.z+dz}`);
  if(['coral','islands'].includes(terrain.mapType))for(const p of grass){let near=false;for(let dx=-4;dx<=4&&!near;dx++)for(let dz=-4;dz<=4;dz++)if(dx*dx+dz*dz<=16&&water.has(`${p.x+dx},${p.z+dz}`)){near=true;break;}if(near)shore.add(`${p.x},${p.z}`);}
  const shoreline=grass.filter(p=>shore.has(`${p.x},${p.z}`));
  const hotBanks=grass.filter(p=>p.y<=5.5&&baths.some(b=>{const d=Math.hypot((p.x-b.x)/b.rx,(p.z-b.z)/b.rz);return d>=1&&d<1.55;}));
  const hotShore=new Set(hotBanks.map(p=>`${p.x},${p.z}`));
  return {mapType:terrain.mapType,heights:terrain.heights,water,grass,nearby,waterCells,deepWater,coastal,ceiling,woodland,clearings,shore,shoreline,hotBanks,hotShore,pond:waterCells.filter(p=>p.x<0),salt,limit,local:new Map()};
}

export function animalSurface(type,x,z,habitat,blocks) {
  const {radius}=WILDLIFE_SPECIES[type];
  let surface=null;
  for(const dx of [-radius,radius])for(const dz of [-radius,radius]){
    const cx=Math.round(x+dx),cz=Math.round(z+dz);
    if(Math.abs(cx)>habitat.limit-1 || Math.abs(cz)>habitat.limit-1)return null;
    const key=`${cx},${cz}`;
    if(type==='gull'){
      if(blocks.has(`${cx},${Math.round(habitat.ceiling)},${cz}`)||blocks.has(`${cx},${Math.round(habitat.ceiling)+1},${cz}`))return null;
      surface=habitat.ceiling;
    }else if(['fish','seaTurtle'].includes(type)){
      if(!habitat.water.has(key)||habitat.heights.get(key)!==1||blocks.has(`${cx},2,${cz}`)||blocks.has(`${cx},3,${cz}`))return null;
      surface=WATER_LEVEL-.65;
    }else if(type==='duck'){
      if(!habitat.water.has(key) || blocks.has(`${cx},3,${cz}`) || blocks.has(`${cx},4,${cz}`))return null;
      surface=WATER_LEVEL;
    }else{
      const ground=habitat.heights.get(key);
      const materials=type==='crab'?['sand','stone']:['camel','fennec'].includes(type)?['sand','sandstone','grass']:['turtle','macaque'].includes(type)?['grass','stone']:type==='magpie'?['grass','gravel']:['grass','snow'];
      if(ground===undefined || !materials.includes(blocks.get(`${cx},${ground},${cz}`)?.texture)||(['turtle','crab'].includes(type)&&!habitat.shore.has(key)))return null;
      if(type==='macaque'&&!habitat.hotShore.has(key))return null;
      if(blocks.has(`${cx},${ground+1},${cz}`) || blocks.has(`${cx},${ground+2},${cz}`) || (['deer','horse','camel'].includes(type)&&blocks.has(`${cx},${ground+3},${cz}`)))return null;
      if(surface!==null && surface!==ground+(type==='butterfly'?1.7:.5))return null;
      surface=ground+(type==='butterfly'?1.7:.5);
    }
  }
  return surface;
}

function relocate(animal,animals,habitat,blocks,player) {
  const waterType=['duck','gull','fish','seaTurtle'].includes(animal.type);
  const pondDuck=animal.type==='duck'&&animal.id<10&&habitat.pond.length;
  const coastGull=animal.type==='gull'&&habitat.coastal.length;
  const woods=['squirrel','fox','arcticFox'].includes(animal.type)&&habitat.woodland.length;
  const clearing=['deer','pheasant','magpie'].includes(animal.type)&&habitat.woodland.length&&habitat.clearings.length;
  const source=animal.type==='macaque'?habitat.hotBanks:['turtle','crab'].includes(animal.type)?habitat.shoreline:woods?habitat.woodland:clearing?habitat.clearings:coastGull?habitat.coastal:['fish','seaTurtle'].includes(animal.type)?habitat.deepWater:pondDuck?habitat.pond:waterType?habitat.waterCells:animal.id<3?habitat.nearby:habitat.grass;
  const zone=`${Math.floor(player.x/24)},${Math.floor(player.z/24)},${animal.type==='macaque'?'hotBank':['turtle','crab'].includes(animal.type)?'shore':woods?'woods':clearing?'clearing':coastGull?'coast':['fish','seaTurtle'].includes(animal.type)?'deep':pondDuck?'pond':waterType?'water':animal.id<3?'near':'land'}`;
  if(!habitat.local.has(zone)){if(habitat.local.size>16)habitat.local.clear();habitat.local.set(zone,source.filter(p=>Math.hypot(p.x-player.x,p.z-player.z)<WILDLIFE_RANGE-5));}
  const local=habitat.local.get(zone),candidates=local.length?local:source;
  for(let i=0;i<Math.min(512,candidates.length);i++){
    const p=candidates[(i+animal.homeOffset)%candidates.length];
    if(Math.hypot(p.x-player.x,p.z-player.z)<5)continue;
    if(animals.some(other=>other!==animal && other.active && Math.hypot(p.x-other.x,p.z-other.z)<3))continue;
    const y=animalSurface(animal.type,p.x,p.z,habitat,blocks);
    if(y===null)continue;
    Object.assign(animal,{x:p.x,y,z:p.z,active:true,state:animal.type==='gull'?'glide':['fish','seaTurtle'].includes(animal.type)?'swim':'rest',remaining:1+random(animal)*3});
    return true;
  }
  animal.homeOffset+=512;animal.active=false;return false;
}

export function createWildlife(habitat,blocks) {
  if(!habitat)return [];
  const animals=[];
  const population=wildlifePopulation(habitat.mapType);
  for(let id=0;id<population.length;id++){
    const animal={id,type:population[id],random:(habitat.salt+id*977)>>>0,homeOffset:id<3?0:id*19,
      x:0,y:0,z:0,heading:0,state:'rest',remaining:0,phase:id*.7,active:false,retry:0};
    relocate(animal,animals,habitat,blocks,{x:0,z:10});animals.push(animal);
  }
  return animals;
}

export function stepWildlife(animals,habitat,blocks,player,delta,{running=true,daylight=1,roughWeather=false}={}) {
  if(!running || !habitat)return;
  const dt=Math.min(.05,Math.max(0,delta));
  for(const animal of animals){
    animal.retry-=dt;
    const surface=animal.active ? animalSurface(animal.type,animal.x,animal.z,habitat,blocks) : null;
    if(surface===null){
      animal.active=false;
      if(animal.retry<=0){relocate(animal,animals,habitat,blocks,player);animal.retry=2;}
      continue;
    }
    animal.y=surface;
    const distance=Math.hypot(animal.x-player.x,animal.z-player.z);
    if(distance>WILDLIFE_RANGE+15){if(animal.retry<=0){relocate(animal,animals,habitat,blocks,player);animal.retry=5;}continue;}
    if(distance>WILDLIFE_RANGE){animal.state='rest';continue;}
    animal.remaining-=dt;animal.phase+=dt;
    const frightened=distance<(animal.state==='flee'?6:4.5) && Math.abs(player.y-animal.y)<3;
    if(frightened){
      animal.state='flee';animal.remaining=1.5;
      animal.heading=Math.atan2(player.x-animal.x,player.z-animal.z);
    }else if(animal.remaining<=0){
      animal.state=animal.type==='gull'?'glide':['fish','seaTurtle'].includes(animal.type)?'swim':daylight<.2 || roughWeather || random(animal)<.45 ? 'rest' : 'wander';
      animal.remaining=2+random(animal)*5;
      animal.heading=random(animal)*Math.PI*2;
    }
    if(animal.state==='rest')continue;
    const speed=WILDLIFE_SPECIES[animal.type].speed*(animal.state==='flee'?2.3:1);
    let moved=false;
    for(const turn of [0,.7,-.7,1.4,-1.4]){
      const heading=animal.heading+turn;
      const x=animal.x-Math.sin(heading)*speed*dt,z=animal.z-Math.cos(heading)*speed*dt;
      const y=animalSurface(animal.type,x,z,habitat,blocks);
      if(y===null || y!==animal.y)continue;
      if(animals.some(other=>other!==animal && other.active && Math.hypot(x-other.x,z-other.z)<WILDLIFE_SPECIES[animal.type].radius+WILDLIFE_SPECIES[other.type].radius+.11))continue;
      animal.x=x;animal.z=z;animal.heading=heading;moved=true;break;
    }
    if(!moved){animal.state='rest';animal.remaining=.5+random(animal);}
  }
}
