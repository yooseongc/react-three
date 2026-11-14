import { useStore } from '../hooks/useStore';
import { formatTime, worldClock } from '../game/daylight';
export default function Settings() {
  const state=useStore();
  return <div className="settings-panel">
    <label>마우스 감도 <output>{state.sensitivity.toFixed(2)}×</output>
      <input aria-label="마우스 감도" type="range" min="0.25" max="2" step="0.05" value={state.sensitivity} onChange={e=>state.updateSettings({sensitivity:Number(e.target.value)})} /></label>
    <label><input type="checkbox" checked={state.soundEnabled} onChange={e=>state.updateSettings({soundEnabled:e.target.checked})} /> 효과음</label>
    <label><input type="checkbox" checked={state.shadows} onChange={e=>state.updateSettings({shadows:e.target.checked})} /> 그림자</label>
    <label><input type="checkbox" checked={state.showMinimap} onChange={e=>state.updateSettings({showMinimap:e.target.checked})} /> 미니맵</label>
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
