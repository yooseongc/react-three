import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { PerspectiveCamera, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../hooks/useStore';
import { landscape } from '../game/landscape';
import { createTourRoute, tourPose } from '../game/tour';
import TourCamera from './TourCamera';
vi.mock('@react-three/fiber',()=>({useFrame:vi.fn()}));
vi.mock('../hooks/useStore',()=>({useStore:{getState:vi.fn()}}));
vi.mock('../game/landscape',()=>({landscape:{seed:'camera-test',size:100,sites:[],water:[],cubes:[]}}));
test('tour camera looks toward scenery, advances on play, and freezes when paused',()=>{
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const state={playing:false,setReady:vi.fn()};useStore.getState.mockReturnValue(state);
 const host=document.createElement('div'),root=createRoot(host);
 try {
  act(()=>root.render(<TourCamera/>));
  const tick=useFrame.mock.calls.at(-1)[0],camera=new PerspectiveCamera(),gl={domElement:{dataset:{}},info:{reset:vi.fn()}};
  tick({camera,gl},.016);
  const route=createTourRoute(landscape),pose=tourPose(route,route.shots[0].index);
  const direction=camera.getWorldDirection(new Vector3()),toward=pose.target.clone().sub(camera.position).normalize();
  expect(direction.dot(toward)).toBeGreaterThan(.999);
  const start=camera.position.clone();state.playing=true;
  for(let i=0;i<150;i++)tick({camera,gl},.05);
  expect(camera.position.distanceTo(start)).toBeGreaterThan(1);
  state.playing=false;const paused=camera.position.clone(),rotation=camera.quaternion.clone();
  tick({camera,gl},.05);expect(camera.position.equals(paused)).toBe(true);expect(camera.quaternion.equals(rotation)).toBe(true);
 } finally {act(()=>root.unmount());delete globalThis.IS_REACT_ACT_ENVIRONMENT;}
});
