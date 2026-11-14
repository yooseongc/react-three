import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { useStore } from '../hooks/useStore';

export function FPVControls() {
  const { camera, gl } = useThree();
  useEffect(() => {
    const controls = new PointerLockControls(camera, gl.domElement);
    controls.pointerSpeed = useStore.getState().sensitivity;
    const unsubscribe = useStore.subscribe(state => { controls.pointerSpeed = state.sensitivity; });
    const change = () => {
      if(useStore.getState().touchMode)return;
      const playing = document.pointerLockElement === gl.domElement;
      useStore.getState().setPlaying(playing);
      if (!playing && useStore.getState().dirty) useStore.getState().saveWorld();
    };
    const error = () => useStore.getState().setControlError('마우스 잠금을 허용하지 못했습니다. 다시 시작 버튼을 눌러주세요.');
    const pause = () => {
      useStore.getState().setPlaying(false);
      if(useStore.getState().dirty)useStore.getState().saveWorld();
      if (document.pointerLockElement) document.exitPointerLock();
    };
    const hide = () => { if (document.hidden) pause(); };
    const escape = event => { if (event.code === 'Escape') pause(); };
    document.addEventListener('pointerlockchange', change);
    document.addEventListener('pointerlockerror', error);
    document.addEventListener('visibilitychange', hide);
    document.addEventListener('keydown', escape);
    window.addEventListener('blur', pause);
    return () => {
      controls.dispose();
      unsubscribe();
      document.removeEventListener('pointerlockchange', change);
      document.removeEventListener('pointerlockerror', error);
      document.removeEventListener('visibilitychange', hide);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('blur', pause);
    };
  }, [camera, gl]);
  return null;
}
