import { useEffect, useState } from 'react';
import { formatTime, worldClock } from '../game/daylight';
import { useStore } from '../hooks/useStore';
export default function WorldTime() {
  const cycle = useStore(s=>s.dayCycle);
  const [time,setTime] = useState(formatTime(worldClock.hour));
  useEffect(()=>{const timer=setInterval(()=>setTime(formatTime(worldClock.hour)),500);return()=>clearInterval(timer);},[]);
  return <span className="world-time">{time} · {cycle ? '하루 12분' : '시간 고정'}</span>;
}
