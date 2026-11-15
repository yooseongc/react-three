import { EXPANSION_MAPS } from './expansionCatalog';
import { terrainQuery } from './mapConfig';
export function randomSeed(){return 'garden-'+Array.from(crypto.getRandomValues(new Uint32Array(2)),n=>n.toString(36).padStart(7,'0')).join('');}
export const MAP_CATALOG=[
  {id:'forest',name:'물빛 숲',tag:'숲과 강',description:'숲과 강을 지나, 등불 켜진 부두와 돛배가 있는 바다.'},
  {id:'meadow',name:'넓은 초원',tag:'들판과 농가',description:'꽃 핀 언덕과 농가, 말들이 쉬는 풍차 아래의 들판.'},
  {id:'islands',name:'작은 군도',tag:'섬과 물가',description:'높낮이가 다른 섬과 모래 해안, 바다를 비추는 등대.'},
  {id:'snow',name:'고요한 설원',tag:'눈길과 산장',description:'설산 능선과 침엽수 사이, 따뜻한 산장의 작은 불빛.'},
  ...EXPANSION_MAPS,
  {id:'house',name:'작은 집',tag:'집이 있는 정원',description:'이미 지어진 집에서 시작하는 나만의 정원.',query:'?demo=build'},
  {id:'flat',name:'건축 연습장',tag:'평평한 잔디밭',description:'비어 있는 들판에 원하는 모양의 하루를 쌓아보세요.',query:'?'},
];
export function mapChoiceQuery(id,seed,size){
  const choice=MAP_CATALOG.find(c=>c.id===id);if(!choice)throw Error('맵을 선택하세요.');
  if(choice.query)return choice.query;
  const value=Array.from(seed.trim()).slice(0,64).join('');if(!value)throw Error('시드를 입력하세요.');
  return terrainQuery(value,{mapType:id,size,generator:3});
}
