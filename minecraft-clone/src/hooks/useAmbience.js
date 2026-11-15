import { undergroundState } from '../game/underground';
import { useEffect } from 'react';
import { useStore } from './useStore';
import { ensureAmbience, setAmbience } from '../game/ambience';
import { worldClock } from '../game/daylight';
import { weatherState } from '../game/weather';

export function useAmbience() {
  useEffect(()=>{
    const silence=()=>setAmbience({},0,false);
    const hide=()=>{if(document.hidden)silence();};
    const unsubscribe=useStore.subscribe(state=>{if(!state.playing || !state.ambienceEnabled)silence();});
    window.addEventListener('blur',silence);
    document.addEventListener('visibilitychange',hide);
    const timer=setInterval(()=>{
      const state=useStore.getState();
      const audible=state.playing && state.ambienceEnabled && !document.hidden;
      if(audible)ensureAmbience();
      setAmbience({hour:worldClock.hour,weather:weatherState.current,sheltered:weatherState.sheltered,underground:undergroundState.inside},state.ambienceVolume,audible);
    },100);
    return ()=>{
      clearInterval(timer);unsubscribe();window.removeEventListener('blur',silence);
      document.removeEventListener('visibilitychange',hide);silence();
    };
  },[]);
}
