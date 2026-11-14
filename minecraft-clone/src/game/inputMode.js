export function detectTouchMode(media=window.matchMedia?.bind(window),points=navigator.maxTouchPoints||0){
  return !!media?.('(pointer: coarse)').matches || (points>0&&!media?.('(pointer: fine)').matches);
}
export function resolveTouchMode(mode){return mode==='touch'||(mode==='auto'&&detectTouchMode());}
