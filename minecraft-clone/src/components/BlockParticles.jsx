import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, Color } from 'three';
import { feedback } from '../game/feedback';
import { BLOCK_TYPES, BLOCK_COLORS } from '../game/world';
import { useStore } from '../hooks/useStore';

export default function BlockParticles() {
  const mesh = useRef(), last = useRef(0), age = useRef(1), origin = useRef([0,0,0]);
  const transform = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);
  useFrame((_, delta) => {
    if (!mesh.current) return;
    const burst = feedback.burst;
    if (burst && burst.serial !== last.current) {
      last.current = burst.serial; age.current = 0; origin.current = burst.pos;
      color.set(BLOCK_COLORS[BLOCK_TYPES.indexOf(burst.texture)] || '#d8c591');
      for (let i=0;i<18;i++) mesh.current.setColorAt(i,color);
      mesh.current.instanceColor.needsUpdate = true;
    }
    if (!useStore.getState().playing) { mesh.current.visible = false; age.current = 1; return; }
    age.current += Math.min(delta, .05);
    const t = age.current;
    mesh.current.visible = t < .65;
    if (t >= .65) return;
    for (let i=0;i<18;i++) {
      const angle = i * 2.4, speed = .7 + (i % 4) * .35;
      transform.position.set(origin.current[0]+Math.cos(angle)*speed*t,
        origin.current[1]+(.8+(i%3)*.7)*t-4*t*t,
        origin.current[2]+Math.sin(angle)*speed*t);
      transform.rotation.set(t*i,angle+t*2,t*3);
      transform.scale.setScalar(.13*(1-t/.65));transform.updateMatrix();
      mesh.current.setMatrixAt(i,transform.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={mesh} args={[null,null,18]} visible={false} frustumCulled={false} name="block-particles">
    <boxGeometry args={[1,1,1]} /><meshStandardMaterial roughness={1} />
  </instancedMesh>;
}
