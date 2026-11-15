import { MAP_TYPES } from './mapConfig';
const maps=Object.keys(MAP_TYPES);
const weather=['clear','cloudy','rain','fog','snow'];
const hours=[6.5,9,13,17.5,19,22];
const pick=(values,random)=>values[Math.min(values.length-1,Math.floor(random()*values.length))];
// A shuffled bag guarantees all landscapes appear before repeating a cycle.
export function sceneDeck(random=Math.random){const deck=[...maps];for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;}
export function chooseTourScene(previous={},deck=[],random=Math.random){
 let remaining=deck.filter(m=>m!==previous.mapType);
 if(!remaining.length)remaining=sceneDeck(random).filter(m=>m!==previous.mapType);
 const mapType=remaining[0];
 return {mapType,weather:pick(weather.filter(w=>w!==previous.weather),random),hour:pick(hours.filter(h=>h!==previous.hour),random),duration:35+Math.floor(random()*21),remaining:remaining.slice(1)};
}
export function advanceScene(elapsed,delta,playing,hidden=false){return elapsed+(playing&&!hidden?Math.min(.25,Math.max(0,delta)):0);}
