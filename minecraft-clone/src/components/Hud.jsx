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

const icons = [dirt, grass, glass, wood, log];
export default function Hud() {
  const state = useStore();
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (state.playing) setStarted(true);
  }, [state.playing]);
  const start = async () => {
    state.setControlError('');
    if (state.soundEnabled) unlockAudio();
    try {
      const canvas = document.querySelector('canvas');
      if (!canvas?.requestPointerLock) throw new Error('unsupported');
      await canvas.requestPointerLock();
    } catch {
      state.setControlError('마우스 잠금을 사용할 수 없습니다. 데스크톱 브라우저에서 다시 시도해주세요.');
    }
  };
  return <div className="hud">
    <header className="status-bar">
      <div><strong>VOXEL GARDEN</strong><span>{landscape ? `물빛 숲 · ${landscapeSeed}` : '작은 건축 연습장'} · M4</span></div>
      <span role="status">{state.saveStatus.includes('실패') || state.saveStatus.includes('불가')
        ? state.saveStatus : state.dirty ? '변경 사항 저장 중…' : state.saveStatus} · {state.cubes.length} 블록</span>
    </header>
    <Minimap />
    <PerformancePanel />
    <div className="build-status">{state.flying ? '비행 중 · Space 상승 / C 하강' : '걷는 중 · F 비행 전환'} · {BLOCK_LABELS[BLOCK_TYPES.indexOf(state.texture)]}</div>
    {state.playing && <div className="crosshair" aria-hidden="true">+</div>}
    <div className="hotbar" aria-label="블록 선택">
      <button className="palette-switch" aria-label="재료 페이지 전환" onClick={state.changePage}>Q / E<br />{state.palettePage + 1} / 2</button>
      {BLOCK_TYPES.slice(state.palettePage * 6, state.palettePage * 6 + 6).map((type, slot) => {
        const i = state.palettePage * 6 + slot;
        return <button key={type} aria-label={BLOCK_LABELS[i]}
        aria-pressed={state.texture === type} onClick={() => state.setTexture(type)}>
        <kbd>{slot + 1}</kbd>{icons[i] ? <img src={icons[i]} alt="" /> : <span className={'material-swatch ' + type} style={{ backgroundColor: BLOCK_COLORS[i] }} />}<span>{BLOCK_LABELS[i]}</span>
      </button>; })}
    </div>
    <div className="controls-hint">WASD 이동 · Shift 가속 · F 비행 · Space 점프/상승 · C 하강 · 좌/우클릭 파괴/설치 · 1–6 재료 · Q/E 페이지 · 휠 선택 · ESC</div>
    {!state.playing && <div className="menu-backdrop"><section className="menu" aria-label="게임 메뉴">
      <span className="eyebrow">작은 세계의 첫걸음</span>
      <h1>{started ? '잠시 쉬어가기' : '나만의 공간을 지어보세요'}</h1>
      <p>{landscape ? '북서쪽 호수와 언덕, 동쪽 모래 해변을 찾아 걸어보세요. 단차는 Space로 넘을 수 있습니다.' : '잔디 위를 걷고, 블록을 쌓아보세요.'}<br />
        {landscape ? '물은 걸어서 건널 수 있는 얕은 수면입니다. 나무와 지형도 편집할 수 있습니다.' : '새로운 숲과 호수로 탐험을 떠나보세요.'}</p>
      {!landscape && <p><a href="?world=willow">물빛 숲 탐험하기 →</a></p>}
      {landscape && <p><a href="?">기존 건축 월드로 돌아가기</a></p>}
      <dl><div><dt>W A S D</dt><dd>이동</dd></div><div><dt>SPACE</dt><dd>점프</dd></div>
        <div><dt>마우스 좌 / 우</dt><dd>파괴 / 설치</dd></div><div><dt>F · SPACE / C</dt><dd>비행 전환 · 상승 / 하강</dd></div>
        <div><dt>Q / E · 1–6</dt><dd>재료 페이지 · 슬롯 선택</dd></div><div><dt>휠 · ESC</dt><dd>재료 순환 · 일시정지</dd></div></dl>
      {state.notice && <p className="notice" role="status">{state.notice}</p>}
      {state.controlError && <p className="notice" role="alert">{state.controlError}</p>}
      <button className="primary" disabled={!state.ready} onClick={start}>
        {!state.ready ? '월드 준비 중…' : started ? '계속하기' : '산책 시작'}
      </button>
      <button className="save-button" onClick={state.saveWorld}>지금 저장</button>
      <button className="save-button" aria-pressed={state.soundEnabled} onClick={state.toggleSound}>효과음 {state.soundEnabled ? '켜짐' : '꺼짐'}</button>
      <small>데스크톱 · 마우스 잠금 사용 · 이 브라우저에 자동 저장</small>
    </section></div>}
  </div>;
}
