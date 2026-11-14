import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Vector3, BoxGeometry, EdgesGeometry } from 'three';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { useStore } from '../hooks/useStore';
import { overlapsPlayer, spawnPosition, stepPlayer } from '../game/world';
import { FPVControls } from './FPVControls';
import { horizontalHeading, playerView } from '../game/navigation';
import { raycastVoxels } from '../game/voxels';
import { renderMetrics } from '../game/metrics';
import { blockFeedback } from '../game/feedback';

export default function Player() {
  const { camera, gl } = useThree();
  const input = useKeyboardControls();
  const player = useRef(spawnPosition(useStore.getState().cubes));
  const outline = useRef();
  const forward = useMemo(() => new Vector3(), []);
  const heading = useRef(0);
  const wasFlying = useRef(false);
  const edges = useMemo(() => {
    const box = new BoxGeometry(1.008, 1.008, 1.008);
    const geometry = new EdgesGeometry(box); box.dispose(); return geometry;
  }, []);
  useEffect(() => () => edges.dispose(), [edges]);
  const target = useCallback(() => {
    camera.getWorldDirection(forward);
    return raycastVoxels(useStore.getState().world, camera.position, forward);
  }, [camera, forward]);

  useEffect(() => {
    const click = event => {
      if (!useStore.getState().playing || document.pointerLockElement !== gl.domElement) return;
      if (event.button !== 0 && event.button !== 2) return;
      event.preventDefault();
      const hit = target();
      if (!hit) return;
      const state = useStore.getState();
      const block = hit.block;
      if (event.button === 0) {
        if (block) {
          const texture = state.world.blocks.get(block.join(',')).texture;
          state.removeCube(...block);
          blockFeedback(block, texture, true, state.soundEnabled);
        }
        return;
      }
      const pos = block
        ? block.map((value, i) => value + hit.normal[i])
        : [Math.round(hit.point[0]), 1, Math.round(hit.point[2])];
      if (!overlapsPlayer(pos, player.current)) {
        state.addCube(...pos);
        if (useStore.getState().world !== state.world) blockFeedback(pos, state.texture, false, state.soundEnabled);
      }
    };
    const context = event => event.preventDefault();
    gl.domElement.addEventListener('mousedown', click);
    gl.domElement.addEventListener('contextmenu', context);
    useStore.getState().setReady(true);
    return () => {
      gl.domElement.removeEventListener('mousedown', click);
      gl.domElement.removeEventListener('contextmenu', context);
    };
  }, [gl, target]);

  useFrame((_, delta) => {
    const state = useStore.getState();
    camera.getWorldDirection(forward);
    heading.current = horizontalHeading(forward, heading.current);
    if (state.playing) {
      if (wasFlying.current !== state.flying) player.current.vy = 0;
      wasFlying.current = state.flying;
      player.current = stepPlayer(player.current, { ...input.current, flying: state.flying }, heading.current, delta, state.world);
      input.current.jump = false;
    }
    const p = player.current;
    Object.assign(playerView, { x: p.x, y: p.y, z: p.z, heading: heading.current });
    camera.position.set(p.x, p.y + 1.62, p.z);
    camera.updateMatrixWorld();
    const hit = state.playing ? target() : null;
    const block = hit?.block;
    if (outline.current) {
      outline.current.visible = !!block;
      if (block) outline.current.position.set(...block);
    }
    // Read-only telemetry supports repeatable browser QA without changing gameplay.
    gl.domElement.dataset.position = [p.x, p.y, p.z].map(n => n.toFixed(3)).join(',');
    gl.domElement.dataset.grounded = String(p.grounded);
    gl.domElement.dataset.flying = String(state.flying);
    gl.domElement.dataset.heading = String(heading.current);
    gl.domElement.dataset.direction = [forward.x, forward.y, forward.z].join(',');
    gl.domElement.dataset.target = block ? block.join(',') : hit?.ground ? 'ground' : '';
    renderMetrics.drawCalls = gl.info.render.calls;
    renderMetrics.triangles = gl.info.render.triangles;
    gl.info.reset();
    renderMetrics.frameMs = renderMetrics.frameMs ? renderMetrics.frameMs * 0.95 + delta * 1000 * 0.05 : delta * 1000;
    gl.domElement.dataset.drawCalls = String(renderMetrics.drawCalls);
    gl.domElement.dataset.triangles = String(renderMetrics.triangles);
    gl.domElement.dataset.chunkCount = String(state.world.chunks.size);
    gl.domElement.dataset.meshBuilds = String(renderMetrics.builds.length);
    gl.domElement.dataset.lastChunks = state.world.lastChanged.join(';');
    gl.domElement.dataset.geometries = String(gl.info.memory.geometries);
  });

  return <>
    <FPVControls />
    <lineSegments ref={outline} visible={false} geometry={edges}>
      <lineBasicMaterial color="#fff4b0" toneMapped={false} />
    </lineSegments>
  </>;
}
