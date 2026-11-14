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
const models={rabbit:rabbitParts,duck:duckParts,fox:foxParts,sheep:sheepParts};
const maxParts=Math.max(...Object.values(models).map(parts=>parts.length));
const palettes=Array.from({length:WILDLIFE_LIMIT},(_,id)=>Object.fromEntries(Object.entries({
  body:id<8 ? ['#c8ad8c','#e5ddd0','#a38c76'][id%3] : id%2 ? '#c7aa76' : '#b6ada0',
  head:id%2?'#b89a69':'#3e735c',wing:'#786c55',bill:'#e3aa48',eye:'#202b29',pink:'#d99f9d',tail:'#eee8db',
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
      const gait=animal.phase*(animal.state==='flee'?13:animal.type==='sheep'?4:7);
      const bounce=animal.type==='rabbit' ? (moving?Math.abs(Math.sin(gait))*.08:Math.sin(animal.phase*2)*.008) : animal.type==='duck'?Math.sin(animal.phase*2)*.025:Math.sin(gait)*.008;
      const c=Math.cos(animal.heading),s=Math.sin(animal.heading);
      for(const [pos,size,color,limb] of models[animal.type]){
        const [x,y,z]=pos;
        transform.position.set(animal.x+x*c+z*s,animal.y+y+bounce+(moving&&limb?Math.sin(gait)*limb*.025:0),animal.z-x*s+z*c);
        transform.rotation.set(0,animal.heading,0);transform.scale.set(...size);transform.updateMatrix();
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
