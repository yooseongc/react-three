import { stepPlayer, spawnPosition, BLOCK_TYPES, parseWorld } from './world';
const run=(p,input,blocks=[],frames=60)=>{for(let i=0;i<frames;i++)p=stepPlayer(p,input,0,1/60,blocks);return p;};
test('flight hovers, ascends, descends and respects floor/height limits',()=>{
 const p={...spawnPosition([]),y:5,grounded:false};
 expect(run(p,{flying:true}).y).toBe(5);
 expect(run(p,{flying:true,ascend:true}).y).toBeCloseTo(9.5);
 expect(run(p,{flying:true,descend:true},[],120).y).toBe(.5);
 expect(run({...p,y:69},{flying:true,ascend:true}).y).toBe(70);
});
test('flight cannot cross a wall or ceiling and gravity resumes when disabled',()=>{
 const p={...spawnPosition([]),y:2,z:3};
 const blocks=[{pos:[0,2,1]},{pos:[0,3,1]},{pos:[0,5,3]}];
 expect(run(p,{flying:true,forward:true},blocks).z).toBeGreaterThanOrEqual(1.8);
 expect(run(p,{flying:true,ascend:true},blocks).y).toBeLessThanOrEqual(2.7);
 expect(run({...p,y:6},{},[]).y).toBeLessThan(6);
});
test('flight diagonal movement has the same total speed',()=>{
 const p={...spawnPosition([]),y:5};
 const a=run(p,{flying:true,forward:true}),b=run(p,{flying:true,forward:true,right:true,ascend:true});
 expect(Math.hypot(b.x-p.x,b.y-p.y,b.z-p.z)).toBeCloseTo(Math.abs(a.z-p.z));
});
test('all twelve building materials survive legacy-compatible saves',()=>{
 const cubes=BLOCK_TYPES.map((texture,i)=>({pos:[i,1,0],texture}));
 expect(BLOCK_TYPES).toHaveLength(12);expect(parseWorld(JSON.stringify({version:1,cubes})).cubes.map(c=>c.texture)).toEqual(BLOCK_TYPES);
});
