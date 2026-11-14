// Shared read-only view for the DOM minimap; avoids React updates on every frame.
export const playerView = { x: 0, y: 0.5, z: 10, heading: 0 };

export function horizontalHeading(direction, previous = 0) {
  // Looking exactly up/down has no horizontal direction: retain the last heading.
  if (Math.hypot(direction.x, direction.z) < 0.00001) return previous;
  return Math.atan2(-direction.x, -direction.z);
}
