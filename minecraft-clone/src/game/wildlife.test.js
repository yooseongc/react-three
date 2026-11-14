import { beforeAll, expect, test } from 'vitest';
import { generateTerrain } from './terrain';
import { animalSurface, createWildlife, stepWildlife, wildlifeHabitat, WILDLIFE_LIMIT, WILDLIFE_SPECIES } from './wildlife';
import { cleanSettings } from './settings';

let habitat,blocks;
beforeAll(()=>{const terrain=generateTerrain('willow');habitat=wildlifeHabitat(terrain);blocks=new Map(terrain.cubes.map(c=>[c.key,c]));});
test('seeded population is bounded, repeatable and inhabits safe land/water',()=>{
  const animals=createWildlife(habitat,blocks);
  expect(animals).toEqual(createWildlife(habitat,blocks));expect(animals).toHaveLength(WILDLIFE_LIMIT);
  expect(animals.filter(a=>a.active)).toHaveLength(16);
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
  expect(animals.every(a=>a.state==='rest')).toBe(true);
  const snapshot=structuredClone(animals);
  stepWildlife(animals,habitat,blocks,player,10,{running:false});expect(animals).toEqual(snapshot);
  for(const a of animals)a.remaining=0;
  stepWildlife(animals,habitat,blocks,player,.05,{roughWeather:true});
  expect(animals.every(a=>a.state==='rest')).toBe(true);
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
    for(const b of animals)if(a!==b)expect(Math.hypot(a.x-b.x,a.z-b.z)).toBeGreaterThanOrEqual(WILDLIFE_SPECIES[a.type].radius+WILDLIFE_SPECIES[b.type].radius+.11);
  }
});
test('disabled wildlife setting survives validation; older settings enable it',()=>{
  expect(cleanSettings({showWildlife:false}).showWildlife).toBe(false);expect(cleanSettings({}).showWildlife).toBe(true);
});
