import { activeMap } from '../game/mapConfig';
import { climateFor } from '../game/climate';
import { useStore } from '../hooks/useStore';
import { formatTime, worldClock } from '../game/daylight';
import { WEATHER_LABELS } from '../game/weather';
import { useEffect, useState } from 'react';
import { ambienceStatus, retryAmbience } from '../game/ambience';
import { musicTracks } from '../game/music';
import NowPlaying from './NowPlaying';
const SECTIONS=[['scene','시간과 날씨'],['audio','소리'],['display','화면과 조작']];
export default function Settings() {
  const state=useStore(),[section,setSection]=useState('scene');
  const [audioError,setAudioError]=useState(ambienceStatus.error);
  useEffect(()=>{const timer=setInterval(()=>setAudioError(ambienceStatus.error),500);return()=>clearInterval(timer);},[]);
  const toggle=(key,label)=><label className="setting-toggle"><span>{label}</span><input type="checkbox" checked={state[key]} onChange={e=>state.updateSettings({[key]:e.target.checked})} /></label>;
  return <div className="settings-panel">
    <nav className="section-tabs" aria-label="설정 분류">{SECTIONS.map(([id,label])=><button key={id} aria-pressed={section===id} onClick={()=>setSection(id)}>{label}</button>)}</nav>
    {section==='scene'&&<div className="settings-grid">
      <section className="setting-card"><span className="eyebrow">LIGHT</span><h2>시간</h2>
        <label className="setting-toggle"><span>낮밤 자동 순환</span><input type="checkbox" checked={state.dayCycle} onChange={e=>state.updateSettings({dayCycle:e.target.checked,timeOfDay:worldClock.hour})} /></label>
        <small>하루 12분</small>
        <label>시간 <output>{formatTime(state.dayCycle?worldClock.hour:state.timeOfDay)}</output><input aria-label="시간 고정" type="range" min="0" max="23.75" step="0.25" value={state.timeOfDay} onChange={e=>state.updateSettings({timeOfDay:Number(e.target.value),dayCycle:false})} /></label>
        <div className="time-presets">{[['일출',6],['한낮',12],['노을',18],['밤',0]].map(([label,hour])=><button key={label} onClick={()=>state.updateSettings({timeOfDay:hour,dayCycle:false})}>{label}</button>)}</div>
      </section>
      <section className="setting-card"><span className="eyebrow">WEATHER</span><h2>날씨</h2>
        <label htmlFor="weather-mode">날씨</label><select id="weather-mode" value={state.weatherMode} onChange={e=>state.updateSettings({weatherMode:e.target.value})}>{Object.entries(WEATHER_LABELS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
        <small>{state.weatherMode==='auto' ? `${climateFor(activeMap.mapType).name} · ${climateFor(activeMap.mapType).description}. 맵과 시간대에 따라 천천히 달라집니다.` : '선택한 날씨를 유지합니다. 자동으로 바꾸면 이 맵의 기후를 따릅니다.'}</small>
        {toggle('landscapeMotion','물결과 바람')}{toggle('showWildlife','동물')}
      </section>
    </div>}
    {section==='audio'&&<div className="settings-grid">
      <section className="setting-card"><span className="eyebrow">SOUND</span><h2>배경음과 효과음</h2>{toggle('ambienceEnabled','배경음악')}
        <label>음량 <output>{Math.round(state.ambienceVolume*100)}%</output><input aria-label="배경음 음량" type="range" min="0" max="1" step="0.05" value={state.ambienceVolume} onChange={e=>state.updateSettings({ambienceVolume:Number(e.target.value)})} /></label>
        <small>시간과 날씨에 맞춰 흐르는 20곡.</small>{toggle('soundEnabled','블록 효과음')}
        {audioError&&<p className="notice" role="status">{audioError} <button onClick={()=>retryAmbience()}>다시 불러오기</button></p>}
      </section>
      <section className="setting-card"><span className="eyebrow">CREDITS</span><h2>현재 음악</h2><NowPlaying panel /><p className="section-description">CC0 · 20곡</p><div className="music-credits" tabIndex={0} aria-label="음악 출처 목록">{musicTracks.map(t=><p key={t.localPath}><a href={t.source} target="_blank" rel="noreferrer">{t.title}</a><span>{t.artist}</span></p>)}</div></section>
    </div>}
    {section==='display'&&<div className="settings-grid">
      <section className="setting-card"><span className="eyebrow">VIEW</span><h2>화면</h2>{toggle('shadows','그림자')}{toggle('showMinimap','미니맵')}</section>
      <section className="setting-card"><span className="eyebrow">CONTROL</span><h2>조작</h2><label htmlFor="input-mode">조작 방식</label><select id="input-mode" value={state.inputMode} onChange={e=>state.setInputMode(e.target.value)}><option value="auto">자동 감지</option><option value="touch">터치</option><option value="keyboard">키보드·마우스</option></select><small>현재: {state.touchMode?'터치':'키보드·마우스'}{state.inputMode==='auto'?' · 기기에 맞춰 자동 전환':' · 직접 선택'}</small>
        <label>마우스 감도 <output>{state.sensitivity.toFixed(2)}×</output><input aria-label="마우스 감도" type="range" min="0.25" max="2" step="0.05" value={state.sensitivity} onChange={e=>state.updateSettings({sensitivity:Number(e.target.value)})} /></label>
      </section>
    </div>}
    {state.settingsNotice&&<p className="notice" role="status">{state.settingsNotice}</p>}
  </div>;
}
