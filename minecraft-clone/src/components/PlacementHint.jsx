import { useEffect, useRef } from 'react';
import { BLOCK_TYPES, BLOCK_LABELS } from '../game/world';
import { useStore } from '../hooks/useStore';

export default function PlacementHint() {
  const touchMode = useStore(s=>s.touchMode);
  const text = useRef();
  useEffect(() => {
    const update = () => {
      const data = document.querySelector('canvas[aria-label="복셀 정원 게임 화면"]')?.dataset;
      if (!data || !text.current) return;
      const material = BLOCK_LABELS[BLOCK_TYPES.indexOf(data.selectedMaterial)] || '';
      const message = !data.placement ? '' : data.placementError ? '× 설치 불가 · ' + data.placementError : '+ ' + material + ' 설치 · ' + (touchMode?'설치 버튼':'우클릭');
      if (text.current.textContent !== message) text.current.textContent = message;
      text.current.dataset.invalid = String(!!data.placement && !!data.placementError);
    };
    update();
    const timer = setInterval(update, 100);
    return () => clearInterval(timer);
  }, [touchMode]);
  return <div ref={text} className="placement-hint" />;
}
