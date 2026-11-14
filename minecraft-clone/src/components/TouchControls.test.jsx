import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test, vi } from 'vitest';
import { TouchButton } from './TouchControls';
vi.mock('../hooks/useStore',()=>({useStore:vi.fn()}));

test('touch button executes once without a compatibility click, cancels safely and supports keyboard',()=>{
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  const host=document.createElement('div'),root=createRoot(host),action=vi.fn();
  act(()=>root.render(<TouchButton onClick={action}>설치</TouchButton>));
  const button=host.querySelector('button');
  button.setPointerCapture=vi.fn();
  button.getBoundingClientRect=()=>({left:0,right:100,top:0,bottom:100});
  const pointer=(type,id=1,x=50)=>act(()=>{
    const event=new Event(type,{bubbles:true,cancelable:true});
    Object.assign(event,{pointerType:'touch',pointerId:id,clientX:x,clientY:50});button.dispatchEvent(event);
  });
  try {
    pointer('pointerdown');pointer('pointerup');expect(action).toHaveBeenCalledTimes(1);
    act(()=>button.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1})));expect(action).toHaveBeenCalledTimes(1);
    pointer('pointerdown');pointer('pointercancel');pointer('pointerup');expect(action).toHaveBeenCalledTimes(1);
    pointer('pointerdown');pointer('pointerup',1,150);expect(action).toHaveBeenCalledTimes(1);
    act(()=>button.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:0})));expect(action).toHaveBeenCalledTimes(2);
  } finally {act(()=>root.unmount());delete globalThis.IS_REACT_ACT_ENVIRONMENT;}
});
