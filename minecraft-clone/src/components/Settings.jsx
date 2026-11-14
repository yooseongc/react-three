import { useStore } from '../hooks/useStore';
import { formatTime, worldClock } from '../game/daylight';
import { WEATHER_LABELS } from '../game/weather';
import { useEffect, useState } from 'react';
import { ambienceStatus, retryAmbience } from '../game/ambience';
export default function Settings() {
  const state=useStore();
  const [audioError,setAudioError]=useState(ambienceStatus.error);
  useEffect(()=>{const timer=setInterval(()=>setAudioError(ambienceStatus.error),500);return()=>clearInterval(timer);},[]);
  return <div className="settings-panel">
    <label><input type="checkbox" checked={state.touchMode} onChange={e=>state.setTouchMode(e.target.checked)} /> 터치 조작</label>
    <p>휴대폰은 터치 조작으로 시작합니다. 왼쪽 스틱으로 이동하고 오른쪽 화면을 드래그해 둘러보세요. 설치·파괴는 버튼을 눌러 실행합니다. 느리면 그림자를 꺼보세요.</p>
    <label>마우스 감도 <output>{state.sensitivity.toFixed(2)}×</output>
      <input aria-label="마우스 감도" type="range" min="0.25" max="2" step="0.05" value={state.sensitivity} onChange={e=>state.updateSettings({sensitivity:Number(e.target.value)})} /></label>
    <label><input type="checkbox" checked={state.soundEnabled} onChange={e=>state.updateSettings({soundEnabled:e.target.checked})} /> 효과음</label>
    <label><input type="checkbox" checked={state.shadows} onChange={e=>state.updateSettings({shadows:e.target.checked})} /> 그림자</label>
    <label><input type="checkbox" checked={state.showMinimap} onChange={e=>state.updateSettings({showMinimap:e.target.checked})} /> 미니맵</label>
    <label><input type="checkbox" checked={state.showWildlife} onChange={e=>state.updateSettings({showWildlife:e.target.checked})} /> 작은 생태계 · 토끼·오리·여우·양</label>
    <p>숲 월드의 풀밭과 물가를 살펴보세요. 가까이 가면 동물이 피하고, 밤이나 비·눈이 오는 날에는 더 자주 쉽니다. 메뉴에서는 움직임이 멈춥니다.</p>
    <label><input type="checkbox" checked={state.landscapeMotion} onChange={e=>state.updateSettings({landscapeMotion:e.target.checked})} /> 풍경 움직임 · 물결과 바람</label>
    <p>물결·풀·잎·구름·안개가 움직입니다. 움직임이 불편하면 꺼보세요. 낮밤 순환과는 별도이며 메뉴에서는 멈춥니다.</p>
    <hr />
    <label htmlFor="weather-mode">날씨</label>
    <select id="weather-mode" value={state.weatherMode} onChange={e=>state.updateSettings({weatherMode:e.target.value})}>
      {Object.entries(WEATHER_LABELS).map(([value,label])=><option key={value} value={value}>{label}</option>)}
    </select>
    <p>자동은 플레이 시간 3~6분마다 맑음·흐림·비·안개·눈을 오갑니다. 비와 눈은 흐림을 거쳐 전환됩니다. 메뉴에서는 멈추며, 개별 날씨를 선택하면 고정됩니다.</p>
    <label><input type="checkbox" checked={state.ambienceEnabled} onChange={e=>state.updateSettings({ambienceEnabled:e.target.checked})} /> ASMR 배경음</label>
    <label>배경음 음량 <output>{Math.round(state.ambienceVolume*100)}%</output>
      <input aria-label="배경음 음량" type="range" min="0" max="1" step="0.05" value={state.ambienceVolume} onChange={e=>state.updateSettings({ambienceVolume:Number(e.target.value)})} /></label>
    <p>날씨에 어울리는 부드러운 공간감이 배경에 흐릅니다. 밤과 실내에서는 더 잔잔해집니다. 블록 효과음과 별도로 조절하며 플레이 중에만 재생됩니다.</p>
    {audioError && <p className="notice" role="status">{audioError} <button onClick={()=>retryAmbience()}>배경음 다시 불러오기</button></p>}
    <p>안개는 먼 풍경을 감싸고, 눈은 천천히 흩날립니다. 눈은 쌓이지 않습니다. 맑아지면 젖은 표면이 천천히 마르며, 풍경 움직임을 끄면 비와 눈 입자를 숨깁니다.</p>
    <hr />
    <label><input type="checkbox" checked={state.dayCycle} onChange={e=>state.updateSettings({dayCycle:e.target.checked,timeOfDay:worldClock.hour})} /> 낮밤 자동 순환 · 하루 12분</label>
    <label>시간 고정 <output>{formatTime(state.timeOfDay)}</output>
      <input aria-label="시간 고정" type="range" min="0" max="23.75" step="0.25" value={state.timeOfDay} onChange={e=>state.updateSettings({timeOfDay:Number(e.target.value),dayCycle:false})} /></label>
    <div className="time-presets">{[['일출',6],['한낮',12],['노을',18],['밤',0]].map(([label,hour])=><button key={label} onClick={()=>state.updateSettings({timeOfDay:hour,dayCycle:false})}>{label}</button>)}</div>
    <p>시간을 선택하면 고정됩니다. 자동 순환은 플레이 중에만 흐르며 메뉴에서는 멈춥니다. 시간 설정은 모든 월드에 공통으로 적용됩니다.</p>
    <p>화면이 느리면 그림자를 꺼보세요. 설정은 이 브라우저에 저장됩니다.</p>
    {state.settingsNotice && <p className="notice" role="status">{state.settingsNotice}</p>}
  </div>;
}
