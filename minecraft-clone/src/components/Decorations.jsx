import { useLayoutEffect, useRef } from 'react';
import { Object3D } from 'three';
import { decorationPositions, demoMode } from '../game/demo';
import { landscape } from '../game/landscape';
import { useStore } from '../hooks/useStore';

// Reusable instancing foundation: decorations have no collision or block interaction.
export default function Decorations() {
  const mesh = useRef();
  const world = useStore(state => state.world);
  const positions = landscape ? landscape.flowers.filter(([x,y,z]) => world.blocks.get([x,Math.round(y-.75),z].join(','))?.texture === 'grass'
    && !world.blocks.has([x,Math.round(y+.25),z].join(','))) : decorationPositions;
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const transform = new Object3D();
    positions.forEach((position, index) => {
      transform.position.set(...position);
      transform.rotation.y = index * 2.4;
      transform.scale.set(1, 0.7 + (index % 4) * 0.2, 1);
      transform.updateMatrix();
      mesh.current.setMatrixAt(index, transform.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [world]);
  if (!landscape && demoMode !== 'chunks') return null;
  return <instancedMesh key={positions.length} ref={mesh} args={[null, null, positions.length]} frustumCulled={false} name="grass-instances">
    <coneGeometry args={[0.18, 0.4, 3]} />
    <meshStandardMaterial color={landscape ? '#e3ce86' : '#8db449'} roughness={1} />
  </instancedMesh>;
}
