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
};
export const WILDLIFE_LIMIT=32;
export function wildlifePopulation(mapType='forest'){
 const overrides={forest:{horse:0,gull:3},meadow:{deer:2,gull:0,fish:5},islands:{rabbit:4,fox:0,deer:0,horse:0},snow:{deer:4,horse:0,gull:0,fish:3}}[mapType]||{};
 return Object.entries(WILDLIFE_SPECIES).flatMap(([type,{count}])=>Array(overrides[type]??count).fill(type)).slice(0,WILDLIFE_LIMIT);
}
export const WILDLIFE_RANGE=45;
function random(animal){animal.random=(Math.imul(animal.random,1664525)+1013904223)>>>0;return animal.random/4294967296;}

export function wildlifeHabitat(terrain) {
  if(!terrain)return null;
  const limit=mapLimit(mapConfig(terrain));
  const salt=hashSeed(terrain.seed), water=new Set(terrain.water.map(([x,,z])=>`${x},${z}`));
  const grass=[...terrain.heights].map(([key,y])=>{const [x,z]=key.split(',').map(Number);return {x,y:y+.5,z};})
    .filter(p=>p.y>WATER_LEVEL && Math.abs(p.x)<limit-4 && Math.abs(p.z)<limit-4);
  const waterCells=terrain.water.map(([x,,z])=>({x,y:WATER_LEVEL,z}));
  // A few animals are discoverable near the starting trail; remaining homes vary with seed.
  const nearby=[...grass].sort((a,b)=>Math.hypot(a.x,a.z-10)-Math.hypot(b.x,b.z-10));
  grass.sort((a,b)=>randomAt(salt,a.x,a.z)-randomAt(salt,b.x,b.z));
  waterCells.sort((a,b)=>randomAt(salt+7,a.x,a.z)-randomAt(salt+7,b.x,b.z));
  const coastal=waterCells.filter(p=>terrain.mapType==='islands'||p.x>limit*.45);
  const deepWater=waterCells.filter(p=>(terrain.heights.get(`${p.x},${p.z}`)||1)===1);
  const ceiling=terrain.cubes.reduce((h,c)=>Math.max(h,c.pos[1]+6),12);
  return {mapType:terrain.mapType,heights:terrain.heights,water,grass,nearby,waterCells,deepWater,coastal,ceiling,pond:waterCells.filter(p=>p.x<0),salt,limit,local:new Map()};
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
    }else if(type==='fish'){
      if(!habitat.water.has(key)||habitat.heights.get(key)!==1||blocks.has(`${cx},2,${cz}`)||blocks.has(`${cx},3,${cz}`))return null;
      surface=WATER_LEVEL-.65;
    }else if(type==='duck'){
      if(!habitat.water.has(key) || blocks.has(`${cx},3,${cz}`) || blocks.has(`${cx},4,${cz}`))return null;
      surface=WATER_LEVEL;
    }else{
      const ground=habitat.heights.get(key);
      if(ground===undefined || !['grass','snow'].includes(blocks.get(`${cx},${ground},${cz}`)?.texture))return null;
      if(blocks.has(`${cx},${ground+1},${cz}`) || blocks.has(`${cx},${ground+2},${cz}`) || (['deer','horse'].includes(type)&&blocks.has(`${cx},${ground+3},${cz}`)))return null;
      if(surface!==null && surface!==ground+.5)return null;
      surface=ground+.5;
    }
  }
  return surface;
}

function relocate(animal,animals,habitat,blocks,player) {
  const waterType=['duck','gull','fish'].includes(animal.type);
  const pondDuck=animal.type==='duck'&&animal.id<10&&habitat.pond.length;
  const coastGull=animal.type==='gull'&&habitat.coastal.length;
  const source=coastGull?habitat.coastal:animal.type==='fish'?habitat.deepWater:pondDuck?habitat.pond:waterType?habitat.waterCells:animal.id<3?habitat.nearby:habitat.grass;
  const zone=`${Math.floor(player.x/24)},${Math.floor(player.z/24)},${coastGull?'coast':animal.type==='fish'?'deep':pondDuck?'pond':waterType?'water':animal.id<3?'near':'land'}`;
  if(!habitat.local.has(zone)){if(habitat.local.size>16)habitat.local.clear();habitat.local.set(zone,source.filter(p=>Math.hypot(p.x-player.x,p.z-player.z)<WILDLIFE_RANGE-5));}
  const local=habitat.local.get(zone),candidates=local.length?local:source;
  for(let i=0;i<Math.min(512,candidates.length);i++){
    const p=candidates[(i+animal.homeOffset)%candidates.length];
    if(Math.hypot(p.x-player.x,p.z-player.z)<5)continue;
    if(animals.some(other=>other!==animal && other.active && Math.hypot(p.x-other.x,p.z-other.z)<3))continue;
    const y=animalSurface(animal.type,p.x,p.z,habitat,blocks);
    if(y===null)continue;
    Object.assign(animal,{x:p.x,y,z:p.z,active:true,state:animal.type==='gull'?'glide':animal.type==='fish'?'swim':'rest',remaining:1+random(animal)*3});
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
      animal.state=animal.type==='gull'?'glide':animal.type==='fish'?'swim':daylight<.2 || roughWeather || random(animal)<.45 ? 'rest' : 'wander';
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
