import { ground } from '../textures';
import { useMemo, useEffect } from 'react';
import { MeshStandardMaterial } from 'three';
import { wetSurface } from '../game/weatherMaterials';

export default function Ground() {
  const material=useMemo(()=>wetSurface(new MeshStandardMaterial({map:ground})),[]);
  useEffect(()=>()=>material.dispose(),[material]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]} receiveShadow userData={{ ground: true }}>
      <planeGeometry args={[100, 100]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
