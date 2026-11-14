import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshStandardMaterial } from 'three';
import { useStore } from '../hooks/useStore';
import { ALL_BLOCK_TYPES } from '../game/world';
import * as textures from '../textures';
import Chunk from './Chunk';
import { animateSurface } from '../game/motion';
import { wetSurface } from '../game/weatherMaterials';
import { chunkInView } from '../game/chunkView';
import { CHUNK_SIZE } from '../game/voxels';

// Stable accessor prevents memoized chunks from retaining obsolete whole-world Maps.
const getBlocks = () => useStore.getState().world.blocks;

export default function Cubes() {
  const world = useStore(state => state.world);
  const [center,setCenter]=useState([0,0]),centerRef=useRef(center);
  const chunks=useMemo(()=>[...world.chunks.values()].filter(chunk=>chunkInView(chunk.coords,center)),[world,center]);
  useFrame(({camera,gl})=>{
    const next=[Math.floor(camera.position.x/CHUNK_SIZE),Math.floor(camera.position.z/CHUNK_SIZE)];
    if(next[0]!==centerRef.current[0]||next[1]!==centerRef.current[1]){centerRef.current=next;setCenter(next);}
    gl.domElement.dataset.visibleChunkCount=String(chunks.length);
  });
  const materials = useMemo(() => Object.fromEntries(ALL_BLOCK_TYPES.map(type => {
    const material = new MeshStandardMaterial({ map: textures[type], color: type === 'glass' ? '#d5f1ff' : 'white',
      transparent: type === 'glass', opacity: type === 'glass' ? 0.6 : 1, depthWrite: type !== 'glass' });
    if(type === 'leaves')animateSurface(material,'leaves');
    if(type === 'lantern'){material.emissive.set('#ffbd61');material.emissiveMap=textures.lantern;material.emissiveIntensity=.8;}
    return [type, type === 'glass' ? material : wetSurface(material)];
  })), []);
  useEffect(() => () => Object.values(materials).forEach(material => material.dispose()), [materials]);
  return chunks.map(chunk => <Chunk key={chunk.key} chunk={chunk} getBlocks={getBlocks} materials={materials} />);
}
