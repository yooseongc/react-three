import { useEffect, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { BLOCK_LABELS, BLOCK_TYPES, BLOCK_COLORS } from '../game/world';
import { unlockAudio } from '../game/feedback';
import dirt from '../images/dirt.jpg';
import grass from '../images/grass.jpg';
import glass from '../images/glass.png';
import wood from '../images/wood.png';
import log from '../images/log.jpg';
import Minimap from './Minimap';
import PerformancePanel from './PerformancePanel';
import { landscape, landscapeSeed } from '../game/landscape';
import WorldManager from './WorldManager';
import Settings from './Settings';
import WorldTime from './WorldTime';
import PlacementHint from './PlacementHint';
import SaveStatus from './SaveStatus';
import TouchControls, { TouchButton } from './TouchControls';
import { activeMap, MAP_TYPES } from '../game/mapConfig';
import { RECENT_KEY, safeWorldQuery } from '../game/transfer';
import ControlsGuide from './ControlsGuide';
import CurrentWorld from './CurrentWorld';

const icons = [dirt, grass, glass, wood, log];
export default function Hud() {
  const state = useStore();
  const [started, setStarted] = useState(false);
  const [tab, setTab] = useState('play');
  useEffect(() => {
    if (state.playing) setStarted(true);
  }, [state.playing]);
  const start = async () => {
    state.setControlError('');
    if (state.soundEnabled || state.ambienceEnabled) unlockAudio();
    try {
      const canvas = document.querySelector('canvas');
      if (state.touchMode) state.setPlaying(true);
      else {
        if (!canvas?.requestPointerLock) throw new Error('unsupported');
        await canvas.requestPointerLock();
      }
      const query = safeWorldQuery(window.location.search || '?');
      if (query) { try { localStorage.setItem(RECENT_KEY, query); } catch { /* Play without recent-world persistence. */ } }
    } catch {
      state.setControlError('마우스 잠금을 사용할 수 없습니다. 데스크톱 브라우저에서 다시 시도해주세요.');
    }
  };
  return <div className={'hud' + (state.playing ? '' : ' is-paused') + (state.touchMode ? ' touch-mode' : '')}>
    {state.touchMode && state.playing && <TouchControls />}
    <header className="status-bar">
      <div><strong>VOXEL GARDEN</strong><span>{landscape ? `${MAP_TYPES[activeMap.mapType]} · ${landscapeSeed}` : '작은 건축 연습장'}</span></div>
      <SaveStatus dirty={state.dirty} canSave={state.canSave} saveStatus={state.saveStatus} saveRevision={state.saveRevision} />
    </header>
    {state.showMinimap && <Minimap />}
    <WorldTime />
    <PerformancePanel />
    {state.playing && state.buildMode && <PlacementHint />}
    {state.playing && state.buildMode && <div className="history-hint" role="status">{state.historyNotice || `Ctrl+Z 취소 ${state.undoStack.length} · Ctrl+Y 다시 실행 ${state.redoStack.length}`}</div>}
    {state.buildMode && <div className="build-status">{state.flying ? '비행 중 · Space 상승 / C 하강' : '걷는 중 · F 비행 전환'} · {BLOCK_LABELS[BLOCK_TYPES.indexOf(state.texture)]}</div>}
    {state.playing && state.buildMode && <div className="crosshair" aria-hidden="true">+</div>}
    {state.buildMode && <div className="hotbar" aria-label="블록 선택">
      <TouchButton className="palette-switch" aria-label="재료 페이지 전환" onClick={state.changePage}>{state.touchMode?'재료':'Q / E'}<br />{state.palettePage + 1} / {Math.ceil(BLOCK_TYPES.length/6)}</TouchButton>
      {BLOCK_TYPES.slice(state.palettePage * 6, state.palettePage * 6 + 6).map((type, slot) => {
        const i = state.palettePage * 6 + slot;
        return <TouchButton key={type} aria-label={BLOCK_LABELS[i]}
        aria-pressed={state.texture === type} onClick={() => state.setTexture(type)}>
        <kbd>{slot + 1}</kbd>{icons[i] ? <img src={icons[i]} alt="" /> : <span className={'material-swatch ' + type} style={{ backgroundColor: BLOCK_COLORS[i] }} />}<span>{BLOCK_LABELS[i]}</span>
      </TouchButton>; })}
    </div>}
    {state.playing && !state.touchMode && <div className="mode-badge" role="status">{state.buildMode ? '건축 모드 · B 탐험으로' : '탐험 모드 · B 건축하기'}</div>}
    <div className="controls-hint">WASD 이동 · Shift 가속 · F 비행 · Space 점프/상승 · C 하강{state.buildMode && ' · 좌/우클릭 파괴/설치 · 1–6 재료 · Q/E 페이지 · 휠 선택'} · ESC</div>
    {!state.playing && <div className="menu-backdrop"><section className={'menu menu-'+tab} role="dialog" aria-modal="true" aria-label="게임 메뉴" onKeyDown={event=>{
      if(event.key!=='Tab')return;
      const items=[...event.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled), select, summary, a[href], [tabindex="0"]')].filter(el=>el.offsetParent!==null);
      const first=items[0],last=items.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }}>
      <header className="menu-heading"><div><span className="eyebrow">VOXEL GARDEN</span><h1>{tab==='play'?'잠시 쉬어가기':tab==='world'?'월드':'설정'}</h1></div>
        {tab!=='play'&&<button className="resume-button" disabled={!state.ready} onClick={start}>{started?'계속하기':'산책 시작'} <span aria-hidden="true">↗</span></button>}
      </header>
      <nav className="menu-tabs" aria-label="메뉴 구분">
        {[['play','플레이'],['world','월드'],['settings','설정']].map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}
      </nav>
      <div className="menu-content">
        {tab==='world'&&<WorldManager />}
        {tab==='settings'&&<Settings />}
        {tab==='play'&&<div className="pause-rest"><p>바람이 머무는 곳에, 나의 작은 하루.</p><CurrentWorld /><button className="primary" disabled={!state.ready} onClick={start}>{!state.ready?'월드 준비 중…':started?'계속하기':'산책 시작'}</button><ControlsGuide touchMode={state.touchMode} /></div>}
      </div>
      {state.notice&&<p className="notice" role="status">{state.notice}</p>}
      {state.controlError&&<p className="notice" role="alert">{state.controlError}</p>}
    </section></div>}
  </div>;
}
