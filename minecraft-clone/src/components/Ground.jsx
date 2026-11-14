import { ground } from '../textures';

export default function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]} receiveShadow userData={{ ground: true }}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial map={ground} />
    </mesh>
  );
}
