import { useEffect,useState } from 'react';
import { ambienceStatus } from '../game/ambience';
import { useStore } from '../hooks/useStore';
import { selectMusic } from '../game/music';
import { worldClock } from '../game/daylight';
import { weatherState } from '../game/weather';
export default function NowPlaying({panel=false}){
 const playing=useStore(s=>s.playing),enabled=useStore(s=>s.ambienceEnabled),volume=useStore(s=>s.ambienceVolume);
 const [audio,setAudio]=useState(()=>({...ambienceStatus}));
 useEffect(()=>{const timer=setInterval(()=>setAudio({...ambienceStatus}),500);return()=>clearInterval(timer);},[]);
 const next=selectMusic(worldClock.hour,weatherState.current);
 const track=audio.ready&&audio.title?audio:next;
 const label=!enabled?'배경음 꺼짐':volume===0?'음소거':audio.error?'재생 오류':!playing?(audio.ready?'일시정지':'재생 예정'):audio.loading?'불러오는 중':audio.ready?'재생 중':'재생 준비 중';
 if(!panel&&(!playing||!enabled||volume===0||!audio.ready))return null;
 const upcoming=audio.ready&&audio.key!==next.time+'_'+next.weather;
 return <div className={panel?'music-current':'now-playing'} aria-label="현재 배경음악" title={track.title+' · '+track.artist}>
   <span className="music-state">♫ {label}</span><strong>{track.title}</strong><span className="music-artist">{track.artist}</span>
   {panel&&upcoming&&<small>다음 곡 · {next.title}</small>}
 </div>;
}
