import { beforeAll, expect, test } from 'vitest';
import { generateTerrain } from './terrain';
import { animalSurface, createWildlife, stepWildlife, wildlifeHabitat, WILDLIFE_LIMIT, WILDLIFE_SPECIES, wildlifePopulation } from './wildlife';
import { cleanSettings } from './settings';

let habitat,blocks;
beforeAll(()=>{const terrain=generateTerrain('willow');habitat=wildlifeHabitat(terrain);blocks=new Map(terrain.cubes.map(c=>[c.key,c]));});
test('seeded population is bounded, repeatable and inhabits safe land/water',()=>{
  const animals=createWildlife(habitat,blocks);
  expect(animals).toEqual(createWildlife(habitat,blocks));expect(animals).toHaveLength(wildlifePopulation(habitat.mapType).length);expect(animals.length).toBeLessThanOrEqual(WILDLIFE_LIMIT);
  expect(animals.every(a=>a.active)).toBe(true);
  expect(animals.filter(a=>a.type==='fox')).toHaveLength(2);
  expect(animals.filter(a=>a.type==='sheep')).toHaveLength(2);
  expect(animals.filter(a=>a.type==='duck' && a.x<0).length).toBeGreaterThanOrEqual(2);
  for(const a of animals)expect(animalSurface(a.type,a.x,a.z,habitat,blocks)).toBe(a.y);
  expect(createWildlife(null,blocks)).toEqual([]);
});
test('proximity triggers flight away from the player',()=>{
  const animals=createWildlife(habitat,blocks),a=animals[0],start={x:a.x,z:a.z};
  const player={x:a.x-3,y:a.y,z:a.z};
  stepWildlife(animals,habitat,blocks,player,.05);
  expect(a.state).toBe('flee');
  expect(Math.hypot(a.x-player.x,a.z-player.z)).toBeGreaterThan(Math.hypot(start.x-player.x,start.z-player.z));
});
test('night and rough weather favour rest; pausing freezes all simulation state',()=>{
  const animals=createWildlife(habitat,blocks),player={x:0,y:5.5,z:10};
  for(const a of animals)a.remaining=0;
  stepWildlife(animals,habitat,blocks,player,.05,{daylight:0});
  expect(animals.filter(a=>!['gull','fish'].includes(a.type)).every(a=>a.state==='rest')).toBe(true);
  const snapshot=structuredClone(animals);
  stepWildlife(animals,habitat,blocks,player,10,{running:false});expect(animals).toEqual(snapshot);
  for(const a of animals)a.remaining=0;
  stepWildlife(animals,habitat,blocks,player,.05,{roughWeather:true});
  expect(animals.filter(a=>!['gull','fish'].includes(a.type)).every(a=>a.state==='rest')).toBe(true);
});
test('building on a habitat moves the animal without changing any world blocks',()=>{
  const animals=createWildlife(habitat,blocks),a=animals[0],old=[a.x,a.z];
  const edited=new Map(blocks),pos=[a.x,a.y+.5,a.z];edited.set(pos.join(','),{pos,texture:'brick'});
  const count=edited.size;
  stepWildlife(animals,habitat,edited,{x:0,y:5.5,z:10},.05);
  expect([a.x,a.z]).not.toEqual(old);expect(a.active).toBe(true);
  expect(animalSurface(a.type,a.x,a.z,habitat,edited)).toBe(a.y);expect(edited.size).toBe(count);
});
test('long simulation stays within habitat and avoids overlap',()=>{
  const animals=createWildlife(habitat,blocks);
  for(let i=0;i<1200;i++)stepWildlife(animals,habitat,blocks,{x:0,y:20,z:10},.05);
  for(const a of animals){
    expect(animalSurface(a.type,a.x,a.z,habitat,blocks)).toBe(a.y);
    for(const b of animals)if(a!==b&&Math.abs(a.y-b.y)<1)expect(Math.hypot(a.x-b.x,a.z-b.z)).toBeGreaterThanOrEqual(WILDLIFE_SPECIES[a.type].radius+WILDLIFE_SPECIES[b.type].radius+.11);
  }
});
test('disabled wildlife setting survives validation; older settings enable it',()=>{
  expect(cleanSettings({showWildlife:false}).showWildlife).toBe(false);expect(cleanSettings({}).showWildlife).toBe(true);
});

test.each(['forest','meadow','islands','snow'])('%s has its own safe mix of land, air and water life',mapType=>{
 const terrain=generateTerrain('willow',{mapType,generator:2}),h=wildlifeHabitat(terrain),b=new Map(terrain.cubes.map(c=>[c.key,c]));
 const animals=createWildlife(h,b);expect(animals.length).toBeLessThanOrEqual(32);
 if(mapType==='forest')expect(animals.some(a=>a.type==='deer'&&a.active)).toBe(true);
 if(mapType==='meadow')expect(animals.some(a=>a.type==='horse'&&a.active)).toBe(true);
 if(mapType==='islands')expect(animals.some(a=>a.type==='gull'&&a.active)).toBe(true);
 expect(animals.some(a=>a.type==='fish'&&a.active)).toBe(true);
 for(let i=0;i<200;i++)stepWildlife(animals,h,b,{x:0,y:20,z:10},.05);
 for(const a of animals.filter(a=>a.active)){expect(animalSurface(a.type,a.x,a.z,h,b)).toBe(a.y);if(a.type==='fish')expect(a.y).toBeLessThan(2.8);if(a.type==='gull')expect(a.y).toBeGreaterThan(15);}
});
