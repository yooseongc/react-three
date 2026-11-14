import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { landscapeSeed } from '../game/landscape';
import { activeMap } from '../game/mapConfig';
import { exportWorld, safeWorldQuery } from '../game/transfer';
import { worldMeta, nameWorld, libraryWorlds, checkpoints, checkpoint, copyWorld, deleteWorld } from '../game/library';

export default function WorldLibrary({go,children}) {
  const query=safeWorldQuery(location.search)||'?';
  const [name,setName]=useState(()=>{try{return worldMeta(localStorage,query).name||landscapeSeed||'나의 정원';}catch{return landscapeSeed||'나의 정원';}});
  const [revision,refresh]=useState(0),[notice,setNotice]=useState(''),[deleting,setDeleting]=useState(null);
  let worlds=[],backups=[];try{worlds=libraryWorlds(localStorage);backups=checkpoints(localStorage,query);}catch{/* Actions report storage errors. */}
  const snapshot=()=>exportWorld(useStore.getState().cubes,landscapeSeed,landscapeSeed===null?undefined:activeMap);
  const act=fn=>{try{fn();refresh(revision+1);}catch(error){setNotice(error.message||'저장 공간 또는 브라우저 권한을 확인하세요.');}};
  return <section className="world-library" aria-label="저장 관리">
    <div className="saved-worlds"><h2>나의 월드</h2><p className="section-description">이 브라우저에 남겨둔 장소들.</p>
      <div className="world-cards">{worlds.length===0&&<p className="empty-library">아직 저장된 월드가 없어요.<br />지금 머무는 곳부터 남겨볼까요.</p>}{worlds.map(item=><article key={item.query}>
        <div><strong>{item.name||item.label}</strong>{item.name&&<small>{item.label}</small>}{item.updatedAt&&<time>{new Date(item.updatedAt).toLocaleDateString('ko-KR')}</time>}</div>
        <div className="world-row-actions">{item.query===query?<span className="current-badge">머무는 중</span>:<><button onClick={()=>go(item.query)}>열기</button><button aria-label={(item.name||item.label)+' 삭제'} onClick={()=>setDeleting(item)}>삭제</button></>}</div>
      </article>)}</div>
      {deleting&&<div className="notice" role="alert"><p>“{deleting.name||deleting.label}”의 저장과 복원 지점을 삭제할까요?</p><button onClick={()=>act(()=>{deleteWorld(localStorage,deleting.query,query);setDeleting(null);setNotice('선택한 월드를 삭제했습니다.');})}>삭제 확인</button><button onClick={()=>setDeleting(null)}>취소</button></div>}
    </div>
    <div className="storage-current"><h2>지금 머무는 월드</h2>
      <label htmlFor="world-name">이름</label>
      <div className="seed-row"><input id="world-name" value={name} maxLength={40} onChange={e=>setName(e.target.value)} /><button onClick={()=>act(()=>{if(!useStore.getState().saveWorld())throw Error('월드를 저장하지 못했습니다. 파일로 내보내세요.');nameWorld(localStorage,query,name);setNotice('월드를 저장했습니다.');})}>저장</button></div>
      <div className="menu-actions"><button onClick={()=>act(()=>{go(copyWorld(localStorage,snapshot(),name+' 복사본'));})}>복사본 만들기</button><button onClick={()=>act(()=>{checkpoint(localStorage,query,snapshot());setNotice('복원 지점을 만들었습니다.');})}>복원 지점 남기기</button></div>
      <details className="restore-points"><summary>복원 지점 <span>{backups.length} / 2</span></summary>{backups.length===0?<p>남겨둔 복원 지점이 없습니다.</p>:backups.map(item=><button className="save-button" key={item.id} onClick={()=>act(()=>{go(copyWorld(localStorage,item.data,name+' 복원본'));})}>{new Date(item.createdAt).toLocaleString('ko-KR')} · 복원</button>)}<small>복원하면 새 복사본으로 열립니다.</small></details>
      {children}
      {notice&&<p className="notice" role="status">{notice}</p>}
    </div>
  </section>;
}
