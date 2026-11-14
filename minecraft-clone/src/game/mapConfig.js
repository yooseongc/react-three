export const MAP_TYPES={forest:'물빛 숲',meadow:'넓은 초원',islands:'작은 군도',snow:'고요한 설원'};
export const MAP_SIZES=[100,150,200];
export function mapConfig(value={}) {
  return {mapType:Object.hasOwn(MAP_TYPES,value.mapType)?value.mapType:'forest',size:MAP_SIZES.includes(Number(value.size))?Number(value.size):100};
}
export function validMapConfig(value) {
  return (value.mapType===undefined || Object.hasOwn(MAP_TYPES,value.mapType)) && (value.size===undefined || MAP_SIZES.includes(value.size));
}
export const mapLimit=config=>config.size/2-1;
export function terrainKey(seed,config={}) {
  const {mapType,size}=mapConfig(config);
  return mapType==='forest' && size===100 ? 'voxel-garden.terrain.v1.'+encodeURIComponent(seed) : `voxel-garden.terrain.v2.${mapType}.${size}.`+encodeURIComponent(seed);
}
export function terrainQuery(seed,config={}) {
  const {mapType,size}=mapConfig(config);
  return '?world='+encodeURIComponent(seed)+(mapType==='forest'&&size===100?'':`&map=${mapType}&size=${size}`);
}
function activeConfig() {
  if(typeof window==='undefined')return mapConfig();
  const params=new URLSearchParams(window.location.search);
  if(params.has('slot')) {
    try {const data=JSON.parse(localStorage.getItem('voxel-garden.copy.'+params.get('slot')));return mapConfig(data?.kind==='terrain'?data:{});}catch{return mapConfig();}
  }
  return mapConfig(params.has('world')&&!params.has('demo')?{mapType:params.get('map'),size:params.get('size')}:{});
}
export const activeMap=activeConfig();
export const MAP_LIMIT=mapLimit(activeMap);
