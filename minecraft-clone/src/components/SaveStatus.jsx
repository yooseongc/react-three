import { useEffect, useState } from 'react';

export default function SaveStatus({ dirty, canSave, saveStatus, saveRevision }) {
  const [visibleRevision, setVisibleRevision] = useState(0);
  useEffect(() => {
    if (!saveRevision) return;
    setVisibleRevision(saveRevision);
    const timer = setTimeout(() => setVisibleRevision(0), 2500);
    return () => clearTimeout(timer);
  }, [saveRevision]);
  const error = saveStatus.includes('실패') || saveStatus.includes('불가');
  const message = error ? saveStatus : !canSave ? '저장 불가 · 브라우저 저장소 확인'
    : dirty ? '저장 중…' : visibleRevision ? '저장됨' : '';
  return <span role="status" aria-live="polite" aria-atomic="true">{message}</span>;
}
