import { beforeEach, afterEach, expect, test, vi } from 'vitest';
const audio=vi.hoisted(()=>({context:null}));
vi.mock('./feedback',()=>({getAudioContext:()=>audio.context}));
let gains;
beforeEach(()=>{
  vi.resetModules();gains=[];
  audio.context={state:'running',currentTime:0,destination:{},decodeAudioData:async()=>({}),
    createBufferSource:()=>({connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn()}),
    createGain:()=>{const gain={gain:{value:0,cancelScheduledValues:vi.fn(),setValueAtTime:vi.fn(),setTargetAtTime:vi.fn()},connect:vi.fn(),disconnect:vi.fn()};gains.push(gain);return gain;}};
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)})));
});
afterEach(()=>vi.unstubAllGlobals());
test('mute immediately silences even a nearly faded-out layer',async()=>{
  const {ensureAmbience,setAmbience}=await import('./ambience');
  await ensureAmbience();setAmbience({rain:.001},1,true);setAmbience({},1,false);
  for(const gain of gains)expect(gain.gain.setValueAtTime).toHaveBeenLastCalledWith(0,0);
  setAmbience({clear:1},0,true);
  for(const gain of gains)expect(gain.gain.setValueAtTime).toHaveBeenLastCalledWith(0,0);
});
test('failed download leaves gameplay silent and can be retried',async()=>{
  fetch.mockResolvedValueOnce({ok:false});
  const {ensureAmbience,retryAmbience,ambienceStatus}=await import('./ambience');
  await ensureAmbience();expect(ambienceStatus.error).not.toBe('');expect(gains).toHaveLength(0);
  await retryAmbience();expect(ambienceStatus.ready).toBe(true);expect(gains).toHaveLength(5);
});
test('concurrent start requests share decoding; loaded tracks start silently',async()=>{
  const {ensureAmbience}=await import('./ambience');
  await Promise.all([ensureAmbience(),ensureAmbience()]);
  expect(fetch).toHaveBeenCalledTimes(5);expect(gains).toHaveLength(5);
  for(const gain of gains)expect(gain.gain.value).toBe(0);
});
