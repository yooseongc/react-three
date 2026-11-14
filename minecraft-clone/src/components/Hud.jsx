import { useEffect, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { BLOCK_LABELS, BLOCK_TYPES } from '../game/world';
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
      <div><strong>VOXEL GARDEN</strong><span>{landscape ? `M3 · 물빛 숲 · ${landscapeSeed}` : 'M2 · 작은 건축 연습장'}</span></div>
      <span role="status">{state.saveStatus.includes('실패') || state.saveStatus.includes('불가')
        ? state.saveStatus : state.dirty ? '변경 사항 저장 중…' : state.saveStatus} · {state.cubes.length} 블록</span>
    </header>
    <Minimap />
    <PerformancePanel />
    {state.playing && <div className="crosshair" aria-hidden="true">+</div>}
    <div className="hotbar" aria-label="블록 선택">
      {BLOCK_TYPES.map((type, i) => <button key={type} aria-label={BLOCK_LABELS[i]}
        aria-pressed={state.texture === type} onClick={() => state.setTexture(type)}>
        <kbd>{i + 1}</kbd><img src={icons[i]} alt="" /><span>{BLOCK_LABELS[i]}</span>
      </button>)}
    </div>
    <div className="controls-hint">WASD 이동 · Shift 달리기 · Space 점프 · 좌클릭 파괴 · 우클릭 설치 · 1–5 블록 · ESC 메뉴</div>
    {!state.playing && <div className="menu-backdrop"><section className="menu" aria-label="게임 메뉴">
      <span className="eyebrow">작은 세계의 첫걸음</span>
      <h1>{started ? '잠시 쉬어가기' : '나만의 공간을 지어보세요'}</h1>
      <p>{landscape ? '북서쪽 호수와 언덕, 동쪽 모래 해변을 찾아 걸어보세요. 단차는 Space로 넘을 수 있습니다.' : '잔디 위를 걷고, 블록을 쌓아보세요.'}<br />
        {landscape ? '물은 걸어서 건널 수 있는 얕은 수면입니다. 나무와 지형도 편집할 수 있습니다.' : '새로운 숲과 호수로 탐험을 떠나보세요.'}</p>
      {!landscape && <p><a href="?world=willow">물빛 숲 탐험하기 →</a></p>}
      {landscape && <p><a href="?">기존 건축 월드로 돌아가기</a></p>}
      <dl><div><dt>W A S D</dt><dd>이동</dd></div><div><dt>SPACE</dt><dd>점프</dd></div>
        <div><dt>마우스 좌 / 우</dt><dd>파괴 / 설치</dd></div><div><dt>ESC</dt><dd>일시정지</dd></div></dl>
      {state.notice && <p className="notice" role="status">{state.notice}</p>}
      {state.controlError && <p className="notice" role="alert">{state.controlError}</p>}
      <button className="primary" disabled={!state.ready} onClick={start}>
        {!state.ready ? '월드 준비 중…' : started ? '계속하기' : '산책 시작'}
      </button>
      <button className="save-button" onClick={state.saveWorld}>지금 저장</button>
      <small>데스크톱 · 마우스 잠금 사용 · 이 브라우저에 자동 저장</small>
    </section></div>}
  </div>;
}
