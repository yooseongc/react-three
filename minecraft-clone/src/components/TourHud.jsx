import { EVENT_LABELS } from '../game/weatherEvents';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { activeMap, MAP_TYPES,latestGenerator } from '../game/mapConfig';
import { tourReturnQuery, tourView } from '../game/tour';
import { chooseTourScene, advanceScene } from '../game/tourScenes';
import { randomSeed } from '../game/mapCatalog';
import { replaceTourLandscape } from '../game/landscape';
import { createVoxelWorld } from '../game/voxels';
import { weatherState, WEATHER_LABELS } from '../game/weather';
import { worldClock, formatTime } from '../game/daylight';
import { unlockAudio } from '../game/feedback';
import NowPlaying from './NowPlaying';

export default function TourHud(){
 const state=useStore(),[name,setName]=useState(''),[fading,setFading]=useState(false),[started,setStarted]=useState(false),[error,setError]=useState(''),[clock,setClock]=useState(()=>formatTime(worldClock.hour));
 const [event,setEvent]=useState('');
 const timer=useRef(),busy=useRef(false),elapsed=useRef(0),deck=useRef([]),nextRef=useRef();
 const next=()=>{
  if(busy.current)return;busy.current=true;setFading(true);setError('');
  timer.current=setTimeout(()=>{
   try {
    const current=useStore.getState(),choice=chooseTourScene(current.tourScene,deck.current),seed=randomSeed();deck.current=choice.remaining;
    const terrain=replaceTourLandscape(seed,{mapType:choice.mapType,size:activeMap.size,generator:latestGenerator(choice.mapType)});
    const world=createVoxelWorld(terrain.cubes);
    // Set the shot's atmosphere under the fade; music chooses its matching track.
    Object.assign(weatherState,{current:choice.weather,cloud:{clear:0,cloudy:.75,rain:1,fog:.45,snow:.85}[choice.weather],rain:choice.weather==='rain'?1:0,wet:choice.weather==='rain'?1:0,fog:choice.weather==='fog'?1:0,snow:choice.weather==='snow'?1:0});
    worldClock.hour=choice.hour;tourView.name='';
    useStore.setState({world,cubes:terrain.cubes,ready:false,tourRevision:current.tourRevision+1,tourScene:choice,weatherMode:choice.weather,timeOfDay:choice.hour,dirty:false,undoStack:[],redoStack:[]});
    elapsed.current=0;
    // The next animation frames allow replacement meshes to render behind the fade.
    timer.current=setTimeout(()=>{busy.current=false;setFading(false);},500);
   } catch {busy.current=false;setFading(false);useStore.getState().setPlaying(false);setError('다음 풍경을 준비하지 못했습니다. 다시 시도해주세요.');}
  },400);
 };
 nextRef.current=next;
 useEffect(()=>{
  let previous=performance.now();
  const poll=setInterval(()=>{
   const now=performance.now(),s=useStore.getState();
   elapsed.current=advanceScene(elapsed.current,(now-previous)/1000,s.playing&&!busy.current,document.hidden);previous=now;
   setEvent(weatherState.event||'');setName(tourView.name);setClock(formatTime(worldClock.hour));
   if(elapsed.current>=(s.tourScene?.duration||45))nextRef.current();
  },100);
  const pause=()=>useStore.getState().setPlaying(false);
  const hidden=()=>{if(document.hidden)pause();};
  const key=e=>{if(e.code==='Escape')pause();};
  window.addEventListener('blur',pause);document.addEventListener('visibilitychange',hidden);document.addEventListener('keydown',key);
  return()=>{clearInterval(poll);clearTimeout(timer.current);window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',hidden);document.removeEventListener('keydown',key);};
 },[]);
 const resume=()=>{unlockAudio();setStarted(true);state.setPlaying(true);};
 return <div className="tour-hud" data-scene={state.tourRevision} data-weather={state.tourScene?.weather} data-hour={state.tourScene?.hour}>
  <div className={'tour-fade'+(fading?' active':'')} aria-hidden="true" />
  <div className="tour-title"><span>VOXEL GARDEN · 풍경 감상</span><h1>{MAP_TYPES[activeMap.mapType]}</h1><small>{clock} · {WEATHER_LABELS[state.tourScene?.weather]}{event?' · '+EVENT_LABELS[event]:''} · 풍경 자동 전환</small></div>
  {state.playing && <div key={state.tourRevision+name} className="tour-place">{name}</div>}
  {!state.playing && <div className="tour-pause"><p>{started?'잠시 머무는 풍경':'바람이 이끄는 대로.'}</p><button className="primary" disabled={!state.ready||fading} onClick={resume}>{!state.ready?'풍경 준비 중…':started?'감상 계속':'감상 시작'}</button>{!started&&<small>맵·시간·날씨가 바뀌는 작은 여행</small>}{error&&<small role="alert">{error}</small>}</div>}
  <div className="tour-toolbar" role="group" aria-label="풍경 감상 조작">
   <button onClick={()=>state.playing?state.setPlaying(false):resume()} disabled={!state.ready||fading}>{state.playing?'일시정지':'재생'}</button>
   <button onClick={next} disabled={!state.ready||fading}>다음 풍경</button>
   <button aria-pressed={state.ambienceEnabled} onClick={()=>{unlockAudio();state.updateSettings({ambienceEnabled:!state.ambienceEnabled});}}>음악 {state.ambienceEnabled?'켜짐':'꺼짐'}</button>
   <button onClick={()=>window.location.assign(tourReturnQuery(window.location.search))}>감상 종료</button>
  </div>
  <NowPlaying panel />
 </div>;
}
