import { useEffect, useRef } from 'react';
import { renderMetrics } from '../game/metrics';
import { isDemo, demoMode } from '../game/demo';

export default function PerformancePanel() {
  const text = useRef();
  useEffect(() => {
    if (!isDemo) return undefined;
    const update = () => {
      const metrics = renderMetrics;
      const faces = [...metrics.chunks.values()].reduce((a, b) => a + b, 0);
      text.current.textContent = Math.round(1000 / (metrics.frameMs || 16.7)) + ' FPS · '
        + metrics.drawCalls + ' draws · ' + metrics.chunks.size + ' chunks · ' + faces.toLocaleString() + ' faces';
    };
    update();
    const timer = setInterval(update, 500);
    return () => clearInterval(timer);
  }, []);
  if (!isDemo) return null;
  return <div className="performance-panel">
    <strong>{demoMode === 'benchmark' ? 'M2 성능 측정 월드' : 'M2 청크 연습장'}</strong>
    <span ref={text} />
    <small>{demoMode === 'benchmark' ? '측정 전용 · 저장하지 않음' : '기존 월드와 별도로 저장됩니다'}</small>
  </div>;
}
