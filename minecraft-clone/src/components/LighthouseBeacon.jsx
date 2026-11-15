import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, DoubleSide, Object3D } from 'three';
import { landscape } from '../game/landscape';
import { useStore } from '../hooks/useStore';
import { sampleDay, worldClock } from '../game/daylight';
import { weatherState } from '../game/weather';

export default function LighthouseBeacon(){
 const world=useStore(s=>s.world),site=landscape?.sites?.find(s=>s.type==='lighthouse');
 const rotor=useRef(),light=useRef(),beam=useRef(),core=useRef(),angle=useRef(.7);
 const target=useMemo(()=>new Object3D(),[]);
 const lit=site&&[-1,0,1].some(dx=>world.blocks.get(`${site.x+dx},${Math.round(site.y)},${site.z}`)?.texture==='lantern');
 useFrame(({gl},dt)=>{
  if(!rotor.current){gl.domElement.dataset.lighthouseBeam='off';return;}
  const s=useStore.getState();if(s.playing&&!document.hidden)angle.current+=Math.min(dt,.05)*.22;
  rotor.current.rotation.y=angle.current;
  const darkness=1-sampleDay(worldClock.hour).daylight;
  light.current.intensity=1100+darkness*1800;
  beam.current.uniforms.strength.value=.045+darkness*.2+weatherState.fog*.08;
  core.current.scale.setScalar(1+.035*Math.sin(angle.current*4));
  gl.domElement.dataset.lighthouseBeam='on';gl.domElement.dataset.lighthouseAngle=angle.current.toFixed(4);
 });
 if(!lit)return null;
 return <group position={[site.x,site.y,site.z]} name="lighthouse-beacon">
  <mesh ref={core}><sphereGeometry args={[.65,16,12]}/><meshBasicMaterial color="#fff3bc" toneMapped={false} fog={false}/></mesh>
  <pointLight color="#ffdf9b" intensity={35} distance={15} decay={2}/>
  <group ref={rotor}>
   <spotLight ref={light} target={target} color="#fff0bb" angle={.1} penumbra={.65} distance={90} decay={2} intensity={1800}/>
   <primitive object={target} position={[55,0,0]}/>
   <mesh position={[24,0,0]} rotation={[0,0,Math.PI/2]}>
    <coneGeometry args={[4.5,48,32,1,true]}/>
    <shaderMaterial ref={beam} uniforms={{strength:{value:.2}}} transparent depthWrite={false} side={DoubleSide} blending={AdditiveBlending} toneMapped={false}
     vertexShader="varying float progress; void main(){progress=(24.-position.y)/48.; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}" 
     fragmentShader="uniform float strength; varying float progress; void main(){float fade=pow(max(0.,1.-progress),2.); gl_FragColor=vec4(1.,.9,.62,strength*fade);}" />
   </mesh>
  </group>
 </group>;
}
