import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import Ground from './components/Ground';
import Player from './components/Player';
import Cubes from './components/Cubes';
import Hud from './components/Hud';
import { useStore } from './hooks/useStore';
import Decorations from './components/Decorations';
import Water from './components/Water';
import BlockParticles from './components/BlockParticles';
import { landscape } from './game/landscape';

class SceneErrorBoundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    if (this.state.error) return <div className="fatal-error" role="alert">
      <h1>월드를 표시하지 못했습니다</h1>
      <p>브라우저의 WebGL 지원과 하드웨어 가속 설정을 확인해주세요. 저장 데이터는 유지됩니다.</p>
      <button onClick={() => window.location.reload()}>다시 시도</button>
    </div>;
    return this.props.children;
  }
}

export default function App() {
  const cubes = useStore(state => state.cubes);
  useEffect(() => {
    if (!useStore.getState().dirty) return;
    const timer = setTimeout(() => useStore.getState().saveWorld(), 500);
    return () => clearTimeout(timer);
  }, [cubes]);
  useEffect(() => {
    const save = () => { if (useStore.getState().dirty) useStore.getState().saveWorld(); };
    const hide = () => { if (document.hidden) save(); };
    window.addEventListener('pagehide', save);
    window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', hide);
    return () => {
      window.removeEventListener('pagehide', save);
      window.removeEventListener('beforeunload', save);
      document.removeEventListener('visibilitychange', hide);
    };
  }, []);
  return <SceneErrorBoundary>
    <Canvas shadows="percentage" camera={{ fov: 70, near: 0.1, far: 180, position: [0, 2.12, 10] }} dpr={[1, 1.5]}
      onCreated={({ gl }) => {
        gl.domElement.setAttribute('aria-label', '복셀 정원 게임 화면');
        // Count both shadow and main passes, reset once at the next frame boundary.
        gl.info.autoReset = false;
      }}>
      <Sky sunPosition={landscape ? [80, 28, -60] : [100, 40, 100]} {...(landscape ? { turbidity: 6, rayleigh: 1.5 } : {})} />
      <fog attach="fog" args={[landscape ? '#c4d8cb' : '#bed4d8', 45, 110]} />
      {/* Preserve pre-r155 illumination under Three's physically based lighting. */}
      <ambientLight intensity={0.65 * Math.PI} />
      <directionalLight castShadow intensity={0.85 * Math.PI} position={[20, 30, 10]}
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} />
      <Ground />
      <Cubes />
      <Decorations />
      <Water />
      <BlockParticles />
      <Player />
    </Canvas>
    <Hud />
  </SceneErrorBoundary>;
}
