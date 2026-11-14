// Kept independent of terrain/store modules so temporary worlds never restore saves.
export function isTourQuery(search) {
 const p=new URLSearchParams(search);
 return p.get('tour')==='1' && !!p.get('world')?.trim() && !p.has('slot') && !p.has('demo');
}
export const isTour=typeof window!=='undefined' && isTourQuery(window.location.search);
