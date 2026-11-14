import { useMemo, useEffect } from 'react';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import { landscape } from '../game/landscape';
import { WATER_LEVEL } from '../game/terrain';
import { useStore } from '../hooks/useStore';

export default function Water() {
  const world = useStore(state => state.world);
  const geometry = useMemo(() => {
    if (!landscape) return null;
    const positions=[], normals=[], uvs=[], indices=[];
    // Only original shallow-water cells; placing a block through the surface hides that cell.
    for(const [x,,z] of landscape.water) {
      if(world.blocks.has([x,3,z].join(',')))continue;
      const start=positions.length/3;
      for(const [dx,dz] of [[-.5,-.5],[-.5,.5],[.5,.5],[.5,-.5]]){
        positions.push(x+dx,WATER_LEVEL,z+dz); normals.push(0,1,0); uvs.push((x+dx)/6,(z+dz)/6);
      }
      indices.push(start,start+1,start+2,start,start+2,start+3);
    }
    const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));
    g.setAttribute('normal',new Float32BufferAttribute(normals,3));g.setAttribute('uv',new Float32BufferAttribute(uvs,2));g.setIndex(indices);
    g.computeBoundingSphere();return g;
  },[world]);
  useEffect(()=>()=>geometry?.dispose(),[geometry]);
  if(!geometry)return null;
  return <mesh geometry={geometry} name="shallow-water" receiveShadow>
    <meshStandardMaterial color="#70c5c8" transparent opacity={0.65} roughness={0.22} metalness={0.15} depthWrite={false} />
  </mesh>;
}
