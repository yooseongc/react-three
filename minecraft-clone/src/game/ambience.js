import { getAudioContext } from './feedback';
import { MusicPlayer } from './music';
let player;
export const ambienceStatus={loading:false,ready:false,error:'',levels:{},title:'',artist:'',key:''};
export function ensureAmbience(){
  const context=getAudioContext();
  if(!player&&context?.state==='running')player=new MusicPlayer(context,undefined,import.meta.env.BASE_URL);
}
export function setAmbience(scene,volume,active){
  if(active)ensureAmbience();
  if(!player)return;
  try {player.tick(scene,volume,active);Object.assign(ambienceStatus,player.status);}
  catch {ambienceStatus.error='이 브라우저에서 배경음을 재생하지 못했습니다.';player.dispose();player=null;}
}
export function retryAmbience(){player?.retry();ambienceStatus.error='';}
