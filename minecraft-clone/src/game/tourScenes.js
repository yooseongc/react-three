import { chooseClimateWeather } from './climate';
import { MAP_TYPES } from './mapConfig';
const maps=Object.keys(MAP_TYPES);
const hours=[6.5,9,13,17.5,19,22];
const pick=(values,random)=>values[Math.min(values.length-1,Math.floor(random()*values.length))];
// A shuffled bag guarantees all landscapes appear before repeating a cycle.
export function sceneDeck(random=Math.random){const deck=[...maps];for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;}
export function chooseTourScene(previous={},deck=[],random=Math.random,forcedMap){
 let remaining=deck.filter(m=>m!==previous.mapType);
 if(!remaining.length)remaining=sceneDeck(random).filter(m=>m!==previous.mapType);
 const mapType=maps.includes(forcedMap)?forcedMap:remaining[0];
 const hour=pick(hours.filter(h=>h!==previous.hour),random);
 return {mapType,weather:chooseClimateWeather(mapType,hour,random),hour,duration:35+Math.floor(random()*21),remaining:remaining.filter(m=>m!==mapType)};
}
export function advanceScene(elapsed,delta,playing,hidden=false){return elapsed+(playing&&!hidden?Math.min(.25,Math.max(0,delta)):0);}
