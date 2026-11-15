import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../hooks/useStore';
import { sampleDay,worldClock } from '../game/daylight';

export default function LanternLights() {
  const world=useStore(s=>s.world),lights=useRef([]),timer=useRef(0);
  const positions=useMemo(()=>[...world.blocks.values()].filter(c=>c.texture==='lantern').map(c=>c.pos),[world]);
  useFrame(({camera,gl},dt)=>{
    timer.current+=dt;if(timer.current<.2)return;timer.current=0;
    const nearby=positions.map(pos=>({pos,d:camera.position.distanceToSquared({x:pos[0],y:pos[1],z:pos[2]})})).filter(p=>p.d<36*36).sort((a,b)=>a.d-b.d).slice(0,4);
    lights.current.forEach((light,i)=>{if(!light)return;const entry=nearby[i];light.intensity=entry?(1-sampleDay(worldClock.hour).daylight)*22+5:0;if(entry)light.position.set(...entry.pos);});
    gl.domElement.dataset.lanternLights=String(nearby.length);gl.domElement.dataset.lanterns=String(positions.length);
  });
  // Fixed budget, no shadow maps: placing hundreds of lamps does not create hundreds of lights.
  return [0,1,2,3].map(i=><pointLight key={i} ref={el=>{lights.current[i]=el;}} color="#ffcd88" distance={12} decay={2} intensity={0} />);
}
