import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BoxGeometry, Color, DynamicDrawUsage, MeshStandardMaterial, Object3D } from 'three';
import { landscape } from '../game/landscape';
import { playerView } from '../game/navigation';
import { useStore } from '../hooks/useStore';
import { createWildlife, stepWildlife, wildlifeHabitat, WILDLIFE_LIMIT, WILDLIFE_RANGE } from '../game/wildlife';
import { sampleDay, worldClock } from '../game/daylight';
import { weatherState } from '../game/weather';

// Each tuple is a local centre, size, colour role and optional animated limb.
const rabbitParts=[
  [[0,.3,0],[.38,.36,.52],'body'],[[0,.54,-.25],[.3,.3,.3],'body'],
  [[-.09,.85,-.25],[.085,.4,.11],'body'],[[.09,.85,-.25],[.085,.4,.11],'body'],
  [[-.09,.86,-.31],[.04,.28,.015],'pink'],[[.09,.86,-.31],[.04,.28,.015],'pink'],
  [[-.09,.57,-.407],[.035,.045,.02],'eye'],[[.09,.57,-.407],[.035,.045,.02],'eye'],
  [[0,.49,-.42],[.045,.035,.025],'pink'],[[0,.32,.3],[.17,.17,.17],'tail'],
  [[-.14,.09,-.18],[.12,.13,.19],'body',1],[[.14,.09,-.18],[.12,.13,.19],'body',-1],
  [[-.14,.09,.18],[.14,.13,.2],'body',-1],[[.14,.09,.18],[.14,.13,.2],'body',1],
];
const duckParts=[
  [[0,.19,0],[.44,.3,.6],'body'],[[0,.45,-.27],[.28,.28,.28],'head'],
  [[0,.41,-.46],[.24,.075,.18],'bill'],[[0,.32,-.23],[.3,.06,.26],'tail'],
  [[-.235,.21,0],[.06,.18,.39],'wing'],[[.235,.21,0],[.06,.18,.39],'wing'],
  [[0,.24,.34],[.22,.12,.19],'wing'],
  [[-.145,.49,-.32],[.02,.04,.045],'eye'],[[.145,.49,-.32],[.02,.04,.045],'eye'],
];
const foxParts=[
  [[0,.4,0],[.43,.38,.65],'fox'],[[0,.61,-.34],[.34,.32,.32],'fox'],
  [[0,.53,-.55],[.23,.16,.2],'cream'],[[0,.55,-.66],[.09,.08,.04],'eye'],
  [[-.12,.86,-.31],[.12,.23,.13],'fox'],[[.12,.86,-.31],[.12,.23,.13],'fox'],
  [[-.12,.87,-.385],[.065,.13,.02],'dark'],[[.12,.87,-.385],[.065,.13,.02],'dark'],
  [[-.173,.65,-.42],[.02,.045,.055],'eye'],[[.173,.65,-.42],[.02,.045,.055],'eye'],
  [[0,.36,.47],[.26,.24,.37],'fox'],[[0,.36,.72],[.25,.23,.16],'cream'],
  [[-.15,.14,-.22],[.12,.26,.13],'dark',1],[[.15,.14,-.22],[.12,.26,.13],'dark',-1],
  [[-.15,.14,.22],[.12,.26,.13],'dark',-1],[[.15,.14,.22],[.12,.26,.13],'dark',1],
];
const sheepParts=[
  [[0,.57,0],[.66,.55,.76],'wool'],[[0,.83,0],[.5,.12,.58],'wool'],
  [[0,.65,-.46],[.31,.33,.31],'face'],[[0,.85,-.41],[.36,.13,.27],'wool'],
  [[-.23,.72,-.42],[.17,.1,.14],'face'],[[.23,.72,-.42],[.17,.1,.14],'face'],
  [[-.1,.69,-.625],[.045,.045,.02],'eye'],[[.1,.69,-.625],[.045,.045,.02],'eye'],
  [[0,.52,.43],[.17,.2,.17],'wool'],
  [[-.22,.17,-.25],[.14,.32,.15],'face',1],[[.22,.17,-.25],[.14,.32,.15],'face',-1],
  [[-.22,.17,.25],[.14,.32,.15],'face',-1],[[.22,.17,.25],[.14,.32,.15],'face',1],
];
const deerParts=[
 [[0,.85,0],[.5,.48,.85],'coat'],[[0,1.25,-.42],[.28,.7,.26],'coat'],[[0,1.63,-.53],[.3,.28,.43],'coat'],
 [[0,1.57,-.78],[.21,.16,.12],'dark'],[[-.24,1.75,-.45],[.24,.12,.12],'cream'],[[.24,1.75,-.45],[.24,.12,.12],'cream'],
 [[-.15,1.68,-.65],[.03,.05,.04],'eye'],[[.15,1.68,-.65],[.03,.05,.04],'eye'],
 [[-.12,1.98,-.45],[.06,.55,.06],'horn'],[[.12,1.98,-.45],[.06,.55,.06],'horn'],
 [[-.23,2.07,-.45],[.25,.06,.06],'horn'],[[.23,2.07,-.45],[.25,.06,.06],'horn'],
 [[-.34,2.17,-.45],[.06,.24,.06],'horn'],[[.34,2.17,-.45],[.06,.24,.06],'horn'],
 [[0,.88,.5],[.18,.2,.19],'cream'],
 ...[-1,1].flatMap(x=>[-1,1].map(z=>[[x*.18,.34,z*.3],[.1,.68,.12],'coat',x*z])),
];
const horseParts=[
 [[0,1,0],[.68,.62,1.22],'horse'],[[0,1.32,-.53],[.4,.75,.38],'horse'],[[0,1.74,-.75],[.4,.42,.67],'horse'],
 [[0,1.63,-1.08],[.4,.2,.13],'dark'],[[-.14,2,-.56],[.12,.15,.14],'horse'],[[.14,2,-.56],[.12,.15,.14],'horse'],
 [[-.21,1.8,-.91],[.03,.06,.06],'eye'],[[.21,1.8,-.91],[.03,.06,.06],'eye'],
 [[0,1.45,-.29],[.16,.6,.12],'mane'],[[0,1.06,.76],[.23,.8,.21],'mane'],
 ...[-1,1].flatMap(x=>[-1,1].map(z=>[[x*.24,.38,z*.44],[.16,.76,.17],'horse',x*z])),
 ...[-1,1].flatMap(x=>[-1,1].map(z=>[[x*.24,.08,z*.44],[.19,.14,.21],'dark',x*z])),
];
const gullParts=[
 [[0,0,0],[.28,.26,.55],'white'],[[0,.14,-.3],[.24,.24,.23],'white'],[[0,.12,-.49],[.14,.08,.2],'bill'],
 [[-.125,.19,-.35],[.02,.04,.04],'eye'],[[.125,.19,-.35],[.02,.04,.04],'eye'],
 [[-.5,.02,0],[.8,.045,.3],'white',2],[[.5,.02,0],[.8,.045,.3],'white',-2],
 [[-.94,.02,.04],[.18,.045,.23],'dark',2],[[.94,.02,.04],[.18,.045,.23],'dark',-2],[[0,0,.36],[.28,.06,.23],'white'],
];
const fishParts=[
 [[0,0,0],[.2,.22,.6],'fish'],[[0,0,-.32],[.17,.18,.12],'fish'],
 [[-.105,.04,-.21],[.025,.05,.05],'eye'],[[.105,.04,-.21],[.025,.05,.05],'eye'],
 [[0,0,.42],[.35,.28,.09],'fin',3],[[0,.15,.03],[.045,.15,.24],'fin'],[[-.16,-.02,-.02],[.18,.04,.2],'fin'],[[.16,-.02,-.02],[.18,.04,.2],'fin'],
];
const squirrelParts=[
 [[0,.22,0],[.25,.26,.4],'squirrel'],[[0,.43,-.2],[.24,.24,.25],'squirrel'],
 [[0,.36,-.32],[.15,.12,.12],'cream'],[[0,.39,-.39],[.06,.055,.03],'eye'],
 [[-.08,.59,-.18],[.07,.13,.08],'squirrel'],[[.08,.59,-.18],[.07,.13,.08],'squirrel'],
 [[-.125,.46,-.25],[.025,.05,.04],'eye'],[[.125,.46,-.25],[.025,.05,.04],'eye'],
 [[0,.4,.29],[.2,.5,.19],'squirrel'],[[0,.66,.24],[.23,.23,.22],'squirrel'],
 [[0,.37,.39],[.08,.42,.03],'cream'],[[0,.365,.02],[.055,.025,.3],'dark'],
 ...[-1,1].flatMap(x=>[-1,1].map(z=>[[x*.09,.07,z*.12],[.08,.1,.14],'squirrel',x*z])),
];
const pheasantParts=[
 [[0,.42,0],[.38,.4,.6],'pheasant'],[[0,.67,-.28],[.2,.35,.22],'green'],
 [[0,.87,-.36],[.22,.22,.25],'green'],[[0,.82,-.53],[.12,.07,.13],'bill'],
 [[-.115,.86,-.4],[.025,.12,.13],'red'],[[.115,.86,-.4],[.025,.12,.13],'red'],
 [[-.13,.89,-.42],[.02,.04,.035],'eye'],[[.13,.89,-.42],[.02,.04,.035],'eye'],
 [[-.2,.44,.04],[.055,.24,.42],'wing'],[[.2,.44,.04],[.055,.24,.42],'wing'],
 [[0,.43,.5],[.17,.11,.48],'pheasant'],[[0,.47,.84],[.11,.085,.3],'pheasant'],
 [[-.12,.13,0],[.055,.25,.06],'bill',1],[[.12,.13,0],[.055,.25,.06],'bill',-1],
 [[-.12,.03,-.06],[.09,.045,.17],'bill',1],[[.12,.03,-.06],[.09,.045,.17],'bill',-1],
];
const turtleParts=[
 [[0,.16,0],[.48,.2,.58],'shell'],[[0,.29,0],[.34,.14,.4],'shellTop'],
 [[0,.18,-.39],[.22,.18,.23],'green'],
 [[-.115,.22,-.45],[.02,.04,.035],'eye'],[[.115,.22,-.45],[.02,.04,.035],'eye'],
 [[0,.12,.36],[.08,.08,.18],'green'],
 ...[-1,1].flatMap(x=>[-1,1].map(z=>[[x*.24,.07,z*.2],[.16,.12,.17],'green',x*z])),
 ...[-1,1].flatMap(x=>[-1,1].map(z=>[[x*.09,.365,z*.11],[.14,.02,.16],'shell'])),
];
const magpieParts=[
 [[0,.32,0],[.28,.3,.4],'ink'],[[0,.31,-.07],[.29,.2,.25],'white'],
 [[0,.56,-.18],[.23,.24,.25],'ink'],[[0,.52,-.37],[.09,.065,.17],'ink'],
 [[-.12,.59,-.23],[.02,.035,.035],'eye'],[[.12,.59,-.23],[.02,.035,.035],'eye'],
 [[-.16,.38,.02],[.06,.23,.34],'blue'],[[.16,.38,.02],[.06,.23,.34],'blue'],
 [[-.19,.39,-.04],[.025,.15,.17],'white'],[[.19,.39,-.04],[.025,.15,.17],'white'],
 [[0,.29,.38],[.13,.06,.4],'blue'],[[0,.27,.62],[.095,.05,.16],'ink'],
 [[-.09,.1,-.02],[.04,.19,.045],'ink',1],[[.09,.1,-.02],[.04,.19,.045],'ink',-1],
 [[-.09,.02,-.09],[.07,.04,.14],'ink',1],[[.09,.02,-.09],[.07,.04,.14],'ink',-1],
];
const macaqueParts=[
 [[0,.55,0],[.44,.64,.4],'fur'],[[0,.93,-.08],[.4,.36,.36],'fur'],
 [[0,.92,-.27],[.29,.24,.045],'monkeyFace'],[[0,.84,-.32],[.2,.11,.1],'monkeyFace'],
 [[-.085,.96,-.3],[.04,.04,.025],'eye'],[[.085,.96,-.3],[.04,.04,.025],'eye'],
 [[-.24,.95,-.08],[.12,.17,.1],'monkeyFace'],[[.24,.95,-.08],[.12,.17,.1],'monkeyFace'],
 [[-.27,.45,-.08],[.14,.55,.15],'fur',1],[[.27,.45,-.08],[.14,.55,.15],'fur',-1],
 [[-.27,.17,-.11],[.14,.12,.17],'monkeyFace',1],[[.27,.17,-.11],[.14,.12,.17],'monkeyFace',-1],
 [[-.14,.18,.04],[.18,.34,.2],'fur',-1],[[.14,.18,.04],[.18,.34,.2],'fur',1],
 [[-.14,.06,-.06],[.18,.1,.3],'monkeyFace',-1],[[.14,.06,-.06],[.18,.1,.3],'monkeyFace',1],
 [[0,.4,.28],[.12,.13,.18],'fur'],
];
const camelParts=[
 [[0,1.2,0],[.78,.7,1.5],'camel'],[[0,1.73,.1],[.6,.55,.65],'camel'],[[0,2.02,.1],[.38,.18,.38],'camel'],
 [[0,1.65,-.7],[.35,1.1,.4],'camel'],[[0,2.22,-.88],[.36,.35,.55],'camel'],[[0,2.15,-1.2],[.32,.21,.2],'cream'],
 [[-.22,2.4,-.69],[.17,.15,.12],'camel'],[[.22,2.4,-.69],[.17,.15,.12],'camel'],
 [[-.19,2.27,-1.02],[.025,.055,.06],'eye'],[[.19,2.27,-1.02],[.025,.055,.06],'eye'],
 [[0,.9,.85],[.12,.6,.12],'camel'],[[0,.62,.85],[.16,.15,.16],'dark'],
 ...[-1,1].flatMap(x=>[-1,1].map(z=>[[x*.27,.5,z*.52],[.16,1,.18],'camel',x*z])),
 ...[-1,1].flatMap(x=>[-1,1].map(z=>[[x*.27,.08,z*.52],[.24,.14,.28],'dark',x*z])),
];
const fennecParts=[
 [[0,.33,0],[.35,.32,.56],'fennec'],[[0,.53,-.29],[.3,.28,.29],'fennec'],
 [[0,.46,-.48],[.2,.13,.17],'cream'],[[0,.48,-.58],[.065,.06,.035],'eye'],
 [[-.14,.86,-.25],[.18,.48,.13],'fennec'],[[.14,.86,-.25],[.18,.48,.13],'fennec'],
 [[-.14,.88,-.32],[.11,.31,.02],'pink'],[[.14,.88,-.32],[.11,.31,.02],'pink'],
 [[-.155,.57,-.36],[.025,.045,.055],'eye'],[[.155,.57,-.36],[.025,.045,.055],'eye'],
 [[0,.27,.43],[.22,.2,.34],'fennec'],[[0,.27,.64],[.18,.18,.12],'dark'],
 ...[-1,1].flatMap(x=>[-1,1].map(z=>[[x*.12,.11,z*.18],[.1,.2,.13],'fennec',x*z])),
];
const crabParts=[
 [[0,.2,0],[.42,.22,.3],'crab'],[[0,.32,-.09],[.3,.07,.16],'crab'],
 [[-.12,.38,-.14],[.045,.14,.045],'crab'],[[.12,.38,-.14],[.045,.14,.045],'crab'],
 [[-.12,.45,-.16],[.06,.06,.06],'eye'],[[.12,.45,-.16],[.06,.06,.06],'eye'],
 ...[-1,1].flatMap(x=>[-1,0,1].map(z=>[[x*.3,.09,z*.12],[.22,.055,.06],'crab',x*(z===0?-1:1)])),
 [[-.3,.24,-.24],[.12,.1,.24],'crab',1],[[.3,.24,-.24],[.12,.1,.24],'crab',-1],
 [[-.31,.29,-.38],[.17,.13,.18],'crab'],[[.31,.29,-.38],[.17,.13,.18],'crab'],
];
const seaTurtleParts=[
 [[0,.12,0],[.55,.23,.72],'shell'],[[0,.27,0],[.39,.1,.5],'shellTop'],
 [[0,.11,-.48],[.25,.19,.24],'green'],
 [[-.13,.15,-.54],[.02,.04,.04],'eye'],[[.13,.15,-.54],[.02,.04,.04],'eye'],
 [[-.43,.04,-.18],[.38,.065,.24],'green',2],[[.43,.04,-.18],[.38,.065,.24],'green',-2],
 [[-.31,.04,.3],[.23,.06,.23],'green',2],[[.31,.04,.3],[.23,.06,.23],'green',-2],
 [[0,.06,.44],[.09,.07,.17],'green'],
];
const butterflyParts=[[[0,0,0],[.045,.045,.22],'dark'],[[-.16,.01,-.04],[.28,.025,.26],'butterfly',2],[[.16,.01,-.04],[.28,.025,.26],'butterfly',-2],[[-.12,0,.13],[.2,.025,.17],'butterfly',2],[[.12,0,.13],[.2,.025,.17],'butterfly',-2]];
const arcticFoxParts=foxParts.map(([p,s,c,l])=>[p,s,['fox','cream'].includes(c)?'white':c,l]);
const arcticHareParts=rabbitParts.map(([p,s,c,l])=>[p,s,['body','tail'].includes(c)?'white':c,l]);
const models={arcticFox:arcticFoxParts,arcticHare:arcticHareParts,butterfly:butterflyParts,crab:crabParts,seaTurtle:seaTurtleParts,camel:camelParts,fennec:fennecParts,rabbit:rabbitParts,duck:duckParts,fox:foxParts,sheep:sheepParts,deer:deerParts,horse:horseParts,gull:gullParts,fish:fishParts,squirrel:squirrelParts,pheasant:pheasantParts,turtle:turtleParts,magpie:magpieParts,macaque:macaqueParts};
const maxParts=Math.max(...Object.values(models).map(parts=>parts.length));
const palettes=Array.from({length:WILDLIFE_LIMIT},(_,id)=>Object.fromEntries(Object.entries({
  body:id<8 ? ['#c8ad8c','#e5ddd0','#a38c76'][id%3] : id%2 ? '#c7aa76' : '#b6ada0',
  head:id%2?'#b89a69':'#3e735c',wing:'#786c55',bill:'#e3aa48',eye:'#202b29',pink:'#d99f9d',tail:'#eee8db',
  coat:'#ba9168',horn:'#76634a',horse:id%2?'#b58b63':'#785644',mane:'#3d352c',white:'#eeeede',fish:id%2?'#e8ad65':'#83c7c2',fin:'#d9c17d',
  squirrel:id%2?'#a96c3e':'#936648',
  pheasant:id%2?'#ad8655':'#746b48',green:'#47715b',red:'#b5483b',
  shell:id%2?'#67734d':'#77764f',shellTop:'#98a06a',
  ink:'#263336',blue:'#345d6b',
  butterfly:['#dfb052','#8baed2','#d291ab'][id%3],
  crab:id%2?'#bd7651':'#cf9465',
  camel:id%2?'#b99461':'#c5aa7c',fennec:'#dec89c',
  fur:id%2?'#a59d8a':'#bbb19d',monkeyFace:'#c58d83',
  fox:id%2?'#c4783c':'#d18a46',cream:'#eee0c6',dark:'#594334',wool:id%2?'#d3cbc0':'#efe6d5',face:'#8c7b67',
}).map(([key,value])=>[key,new Color(value)])));

export default function Wildlife() {
  const enabled=useStore(s=>s.showWildlife);
  const habitat=useMemo(()=>wildlifeHabitat(landscape),[]);
  const animals=useMemo(()=>createWildlife(habitat,useStore.getState().world.blocks),[habitat]);
  const mesh=useRef(),telemetry=useRef(0);
  const geometry=useMemo(()=>new BoxGeometry(1,1,1),[]);
  const material=useMemo(()=>new MeshStandardMaterial({roughness:.95}),[]);
  const transform=useMemo(()=>new Object3D(),[]);
  useEffect(()=>()=>{geometry.dispose();material.dispose();},[geometry,material]);
  useEffect(()=>{if(mesh.current)mesh.current.instanceMatrix.setUsage(DynamicDrawUsage);},[]);
  useFrame(({gl},dt)=>{
    const state=useStore.getState();
    const running=enabled && state.playing && !document.hidden;
    stepWildlife(animals,habitat,state.world.blocks,playerView,dt,{running,daylight:sampleDay(worldClock.hour).daylight,roughWeather:weatherState.rain>.5 || weatherState.snow>.5});
    let count=0,visible=0;
    for(const animal of animals){
      if(!enabled || !animal.active || Math.hypot(animal.x-playerView.x,animal.z-playerView.z)>WILDLIFE_RANGE)continue;
      visible++;
      const moving=animal.state!=='rest';
      const gait=animal.phase*(animal.state==='flee'?13:animal.type==='turtle'?2:animal.type==='sheep'?4:7);
      const bounce=['rabbit','arcticHare'].includes(animal.type) ? (moving?Math.abs(Math.sin(gait))*.08:Math.sin(animal.phase*2)*.008) : animal.type==='duck'?Math.sin(animal.phase*2)*.025:Math.sin(gait)*.008;
      const modelHeading=animal.heading+(animal.type==='crab'?Math.PI/2:0);
      const c=Math.cos(modelHeading),s=Math.sin(modelHeading);
      for(const [pos,size,color,limb] of models[animal.type]){
        let [x,y,z]=pos;
        if(animal.type==='squirrel'&&!moving&&z<-.15)y+=Math.sin(animal.phase*4)*.018;
        if(animal.type==='pheasant'&&!moving&&z<-.2)y-=Math.max(0,Math.sin(animal.phase*2.2))*.09;
        if(animal.type==='magpie'&&!moving&&z<-.15)y-=Math.max(0,Math.sin(animal.phase*2.6))*.06;
        if(animal.type==='macaque'&&!moving&&y>.8)y+=Math.sin(animal.phase*1.5)*.012;
        if(animal.type==='butterfly'&&limb)y+=Math.sin(animal.phase*15)*Math.abs(x)*.8;
        if(animal.type==='seaTurtle'&&limb)y+=Math.sin(animal.phase*3)*Math.sign(limb)*x*.15;
        if(animal.type==='fish'&&limb===3)x+=Math.sin(gait)*.08;
        if(animal.type==='gull'&&limb)y+=Math.sin(gait*.6)*Math.sign(limb)*x*.3;
        transform.position.set(animal.x+x*c+z*s,animal.y+y+bounce+(moving&&limb?Math.sin(gait)*limb*.025:0),animal.z-x*s+z*c);
        transform.rotation.set(moving&&limb&&Math.abs(limb)===1?Math.sin(gait)*limb*.25:0,modelHeading,animal.type==='gull'&&limb?Math.sin(gait*.6)*Math.sign(limb)*.35:0);transform.scale.set(...size);transform.updateMatrix();
        mesh.current.setMatrixAt(count,transform.matrix);mesh.current.setColorAt(count,palettes[animal.id][color]);count++;
      }
    }
    mesh.current.count=count;mesh.current.instanceMatrix.needsUpdate=true;
    if(mesh.current.instanceColor)mesh.current.instanceColor.needsUpdate=true;
    telemetry.current+=dt;
    if(telemetry.current>.25){
      telemetry.current=0;
      gl.domElement.dataset.wildlifeVisible=String(visible);
      gl.domElement.dataset.wildlife=JSON.stringify(animals.map(a=>({id:a.id,type:a.type,active:a.active,state:a.state,x:+a.x.toFixed(2),y:a.y,z:+a.z.toFixed(2)})));
    }
  });
  return <instancedMesh ref={mesh} args={[geometry,material,WILDLIFE_LIMIT*maxParts]} frustumCulled={false} castShadow receiveShadow name="wildlife-instances" />;
}
