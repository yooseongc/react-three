import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D } from 'three';
import { landscape } from '../game/landscape';
import { anchorIntact, detailNearby } from '../game/livingWorld';
import { useStore } from '../hooks/useStore';

function Rotor({detail}){
 const group=useRef();
 useFrame(({camera},dt)=>{const s=useStore.getState(),g=group.current;g.visible=anchorIntact(detail,s.world.blocks)&&detailNearby(detail.pos,camera.position);if(g.visible&&s.playing&&s.landscapeMotion&&!document.hidden)g.rotation.z+=Math.min(dt,.05)*(detail.type==='wind'?.2:-.3);});
 return <group position={detail.pos} rotation={detail.type==='water'?[0,Math.PI/2,0]:[0,0,0]}><group ref={group} name={'rotor:'+detail.anchor} raycast={()=>null}>
  {detail.type==='water'&&<mesh><torusGeometry args={[3.6,.32,4,24]} /><meshStandardMaterial color="#725039" /></mesh>}
  {Array.from({length:detail.type==='wind'?4:8},(_,i)=><group key={i} rotation={[0,0,i*Math.PI/(detail.type==='wind'?2:4)]}><mesh position={[0,2,0]} castShadow><boxGeometry args={[.25,4,.3]} /><meshStandardMaterial color="#5e4632" /></mesh>{detail.type==='wind'&&<mesh position={[.55,3.4,0]} castShadow><boxGeometry args={[1.2,2.8,.15]} /><meshStandardMaterial color="#e5d4ab" /></mesh>}</group>)}
 </group></group>;
}
export default function LivingDetails(){
 const smoke=useRef(),leaves=useRef(),time=useRef(0),dummy=useMemo(()=>new Object3D(),[]);
 const emitters=useMemo(()=>{const result=[];for(const c of landscape?.cubes||[])if(['cherryLeaves','mapleLeaves','goldenLeaves'].includes(c.texture)&&!((c.pos[0]+c.pos[2])%5))result.push(c);return result;},[]);
 useFrame(({camera,gl},dt)=>{
  const s=useStore.getState(),moving=s.playing&&s.landscapeMotion&&!document.hidden;
  if(moving)time.current+=Math.min(dt,.05);let n=0,k=0;
  for(const d of landscape?.chimneys||[])if(anchorIntact(d,s.world.blocks)&&detailNearby(d.pos,camera.position))for(let i=0;i<6;i++){
   const t=(time.current*.45+i*.67)%4;dummy.position.set(d.pos[0]+Math.sin(t+i)*.3+t*.25,d.pos[1]+t,d.pos[2]);dummy.scale.setScalar(.3+t*.18);dummy.rotation.set(0,0,0);dummy.updateMatrix();smoke.current.setMatrixAt(n++,dummy.matrix);
  }
  if(s.landscapeMotion)for(const c of emitters){if(k>=72)break;if(!detailNearby(c.pos,camera.position,30)||s.world.blocks.get(c.key)?.texture!==c.texture)continue;
   const phase=(time.current*.65+k*.83)%4,x=c.pos[0]+Math.sin(time.current*.6+k)*1.1,y=c.pos[1]-phase,z=c.pos[2]+Math.cos(time.current*.4+k);
   if(s.world.blocks.has([Math.round(x),Math.round(y),Math.round(z)].join(',')))continue;
   dummy.position.set(x,y,z);dummy.scale.set(.12,.025,.18);dummy.rotation.set(phase,phase*.6,k);dummy.updateMatrix();leaves.current.setMatrixAt(k++,dummy.matrix);
  }
  smoke.current.count=n;smoke.current.instanceMatrix.needsUpdate=true;leaves.current.count=k;leaves.current.instanceMatrix.needsUpdate=true;
  gl.domElement.dataset.livingTime=time.current.toFixed(3);gl.domElement.dataset.smokePuffs=String(n);gl.domElement.dataset.fallingLeaves=String(k);
 });
 return <>
  {(landscape?.rotors||[]).map(d=><Rotor key={d.anchor} detail={d}/>)}
  <instancedMesh ref={smoke} args={[null,null,144]} frustumCulled={false} raycast={()=>null}><sphereGeometry args={[1,8,5]}/><meshBasicMaterial color="#d6d3cc" transparent opacity={.13} depthWrite={false}/></instancedMesh>
  <instancedMesh ref={leaves} args={[null,null,72]} frustumCulled={false} raycast={()=>null}><boxGeometry/><meshStandardMaterial color={landscape?.mapType==='autumn'?'#d69645':'#edb8cb'}/></instancedMesh>
 </>;
}
