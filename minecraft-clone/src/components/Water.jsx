import { useMemo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute, MeshStandardMaterial } from 'three';
import { animateSurface, MAX_WAVE_HEIGHT } from '../game/motion';
import { landscape } from '../game/landscape';
import { WATER_LEVEL } from '../game/terrain';
import { useStore } from '../hooks/useStore';

export default function Water() {
  const world = useStore(state => state.world);
  const gl = useThree(state => state.gl);
  const material = useMemo(() => animateSurface(new MeshStandardMaterial({color:'#318f9e',transparent:true,opacity:.72,roughness:.42,metalness:.05,depthWrite:false}), 'water'), []);
  useEffect(()=>()=>material.dispose(),[material]);
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
    // Ocean continues beyond the editable map so coastal views meet a horizon.
    if(['forest','islands','canal','coral'].includes(landscape.mapType)){
      const edge=landscape.size/2-.5,far=edge+180;
      const regions=[[-far,-edge,-far,far],[edge,far,-far,far],[-edge,edge,-far,-edge],[-edge,edge,edge,far]];
      for(const [x0,x1,z0,z1] of regions)for(let x=x0;x<x1;x+=8)for(let z=z0;z<z1;z+=8){
        const start=positions.length/3;
        for(const [xx,zz] of [[x,z],[x,Math.min(z+8,z1)],[Math.min(x+8,x1),Math.min(z+8,z1)],[Math.min(x+8,x1),z]]){positions.push(xx,WATER_LEVEL,zz);normals.push(0,1,0);uvs.push(xx/6,zz/6);}
        indices.push(start,start+1,start+2,start,start+2,start+3);
      }
    }
    const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));
    g.setAttribute('normal',new Float32BufferAttribute(normals,3));g.setAttribute('uv',new Float32BufferAttribute(uvs,2));g.setIndex(indices);
    g.computeBoundingSphere();g.boundingSphere.radius += MAX_WAVE_HEIGHT;return g;
  },[world]);
  useEffect(()=>()=>geometry?.dispose(),[geometry]);
  useEffect(()=>{gl.domElement.dataset.waterCells=String(geometry ? geometry.index.count/6 : 0);},[gl,geometry]);
  if(!geometry)return null;
  return <mesh geometry={geometry} material={material} name="shallow-water" receiveShadow dispose={null} />;
}
