import { generateTerrain } from './terrain';
import { slotId, slotData } from './session';
const params = new URLSearchParams(window.location.search);
export const landscapeSeed = slotId ? (slotData?.kind === 'terrain' ? slotData.seed : null) : !params.has('demo') && params.has('world')
  ? (Array.from(params.get('world').trim()).slice(0,64).join('') || 'willow') : null;
export const landscape = landscapeSeed === null ? null : generateTerrain(landscapeSeed);
