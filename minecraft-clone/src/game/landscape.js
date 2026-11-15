import { generateTerrain } from './terrain';
import { slotId, slotData } from './session';
import { activeMap } from './mapConfig';
const params = new URLSearchParams(window.location.search);
export let landscapeSeed = slotId ? (slotData?.kind === 'terrain' ? slotData.seed : null) : !params.has('demo') && params.has('world')
  ? (Array.from(params.get('world').trim()).slice(0,64).join('') || 'willow') : null;
const start=performance.now();
export let landscape = landscapeSeed === null ? null : generateTerrain(landscapeSeed,activeMap);
export let generationMs=performance.now()-start;

// Tour-only replacement: same Canvas/context, new temporary world and scene resources.
export function replaceTourLandscape(seed,config){
 const start=performance.now(),next=generateTerrain(seed,config);
 Object.assign(activeMap,config);landscapeSeed=seed;landscape=next;generationMs=performance.now()-start;
 return next;
}
