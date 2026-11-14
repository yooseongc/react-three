import tracks from './musicTracks.json';
export { tracks as musicTracks };
export function musicTime(hour) {
  const h=((hour%24)+24)%24;
  return h>=5&&h<10?'morning':h>=10&&h<17?'day':h>=17&&h<20?'sunset':'night';
}
export function selectMusic(hour,weather) {
  return tracks.find(t=>t.time===musicTime(hour)&&t.weather===weather)||tracks.find(t=>t.time===musicTime(hour)&&t.weather==='clear');
}

// Streaming media elements keep long songs out of decoded WebAudio buffers.
// At most two elements/nodes exist, even while users rapidly change the weather.
export class MusicPlayer {
  constructor(context,createAudio=url=>new Audio(url),base='/') {
    this.context=context;this.createAudio=createAudio;this.base=base;this.slots=[];this.failed=null;
    this.status={ready:false,loading:false,error:'',title:'',artist:'',key:'',levels:{}};
    this.active=false;this.volume=0;this.time=0;
  }
  release(slot){slot.alive=false;slot.audio.pause();slot.audio.removeAttribute('src');slot.audio.load();slot.source.disconnect();slot.gain.disconnect();this.slots=this.slots.filter(s=>s!==slot);}
  play(slot){
    if(slot.pending||!slot.audio.paused||!this.active)return;
    slot.pending=true;
    Promise.resolve(slot.audio.play()).then(()=>{
      slot.pending=false;if(!slot.alive)return;
      if(!this.active){slot.audio.pause();return;}
      slot.ready=true;
    }).catch(error=>{
      slot.pending=false;if(!slot.alive||!this.active||error?.name==='AbortError')return;
      this.failed=slot.key;this.status.error='배경음 재생에 실패했습니다. 연결을 확인하고 다시 불러오세요.';this.release(slot);
    });
  }
  tick({hour=9,weather='clear',sheltered=false}={},volume=0,active=false,now=performance.now()) {
    const dt=Math.min(.25,Math.max(0,(now-this.time)/1000));this.time=now;
    this.active=active&&volume>0;this.volume=volume*(sheltered?.65:1);
    if(!this.active){for(const s of this.slots){s.gain.gain.cancelScheduledValues(this.context.currentTime);s.gain.gain.setValueAtTime(0,this.context.currentTime);s.audio.pause();}this.status.levels={};return;}
    const track=selectMusic(hour,weather),key=track.time+'_'+track.weather;
    let target=this.slots.find(s=>s.key===key);
    if(!target&&this.failed!==key){
      // Keep the loudest existing track until its replacement can actually play.
      const keep=[...this.slots].sort((a,b)=>b.weight-a.weight)[0];
      for(const s of [...this.slots])if(s!==keep)this.release(s);
      const audio=this.createAudio(this.base+track.localPath.replace(/^\//,''));
      audio.preload='auto';audio.loop=true;
      const source=this.context.createMediaElementSource(audio),gain=this.context.createGain();gain.gain.value=0;source.connect(gain);gain.connect(this.context.destination);
      target={audio,source,gain,key,track,weight:0,ready:false,pending:false,alive:true};
      audio.onerror=()=>{if(!target.alive)return;this.failed=key;this.status.error='배경음 파일을 불러오지 못했습니다. 다시 불러오기를 눌러주세요.';this.release(target);};
      this.slots.push(target);this.status.error='';
    }
    for(const s of this.slots)this.play(s);
    const ready=target?.ready;
    for(const s of [...this.slots]){
      const desired=ready?(s===target?1:0):(s.ready?1:0);
      s.weight=Math.max(0,Math.min(1,s.weight+Math.sign(desired-s.weight)*Math.min(Math.abs(desired-s.weight),dt/3)));
      s.gain.gain.setTargetAtTime(s.weight*this.volume,this.context.currentTime,.08);
      if(ready&&s!==target&&s.weight===0)this.release(s);
    }
    const audible=ready?target:[...this.slots].find(s=>s.ready);
    Object.assign(this.status,{ready:!!audible,loading:!!target&&!ready,title:audible?.track.title||'',artist:audible?.track.artist||'',key:audible?.key||'',levels:Object.fromEntries(this.slots.map(s=>[s.key,s.weight*this.volume]))});
  }
  retry(){this.failed=null;this.status.error='';}
  dispose(){for(const s of [...this.slots])this.release(s);}
}
