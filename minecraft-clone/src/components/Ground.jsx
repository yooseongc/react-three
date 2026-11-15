import { ground } from '../textures';
import { useMemo, useEffect } from 'react';
import { MeshStandardMaterial } from 'three';
import { wetSurface } from '../game/weatherMaterials';
import { activeMap } from '../game/mapConfig';

export default function Ground() {
  const material=useMemo(()=>wetSurface(new MeshStandardMaterial(activeMap.mapType==='snow'?{color:'#e5eff1'}:{map:ground})),[]);
  useEffect(()=>()=>material.dispose(),[material]);
  if(activeMap.mapType==='sky')return null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]} receiveShadow userData={{ ground: true }}>
      <planeGeometry args={[activeMap.size, activeMap.size]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
