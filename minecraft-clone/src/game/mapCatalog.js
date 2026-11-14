import { terrainQuery } from './mapConfig';
export function randomSeed(){return 'garden-'+Array.from(crypto.getRandomValues(new Uint32Array(2)),n=>n.toString(36).padStart(7,'0')).join('');}
export const MAP_CATALOG=[
  {id:'forest',name:'물빛 숲',tag:'숲과 강',description:'나무 사이로 흐르는 물길, 그 곁의 작은 오두막.'},
  {id:'meadow',name:'넓은 초원',tag:'들판과 농가',description:'풀빛 들판과 굽이치는 강 너머, 느긋한 하루.'},
  {id:'islands',name:'작은 군도',tag:'섬과 물가',description:'물 위에 흩어진 섬과 바닷바람이 쉬어가는 집.'},
  {id:'snow',name:'고요한 설원',tag:'눈길과 산장',description:'하얀 지붕 아래 켜진 등불, 발걸음이 잦아드는 곳.'},
  {id:'house',name:'작은 집',tag:'집이 있는 정원',description:'이미 지어진 집에서 시작하는 나만의 정원.',query:'?demo=build'},
  {id:'flat',name:'건축 연습장',tag:'평평한 잔디밭',description:'비어 있는 들판에 원하는 모양의 하루를 쌓아보세요.',query:'?'},
];
export function mapChoiceQuery(id,seed,size){
  const choice=MAP_CATALOG.find(c=>c.id===id);if(!choice)throw Error('맵을 선택하세요.');
  if(choice.query)return choice.query;
  const value=Array.from(seed.trim()).slice(0,64).join('');if(!value)throw Error('시드를 입력하세요.');
  return terrainQuery(value,{mapType:id,size,generator:2});
}
