import { hashSeed, randomAt, WATER_LEVEL } from './terrain';

export const WILDLIFE_SPECIES={
  rabbit:{count:8,speed:.75,radius:.27},
  duck:{count:4,speed:.55,radius:.27},
  fox:{count:2,speed:.95,radius:.38},
  sheep:{count:2,speed:.4,radius:.42},
};
const population=Object.entries(WILDLIFE_SPECIES).flatMap(([type,{count}])=>Array(count).fill(type));
export const WILDLIFE_LIMIT=population.length;
export const WILDLIFE_RANGE=45;
function random(animal){animal.random=(Math.imul(animal.random,1664525)+1013904223)>>>0;return animal.random/4294967296;}

export function wildlifeHabitat(terrain) {
  if(!terrain)return null;
  const salt=hashSeed(terrain.seed), water=new Set(terrain.water.map(([x,,z])=>`${x},${z}`));
  const grass=[...terrain.heights].map(([key,y])=>{const [x,z]=key.split(',').map(Number);return {x,y:y+.5,z};})
    .filter(p=>p.y>WATER_LEVEL && Math.abs(p.x)<45 && Math.abs(p.z)<45);
  const waterCells=terrain.water.map(([x,,z])=>({x,y:WATER_LEVEL,z}));
  // A few animals are discoverable near the starting trail; remaining homes vary with seed.
  const nearby=[...grass].sort((a,b)=>Math.hypot(a.x,a.z-10)-Math.hypot(b.x,b.z-10));
  grass.sort((a,b)=>randomAt(salt,a.x,a.z)-randomAt(salt,b.x,b.z));
  waterCells.sort((a,b)=>randomAt(salt+7,a.x,a.z)-randomAt(salt+7,b.x,b.z));
  return {heights:terrain.heights,water,grass,nearby,waterCells,pond:waterCells.filter(p=>p.x<0),salt};
}

export function animalSurface(type,x,z,habitat,blocks) {
  const {radius}=WILDLIFE_SPECIES[type];
  let surface=null;
  for(const dx of [-radius,radius])for(const dz of [-radius,radius]){
    const cx=Math.round(x+dx),cz=Math.round(z+dz);
    if(Math.abs(cx)>48 || Math.abs(cz)>48)return null;
    const key=`${cx},${cz}`;
    if(type==='duck'){
      if(!habitat.water.has(key) || blocks.has(`${cx},3,${cz}`) || blocks.has(`${cx},4,${cz}`))return null;
      surface=WATER_LEVEL;
    }else{
      const ground=habitat.heights.get(key);
      if(ground===undefined || blocks.get(`${cx},${ground},${cz}`)?.texture!=='grass')return null;
      if(blocks.has(`${cx},${ground+1},${cz}`) || blocks.has(`${cx},${ground+2},${cz}`))return null;
      if(surface!==null && surface!==ground+.5)return null;
      surface=ground+.5;
    }
  }
  return surface;
}

function relocate(animal,animals,habitat,blocks,player) {
  const candidates=animal.type==='duck' ? (animal.id<10 && habitat.pond.length ? habitat.pond : habitat.waterCells) : animal.id<3 ? habitat.nearby : habitat.grass;
  for(let i=0;i<Math.min(512,candidates.length);i++){
    const p=candidates[(i+animal.homeOffset)%candidates.length];
    if(Math.hypot(p.x-player.x,p.z-player.z)<5)continue;
    if(animals.some(other=>other!==animal && other.active && Math.hypot(p.x-other.x,p.z-other.z)<3))continue;
    const y=animalSurface(animal.type,p.x,p.z,habitat,blocks);
    if(y===null)continue;
    Object.assign(animal,{x:p.x,y,z:p.z,active:true,state:'rest',remaining:1+random(animal)*3});
    return true;
  }
  animal.homeOffset+=512;animal.active=false;return false;
}

export function createWildlife(habitat,blocks) {
  if(!habitat)return [];
  const animals=[];
  for(let id=0;id<WILDLIFE_LIMIT;id++){
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
    if(distance>WILDLIFE_RANGE){animal.state='rest';continue;}
    animal.remaining-=dt;animal.phase+=dt;
    const frightened=distance<(animal.state==='flee'?6:4.5) && Math.abs(player.y-animal.y)<3;
    if(frightened){
      animal.state='flee';animal.remaining=1.5;
      animal.heading=Math.atan2(player.x-animal.x,player.z-animal.z);
    }else if(animal.remaining<=0){
      animal.state=daylight<.2 || roughWeather || random(animal)<.45 ? 'rest' : 'wander';
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
