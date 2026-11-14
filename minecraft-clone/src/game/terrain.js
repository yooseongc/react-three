import { mapConfig, mapLimit } from './mapConfig.js';
import { addLandmarks } from './landmarks.js';
export const TERRAIN_VERSION = 1;
export const WATER_LEVEL = 2.8;
export function hashSeed(text) {
  let h = 2166136261;
  for (const c of String(text)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
export function randomAt(seed, x, z) {
  let h = Math.imul(x ^ seed, 374761393) ^ Math.imul(z, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function generateTerrain(seed = 'willow', options = {}) {
  const config=mapConfig(options),limit=mapLimit(config),kind=config.mapType;
  const salt = hashSeed(seed), cubes = [], heights = new Map(), water = [], flowers = [], occupied = new Set();
  const phase = (salt % 1000) / 157;
  const add = (x,y,z,texture) => {
    const key=[x,y,z].join(',');
    if(occupied.has(key))return;
    occupied.add(key);cubes.push({key,pos:[x,y,z],texture});
  };
  for (let x=-limit;x<=limit;x++) for(let z=-limit;z<=limit;z++) {
    const coast = 30 + 3 * Math.sin(z / 12 + phase);
    const lake = Math.hypot((x+18)/1.15,z+13);
    let height = Math.round(5 + 2*Math.sin(x/15+phase)*Math.sin(z/17) + 3*Math.exp(-((x+27)**2+(z+34)**2)/260));
    if (x>coast-7) height = Math.min(height, Math.max(1, Math.round((coast-x)/3+2)));
    if (lake<12) height = Math.min(height, Math.max(1,Math.round((lake-6)/2+1)));
    if(kind==='meadow')height=Math.round(4.5+Math.sin(x/24+phase)*Math.sin(z/27));
    if(kind==='islands')height=Math.max(1,Math.round(1+5*Math.max(0,Math.sin(x/12+phase)*Math.cos(z/14))));
    if(kind==='snow')height=Math.round(6+3*Math.sin(x/21+phase)*Math.sin(z/23)+2*Math.cos((x+z)/30));
    // Generator 2 is opt-in: old worlds keep their exact terrain and edit baseline.
    let rocky=false;
    if(config.generator===2) {
      const river=Math.abs(x-(-14+8*Math.sin(z/15+phase)));
      const pond=Math.hypot((x-20)/1.3,z+22);
      const ridge=Math.hypot((x+30)/1.1,z-25);
      if(ridge<11){height=Math.max(height,Math.round(5+(11-ridge)*.65));rocky=ridge<7;}
      if(river<5)height=Math.min(height,Math.max(1,Math.round(river-1)));
      if(pond<10)height=Math.min(height,Math.max(1,Math.round((pond-4)/1.5)));
    }
    // A broad clearing and two level trails connect the starting point to the biomes.
    const path = Math.min(Math.abs(x),Math.abs(z-10));
    if(kind!=='islands' && path<5 && x<28 && (config.generator===1 || height>=4)) height = Math.round(height+(5-height)*Math.max(0,1-path/5));
    if(config.generator===2&&Math.hypot(x,z-10)<5)height=5;
    if(kind==='islands' && Math.hypot(x,z-10)<7)height=Math.max(height,Math.round(5-Math.hypot(x,z-10)/3));
    heights.set(`${x},${z}`,height);
    for(let y=1;y<=height;y++) add(x,y,z,y===height?(rocky?'stone':kind==='snow'?'snow':height<=3?'sand':'grass'):y<height-2?'stone':'dirt');
    if(height+.5<WATER_LEVEL) water.push([x,WATER_LEVEL,z]);
    if(kind!=='snow' && height>=4 && path>3 && randomAt(salt,x,z)>.975) flowers.push([x,height+.75,z]);
  }
  // Trees are editable voxels, with empty trails and a clear spawn radius.
  for(let x=-(limit-5);x<(kind==='forest'?25:limit-4);x+=5) for(let z=-(limit-5);z<limit-4;z+=5){
    const h=heights.get(`${x},${z}`);
    if(h<4 || Math.abs(x)<5 || Math.abs(z-10)<5 || randomAt(salt,x,z)<(kind==='meadow'?.94:kind==='islands'?.68:.42)) continue;
    const trunk=3+Math.floor(randomAt(salt+1,x,z)*2);
    for(let y=1;y<=trunk;y++)add(x,h+y,z,'log');
    for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=0;dy<=2;dy++){
      if(Math.abs(dx)+Math.abs(dz)+dy>4 || (dx===0&&dz===0&&dy===0))continue;
      add(x+dx,h+trunk+dy,z+dz,'leaves');
    }
  }
  const terrain={seed:String(seed),...config,cubes,heights,water,flowers};
  return config.generator===2 ? addLandmarks(terrain,salt) : terrain;
}

// Saves contain only edits relative to this version of the deterministic generator.
export function serializeTerrain(seed, base, current, options={}) {
  const edits=[];
  for(const [key,cube] of base)if(!current.has(key))edits.push({pos:cube.pos,texture:null});
  for(const [key,cube] of current)if(base.get(key)?.texture!==cube.texture)edits.push({pos:cube.pos,texture:cube.texture});
  return JSON.stringify({version:2,generator:TERRAIN_VERSION,seed,...mapConfig(options),edits});
}
export function restoreTerrain(raw, seed, cubes, validPosition, types, options={}) {
  const data=JSON.parse(raw);
  if(data.version!==2||![1,2].includes(data.generator)||data.seed!==seed||!Array.isArray(data.edits))throw Error('Unsupported landscape save');
  const config=mapConfig(options),saved=mapConfig(data);
  if((data.mapType!==undefined && data.mapType!==saved.mapType)||(data.size!==undefined && data.size!==saved.size)||config.mapType!==saved.mapType||config.size!==saved.size||config.generator!==saved.generator)throw Error('Landscape configuration mismatch');
  const blocks=new Map(cubes.map(c=>[c.key,c]));
  for(const edit of data.edits){
    if(!edit||!validPosition(edit.pos)||(edit.texture!==null&&!types.includes(edit.texture)))throw Error('Invalid landscape edit');
    const key=edit.pos.join(',');
    if(edit.texture===null)blocks.delete(key);else blocks.set(key,{key,pos:[...edit.pos],texture:edit.texture});
  }
  return [...blocks.values()];
}
