import { generateTerrain, serializeTerrain, restoreTerrain } from './terrain';
import { ALL_BLOCK_TYPES, validPosition, spawnPosition, overlapsPlayer } from './world';
import { createVoxelWorld, nearbyBlocks } from './voxels';

test('seed reproduces terrain, foliage and water and changes another world',()=>{
 const a=generateTerrain('willow'),b=generateTerrain('willow'),c=generateTerrain('cedar');
 expect(a.cubes).toEqual(b.cubes);expect(a.water).toEqual(b.water);expect(a.flowers).toEqual(b.flowers);
 expect(a.cubes).not.toEqual(c.cubes);
 expect(new Set(a.cubes.map(c=>c.key)).size).toBe(a.cubes.length);
 expect(a.cubes.every(c=>validPosition(c.pos)&&ALL_BLOCK_TYPES.includes(c.texture))).toBe(true);
});
test.each(['willow','cedar','0','산책'])('safe spawn and reachable biomes for %s',seed=>{
 const t=generateTerrain(seed),world=createVoxelWorld(t.cubes),spawn=spawnPosition(t.cubes);
 expect(spawn.y).toBe(5.5);
 expect(nearbyBlocks(world,spawn).some(c=>overlapsPlayer(c.pos,spawn))).toBe(false);
 // One-block steps are within the existing jump height. Require a clear standing volume.
 const queue=[[0,10]],seen=new Set(['0,10']);
 for(let i=0;i<queue.length;i++){
  const [x,z]=queue[i],h=t.heights.get(`${x},${z}`);
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const nx=x+dx,nz=z+dz,key=`${nx},${nz}`,nh=t.heights.get(key);
   if(seen.has(key)||nh===undefined||Math.abs(nh-h)>1)continue;
   if(world.blocks.has(`${nx},${nh+1},${nz}`)||world.blocks.has(`${nx},${nh+2},${nz}`))continue;
   seen.add(key);queue.push([nx,nz]);
  }
 }
 expect(queue.some(([x,z])=>x>35)).toBe(true);
 expect(queue.some(([x,z])=>x<-15&&z<-30)).toBe(true);
 expect(queue.some(([x,z])=>Math.hypot(x+18,z+13)<5)).toBe(true);
 expect(t.water.length).toBeGreaterThan(100);
});
test('delta saves restore additions, removals and material changes without copying terrain',()=>{
 const t=generateTerrain(),base=new Map(t.cubes.map(c=>[c.key,c])),current=new Map(base);
 current.delete('0,5,10');current.set('0,6,10',{key:'0,6,10',pos:[0,6,10],texture:'wood'});
 current.set('1,5,10',{key:'1,5,10',pos:[1,5,10],texture:'glass'});
 const raw=serializeTerrain('willow',base,current);
 expect(raw.length).toBeLessThan(400);
 expect(new Map(restoreTerrain(raw,'willow',t.cubes,validPosition,ALL_BLOCK_TYPES).map(c=>[c.key,c]))).toEqual(current);
 expect(()=>restoreTerrain(raw,'other',t.cubes,validPosition,ALL_BLOCK_TYPES)).toThrow();
 expect(()=>restoreTerrain('{broken','willow',t.cubes,validPosition,ALL_BLOCK_TYPES)).toThrow();
 expect(()=>restoreTerrain(JSON.stringify({version:2,generator:1,seed:'willow',edits:[{pos:[0,500,0],texture:'wood'}]}),'willow',t.cubes,validPosition,ALL_BLOCK_TYPES)).toThrow();
});
