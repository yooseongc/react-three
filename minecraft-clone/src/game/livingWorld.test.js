import { generateTerrain } from './terrain';
import { anchorIntact,detailNearby } from './livingWorld';
import { terrainKey,terrainQuery } from './mapConfig';
import { exportWorld,parseTransfer,listWorlds,safeWorldQuery } from './transfer';
import { undergroundAt } from './underground';
import { roofHeights,roofAt } from './weather';
import { stepPlayer } from './world';
import { createVoxelWorld } from './voxels';

test('rotors and smoke require their editable original anchors',()=>{
 for(const mapType of ['meadow','autumn']){
  const t=generateTerrain('willow',{mapType,generator:3}),blocks=new Map(t.cubes.map(c=>[c.key,c]));expect(t.rotors.length).toBeGreaterThan(0);expect(t.chimneys.length).toBeGreaterThan(0);
  for(const d of [...t.rotors,...t.chimneys]){expect(anchorIntact(d,blocks)).toBe(true);blocks.delete(d.anchor);expect(anchorIntact(d,blocks)).toBe(false);}
 }
 expect(detailNearby([0,0,0],{x:100,y:0,z:0})).toBe(false);
});
test.each(['autumn','onsen','canal'].flatMap(map=>['willow','mist','seed-0','garden','high'].map(seed=>[map,seed])))('%s / %s has a reversible dry route and actual rain-blocking ceiling',(mapType,seed)=>{
 const t=generateTerrain(seed,{mapType,generator:3}),b=new Map(t.cubes.map(c=>[c.key,c])),c=t.caves[0];
 // Search standing cells reachable with a one-block stair; never traverse water.
 const floorAt=(x,z)=>{const ys=[];for(let y=1;y<=20;y++)if(b.has([x,y,z].join(','))&&!b.has([x,y+1,z].join(','))&&!b.has([x,y+2,z].join(',')))ys.push(y);return ys;};
 const start=[c.entry[0],Math.floor(c.entry[1]),c.entry[2]],queue=[start],seen=new Set([start.join(',')]);let reached=false;
 for(let i=0;i<queue.length;i++){const [x,y,z]=queue[i];if(Math.abs(x-c.x)<=4&&Math.abs(z-c.z)<=2&&y===3)reached=true;
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,zz=z+dz;if(xx<c.minX-2||xx>c.maxX+2||zz<c.minZ-2||zz>c.maxZ+2)continue;for(const yy of floorAt(xx,zz)){if(Math.abs(yy-y)>1)continue;const k=[xx,yy,zz].join(',');if(!seen.has(k)){seen.add(k);queue.push([xx,yy,zz]);}}}
 }
 expect(reached).toBe(true);const pos={x:c.x+3,y:5.12,z:c.z};expect(undergroundAt(t,pos,b)?.name).toBe(c.name);expect(roofAt(roofHeights(b),pos.x,pos.z)).toBeGreaterThan(pos.y);expect(undergroundAt(t,{...pos,y:30},b)).toBeNull();
 expect(t.cubes.every(c=>c.pos[1]>=1&&c.pos[1]<=64&&Math.abs(c.pos[0])<=49&&Math.abs(c.pos[2])<=49)).toBe(true);
 const world=createVoxelWorld(t.cubes),direction=mapType==='canal'?-1:1,target=c.z-direction*4;
 let p={x:c.entry[0],y:c.entry[1],z:c.entry[2],vy:0,grounded:true};
 const ticks=Math.round(Math.abs(target-p.z)/4.5*60);
 for(let i=0;i<ticks+120&&Math.abs(p.z-target)>.1;i++)p=stepPlayer(p,{forward:true,autoStep:true},direction>0?Math.PI:0,1/60,world);
 expect(Math.abs(p.z-target)).toBeLessThan(.2);expect(p.y).toBeCloseTo(3.5,1);
 for(let i=0;i<ticks+120&&Math.abs(p.z-c.entry[2])>.1;i++)p=stepPlayer(p,{forward:true,autoStep:true},direction>0?0:Math.PI,1/60,world);
 expect(Math.abs(p.z-c.entry[2])).toBeLessThan(.3);expect(p.y).toBeCloseTo(c.entry[1],1);
});
test('generation 3 saves use their own baseline and appear in the world library',()=>{
 const config={mapType:'autumn',size:100,generator:3},t=generateTerrain('living',config),cubes=t.cubes.filter(c=>c.key!==t.rotors[0].anchor),file=exportWorld(cubes,t.seed,config);
 expect(parseTransfer(JSON.stringify(file)).cubes).toEqual(cubes);expect(terrainKey(t.seed,config)).not.toBe(terrainKey(t.seed,{...config,generator:2}));
 localStorage.clear();localStorage.setItem(terrainKey(t.seed,config),JSON.stringify(file));expect(listWorlds(localStorage).some(w=>w.query===terrainQuery(t.seed,config))).toBe(true);expect(safeWorldQuery(terrainQuery(t.seed,config))).toBe(terrainQuery(t.seed,config));
});
