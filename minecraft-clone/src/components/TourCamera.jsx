import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from 'three';
import { landscape } from '../game/landscape';
import { createTourRoute, nextTourStop, tourPose, tourView } from '../game/tour';
import { useStore } from '../hooks/useStore';
import { playerView } from '../game/navigation';

export default function TourCamera(){
 const route=useMemo(()=>createTourRoute(landscape),[]);
 const cursor=useRef(route.shots[0].index),seek=useRef(tourView.seek),hold=useRef(3),lastStop=useRef(-1),first=useRef(true);
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
  camera.position.copy(pose.position);aim.position.copy(pose.position);aim.lookAt(pose.target);
  if(first.current){camera.quaternion.copy(aim.quaternion);first.current=false;}
  else if(playing)camera.quaternion.slerp(aim.quaternion,1-Math.exp(-Math.min(delta,.05)*1.4));
  Object.assign(playerView,{x:camera.position.x,y:camera.position.y-1.62,z:camera.position.z,heading:camera.rotation.y});
  tourView.name=pose.name;tourView.shot=cursor.current;
  gl.domElement.dataset.tour='true';gl.domElement.dataset.tourCursor=cursor.current.toFixed(3);
  gl.domElement.dataset.position=camera.position.toArray().map(n=>n.toFixed(3)).join(',');
  gl.info.reset();
 });
 return null;
}
