import { safeWorldQuery, SLOT_PREFIX, listWorlds } from './transfer';
import { terrainKey } from './mapConfig';
const META='voxel-garden.library.v1.';
const BACKUP='voxel-garden.checkpoints.v1.';
export function worldKey(query) {
  const safe=safeWorldQuery(query);if(!safe)throw Error('월드 주소가 올바르지 않습니다.');
  const p=new URLSearchParams(safe);
  if(p.has('slot'))return SLOT_PREFIX+p.get('slot');
  if(p.has('world'))return terrainKey(p.get('world'),{mapType:p.get('map'),size:p.get('size'),generator:Number(p.get('gen')||1)});
  if(p.has('demo'))return p.get('demo')==='build'?'voxel-garden.m4-demo.v1':'voxel-garden.m2-demo.v1';
  return 'voxel-garden.world.v1';
}
export function worldMeta(storage,query) {
  try {const data=JSON.parse(storage.getItem(META+worldKey(query)));return {
    ...(typeof data?.name==='string'?{name:data.name.slice(0,40)}:{}),
    ...(typeof data?.thumbnail==='string'&&/^data:image\/(webp|png);base64,/.test(data.thumbnail)?{thumbnail:data.thumbnail}:{}),
    ...(Number.isFinite(data?.updatedAt)?{updatedAt:data.updatedAt}:{}),
  };}catch{return {};}
}
export function nameWorld(storage,query,name,thumbnail) {
  const clean=Array.from(name.trim()).slice(0,40).join('');if(!clean)throw Error('월드 이름을 입력하세요.');
  const previous=worldMeta(storage,query);
  storage.setItem(META+worldKey(query),JSON.stringify({...previous,name:clean,updatedAt:Date.now(),...(thumbnail?{thumbnail}:{})}));
}
export function libraryWorlds(storage) {
  return listWorlds(storage).filter(w=>storage.getItem(worldKey(w.query))!==null).map(w=>({...w,...worldMeta(storage,w.query)}));
}
export function checkpoints(storage,query) {
  try {const list=JSON.parse(storage.getItem(BACKUP+worldKey(query)));return Array.isArray(list)?list.filter(item=>typeof item?.id==='string'&&Number.isFinite(item.createdAt)&&item.data?.format==='voxel-garden').slice(0,2):[];}catch{return [];}
}
export function checkpoint(storage,query,data) {
  const item={id:crypto.randomUUID(),createdAt:Date.now(),data};
  storage.setItem(BACKUP+worldKey(query),JSON.stringify([item,...checkpoints(storage,query)].slice(0,2)));
  return item;
}
export function copyWorld(storage,data,name,thumbnail) {
  const id=crypto.randomUUID(),query='?slot='+id;
  storage.setItem(SLOT_PREFIX+id,JSON.stringify(data));
  try {nameWorld(storage,query,name,thumbnail);}catch(error){storage.removeItem(SLOT_PREFIX+id);throw error;}
  return query;
}
export function deleteWorld(storage,query,current) {
  if(worldKey(query)===worldKey(current))throw Error('현재 월드는 다른 월드로 이동한 뒤 삭제하세요.');
  const key=worldKey(query);
  storage.removeItem(key);storage.removeItem(META+key);storage.removeItem(BACKUP+key);
  if(storage.getItem('voxel-garden.recent.v1')===query)storage.removeItem('voxel-garden.recent.v1');
}
