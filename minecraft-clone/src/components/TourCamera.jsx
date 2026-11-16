import { natureUniforms } from '../game/naturalEvents';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from 'three';
import { landscape } from '../game/landscape';
import { createTourRoute, nextTourStop, tourPose, tourView, easeTourRotation } from '../game/tour';
import { useStore } from '../hooks/useStore';
import { playerView } from '../game/navigation';

export default function TourCamera(){
 const route=useMemo(()=>createTourRoute(landscape),[]);
 const preferred={forest:'sailboat',meadow:'windmill',islands:'lighthouse',snow:'cabin',canal:'belltower',onsen:'bath',oasis:'market',autumn:'mill',coral:'bungalow',sky:'observatory',shrine:'shrine',moon:'moonGate',pine:'byeolseo'}[landscape.mapType];
 const highlights=route.shots.filter(s=>s.stop.type===preferred);
 const opening=highlights.length?highlights:route.shots;
 const cursor=useRef(opening[Math.floor(Math.random()*opening.length)].index),seek=useRef(tourView.seek),hold=useRef(3),lastStop=useRef(-1),first=useRef(true);
 const aim=useMemo(()=>new PerspectiveCamera(),[]);
 useEffect(()=>{useStore.getState().setReady(true);},[]);
 useFrame(({camera,gl},delta)=>{
  const playing=useStore.getState().playing&&!document.hidden;
  if(seek.current!==tourView.seek){cursor.current=nextTourStop(route,cursor.current);seek.current=tourView.seek;hold.current=3;lastStop.current=cursor.current;first.current=true;}
  if(playing){
   const dt=Math.min(delta,.05);
   if(hold.current>0)hold.current=Math.max(0,hold.current-dt);
   else {
    const previous=cursor.current;cursor.current=(cursor.current+dt*3.6)%route.count;
    const stop=route.shots.find(s=>s.index>previous && s.index<=cursor.current && s.index!==lastStop.current);
    if(stop){hold.current=3;lastStop.current=stop.index;}
   }
  }
  const pose=tourPose(route,cursor.current);
  if((natureUniforms.auroraStrength.value>.1||natureUniforms.rainbowStrength.value>.1)&&natureUniforms.natureTime.value%40<14)pose.target.y=Math.max(pose.target.y,pose.position.y+10);
  camera.position.copy(pose.position);aim.position.copy(pose.position);aim.lookAt(pose.target);
  if(first.current){camera.quaternion.copy(aim.quaternion);first.current=false;}
  else if(playing)easeTourRotation(camera.quaternion,aim.quaternion,delta);
  Object.assign(playerView,{x:camera.position.x,y:camera.position.y-1.62,z:camera.position.z,heading:camera.rotation.y});
  tourView.name=pose.name;tourView.shot=cursor.current;
  gl.domElement.dataset.tour='true';gl.domElement.dataset.tourRevision=String(useStore.getState().tourRevision||0);gl.domElement.dataset.mapType=landscape.mapType;gl.domElement.dataset.seed=landscape.seed;gl.domElement.dataset.tourCursor=cursor.current.toFixed(3);
  gl.domElement.dataset.position=camera.position.toArray().map(n=>n.toFixed(3)).join(',');
  gl.domElement.dataset.geometries=String(gl.info.memory?.geometries||0);
  gl.info.reset();
 });
 return null;
}
