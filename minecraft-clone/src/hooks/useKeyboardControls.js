import { useEffect, useRef } from 'react';
import { useStore } from './useStore';
import { BLOCK_TYPES } from '../game/world';

const keys = { KeyW: 'forward', KeyS: 'backward', KeyA: 'left', KeyD: 'right', ShiftLeft: 'sprint', ShiftRight: 'sprint' };
export const useKeyboardControls = () => {
  const input = useRef({});
  useEffect(() => {
    const clear = () => { input.current = {}; };
    const down = event => {
      if (!useStore.getState().playing) return;
      if (keys[event.code] || event.code === 'Space') event.preventDefault();
      if (keys[event.code]) input.current[keys[event.code]] = true;
      if (event.code === 'Space' && !event.repeat) input.current.jump = true;
      const slot = Number(event.code.replace('Digit', '')) - 1;
      if (BLOCK_TYPES[slot]) useStore.getState().setTexture(BLOCK_TYPES[slot]);
    };
    const up = event => { if (keys[event.code]) input.current[keys[event.code]] = false; };
    document.addEventListener('keydown', down);
    document.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', clear);
    const unsubscribe = useStore.subscribe(state => { if (!state.playing) clear(); });
    return () => {
      document.removeEventListener('keydown', down);
      document.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', clear);
      unsubscribe();
    };
  }, []);
  return input;
};
