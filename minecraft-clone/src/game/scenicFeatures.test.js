import { generateTerrain } from './terrain';
import { validPosition, ALL_BLOCK_TYPES } from './world';
test.each(['willow','harbor','dawn'])('scenery %s includes editable boats, windmill and lighthouse',seed=>{
 for(const [mapType,feature] of [['forest','sailboat'],['islands','lighthouse'],['meadow','windmill'],['snow','cabin']]){
  const t=generateTerrain(seed,{mapType,size:100,generator:2});expect(t.sites.some(s=>s.type===feature)).toBe(true);
  expect(t.cubes.every(c=>validPosition(c.pos,49)&&ALL_BLOCK_TYPES.includes(c.texture))).toBe(true);expect(new Set(t.cubes.map(c=>c.key)).size).toBe(t.cubes.length);
  const boat=t.sites.find(s=>s.type==='sailboat');if(boat){for(let dx=-3;dx<=3;dx++)for(let dz=-8;dz<=8;dz++)expect(t.heights.get(`${boat.x+dx},${boat.z+dz}`)).toBeLessThanOrEqual(2);expect(t.cubes.some(c=>c.texture==='plaster'&&Math.abs(c.pos[0]-boat.x)<5&&Math.abs(c.pos[2]-boat.z)<2&&c.pos[1]>8)).toBe(true);}
  const roof=Math.max(...t.heights.values());expect(roof).toBeGreaterThan(mapType==='snow'?25:14);
 }
});
