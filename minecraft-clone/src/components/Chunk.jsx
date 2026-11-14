import { memo, useEffect, useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import { buildChunkMesh } from '../game/meshing';
import { renderMetrics } from '../game/metrics';

function Chunk({ chunk, getBlocks, materials }) {
  const batches = useMemo(() => {
    const start = performance.now();
    const data = buildChunkMesh(chunk, getBlocks()).map(batch => {
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new Float32BufferAttribute(batch.positions, 3));
      geometry.setAttribute('normal', new Float32BufferAttribute(batch.normals, 3));
      geometry.setAttribute('uv', new Float32BufferAttribute(batch.uvs, 2));
      geometry.setIndex(batch.indices);
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
      return { texture: batch.texture, faces: batch.faces, geometry };
    });
    renderMetrics.builds.push({ key: chunk.key, ms: performance.now() - start });
    if (renderMetrics.builds.length > 200) renderMetrics.builds.shift();
    return data;
  }, [chunk, getBlocks]);
  useEffect(() => {
    renderMetrics.chunks.set(chunk.key, batches.reduce((sum, batch) => sum + batch.faces, 0));
    return () => {
      renderMetrics.chunks.delete(chunk.key);
      batches.forEach(batch => batch.geometry.dispose());
    };
  }, [chunk, batches]);
  return batches.map(batch => <mesh key={batch.texture} geometry={batch.geometry}
    material={materials[batch.texture]} castShadow={batch.texture !== 'glass'} receiveShadow
    dispose={null} name={'chunk:' + chunk.key + ':' + batch.texture} />);
}

export default memo(Chunk, (previous, next) => previous.chunk === next.chunk
  && previous.materials === next.materials && previous.getBlocks === next.getBlocks);
