import { landscape,landscapeSeed } from '../game/landscape';
import { activeMap,MAP_TYPES } from '../game/mapConfig';
import { demoMode } from '../game/demo';
import { slotId } from '../game/session';
import { worldMeta } from '../game/library';
import { safeWorldQuery } from '../game/transfer';

export default function CurrentWorld(){
  const map=landscape?MAP_TYPES[activeMap.mapType]:demoMode==='build'?'작은 집':slotId?'건축 월드':'건축 연습장';
  let name=landscapeSeed||'나의 정원';
  try{name=worldMeta(localStorage,safeWorldQuery(location.search)||'?').name||name;}catch{/* Keep the default name if storage is unavailable. */}
  return <div className="pause-world-summary" aria-label="현재 월드 정보"><span>현재 월드</span><strong title={name}>{name}</strong><small>맵 · {map}{landscape?` · ${activeMap.size} × ${activeMap.size}`:''}</small></div>;
}
