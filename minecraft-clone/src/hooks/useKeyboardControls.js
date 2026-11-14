import { useEffect, useRef } from 'react';
import { useStore } from './useStore';
import { BLOCK_TYPES } from '../game/world';

const keys = { KeyW: 'forward', KeyS: 'backward', KeyA: 'left', KeyD: 'right', ShiftLeft: 'sprint', ShiftRight: 'sprint', Space: 'ascend', KeyC: 'descend' };
export const useKeyboardControls = () => {
  const input = useRef({});
  useEffect(() => {
    const clear = () => { input.current = {}; };
    const down = event => {
      if (!useStore.getState().playing) return;
      if (keys[event.code] || event.code === 'Space') event.preventDefault();
      if (keys[event.code]) input.current[keys[event.code]] = true;
      if (event.code === 'Space' && !event.repeat) input.current.jump = true;
      if (event.code === 'KeyF' && !event.repeat) useStore.getState().toggleFlight();
      if ((event.code === 'KeyQ' || event.code === 'KeyE') && !event.repeat) useStore.getState().changePage();
      const slot = Number(event.code.replace('Digit', '')) - 1;
      if (slot >= 0 && slot < 6) useStore.getState().setTexture(BLOCK_TYPES[useStore.getState().palettePage * 6 + slot]);
    };
    const wheel = event => {
      const state = useStore.getState();
      if (!state.playing || !event.deltaY) return;
      event.preventDefault();
      state.setTexture(BLOCK_TYPES[(BLOCK_TYPES.indexOf(state.texture) + Math.sign(event.deltaY) + BLOCK_TYPES.length) % BLOCK_TYPES.length]);
    };
    const up = event => { if (keys[event.code]) input.current[keys[event.code]] = false; };
    document.addEventListener('keydown', down);
    document.addEventListener('keyup', up);
    document.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', clear);
    const unsubscribe = useStore.subscribe(state => { if (!state.playing) clear(); });
    return () => {
      document.removeEventListener('keydown', down);
      document.removeEventListener('keyup', up);
      document.removeEventListener('wheel', wheel);
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', clear);
      unsubscribe();
    };
  }, []);
  return input;
};
