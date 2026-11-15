import { generateTerrain } from './terrain';
import { EXPANSION_IDS } from './expansionCatalog';
import { BLOCK_TYPES, BLOCK_COLORS, BLOCK_LABELS, spawnPosition, stepPlayer } from './world';
import { activeMap } from './mapConfig';
import { exportWorld, parseTransfer } from './transfer';
import { createTourRoute } from './tour';

const landmarks=['belltower','bath','market','mill','bungalow','observatory','shrine','moonGate','byeolseo'];
test.each(EXPANSION_IDS)('%s has its landmark, safe arrival, valid materials and clear tour path',mapType=>{
 const t=generateTerrain('preview',{mapType,size:100,generator:2}),blocks=new Map(t.cubes.map(c=>[c.key,c]));
 expect(t.sites.some(s=>s.type===landmarks[EXPANSION_IDS.indexOf(mapType)])).toBe(true);
 expect(t.cubes.every(c=>BLOCK_TYPES.includes(c.texture))).toBe(true);
 const p=spawnPosition(t.cubes);expect(p.y).toBe(mapType==='sky'?26.5:4.5);
 for(let dy=1;dy<=2;dy++)expect(blocks.has('0,'+(Math.floor(p.y)+dy)+',10')).toBe(false);
 const route=createTourRoute(t);expect(route.samples.every(p=>!blocks.has([Math.round(p.x),Math.round(p.y),Math.round(p.z)].join(',')))).toBe(true);
 const edited=[...t.cubes,{key:'0,60,0',pos:[0,60,0],texture:'jadeTile'}];
 const file=exportWorld(edited,t.seed,t);expect(JSON.stringify(file).length).toBeLessThan(1000);
 expect(parseTransfer(JSON.stringify(file)).cubes).toEqual(edited);
});
test('new building materials all have labels and palette colors',()=>{
 expect(BLOCK_TYPES.length).toBe(34);expect(new Set(BLOCK_TYPES).size).toBe(34);
 expect(BLOCK_LABELS).toHaveLength(34);expect(BLOCK_COLORS).toHaveLength(34);
});
test('cloud islands are hollow below and return a fallen walker to the arrival',()=>{
 const t=generateTerrain('cloud',{mapType:'sky',size:100});expect(t.cubes.some(c=>c.pos[1]===1)).toBe(false);expect(t.water).toHaveLength(0);
 const before=activeMap.mapType;try{activeMap.mapType='sky';const p=stepPlayer({x:40,y:4,z:40,vy:-2,grounded:false},{},0,.02,t.cubes);expect(p.x).toBe(0);expect(p.z).toBe(10);expect(p.y).toBe(26.5);}finally{activeMap.mapType=before;}
});
