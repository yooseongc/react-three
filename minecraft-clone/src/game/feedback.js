// Audio is created only after a user gesture; unsupported/blocked audio never stops play.
let context;
export function getAudioContext() { return context; }
export const feedback = { burst: null, serial: 0 };
export function unlockAudio() {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    context ||= new Audio();
    context.resume().catch(() => {});
  } catch { /* Browser audio is optional. */ }
}
export function blockFeedback(pos, texture, removed, audible) {
  if (removed) feedback.burst = { pos: [...pos], texture, serial: ++feedback.serial };
  if (!audible || !context || context.state !== 'running') return;
  try {
    const oscillator = context.createOscillator(), gain = context.createGain();
    const start = context.currentTime;
    oscillator.type = removed ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(removed ? 160 : 440, start);
    oscillator.frequency.exponentialRampToValueAtTime(removed ? 55 : 220, start + 0.09);
    gain.gain.setValueAtTime(0.045, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(start); oscillator.stop(start + 0.13);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  } catch { /* Continue editing if the device loses audio. */ }
}
