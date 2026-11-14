import { useStore } from '../hooks/useStore';
export default function Settings() {
  const state=useStore();
  return <div className="settings-panel">
    <label>마우스 감도 <output>{state.sensitivity.toFixed(2)}×</output>
      <input aria-label="마우스 감도" type="range" min="0.25" max="2" step="0.05" value={state.sensitivity} onChange={e=>state.updateSettings({sensitivity:Number(e.target.value)})} /></label>
    <label><input type="checkbox" checked={state.soundEnabled} onChange={e=>state.updateSettings({soundEnabled:e.target.checked})} /> 효과음</label>
    <label><input type="checkbox" checked={state.shadows} onChange={e=>state.updateSettings({shadows:e.target.checked})} /> 그림자</label>
    <label><input type="checkbox" checked={state.showMinimap} onChange={e=>state.updateSettings({showMinimap:e.target.checked})} /> 미니맵</label>
    <p>화면이 느리면 그림자를 꺼보세요. 설정은 이 브라우저에 저장됩니다.</p>
    {state.settingsNotice && <p className="notice" role="status">{state.settingsNotice}</p>}
  </div>;
}
