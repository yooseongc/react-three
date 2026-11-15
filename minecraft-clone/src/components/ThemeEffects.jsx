import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { landscape } from '../game/landscape';
import { useStore } from '../hooks/useStore';

// Small, texture-free translucent puffs; paused together with the landscape.
export default function ThemeEffects(){
 const group=useRef(),time=useRef(0),sky=landscape?.mapType==='sky';
 const puffs=useMemo(()=>sky?Array.from({length:30},(_,i)=>({x:Math.sin(i*2.4)*65,z:Math.cos(i*2.4)*65,y:9+i%3,scale:[10+i%4,1.2,6+i%5]})):(landscape?.steam||[]).flatMap(([x,y,z])=>Array.from({length:8},(_,i)=>({x:x+Math.sin(i*2.4)*1.5,y:y+i*.45,z:z+Math.cos(i*2.4),scale:[.7,.5,.7]}))),[sky]);
 useFrame((_,dt)=>{if(!group.current)return;if(useStore.getState().playing&&!document.hidden)time.current+=Math.min(dt,.05);group.current.children.forEach((mesh,i)=>{const p=puffs[i];mesh.position.set(p.x+Math.sin(time.current*.15+i)*.6,p.y+(sky?0:(time.current*.25+i*.23)%2),p.z);});});
 if(!puffs.length)return null;
 return <group ref={group} name={sky?'cloud-garden':'hot-spring-steam'}>{puffs.map((p,i)=><mesh key={i} position={[p.x,p.y,p.z]} scale={p.scale} raycast={()=>null}><sphereGeometry args={[1,8,5]} /><meshBasicMaterial color="#f5f3eb" transparent opacity={sky?.27:.09} depthWrite={false} /></mesh>)}</group>;
}
