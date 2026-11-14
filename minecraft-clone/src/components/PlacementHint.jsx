import { useEffect, useRef } from 'react';

export default function PlacementHint() {
  const text = useRef();
  useEffect(() => {
    const update = () => {
      const data = document.querySelector('canvas[aria-label="복셀 정원 게임 화면"]')?.dataset;
      if (!data || !text.current) return;
      const message = data.placementError || (data.placement ? '우클릭 설치 · ' + data.placement : '6칸 안의 블록이나 지면을 바라보세요');
      if (text.current.textContent !== message) text.current.textContent = message;
      text.current.dataset.invalid = String(!!data.placement && !!data.placementError);
    };
    update();
    const timer = setInterval(update, 100);
    return () => clearInterval(timer);
  }, []);
  return <div ref={text} className="placement-hint" />;
}
