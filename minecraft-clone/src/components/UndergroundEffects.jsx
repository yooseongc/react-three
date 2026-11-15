import { useEffect,useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { landscape } from '../game/landscape';
import { useStore } from '../hooks/useStore';
import { undergroundAt,undergroundState } from '../game/underground';
import { anchorIntact } from '../game/livingWorld';

function Crystal({detail}){
 const group=useRef();
 useFrame(()=>{group.current.visible=anchorIntact(detail,useStore.getState().world.blocks);});
 return <group ref={group} position={detail.pos} raycast={()=>null}>{[0,1,2].map(i=><mesh key={i} position={[(i-1)*.45,i===1?.2:-.3,0]} rotation={[.12,0,(i-1)*.4]} scale={[.4,i===1?1.4:.8,.4]}><octahedronGeometry args={[1,0]}/><meshStandardMaterial color="#8fcdf7" emissive="#3f9fcc" emissiveIntensity={.8} roughness={.2}/></mesh>)}<pointLight color="#8ddaff" intensity={8} distance={9} decay={2}/></group>;
}
export default function UndergroundEffects(){
 useEffect(()=>()=>{undergroundState.inside=false;undergroundState.name='';},[]);
 useFrame(({camera,gl})=>{const cave=undergroundAt(landscape,camera.position,useStore.getState().world.blocks);undergroundState.inside=!!cave;undergroundState.name=cave?.name||'';gl.domElement.dataset.underground=cave?.name||'';});
 return (landscape?.crystals||[]).map(c=><Crystal key={c.anchor} detail={c}/>);
}
