import { generateTerrain } from './terrain';
const params = new URLSearchParams(window.location.search);
export const landscapeSeed = !params.has('demo') && params.has('world')
  ? (Array.from(params.get('world').trim()).slice(0,64).join('') || 'willow') : null;
export const landscape = landscapeSeed === null ? null : generateTerrain(landscapeSeed);
