import { useEffect,useState } from 'react';
import { landscape } from '../game/landscape';
import { playerView } from '../game/navigation';
import { useStore } from '../hooks/useStore';
export default function DiscoveryHint(){
  const playing=useStore(s=>s.playing),[site,setSite]=useState(null);
  useEffect(()=>{const timer=setInterval(()=>{const near=landscape?.sites?.map(s=>({...s,d:Math.hypot(s.x-playerView.x,s.z-playerView.z,s.y-playerView.y)})).sort((a,b)=>a.d-b.d)[0];setSite(near?.d<12?near:null);},400);return()=>clearInterval(timer);},[]);
  if(!playing||!site)return null;
  return <div className="discovery-hint" role="status"><small>풍경 속 작은 발견</small><span>{site.name}</span></div>;
}
