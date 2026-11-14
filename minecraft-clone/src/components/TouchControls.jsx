import { useEffect, useRef } from 'react';
import { useStore } from '../hooks/useStore';
import { clearTouchInput, stickAxes, touchInput } from '../game/touch';

// Touch releases work even while another finger is holding the movement stick.
export function TouchButton({onClick,disabled,...props}) {
  const pointer=useRef(null),lastTouch=useRef(-Infinity);
  return <button {...props} disabled={disabled} onPointerDown={e=>{
    if(e.pointerType!=='touch' || disabled || pointer.current!==null)return;
    e.preventDefault();pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);
  }} onPointerUp={e=>{
    if(pointer.current!==e.pointerId)return;pointer.current=null;e.preventDefault();lastTouch.current=performance.now();
    const r=e.currentTarget.getBoundingClientRect();
    if(!disabled && e.clientX>=r.left && e.clientX<=r.right && e.clientY>=r.top && e.clientY<=r.bottom)onClick?.(e);
  }} onPointerCancel={()=>{pointer.current=null;}} onLostPointerCapture={()=>{pointer.current=null;}}
    onClick={e=>{if(e.detail && performance.now()-lastTouch.current<700)return;onClick?.(e);}} />;
}

function HoldButton({name,children}) {
  const pointer=useRef(null);
  const release=e=>{if(pointer.current!==e.pointerId)return;pointer.current=null;touchInput[name]=false;};
  return <button aria-label={children} onPointerDown={e=>{
    if(pointer.current!==null)return;e.preventDefault();pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);
    touchInput[name]=true;if(name==='ascend')touchInput.jump=true;
  }} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>{children}</button>;
}
export default function TouchControls() {
  const state=useStore();
  const stick=useRef(null),look=useRef(null),knob=useRef();
  useEffect(()=>{
    const reset=()=>{stick.current=null;look.current=null;clearTouchInput();if(knob.current)knob.current.style.transform='translate(0px,0px)';};
    const pause=()=>{reset();useStore.getState().setPlaying(false);if(useStore.getState().dirty)useStore.getState().saveWorld();};
    window.addEventListener('resize',pause);
    window.addEventListener('blur',pause);
    const hide=()=>{if(document.hidden)pause();};
    document.addEventListener('visibilitychange',hide);
    return()=>{reset();window.removeEventListener('resize',pause);window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',hide);};
  },[]);
  const moveStick=e=>{
    if(stick.current!==e.pointerId)return;
    const r=e.currentTarget.getBoundingClientRect();const dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;
    const axes=stickAxes(dx,dy);Object.assign(touchInput,axes);
    knob.current.style.transform=`translate(${axes.moveRight*36}px,${-axes.moveForward*36}px)`;
  };
  const releaseStick=e=>{if(stick.current!==e.pointerId)return;stick.current=null;touchInput.moveForward=touchInput.moveRight=0;knob.current.style.transform='translate(0px,0px)';};
  const releaseLook=e=>{if(look.current?.id===e.pointerId)look.current=null;};
  const action=button=>window.dispatchEvent(new CustomEvent('voxel-action',{detail:button}));
  return <div className="touch-controls">
    <div className="touch-look" aria-label="시점 드래그 영역" onPointerDown={e=>{if(look.current)return;e.preventDefault();look.current={id:e.pointerId,x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}}
      onPointerMove={e=>{const p=look.current;if(p?.id!==e.pointerId)return;touchInput.lookX+=e.clientX-p.x;touchInput.lookY+=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;}}
      onPointerUp={releaseLook} onPointerCancel={releaseLook} onLostPointerCapture={releaseLook} />
    <div className="touch-stick" role="group" aria-label="이동 스틱" onPointerDown={e=>{if(stick.current!==null)return;e.preventDefault();stick.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);moveStick(e);}}
      onPointerMove={moveStick} onPointerUp={releaseStick} onPointerCancel={releaseStick} onLostPointerCapture={releaseStick}><span ref={knob}>이동</span></div>
    <div className="touch-toolbar">
      <TouchButton onClick={()=>{state.setPlaying(false);if(state.dirty)state.saveWorld();}}>메뉴</TouchButton>
      <TouchButton aria-label="실행 취소" disabled={!state.undoStack.length} onClick={()=>state.undoEdit()}>취소</TouchButton>
      <TouchButton aria-label="다시 실행" disabled={!state.redoStack.length} onClick={()=>state.redoEdit()}>재실행</TouchButton>
      <TouchButton aria-pressed={state.flying} onClick={state.toggleFlight}>비행</TouchButton>
    </div>
    <div className="touch-actions">
      <TouchButton onClick={()=>action(1)}>집기</TouchButton><HoldButton name="ascend">{state.flying?'상승':'점프'}</HoldButton>
      <TouchButton className="touch-destroy" onClick={()=>action(0)}>파괴</TouchButton><TouchButton onClick={()=>action(2)}>설치</TouchButton>
      {state.flying && <HoldButton name="descend">하강</HoldButton>}
    </div>
  </div>;
}
