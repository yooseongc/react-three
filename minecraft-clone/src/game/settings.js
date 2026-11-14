export const SETTINGS_KEY = 'voxel-garden.settings.v1';
export const defaultSettings = { soundEnabled: true, sensitivity: 1, shadows: true, showMinimap: true, dayCycle: true, timeOfDay: 9, landscapeMotion: true };
export function cleanSettings(value) {
  return { soundEnabled: typeof value?.soundEnabled === 'boolean' ? value.soundEnabled : true,
    sensitivity: Number.isFinite(value?.sensitivity) ? Math.min(2,Math.max(.25,value.sensitivity)) : 1,
    shadows: typeof value?.shadows === 'boolean' ? value.shadows : true,
    showMinimap: typeof value?.showMinimap === 'boolean' ? value.showMinimap : true,
    dayCycle: typeof value?.dayCycle === 'boolean' ? value.dayCycle : true,
    landscapeMotion: typeof value?.landscapeMotion === 'boolean' ? value.landscapeMotion : true,
    timeOfDay: Number.isFinite(value?.timeOfDay) ? ((value.timeOfDay % 24) + 24) % 24 : 9 };
}
export function loadSettings(storage) {
  try { return cleanSettings(JSON.parse(storage.getItem(SETTINGS_KEY))); } catch { return {...defaultSettings}; }
}
