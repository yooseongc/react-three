import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { DoubleSide, MeshStandardMaterial, Object3D } from 'three';
import { animateSurface } from '../game/motion';
import { createGrassGeometry } from '../game/grassGeometry';
import { decorationPositions, demoMode } from '../game/demo';
import { landscape } from '../game/landscape';
import { useStore } from '../hooks/useStore';

// Reusable instancing foundation: decorations have no collision or block interaction.
export default function Decorations() {
  const mesh = useRef();
  const world = useStore(state => state.world);
  const material = useMemo(() => animateSurface(new MeshStandardMaterial({vertexColors:true,side:DoubleSide,roughness:1}), 'grass'), []);
  const geometry = useMemo(createGrassGeometry, []);
  useEffect(()=>()=>material.dispose(),[material]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  const positions = landscape ? landscape.flowers.filter(([x,y,z]) => world.blocks.get([x,Math.round(y-.75),z].join(','))?.texture === 'grass'
    && !world.blocks.has([x,Math.round(y+.25),z].join(','))) : decorationPositions;
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const transform = new Object3D();
    positions.forEach((position, index) => {
      const height = 0.7 + (index % 4) * 0.2;
      transform.position.set(position[0], position[1]-.25+.2*height, position[2]);
      transform.rotation.y = index * 2.4;
      transform.scale.set(1, height, 1);
      transform.updateMatrix();
      mesh.current.setMatrixAt(index, transform.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [world]);
  if (!landscape && demoMode !== 'chunks') return null;
  return <instancedMesh key={positions.length} ref={mesh} args={[geometry, material, positions.length]} frustumCulled={false} name="grass-instances" />;
}
