import { EVENT_LABELS } from '../game/weatherEvents';
import { useEffect, useState } from 'react';
import { formatTime, worldClock } from '../game/daylight';
import { useStore } from '../hooks/useStore';
import { WEATHER_LABELS, weatherState } from '../game/weather';
export default function WorldTime() {
  const cycle = useStore(s=>s.dayCycle);
  const weather = useStore(s=>s.weatherMode);
  const [event,setEvent]=useState('');
  const [current,setCurrent]=useState(weatherState.current);
  const [time,setTime] = useState(formatTime(worldClock.hour));
  useEffect(()=>{const timer=setInterval(()=>{setTime(formatTime(worldClock.hour));setCurrent(weatherState.current);setEvent(weatherState.event);},500);return()=>clearInterval(timer);},[]);
  return <span className="world-time">{time} · {cycle ? '하루 12분' : '시간 고정'} · {WEATHER_LABELS[current]}{weather==='auto' ? ' (자동)' : ''}{event ? ' · '+EVENT_LABELS[event] : ''}</span>;
}
