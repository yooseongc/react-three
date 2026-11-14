import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test, vi } from 'vitest';
import { useKeyboardControls } from './useKeyboardControls';
import { useStore } from './useStore';
vi.mock('./useStore',()=>({useStore:{getState:vi.fn(),subscribe:()=>()=>{}}}));
test('exploration keeps movement and flight, gates editing, and B toggles once per press',()=>{
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const state={playing:true,buildMode:false,texture:'dirt',palettePage:0,undoEdit:vi.fn(),redoEdit:vi.fn(),setTexture:vi.fn(),changePage:vi.fn(),toggleFlight:vi.fn()};
 state.toggleBuildMode=vi.fn(()=>{state.buildMode=!state.buildMode;});
 useStore.getState.mockReturnValue(state);
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);let input;
 function Probe(){input=useKeyboardControls();return null;}
 const key=(code,options={})=>document.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true,...options}));
 try {
 act(()=>root.render(<Probe/>));
 key('KeyW');key('Space');key('KeyF');key('Digit2');key('KeyQ');key('KeyZ',{ctrlKey:true});
 document.dispatchEvent(new WheelEvent('wheel',{deltaY:1}));
 expect(input.current.forward).toBe(true);expect(input.current.jump).toBe(true);expect(state.toggleFlight).toHaveBeenCalledOnce();
 expect(state.setTexture).not.toHaveBeenCalled();expect(state.changePage).not.toHaveBeenCalled();expect(state.undoEdit).not.toHaveBeenCalled();
 key('KeyB');key('KeyB',{repeat:true});expect(state.buildMode).toBe(true);expect(state.toggleBuildMode).toHaveBeenCalledOnce();
 key('KeyZ',{ctrlKey:true});key('KeyY',{ctrlKey:true});key('Digit2');
 expect(state.undoEdit).toHaveBeenCalledOnce();expect(state.redoEdit).toHaveBeenCalledOnce();expect(state.setTexture).toHaveBeenCalledOnce();
 key('KeyB');expect(state.buildMode).toBe(false);
 state.playing=false;key('KeyB');expect(state.buildMode).toBe(false);
 state.playing=true;const field=document.createElement('input');host.append(field);field.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyB',bubbles:true}));expect(state.buildMode).toBe(false);
 } finally {act(()=>root.unmount());host.remove();delete globalThis.IS_REACT_ACT_ENVIRONMENT;}
});
