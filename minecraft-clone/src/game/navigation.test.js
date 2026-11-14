import { Euler, PerspectiveCamera, Vector3 } from 'three';
import { horizontalHeading } from './navigation';
import { spawnPosition, stepPlayer } from './world';

test.each([0, 90, 180, 270])('WASD follows actual camera direction at %i degrees, including pitch', degrees => {
  const yaw = degrees * Math.PI / 180;
  for (const pitch of [-1.4, 0, 1.4]) {
    const camera = new PerspectiveCamera();
    // PointerLockControls writes a quaternion; the camera's Euler order stays XYZ.
    camera.quaternion.setFromEuler(new Euler(pitch, yaw, 0, 'YXZ'));
    const heading = horizontalHeading(camera.getWorldDirection(new Vector3()));
    const p = spawnPosition([]);
    const expected = {
      forward: [-Math.sin(yaw), -Math.cos(yaw)],
      backward: [Math.sin(yaw), Math.cos(yaw)],
      right: [Math.cos(yaw), -Math.sin(yaw)],
      left: [-Math.cos(yaw), Math.sin(yaw)],
    };
    for (const [key, [x, z]] of Object.entries(expected)) {
      const next = stepPlayer(p, { [key]: true }, heading, 0.05, []);
      expect(next.x - p.x).toBeCloseTo(x * 4.5 * 0.05);
      expect(next.z - p.z).toBeCloseTo(z * 4.5 * 0.05);
      expect(next.y).toBe(p.y);
    }
  }
});

test('looking vertically retains the previous horizontal heading', () => {
  expect(horizontalHeading({ x: 0, y: 1, z: 0 }, 2.1)).toBe(2.1);
  expect(horizontalHeading({ x: 0, y: -1, z: 0 }, -2.1)).toBe(-2.1);
});
