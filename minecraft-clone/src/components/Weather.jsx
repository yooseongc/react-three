import { activeMap } from '../game/mapConfig';
import { worldClock } from '../game/daylight';
import { climateFor } from '../game/climate';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import { useStore } from '../hooks/useStore';
import { createWeatherSchedule, advanceWeatherSchedule, roofAt, roofHeights, stepWeather, weatherDuration, weatherState } from '../game/weather';
import { weatherUniforms } from '../game/weatherMaterials';
import { ambienceStatus } from '../game/ambience';
import { useAmbience } from '../hooks/useAmbience';

const DROP_COUNT=600;
const SNOW_COUNT=420;
const softenSnow=shader=>{
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= 1.-smoothstep(.2,.5,length(gl_PointCoord-vec2(.5)));');
};
export default function Weather() {
  useAmbience();
  const world=useStore(s=>s.world);
  const roofs=useMemo(()=>roofHeights(world.blocks),[world]);
  const rain=useRef(); const snow=useRef(); const clock=useRef(0);
  const schedule=useRef(null); const lastMode=useRef(null);
  if(!schedule.current)schedule.current=createWeatherSchedule(activeMap.mapType,useStore.getState().timeOfDay);
  const geometry=useMemo(()=>{
    const value=new BufferGeometry();
    value.setAttribute('position',new Float32BufferAttribute(new Float32Array(DROP_COUNT*6),3));
    return value;
  },[]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  const snowGeometry=useMemo(()=>{
    const value=new BufferGeometry();
    value.setAttribute('position',new Float32BufferAttribute(new Float32Array(SNOW_COUNT*3),3));
    return value;
  },[]);
  useEffect(()=>()=>snowGeometry.dispose(),[snowGeometry]);
  useEffect(()=>{
    weatherUniforms.weatherRoof.value.image.data=roofs;
    weatherUniforms.weatherRoof.value.needsUpdate=true;
  },[roofs]);
  useFrame(({camera,gl},delta)=>{
    const state=useStore.getState();
    if(lastMode.current!==state.weatherMode){
      schedule.current=state.weatherMode==='auto' ? (lastMode.current===null?schedule.current:createWeatherSchedule(activeMap.mapType,worldClock.hour)) : {mode:state.weatherMode,remaining:weatherDuration(Math.random,activeMap.mapType,state.weatherMode,worldClock.hour)};
      lastMode.current=state.weatherMode;
    }
    schedule.current=advanceWeatherSchedule(schedule.current,delta,state.weatherMode==='auto' && state.playing && !document.hidden,Math.random,{mapType:activeMap.mapType,hour:worldClock.hour});
    const current=state.weatherMode==='auto' ? schedule.current.mode : state.weatherMode;
    weatherState.current=current;
    // Settings preview transitions in the menu; falling rain remains paused there.
    Object.assign(weatherState,stepWeather(weatherState,current,document.hidden ? 0 : delta));
    weatherUniforms.weatherCloud.value=weatherState.cloud;
    weatherUniforms.weatherWet.value=weatherState.wet;
    weatherUniforms.weatherFog.value=weatherState.fog;
    weatherUniforms.weatherSnow.value=weatherState.snow;
    weatherState.sheltered=roofAt(roofs,camera.position.x,camera.position.z)>camera.position.y;
    const moving=state.playing && state.landscapeMotion && !document.hidden;
    if(moving)clock.current+=Math.min(delta,.1);
    rain.current.visible=state.landscapeMotion && weatherState.rain>.01;
    rain.current.material.opacity=weatherState.rain*.38;
    let visible=0;
    if(rain.current.visible){
      const positions=geometry.attributes.position.array;
      for(let i=0;i<DROP_COUNT;i++){
        const x=camera.position.x+((i*17.31)%32)-16;
        const z=camera.position.z+((i*9.17)%32)-16;
        const y=camera.position.y+12-((i*.731+clock.current*11)%22);
        const bottom=Math.max(y-.65,roofAt(roofs,x,z));
        const show=y>bottom;
        if(show)visible++;
        const offset=i*6;
        positions[offset]=x;positions[offset+1]=y;positions[offset+2]=z;
        positions[offset+3]=x;positions[offset+4]=show ? bottom : y;positions[offset+5]=z;
      }
      geometry.attributes.position.needsUpdate=true;
    }
    snow.current.visible=state.landscapeMotion && weatherState.snow>.01;
    snow.current.material.opacity=weatherState.snow*.85;
    let flakes=0;
    if(snow.current.visible){
      const positions=snowGeometry.attributes.position.array;
      for(let i=0;i<SNOW_COUNT;i++){
        const x=camera.position.x+((i*13.37)%30)-15+Math.sin(clock.current*.6+i)*.45;
        const z=camera.position.z+((i*7.19)%30)-15+Math.cos(clock.current*.45+i)*.35;
        const y=camera.position.y+12-((i*.791+clock.current*(1.1+(i%4)*.12))%22);
        const show=y>roofAt(roofs,x,z)+.04;
        if(show)flakes++;
        const offset=i*3;
        positions[offset]=x;positions[offset+1]=show ? y : -10000;positions[offset+2]=z;
      }
      snowGeometry.attributes.position.needsUpdate=true;
    }
    gl.domElement.dataset.climate=climateFor(activeMap.mapType).name;
    gl.domElement.dataset.weather=current;
    gl.domElement.dataset.weatherMode=state.weatherMode;
    gl.domElement.dataset.weatherRemaining=schedule.current.remaining.toFixed(2);
    gl.domElement.dataset.rain=weatherState.rain.toFixed(3);
    gl.domElement.dataset.wetness=weatherState.wet.toFixed(3);
    gl.domElement.dataset.sheltered=String(weatherState.sheltered);
    gl.domElement.dataset.rainDrops=String(visible);
    gl.domElement.dataset.rainTime=clock.current.toFixed(3);
    gl.domElement.dataset.snow=weatherState.snow.toFixed(3);
    gl.domElement.dataset.fog=weatherState.fog.toFixed(3);
    gl.domElement.dataset.snowFlakes=String(flakes);
    gl.domElement.dataset.ambienceReady=String(ambienceStatus.ready);
    gl.domElement.dataset.musicTrack=ambienceStatus.key;
    gl.domElement.dataset.musicTitle=ambienceStatus.title;
    gl.domElement.dataset.ambienceLevels=JSON.stringify(ambienceStatus.levels);
  },-1);
  return <><lineSegments ref={rain} geometry={geometry} frustumCulled={false} name="rain-curtain">
    <lineBasicMaterial color="#b6ccd9" transparent opacity={0} depthWrite={false} />
  </lineSegments>
    <points ref={snow} geometry={snowGeometry} frustumCulled={false} name="snow-flurries">
      <pointsMaterial color="#e4eef5" size={.11} transparent opacity={0} depthWrite={false} onBeforeCompile={softenSnow} customProgramCacheKey={()=>'soft-snow-v1'} />
    </points>
  </>;
}
