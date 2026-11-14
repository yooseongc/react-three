import { useFrame } from '@react-three/fiber';
import { useStore } from '../hooks/useStore';
import { advanceMotion, motionUniforms } from '../game/motion';

export default function LandscapeMotion() {
  useFrame(({ gl }, delta) => {
    const { landscapeMotion, playing } = useStore.getState();
    motionUniforms.m8Strength.value = landscapeMotion ? 1 : 0;
    motionUniforms.m8Time.value = advanceMotion(motionUniforms.m8Time.value, delta, landscapeMotion && playing && !document.hidden);
    gl.domElement.dataset.landscapeMotion = String(landscapeMotion);
    gl.domElement.dataset.motionTime = motionUniforms.m8Time.value.toFixed(3);
  }, -2);
  return null;
}
