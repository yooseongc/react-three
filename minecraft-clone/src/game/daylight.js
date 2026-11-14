export const DAY_SECONDS = 720;
export const worldClock = { hour: 9 };
export function advanceTime(hour, delta, running) {
  return (hour + (running ? Math.min(Math.max(delta, 0), .1) * 24 / DAY_SECONDS : 0)) % 24;
}
export function sampleDay(hour) {
  const angle = (hour - 6) / 24 * Math.PI * 2;
  const elevation = Math.sin(angle);
  const daylight = Math.min(1, Math.max(0, (elevation + .15) / .5));
  const twilight = Math.max(0, 1 - Math.abs(elevation) / .3);
  return { elevation, daylight, twilight, sun: [Math.cos(angle) * 90, elevation * 90, -35],
    stars: 1 - daylight, ambient: .65 + daylight * 1.4 };
}
export function formatTime(hour) {
  const minutes = Math.floor(((hour % 24 + 24) % 24) * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
