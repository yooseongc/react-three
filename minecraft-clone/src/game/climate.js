// Game climate weights, not measured meteorological probabilities.
const temperate={clear:42,cloudy:28,rain:22,fog:8,snow:0};
export const CLIMATES={
 forest:{name:'촉촉한 숲',description:'비와 아침 안개가 머무는 숲',weights:{clear:32,cloudy:27,rain:28,fog:13,snow:0}},
 meadow:{name:'온화한 들판',description:'긴 맑은 날과 가끔 지나가는 비',weights:{clear:55,cloudy:25,rain:16,fog:4,snow:0}},
 islands:{name:'해양',description:'바닷바람과 새벽 해무',weights:{clear:43,cloudy:29,rain:20,fog:8,snow:0}},
 snow:{name:'한랭',description:'눈과 구름 사이로 드러나는 맑은 하늘',weights:{clear:28,cloudy:27,rain:0,fog:8,snow:37}},
 canal:{name:'해안 도시',description:'햇살과 비, 이른 아침의 물안개',weights:temperate},
 onsen:{name:'습윤 산림',description:'잔잔한 비와 짙은 아침 안개',weights:{clear:28,cloudy:27,rain:30,fog:15,snow:0}},
 oasis:{name:'건조 사막',description:'긴 햇살과 아주 드문 짧은 비',weights:{clear:85,cloudy:13,rain:2,fog:0,snow:0}},
 autumn:{name:'가을 계곡',description:'흐린 하늘과 계곡의 아침 안개',weights:{clear:36,cloudy:32,rain:20,fog:12,snow:0}},
 coral:{name:'열대 해양',description:'햇살 사이 짧게 지나가는 소나기',weights:{clear:53,cloudy:22,rain:24,fog:1,snow:0}},
 sky:{name:'구름 위',description:'햇살과 흐르는 구름 안개',weights:{clear:60,cloudy:30,rain:0,fog:10,snow:0}},
 shrine:{name:'온화한 정원',description:'벚꽃 사이 햇살과 옅은 아침 안개',weights:temperate},
 moon:{name:'수변 정원',description:'연못의 아침 안개와 잔잔한 비',weights:{clear:38,cloudy:28,rain:22,fog:12,snow:0}},
 pine:{name:'산자락 정원',description:'솔숲의 햇살과 새벽 안개',weights:temperate},
};
export const climateFor=mapType=>CLIMATES[mapType]||CLIMATES.forest;
export function climateWeights(mapType,hour=9){
 const weights={...climateFor(mapType).weights};
 const h=((Number.isFinite(hour)?hour:9)%24+24)%24;
 const dawn=Math.max(0,1-Math.abs(h-6)/3);
 weights.fog*=h>=10&&h<18?.18:1+3*dawn;
 return weights;
}
export function chooseClimateWeather(mapType,hour=9,random=Math.random,allowed){
 const entries=Object.entries(climateWeights(mapType,hour)).filter(([mode,w])=>w>0&&(!allowed||allowed.includes(mode)));
 if(!entries.length)return 'clear';
 let value=Math.max(0,Math.min(.999999999,random()))*entries.reduce((sum,[,w])=>sum+w,0);
 for(const [mode,weight] of entries){value-=weight;if(value<0)return mode;}
 return entries.at(-1)[0];
}
export function climateDuration(mapType,mode,random=Math.random,hour=9){
 let range={clear:[240,480],cloudy:[90,180],rain:[120,240],fog:[60,150],snow:[150,300]}[mode]||[180,300];
 if(mode==='clear'&&mapType==='oasis')range=[360,600];
 if(mode==='rain'&&mapType==='coral')range=[45,90];
 if(mode==='rain'&&mapType==='oasis')range=[30,60];
 if(mode==='fog'&&hour>=10&&hour<18)range=[30,60];
 return range[0]+Math.max(0,Math.min(1,random()))*(range[1]-range[0]);
}
