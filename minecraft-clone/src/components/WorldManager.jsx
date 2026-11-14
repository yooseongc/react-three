import { useState, useRef } from 'react';
import WorldLibrary from './WorldLibrary';
import { MAP_CATALOG,mapChoiceQuery,randomSeed } from '../game/mapCatalog';
import { useStore } from '../hooks/useStore';
import { landscapeSeed } from '../game/landscape';
import { activeMap, MAP_TYPES, MAP_SIZES, MAP_SIZE_LABELS } from '../game/mapConfig';
import { exportWorld, parseTransfer, MAX_IMPORT_BYTES, SLOT_PREFIX, safeWorldQuery } from '../game/transfer';

export default function WorldManager() {
  const [seed,setSeed] = useState('willow');
  const [mapType,setMapType]=useState('forest'),[size,setSize]=useState(100);
  const [section,setSection]=useState('maps');
  const choice=MAP_CATALOG.find(c=>c.id===mapType);
  const fileTicket = useRef(0);
  const [notice,setNotice] = useState('');
  const [pending,setPending] = useState(null);
  const [leave,setLeave] = useState(null);
  const navigate = query => { window.location.assign(window.location.pathname + query); };
  const go = query => {
    const safe = safeWorldQuery(query);
    if (!safe) { setNotice('월드 주소가 올바르지 않습니다.'); return; }
    const state=useStore.getState();
    if (state.dirty && !state.saveWorld()) { setLeave(safe); setNotice('현재 월드를 저장하지 못했습니다. 먼저 파일로 내보내거나 저장 없이 이동할 수 있습니다.'); return; }
    navigate(safe);
  };
  const download = () => {
    const blob = new Blob([JSON.stringify(exportWorld(useStore.getState().cubes, landscapeSeed,landscapeSeed===null?undefined:activeMap))],{type:'application/json'});
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
    try {const id=crypto.randomUUID();localStorage.setItem(SLOT_PREFIX+id,JSON.stringify(exportWorld(pending.cubes,pending.kind==='terrain'?pending.seed:null,pending.kind==='terrain'?pending:undefined)));
      setPending(null);go('?slot='+id);
    }catch{setNotice('가져온 월드를 저장하지 못했습니다. 저장 공간이나 브라우저 권한을 확인하세요.');}
  };
  return <div className="world-manager">
    <nav className="section-tabs" aria-label="월드 메뉴"><button aria-pressed={section==='maps'} onClick={()=>setSection('maps')}>맵 고르기</button><button aria-pressed={section==='storage'} onClick={()=>setSection('storage')}>저장 관리</button></nav>
    {section==='maps'?<form className="map-picker" onSubmit={event=>{event.preventDefault();try{go(mapChoiceQuery(mapType,seed,size));}catch(error){setNotice(error.message);}}}>
      <div className="map-gallery" aria-label="맵 종류">{MAP_CATALOG.map(map=><button type="button" className="map-card" key={map.id} aria-label={map.name} aria-pressed={mapType===map.id} onClick={()=>setMapType(map.id)}>
        <img src={import.meta.env.BASE_URL+'maps/'+map.id+'.jpg'} alt={map.name+' 풍경 미리보기'} /><span className="map-caption"><strong>{map.name}</strong><small>{map.tag}</small></span><span className="map-selected" aria-hidden="true">✓</span>
      </button>)}</div>
      <aside className="map-options"><span className="eyebrow">YOUR NEXT PLACE</span><h2>{choice.name}</h2><p>{choice.description}</p>
        {!choice.query&&<><label htmlFor="map-size">맵 크기</label><select id="map-size" value={size} onChange={e=>setSize(Number(e.target.value))}>{MAP_SIZES.map(n=><option key={n} value={n}>{n} × {n} · {MAP_SIZE_LABELS[n]}</option>)}</select><label htmlFor="world-seed">시드</label><div className="seed-row"><input id="world-seed" value={seed} onChange={e=>setSeed(e.target.value)} placeholder="예: willow" required /><button type="button" aria-label="랜덤 시드 생성" title="랜덤 시드 생성" onClick={()=>setSeed(randomSeed())}>랜덤 ↻</button></div><small>같은 시드는 같은 장소로 이어집니다.</small></>}
        <button type="submit" className="primary">이 맵으로 떠나기 <span aria-hidden="true">↗</span></button><small>미리보기는 대표 풍경입니다.</small>
      </aside>
    </form>:<WorldLibrary go={go}>
      <section className="file-tools" aria-label="파일 보관"><h3>파일로 보관하기</h3>
    <button className="secondary-button" onClick={download}>파일 내보내기</button>
    <label className="file-label">파일 가져오기<input type="file" accept=".json,application/json" onChange={readFile} /></label>
    <small>JSON · 최대 8MB · 가져온 파일은 별도 월드로 열립니다.</small>
    {pending && <div className="import-preview"><p>{pending.kind==='terrain'?`${MAP_TYPES[pending.mapType||'forest']} ${pending.size||100} · ${pending.seed}`:'건축 월드'} · {pending.cubes.length.toLocaleString()} 블록</p>
      <button className="save-button" onClick={importCopy}>새 복사본으로 가져오기</button><button className="save-button" onClick={()=>setPending(null)}>취소</button></div>}
      </section>
    </WorldLibrary>}
    {notice && <p className="notice" role="status">{notice}</p>}
    {leave && <button className="save-button" onClick={()=>{useStore.setState({dirty:false});navigate(leave);}}>현재 변경을 저장하지 않고 이동</button>}
  </div>;
}
