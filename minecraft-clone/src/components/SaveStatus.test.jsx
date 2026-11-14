import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test, vi } from 'vitest';
import SaveStatus from './SaveStatus';

test('save feedback hides idle/success, renews repeated saves and keeps failures until recovery', () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  const host = document.createElement('div'), root = createRoot(host);
  let state = {dirty:false, canSave:true, saveStatus:'저장 대기', saveRevision:0};
  const render = patch => { state = {...state,...patch}; act(() => root.render(<SaveStatus {...state} />)); };
  try {
    render({}); expect(host.textContent).toBe('');
    render({dirty:true}); expect(host.textContent).toBe('저장 중…');
    render({dirty:false,saveStatus:'저장 완료',saveRevision:1}); expect(host.textContent).toBe('저장됨');
    act(() => vi.advanceTimersByTime(2000));
    render({saveRevision:2});
    act(() => vi.advanceTimersByTime(1000)); expect(host.textContent).toBe('저장됨');
    act(() => vi.advanceTimersByTime(1500)); expect(host.textContent).toBe('');
    render({dirty:true,saveStatus:'저장 실패 · 저장 공간 / 권한 확인'});
    act(() => vi.advanceTimersByTime(10000)); expect(host.textContent).toContain('저장 실패');
    render({dirty:false,saveStatus:'저장 완료',saveRevision:3}); expect(host.textContent).toBe('저장됨');
    render({canSave:false}); expect(host.textContent).toContain('저장 불가');
  } finally {
    act(() => root.unmount());
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers(); delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});
