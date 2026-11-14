import { BufferGeometry, Float32BufferAttribute } from 'three';

// Five curved ribbons share one instanced tuft; their roots stay on the ground.
export function createGrassGeometry() {
  const positions = [], colors = [], indices = [];
  for (let blade = 0; blade < 5; blade++) {
    const angle = blade * 2.4, dx = Math.cos(angle), dz = Math.sin(angle);
    const start = positions.length / 3;
    for (let segment = 0; segment <= 3; segment++) {
      const t = segment / 3, width = .034 * (1 - t) + .001;
      for (const side of [-1, 1]) {
        positions.push(dx * (.025 + t*t*.12) - dz*width*side, -.2 + t*(.34 + blade*.025), dz*(.025+t*t*.12) + dx*width*side);
        colors.push(.16+t*.22, .29+t*.22, .055+t*.08);
      }
      if (segment < 3) {
        const a=start+segment*2;
        indices.push(a,a+1,a+2,a+1,a+3,a+2);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position',new Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  return geometry;
}
