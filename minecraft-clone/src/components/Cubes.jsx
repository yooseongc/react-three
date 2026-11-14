import { useEffect, useMemo } from 'react';
import { MeshStandardMaterial } from 'three';
import { useStore } from '../hooks/useStore';
import { ALL_BLOCK_TYPES } from '../game/world';
import * as textures from '../textures';
import Chunk from './Chunk';
import { animateSurface } from '../game/motion';

// Stable accessor prevents memoized chunks from retaining obsolete whole-world Maps.
const getBlocks = () => useStore.getState().world.blocks;

export default function Cubes() {
  const world = useStore(state => state.world);
  const materials = useMemo(() => Object.fromEntries(ALL_BLOCK_TYPES.map(type => {
    const material = new MeshStandardMaterial({ map: textures[type], color: type === 'glass' ? '#d5f1ff' : 'white',
      transparent: type === 'glass', opacity: type === 'glass' ? 0.6 : 1, depthWrite: type !== 'glass' });
    return [type, type === 'leaves' ? animateSurface(material, 'leaves') : material];
  })), []);
  useEffect(() => () => Object.values(materials).forEach(material => material.dispose()), [materials]);
  return [...world.chunks.values()].map(chunk => <Chunk key={chunk.key} chunk={chunk} getBlocks={getBlocks} materials={materials} />);
}
