import { generateTerrain } from '../src/game/terrain.js';
import { MAP_TYPES, MAP_SIZES } from '../src/game/mapConfig.js';

// CPU generation only; browser rendering and device performance require separate QA.
const rows=[];
for(const mapType of Object.keys(MAP_TYPES))for(const size of MAP_SIZES){
  const times=[];let terrain;
  for(let i=0;i<3;i++){
    const start=performance.now();terrain=generateTerrain('willow',{mapType,size});times.push(performance.now()-start);
  }
  times.sort((a,b)=>a-b);
  rows.push({mapType,size,blocks:terrain.cubes.length,water:terrain.water.length,medianGenerationMs:+times[1].toFixed(1)});
}
console.table(rows);
