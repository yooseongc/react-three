import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import DayNight from './components/DayNight';
import LandscapeMotion from './components/LandscapeMotion';
import Weather from './components/Weather';
import Ground from './components/Ground';
import Player from './components/Player';
import Cubes from './components/Cubes';
import Hud from './components/Hud';
import { useStore } from './hooks/useStore';
import Decorations from './components/Decorations';
import Water from './components/Water';
import BlockParticles from './components/BlockParticles';


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
  const shadows = useStore(state => state.shadows);
  useEffect(() => {
    if (!useStore.getState().dirty) return;
    const timer = setTimeout(() => useStore.getState().saveWorld(), 500);
    return () => clearTimeout(timer);
  }, [cubes]);
  useEffect(() => {
    const save = () => { if (useStore.getState().dirty) useStore.getState().saveWorld(); };
    const hide = () => { if (document.hidden) save(); };
    window.addEventListener('pagehide', save);
    const beforeUnload = event => {
      save();
      if (useStore.getState().dirty) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('visibilitychange', hide);
    return () => {
      window.removeEventListener('pagehide', save);
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('visibilitychange', hide);
    };
  }, []);
  return <SceneErrorBoundary>
    <Canvas shadows={shadows ? 'percentage' : false} camera={{ fov: 70, near: 0.1, far: 180, position: [0, 2.12, 10] }} dpr={[1, 1.5]}
      onCreated={({ gl }) => {
        gl.domElement.setAttribute('aria-label', '복셀 정원 게임 화면');
        // Count both shadow and main passes, reset once at the next frame boundary.
        gl.info.autoReset = false;
      }}>
      <LandscapeMotion />
      <Weather />
      <DayNight />
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
