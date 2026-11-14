import { getAudioContext } from './feedback';
import { AMBIENCE_TRACKS } from './ambienceMix';

const tracks=new Map();
let loading;
export const ambienceStatus={loading:false,ready:false,error:'',levels:Object.fromEntries(AMBIENCE_TRACKS.map(name=>[name,0]))};
export async function ensureAmbience() {
  if(ambienceStatus.ready || ambienceStatus.error || loading)return loading;
  const context=getAudioContext();
  if(!context || context.state!=='running')return;
  ambienceStatus.loading=true;
  loading=(async()=>{
    // Decode before connecting anything: a failed download cannot leave a partial soundscape.
    const buffers=await Promise.all(AMBIENCE_TRACKS.map(async name=>{
      const response=await fetch(`${import.meta.env.BASE_URL}audio/${name}.ogg`);
      if(!response.ok)throw new Error('audio download');
      return [name,await context.decodeAudioData(await response.arrayBuffer())];
    }));
    for(const [name,buffer] of buffers){
      const source=context.createBufferSource(),gain=context.createGain();
      source.buffer=buffer;source.loop=true;gain.gain.value=0;
      source.connect(gain);gain.connect(context.destination);source.start();
      tracks.set(name,{source,gain});
    }
    ambienceStatus.ready=true;
  })().catch(()=>{
    for(const {source,gain} of tracks.values()){source.stop();source.disconnect();gain.disconnect();}
    tracks.clear();ambienceStatus.error='배경음을 불러오지 못했습니다. 연결을 확인한 뒤 다시 시도해주세요.';
  }).finally(()=>{ambienceStatus.loading=false;loading=null;});
  return loading;
}
export function retryAmbience() { ambienceStatus.error='';return ensureAmbience(); }
export function setAmbience(levels, volume, active) {
  const context=getAudioContext();
  for(const name of AMBIENCE_TRACKS){
    const target=active ? Math.min(1,Math.max(0,(levels[name] || 0)*volume)) : 0;
    ambienceStatus.levels[name]=target;
    const track=tracks.get(name);
    if(!track || !context)continue;
    // Silence must bypass smoothing/tolerance, including a nearly faded-out track.
    if(!active || volume===0){
      track.gain.gain.cancelScheduledValues(context.currentTime);
      track.gain.gain.setValueAtTime(0,context.currentTime);
      track.target=0;continue;
    }
    if(Math.abs((track.target ?? -1)-target)<.002)continue;
    track.target=target;
    track.gain.gain.cancelScheduledValues(context.currentTime);
    if(active && volume>0)track.gain.gain.setTargetAtTime(target,context.currentTime,.7);
    else track.gain.gain.setValueAtTime(0,context.currentTime);
  }
}
