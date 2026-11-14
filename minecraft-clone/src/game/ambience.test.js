import { MusicPlayer,musicTime,selectMusic,musicTracks } from './music';
import { vi } from 'vitest';
import { existsSync,statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
function harness(){
 const audios=[],gains=[];
 const context={currentTime:0,destination:{},createMediaElementSource:()=>({connect:vi.fn(),disconnect:vi.fn()}),createGain:()=>{const g={gain:{value:0,setTargetAtTime:vi.fn(),cancelScheduledValues:vi.fn(),setValueAtTime:vi.fn()},connect:vi.fn(),disconnect:vi.fn()};gains.push(g);return g;}};
 const player=new MusicPlayer(context,url=>{const a={src:url,paused:true,play:vi.fn(function(){this.paused=false;return Promise.resolve();}),pause:vi.fn(function(){this.paused=true;}),removeAttribute:vi.fn(),load:vi.fn()};audios.push(a);return a;},'/react-three/');
 let time=0;return {player,audios,gains,tick:(scene={},volume=.5,active=true)=>player.tick(scene,volume,active,time+=250)};
}
test('all 20 slots resolve to real local audio, with exact time boundaries',()=>{
 expect([4.99,5,9.99,10,16.99,17,19.99,20,24].map(musicTime)).toEqual(['night','morning','morning','day','day','sunset','sunset','night','night']);
 expect(musicTracks).toHaveLength(20);expect(new Set(musicTracks.map(t=>t.localPath)).size).toBe(20);
 for(const t of musicTracks){const path=fileURLToPath(new URL('../../public'+t.localPath,import.meta.url));expect(existsSync(path)).toBe(true);expect(statSync(path).size).toBe(t.bytes);}
 expect(selectMusic(9,'rain').title).toBe('Morning rain');expect(selectMusic(0,'snow').title).toBe('Iridescent Deep');
});
test('loads only the selected song, crossfades, and releases old media',async()=>{
 const {player,audios,tick}=harness();tick({hour:9,weather:'clear'});await Promise.resolve();
 for(let n=0;n<14;n++)tick({hour:9,weather:'clear'});
 expect(audios).toHaveLength(1);expect(audios[0].src).toBe('/react-three/assets/audio/morning_clear.ogg');
 tick({hour:18,weather:'snow'});expect(player.slots).toHaveLength(2);await Promise.resolve();
 tick({hour:18,weather:'snow'});expect(player.slots.every(s=>s.weight>0&&s.weight<1)).toBe(true);
 for(let n=0;n<14;n++)tick({hour:18,weather:'snow'});
 expect(player.slots).toHaveLength(1);expect(audios[0].removeAttribute).toHaveBeenCalledWith('src');expect(player.status.key).toBe('sunset_snow');
});
test('mute cancels automation and pending playback cannot restart after pausing',async()=>{
 const {player,audios,gains,tick}=harness();tick();tick({},0,false);await Promise.resolve();
 expect(audios[0].paused).toBe(true);expect(gains[0].gain.cancelScheduledValues).toHaveBeenCalled();expect(gains[0].gain.setValueAtTime).toHaveBeenLastCalledWith(0,0);
 expect(player.status.levels).toEqual({});tick();await Promise.resolve();expect(audios[0].paused).toBe(false);
});
test('rapid changes stay bounded and a failed replacement retains the old song until retry',async()=>{
 const {player,audios,tick}=harness();tick();await Promise.resolve();for(let n=0;n<14;n++)tick();
 for(const weather of ['rain','snow','fog','cloudy']){tick({weather});expect(player.slots.length).toBeLessThanOrEqual(2);}
 audios.at(-1).onerror();expect(player.status.error).not.toBe('');expect(player.slots).toHaveLength(1);
 const count=audios.length;tick({weather:'cloudy'});expect(audios).toHaveLength(count);
 player.retry();tick({weather:'cloudy'});expect(audios).toHaveLength(count+1);
 player.dispose();expect(player.slots).toHaveLength(0);
});
