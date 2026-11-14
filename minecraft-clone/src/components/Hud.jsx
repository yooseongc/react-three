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
    {state.playing && <PlacementHint />}
    {state.playing && <div className="history-hint" role="status">{state.historyNotice || `Ctrl+Z 취소 ${state.undoStack.length} · Ctrl+Y 다시 실행 ${state.redoStack.length}`}</div>}
    <div className="build-status">{state.flying ? '비행 중 · Space 상승 / C 하강' : '걷는 중 · F 비행 전환'} · {BLOCK_LABELS[BLOCK_TYPES.indexOf(state.texture)]}</div>
    {state.playing && <div className="crosshair" aria-hidden="true">+</div>}
    <div className="hotbar" aria-label="블록 선택">
      <TouchButton className="palette-switch" aria-label="재료 페이지 전환" onClick={state.changePage}>{state.touchMode?'재료':'Q / E'}<br />{state.palettePage + 1} / {Math.ceil(BLOCK_TYPES.length/6)}</TouchButton>
      {BLOCK_TYPES.slice(state.palettePage * 6, state.palettePage * 6 + 6).map((type, slot) => {
        const i = state.palettePage * 6 + slot;
        return <TouchButton key={type} aria-label={BLOCK_LABELS[i]}
        aria-pressed={state.texture === type} onClick={() => state.setTexture(type)}>
        <kbd>{slot + 1}</kbd>{icons[i] ? <img src={icons[i]} alt="" /> : <span className={'material-swatch ' + type} style={{ backgroundColor: BLOCK_COLORS[i] }} />}<span>{BLOCK_LABELS[i]}</span>
      </TouchButton>; })}
    </div>
    <div className="controls-hint">WASD 이동 · Shift 가속 · F 비행 · Space 점프/상승 · C 하강 · 좌/우클릭 파괴/설치 · 1–6 재료 · Q/E 페이지 · 휠 선택 · ESC</div>
    {!state.playing && <div className="menu-backdrop"><section className="menu" aria-label="게임 메뉴">
      <span className="eyebrow">VOXEL GARDEN</span>
      <h1>{started ? '잠시 쉬어가기' : '작은 세계, 나만의 쉼터'}</h1>
      <nav className="menu-tabs" aria-label="메뉴 구분">
        {[['play','플레이'],['world','월드'],['settings','설정']].map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}
      </nav>
      {tab === 'world' && <WorldManager />}
      {tab === 'settings' && <Settings />}
      {tab === 'play' && <>
      <p>{landscape ? `${MAP_TYPES[activeMap.mapType]}에서 나만의 장소를 찾아보세요. 단차는 ${state.touchMode?'점프 버튼':'Space'}으로 넘을 수 있습니다.` : '잔디 위를 걷고, 블록을 쌓아보세요.'}<br />
        {landscape ? '물은 걸어서 건널 수 있는 얕은 수면입니다. 나무와 지형도 편집할 수 있습니다.' : '새로운 숲과 호수로 탐험을 떠나보세요.'}</p>
      <button className="save-button" onClick={()=>setTab('world')}>{landscape ? '다른 월드 / 파일 관리' : '숲 만들기 / 월드 이어하기'}</button>
      <details><summary>조작 안내</summary>{state.touchMode ? <p>왼쪽 스틱: 이동 · 오른쪽 화면 드래그: 둘러보기<br />점프/상승·하강: 누르고 있는 동안 조작<br />설치·파괴·집기: 중앙 조준점의 블록에 적용<br />비행: 걷기/비행 전환 · 취소/재실행: 건축 이력<br />아래 재료 선택 · 메뉴: 일시정지<br />화면 회전이나 다른 앱으로 이동하면 일시정지합니다.</p> : <dl><div><dt>W A S D</dt><dd>이동</dd></div><div><dt>SPACE</dt><dd>점프</dd></div>
        <div><dt>마우스 좌 / 우 / 가운데</dt><dd>파괴 / 설치 / 재료 집기</dd></div><div><dt>F · SPACE / C</dt><dd>비행 전환 · 상승 / 하강</dd></div>
        <div><dt>Q / E · 1–6</dt><dd>재료 페이지 · 슬롯 선택</dd></div><div><dt>휠 · ESC</dt><dd>재료 순환 · 일시정지</dd></div>
        <div><dt>Ctrl/Cmd + Z</dt><dd>실행 취소</dd></div><div><dt>Ctrl/Cmd + Shift + Z · Ctrl + Y</dt><dd>다시 실행</dd></div></dl>}
        <p>초록 미리보기는 설치 가능, 빨강은 설치 불가입니다. 실행 기록은 현재 월드 세션의 최근 100개만 유지됩니다.</p></details>
      </>}
      {state.notice && <p className="notice" role="status">{state.notice}</p>}
      {state.controlError && <p className="notice" role="alert">{state.controlError}</p>}
      <button className="primary" disabled={!state.ready} onClick={start}>
        {!state.ready ? '월드 준비 중…' : started ? '계속하기' : '산책 시작'}
      </button>
      <button className="save-button" onClick={state.saveWorld}>지금 저장</button>
      <div className="menu-actions">
        <button className="save-button" disabled={!state.undoStack.length} onClick={()=>state.undoEdit()}>실행 취소 ({state.undoStack.length})</button>
        <button className="save-button" disabled={!state.redoStack.length} onClick={()=>state.redoEdit()}>다시 실행 ({state.redoStack.length})</button>
      </div>
      {state.historyNotice && <p className="notice" role="status">{state.historyNotice}</p>}
      <small>{state.touchMode ? '왼쪽 스틱 이동 · 오른쪽 화면 드래그로 시점 조절' : 'PC 키보드·마우스 조작'} · 이 브라우저에 저장<br />중요한 건축물은 월드 메뉴에서 파일로 보관하세요.</small>
    </section></div>}
  </div>;
}
