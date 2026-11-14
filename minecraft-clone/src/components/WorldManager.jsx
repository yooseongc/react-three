import { useState, useRef } from 'react';
import { useStore } from '../hooks/useStore';
import { landscapeSeed } from '../game/landscape';
import { exportWorld, parseTransfer, MAX_IMPORT_BYTES, SLOT_PREFIX, RECENT_KEY, safeWorldQuery, listWorlds } from '../game/transfer';

export default function WorldManager() {
  const [seed,setSeed] = useState('willow');
  const fileTicket = useRef(0);
  const [notice,setNotice] = useState('');
  const [pending,setPending] = useState(null);
  const [leave,setLeave] = useState(null);
  const [worlds,setWorlds] = useState(()=>{try{return listWorlds(localStorage);}catch{return [];}});
  const [recent] = useState(()=>{try{return safeWorldQuery(localStorage.getItem(RECENT_KEY));}catch{return null;}});
  const navigate = query => { window.location.assign(window.location.pathname + query); };
  const go = query => {
    const safe = safeWorldQuery(query);
    if (!safe) { setNotice('월드 주소가 올바르지 않습니다.'); return; }
    const state=useStore.getState();
    if (state.dirty && !state.saveWorld()) { setLeave(safe); setNotice('현재 월드를 저장하지 못했습니다. 먼저 파일로 내보내거나 저장 없이 이동할 수 있습니다.'); return; }
    navigate(safe);
  };
  const download = () => {
    const blob = new Blob([JSON.stringify(exportWorld(useStore.getState().cubes, landscapeSeed))],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='voxel-garden-'+new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    setNotice('월드 파일을 내보냈습니다. 다운로드 폴더를 확인하세요.');
  };
  const readFile = async event => {
    const ticket = ++fileTicket.current;
    const file=event.target.files?.[0];event.target.value='';setPending(null);
    if(!file)return;
    try { if(file.size>MAX_IMPORT_BYTES)throw Error('파일은 8MB 이하만 지원합니다.');
      const data=parseTransfer(await file.text());if(ticket !== fileTicket.current)return;
      setPending(data);setNotice('파일을 확인했습니다. 새 복사본으로 가져올 수 있습니다.');
    } catch(error){if(ticket === fileTicket.current)setNotice(error.message);}
  };
  const importCopy = () => {
    if(!pending)return;
    try {const id=crypto.randomUUID();localStorage.setItem(SLOT_PREFIX+id,JSON.stringify(pending));
      setPending(null);setWorlds(listWorlds(localStorage));go('?slot='+id);
    }catch{setNotice('가져온 월드를 저장하지 못했습니다. 저장 공간이나 브라우저 권한을 확인하세요.');}
  };
  return <div className="world-manager">
    {recent && <button className="save-button" onClick={()=>go(recent)}>최근 월드 이어하기</button>}
    <form onSubmit={event=>{event.preventDefault();const value=Array.from(seed.trim()).slice(0,64).join('');if(!value){setNotice('시드를 입력해주세요.');return;}go('?world='+encodeURIComponent(value));}}>
      <label htmlFor="world-seed">새 숲의 시드</label>
      <div className="seed-row"><input id="world-seed" value={seed} onChange={e=>setSeed(e.target.value)} placeholder="예: willow" required /><button type="submit">숲 열기</button></div>
      <small>같은 시드는 저장된 숲을 이어 엽니다. 다른 이름으로 새 숲을 만드세요.</small>
    </form>
    <label htmlFor="saved-world">이 브라우저의 월드</label>
    <select id="saved-world" defaultValue="" onChange={e=>{if(e.target.value)go(e.target.value);}}>
      <option value="" disabled>월드 선택…</option>{worlds.map(item=><option key={item.query} value={item.query}>{item.label}</option>)}
    </select>
    <div className="menu-actions"><button className="save-button" onClick={()=>go('?demo=build')}>작은 집 데모</button><button className="save-button" onClick={()=>go('?')}>건축 연습장</button></div>
    <hr />
    <button className="save-button" onClick={download}>현재 월드 내보내기</button>
    <label className="file-label">월드 파일 가져오기<input type="file" accept=".json,application/json" onChange={readFile} /></label>
    <small>JSON · 최대 8MB / 15만 블록 · 기존 월드를 덮어쓰지 않습니다.</small>
    {pending && <div className="import-preview"><p>{pending.kind==='terrain'?'숲 · '+pending.seed:'건축 월드'} · {pending.cubes.length.toLocaleString()} 블록</p>
      <button className="save-button" onClick={importCopy}>새 복사본으로 가져오기</button><button className="save-button" onClick={()=>setPending(null)}>취소</button></div>}
    {notice && <p className="notice" role="status">{notice}</p>}
    {leave && <button className="save-button" onClick={()=>{useStore.setState({dirty:false});navigate(leave);}}>현재 변경을 저장하지 않고 이동</button>}
  </div>;
}
