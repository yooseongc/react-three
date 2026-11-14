import { useEffect, useRef, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { activeMap, MAP_TYPES } from '../game/mapConfig';
import { tourReturnQuery, tourView } from '../game/tour';
import { unlockAudio } from '../game/feedback';
import NowPlaying from './NowPlaying';

export default function TourHud(){
 const state=useStore(),[name,setName]=useState(''),[fading,setFading]=useState(false),[started,setStarted]=useState(false);
 const timer=useRef();
 useEffect(()=>{
  const poll=setInterval(()=>setName(tourView.name),500);
  const pause=()=>useStore.getState().setPlaying(false);
  const hidden=()=>{if(document.hidden)pause();};
  const key=e=>{if(e.code==='Escape')pause();};
  window.addEventListener('blur',pause);document.addEventListener('visibilitychange',hidden);document.addEventListener('keydown',key);
  return()=>{clearInterval(poll);clearTimeout(timer.current);window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',hidden);document.removeEventListener('keydown',key);};
 },[]);
 const resume=()=>{unlockAudio();setStarted(true);state.setPlaying(true);};
 const next=()=>{setFading(true);timer.current=setTimeout(()=>{tourView.seek++;timer.current=setTimeout(()=>setFading(false),120);},300);};
 return <div className="tour-hud">
  <div className={'tour-fade'+(fading?' active':'')} aria-hidden="true" />
  <div className="tour-title"><span>VOXEL GARDEN · 풍경 감상</span><h1>{MAP_TYPES[activeMap.mapType]}</h1></div>
  {state.playing && <div key={name} className="tour-place">{name}</div>}
  {!state.playing && <div className="tour-pause"><p>{started?'잠시 머무는 풍경':'바람이 이끄는 대로.'}</p><button className="primary" disabled={!state.ready} onClick={resume}>{!state.ready?'풍경 준비 중…':started?'감상 계속':'감상 시작'}</button>{!started&&<small>랜덤으로 만든 임시 월드 · 기존 저장은 그대로</small>}</div>}
  <div className="tour-toolbar" role="group" aria-label="풍경 감상 조작">
   <button onClick={()=>state.playing?state.setPlaying(false):resume()} disabled={!state.ready}>{state.playing?'일시정지':'재생'}</button>
   <button onClick={next} disabled={!state.ready||fading}>다음 풍경</button>
   <button aria-pressed={state.ambienceEnabled} onClick={()=>{unlockAudio();state.updateSettings({ambienceEnabled:!state.ambienceEnabled});}}>음악 {state.ambienceEnabled?'켜짐':'꺼짐'}</button>
   <button onClick={()=>window.location.assign(tourReturnQuery(window.location.search))}>감상 종료</button>
  </div>
  <NowPlaying panel />
 </div>;
}
