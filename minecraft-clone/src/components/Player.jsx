import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Vector3, BoxGeometry, EdgesGeometry, Euler } from 'three';
import { touchInput } from '../game/touch';
import { Line } from '@react-three/drei';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { useStore } from '../hooks/useStore';
import { spawnPosition, stepPlayer } from '../game/world';
import { placementPosition, placementError } from '../game/placement';
import * as textures from '../textures';
import { FPVControls } from './FPVControls';
import { horizontalHeading, playerView } from '../game/navigation';
import { raycastVoxels } from '../game/voxels';
import { renderMetrics } from '../game/metrics';
import { blockFeedback } from '../game/feedback';
import { activeMap } from '../game/mapConfig';
import { generationMs } from '../game/landscape';

export default function Player() {
  const { camera, gl } = useThree();
  const input = useKeyboardControls();
  const player = useRef(spawnPosition(useStore.getState().cubes));
  const outline = useRef();
  const ghost = useRef();
  const ghostEdges = useRef();
  const ghostBorder = useRef();
  const face = useRef();
  const invalidMark = useRef();
  const normalVector = useMemo(() => new Vector3(), []);
  const planeNormal = useMemo(() => new Vector3(0,0,1), []);
  const texture = useStore(state => state.texture);
  const forward = useMemo(() => new Vector3(), []);
  const touchRotation = useMemo(() => new Euler(0,0,0,'YXZ'), []);
  const heading = useRef(0);
  const wasFlying = useRef(false);
  const edges = useMemo(() => {
    const box = new BoxGeometry(1.008, 1.008, 1.008);
    const geometry = new EdgesGeometry(box); box.dispose(); return geometry;
  }, []);
  useEffect(() => () => edges.dispose(), [edges]);
  const edgePoints = useMemo(() => {
    const a = edges.attributes.position.array;
    return Array.from({length:a.length/3},(_,i)=>[a[i*3],a[i*3+1],a[i*3+2]]);
  }, [edges]);
  const target = useCallback(() => {
    camera.getWorldDirection(forward);
    return raycastVoxels(useStore.getState().world, camera.position, forward);
  }, [camera, forward]);

  useEffect(() => {
    const click = event => {
      const isTouch=event.type==='voxel-action';
      const state = useStore.getState();
      if (!state.playing || (isTouch ? !state.touchMode : document.pointerLockElement !== gl.domElement)) return;
      const button=isTouch?event.detail:event.button;
      if (![0,1,2].includes(button)) return;
      event.preventDefault();
      const hit = target();
      if (!hit) return;
      const block = hit.block;
      if (button === 1) {
        if (block) state.setTexture(state.world.blocks.get(block.join(',')).texture);
        return;
      }
      if (button === 0) {
        if (block) {
          const texture = state.world.blocks.get(block.join(',')).texture;
          state.removeCube(...block);
          blockFeedback(block, texture, true, state.soundEnabled);
        }
        return;
      }
      const pos = placementPosition(hit);
      if (state.addCube(...pos, player.current)) blockFeedback(pos, state.texture, false, state.soundEnabled);
    };
    const context = event => event.preventDefault();
    gl.domElement.addEventListener('mousedown', click);
    window.addEventListener('voxel-action', click);
    gl.domElement.addEventListener('contextmenu', context);
    useStore.getState().setReady(true);
    return () => {
      gl.domElement.removeEventListener('mousedown', click);
      window.removeEventListener('voxel-action', click);
      gl.domElement.removeEventListener('contextmenu', context);
    };
  }, [gl, target]);

  useFrame((_, delta) => {
    const state = useStore.getState();
    if(state.touchMode && state.playing) {
      touchRotation.setFromQuaternion(camera.quaternion);
      touchRotation.y-=touchInput.lookX*.004*state.sensitivity;
      touchRotation.x=Math.max(-Math.PI/2+.01,Math.min(Math.PI/2-.01,touchRotation.x-touchInput.lookY*.004*state.sensitivity));
      camera.quaternion.setFromEuler(touchRotation);
      touchInput.lookX=touchInput.lookY=0;
    }
    camera.getWorldDirection(forward);
    heading.current = horizontalHeading(forward, heading.current);
    if (state.playing) {
      if (wasFlying.current !== state.flying) player.current.vy = 0;
      wasFlying.current = state.flying;
      player.current = stepPlayer(player.current, { ...input.current, ...(state.touchMode?touchInput:{}), flying: state.flying }, heading.current, delta, state.world);
      input.current.jump = false;
      touchInput.jump = false;
    }
    const p = player.current;
    Object.assign(playerView, { x: p.x, y: p.y, z: p.z, heading: heading.current });
    camera.position.set(p.x, p.y + 1.62, p.z);
    camera.updateMatrixWorld();
    const hit = state.playing ? target() : null;
    const block = hit?.block;
    const placement = placementPosition(hit);
    const error = placementError(state.world, placement, p);
    if (ghost.current && ghostEdges.current) {
      ghost.current.visible = ghostEdges.current.visible = !!placement;
      ghostBorder.current.visible = !!placement;
      invalidMark.current.visible = !!placement && !!error;
      if (placement) {
        ghost.current.position.set(...placement);
        ghostEdges.current.position.set(...placement);
        ghostBorder.current.position.set(...placement);
        invalidMark.current.position.set(...placement);
        ghost.current.material.color.set(error ? '#ff6575' : '#9af7bd');
        ghostEdges.current.material.color.set(error ? '#ff4055' : '#82ffc1');
      }
    }
    if (outline.current) {
      outline.current.visible = !!block;
      if (block) outline.current.position.set(...block);
    }
    face.current.visible = !!placement;
    if (placement) {
      normalVector.set(...(hit.normal || [0,1,0]));
      const base = block || [placement[0],0,placement[2]];
      face.current.position.set(...base).addScaledVector(normalVector,.506);
      face.current.quaternion.setFromUnitVectors(planeNormal,normalVector);
    }
    // Read-only telemetry supports repeatable browser QA without changing gameplay.
    gl.domElement.dataset.position = [p.x, p.y, p.z].map(n => n.toFixed(3)).join(',');
    gl.domElement.dataset.grounded = String(p.grounded);
    gl.domElement.dataset.flying = String(state.flying);
    gl.domElement.dataset.heading = String(heading.current);
    gl.domElement.dataset.direction = [forward.x, forward.y, forward.z].join(',');
    gl.domElement.dataset.target = block ? block.join(',') : hit?.ground ? 'ground' : '';
    gl.domElement.dataset.placement = placement?.join(',') || '';
    gl.domElement.dataset.placementError = state.playing ? error : '';
    gl.domElement.dataset.selectedMaterial = state.texture;
    gl.domElement.dataset.targetNormal = hit?.normal?.join(',') || (hit?.ground ? '0,1,0' : '');
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
    gl.domElement.dataset.mapType=activeMap.mapType;
    gl.domElement.dataset.mapSize=String(activeMap.size);
    gl.domElement.dataset.generationMs=generationMs.toFixed(1);
  });

  return <>
    <FPVControls />
    <group ref={outline} visible={false}>
      <Line points={edgePoints} segments transparent color="#14251f" lineWidth={5} fog={false} toneMapped={false} />
      <Line points={edgePoints} segments transparent color="#ffe5a0" lineWidth={2} fog={false} toneMapped={false} renderOrder={1} />
    </group>
    <mesh ref={face} visible={false} renderOrder={1}>
      <planeGeometry args={[.94,.94]} />
      <meshBasicMaterial color="#ffe5a0" transparent opacity={.24} depthWrite={false} fog={false} toneMapped={false} />
    </mesh>
    <mesh ref={ghost} visible={false} renderOrder={2}>
      <boxGeometry args={[1.002, 1.002, 1.002]} />
      <meshBasicMaterial map={textures[texture]} transparent opacity={0.22} depthWrite={false} fog={false} toneMapped={false} />
    </mesh>
    <Line ref={ghostBorder} points={edgePoints} segments transparent color="#14251f" lineWidth={5} depthWrite={false} fog={false} toneMapped={false} renderOrder={3} />
    <Line ref={ghostEdges} points={edgePoints} segments transparent lineWidth={2.5} depthWrite={false} fog={false} toneMapped={false} renderOrder={4} />
    <group ref={invalidMark} visible={false}>
      <Line points={[[-.5,-.5,-.505],[.5,.5,-.505],[-.5,.5,-.505],[.5,-.5,-.505],[-.5,-.5,.505],[.5,.5,.505],[-.5,.5,.505],[.5,-.5,.505]]} segments transparent color="#ff6575" lineWidth={3} fog={false} toneMapped={false} depthWrite={false} renderOrder={5} />
    </group>
  </>;
}
