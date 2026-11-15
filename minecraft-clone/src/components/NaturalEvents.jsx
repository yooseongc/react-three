import { useEffect,useMemo,useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import { landscape } from '../game/landscape';
import { useStore } from '../hooks/useStore';
import { worldClock } from '../game/daylight';
import { weatherState } from '../game/weather';
import { advanceNature,natureUniforms } from '../game/naturalEvents';

export default function NaturalEvents(){
 const fireflies=useRef(),meteor=useRef(),state=useRef({time:0,afterRain:0});
 const habitat=useMemo(()=>{const cells=[];for(const [key,h] of landscape?.heights||[]){const [x,z]=key.split(',').map(Number);if(h>=3&&h<9&&(x*13+z*7)%19===0)cells.push([x,h+1.5,z]);}return cells;},[]);
 const geometry=useMemo(()=>{const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(new Float32Array(64*3),3));return g;},[]);
 const trail=useMemo(()=>{const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(new Float32Array(6),3));return g;},[]);
 useEffect(()=>()=>{geometry.dispose();trail.dispose();natureUniforms.auroraStrength.value=0;natureUniforms.rainbowStrength.value=0;},[geometry,trail]);
 useFrame(({camera,gl},dt)=>{
  const s=useStore.getState();state.current=advanceNature(state.current,{weather:weatherState.current,hour:worldClock.hour,mapType:landscape?.mapType,running:s.playing&&s.landscapeMotion&&!document.hidden,delta:dt,sheltered:weatherState.sheltered});
  const n=state.current;natureUniforms.natureTime.value=n.time;natureUniforms.auroraStrength.value=n.aurora;natureUniforms.rainbowStrength.value=n.rainbow;
  let count=0;const positions=geometry.attributes.position.array;
  if(n.fireflies)for(const [x,y,z] of habitat){if(count>=64)break;if(Math.hypot(x-camera.position.x,z-camera.position.z)>22||Math.abs(y-camera.position.y)>12||s.world.blocks.has([x,Math.round(y),z].join(',')))continue;positions.set([x+Math.sin(n.time*.45+count),y+Math.sin(n.time*.7+count)*.5,z+Math.cos(n.time*.3+count)],count++*3);}
  geometry.setDrawRange(0,count);geometry.attributes.position.needsUpdate=true;fireflies.current.material.opacity=.55+.25*Math.sin(n.time*1.4);
  meteor.current.visible=n.meteor>=0;
  if(n.meteor>=0){const t=n.meteor;trail.attributes.position.array.set([camera.position.x-35+t*18,camera.position.y+55-t*9,camera.position.z-65,camera.position.x-43+t*18,camera.position.y+59-t*9,camera.position.z-65]);trail.attributes.position.needsUpdate=true;meteor.current.material.opacity=Math.sin(t/3*Math.PI)*.8;}
  gl.domElement.dataset.naturalEvents=JSON.stringify({aurora:+n.aurora.toFixed(2),rainbow:n.rainbow,fireflies:count,meteor:n.meteor>=0});
 });
 return <><points ref={fireflies} geometry={geometry} frustumCulled={false} raycast={()=>null}><pointsMaterial color="#dfff8b" size={.12} transparent depthWrite={false} onBeforeCompile={s=>{s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=1.-smoothstep(.1,.5,length(gl_PointCoord-vec2(.5)));');}} /></points><line ref={meteor} geometry={trail} frustumCulled={false} raycast={()=>null}><lineBasicMaterial color="#dcf5ff" transparent depthWrite={false} fog={false}/></line></>;
}
