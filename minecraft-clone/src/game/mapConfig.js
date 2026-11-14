export const MAP_TYPES={forest:'물빛 숲',meadow:'넓은 초원',islands:'작은 군도',snow:'고요한 설원'};
export const MAP_SIZES=[100,150,200,400];
export const MAP_SIZE_LABELS={100:'기본',150:'넓게',200:'대형',400:'광활'};
export function mapConfig(value={}) {
  return {mapType:Object.hasOwn(MAP_TYPES,value.mapType)?value.mapType:'forest',size:MAP_SIZES.includes(Number(value.size))?Number(value.size):100,generator:Number(value.generator)===2?2:1};
}
export function validMapConfig(value) {
  return (value.mapType===undefined || Object.hasOwn(MAP_TYPES,value.mapType)) && (value.size===undefined || MAP_SIZES.includes(value.size)) && (value.generator===undefined || [1,2].includes(value.generator));
}
export const mapLimit=config=>config.size/2-1;
export function terrainKey(seed,config={}) {
  const {mapType,size,generator}=mapConfig(config);
  if(generator===2)return `voxel-garden.terrain.v3.${mapType}.${size}.`+encodeURIComponent(seed);
  return mapType==='forest' && size===100 ? 'voxel-garden.terrain.v1.'+encodeURIComponent(seed) : `voxel-garden.terrain.v2.${mapType}.${size}.`+encodeURIComponent(seed);
}
export function terrainQuery(seed,config={}) {
  const {mapType,size,generator}=mapConfig(config);
  return '?world='+encodeURIComponent(seed)+(mapType==='forest'&&size===100?'':`&map=${mapType}&size=${size}`)+(generator===2?'&gen=2':'');
}
function activeConfig() {
  if(typeof window==='undefined')return mapConfig();
  const params=new URLSearchParams(window.location.search);
  if(params.has('slot')) {
    try {const data=JSON.parse(localStorage.getItem('voxel-garden.copy.'+params.get('slot')));return mapConfig(data?.kind==='terrain'?data:{});}catch{return mapConfig();}
  }
  if(params.get('tour')==='1' && params.has('world') && !params.has('demo'))return mapConfig({mapType:params.get('map'),size:params.get('size')==='150'?150:100,generator:2});
  return mapConfig(params.has('world')&&!params.has('demo')?{mapType:params.get('map'),size:params.get('size'),generator:params.get('gen')}:{});
}
export const activeMap=activeConfig();
export const MAP_LIMIT=mapLimit(activeMap);
