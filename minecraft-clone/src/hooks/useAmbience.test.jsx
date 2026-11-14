import React, { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test, vi } from 'vitest';
import { useAmbience } from './useAmbience';
import { useStore } from './useStore';
import { setAmbience } from '../game/ambience';

vi.mock('./useStore',()=>({useStore:{subscribe:vi.fn(()=>vi.fn()),getState:()=>({playing:false,ambienceEnabled:true,ambienceVolume:.45})}}));
vi.mock('../game/ambience',()=>({ensureAmbience:vi.fn(),setAmbience:vi.fn()}));
afterEach(()=>{vi.restoreAllMocks();vi.useRealTimers();delete globalThis.IS_REACT_ACT_ENVIRONMENT;});
test('StrictMode remount and final unmount release audio subscriptions, listeners and timer',()=>{
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;vi.useFakeTimers();
  const add=vi.spyOn(window,'addEventListener'),remove=vi.spyOn(window,'removeEventListener');
  const host=document.createElement('div');document.body.append(host);
  const root=createRoot(host);
  function Probe(){useAmbience();return null;}
  act(()=>root.render(<StrictMode><Probe /></StrictMode>));
  act(()=>vi.advanceTimersByTime(200));
  act(()=>root.unmount());host.remove();
  expect(useStore.subscribe).toHaveBeenCalled();
  for(const {value:unsubscribe} of useStore.subscribe.mock.results)expect(unsubscribe).toHaveBeenCalledTimes(1);
  for(const [event,handler] of add.mock.calls.filter(([event])=>event==='blur'))expect(remove).toHaveBeenCalledWith(event,handler);
  expect(setAmbience).toHaveBeenLastCalledWith({},0,false);
  expect(vi.getTimerCount()).toBe(0);
});
