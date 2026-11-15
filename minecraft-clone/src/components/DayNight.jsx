import { undergroundState } from '../game/underground';
import { natureUniforms,natureSkyShader } from '../game/naturalEvents';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide, Color, Vector3 } from 'three';
import { useStore } from '../hooks/useStore';
import { advanceTime, sampleDay, worldClock } from '../game/daylight';
import { cloudShader, maskCloudStars, motionUniforms } from '../game/motion';
import { weatherUniforms } from '../game/weatherMaterials';

// A camera-centred sky keeps the horizon continuous across dawn and midnight.
const vertexShader = `varying vec3 direction;
void main(){ direction = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const fragmentShader = `varying vec3 direction;
uniform float natureTime; uniform float auroraStrength; uniform float rainbowStrength;
uniform float weatherFlash;
uniform vec3 zenith; uniform vec3 horizon; uniform vec3 sun; uniform float daylight;
${cloudShader}
void main(){
  vec3 d = normalize(direction);
  vec3 color = mix(horizon, zenith, smoothstep(-.08,.65,d.y));
  float sunDisc = smoothstep(.9994,.9997,dot(d,normalize(sun)));
  float moonDisc = smoothstep(.99965,.9998,dot(d,-normalize(sun)));
  color = mix(color,vec3(1.0,.85,.55),sunDisc);
  color = mix(color,vec3(.8,.88,1.0),moonDisc * (1.0-daylight));
  vec3 cloudColor = mix(horizon * .7, mix(horizon,vec3(.92,.96,1.),.65),daylight) * (1.-weatherCloud*.35);
  color = mix(color,cloudColor,cloudCover(d));
  ${natureSkyShader}
  color += vec3(.6,.7,.85)*weatherFlash*smoothstep(.0,.6,d.y);
  gl_FragColor=vec4(color,1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
export default function DayNight() {
  const selectedHour = useStore(s => s.timeOfDay);
  const sky = useRef(); const stars = useRef(); const ambient = useRef(); const light = useRef(); const moon = useRef();
  const wasPlaying = useRef(false),caveShade=useRef(0);
  useEffect(() => { worldClock.hour = selectedHour; }, [selectedHour]);
  const colors = useMemo(() => ({ night: new Color('#101d38'), day: new Color('#72b9e5'),
    nightFog: new Color('#34465f'), dayFog: new Color('#c4d8cb'), dusk: new Color('#eea16d'), noon: new Color('#fff4dc'),
    moon: new Color('#bbcdf5'), white: new Color('#ffffff'), mistDay:new Color('#c9d4d4'), mistNight:new Color('#384452'), sand:new Color('#b7a07c'), mistShade:new Color() }), []);
  const uniforms = useMemo(() => ({ zenith: { value: new Color() }, horizon: { value: new Color() },
    sun: { value: new Vector3() }, daylight: { value: 1 }, ...motionUniforms, ...weatherUniforms, ...natureUniforms }), []);
  const starPositions = useMemo(() => {
    const positions = new Float32Array(600 * 3);
    let seed = 781;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 600; i++) {
      const y = .12 + random() * .88, theta = random() * Math.PI * 2, r = Math.sqrt(1-y*y);
      positions.set([r*Math.cos(theta)*130, y*130, r*Math.sin(theta)*130], i*3);
    }
    return positions;
  }, []);
  useFrame(({ camera, scene, gl }, delta) => {
    const state = useStore.getState();
    if (wasPlaying.current && !state.playing) state.updateSettings({ timeOfDay: worldClock.hour });
    wasPlaying.current = state.playing;
    worldClock.hour = advanceTime(worldClock.hour, delta, state.dayCycle && state.playing && !document.hidden);
    const sample = sampleDay(worldClock.hour);
    const liveUniforms = sky.current.material.uniforms;
    liveUniforms.m8Time.value = motionUniforms.m8Time.value;
    for(const name of Object.keys(natureUniforms))liveUniforms[name].value=natureUniforms[name].value;
    liveUniforms.m8Strength.value = motionUniforms.m8Strength.value;
    const overcast=weatherUniforms.weatherCloud.value;
    const fog=weatherUniforms.weatherFog.value, snow=weatherUniforms.weatherSnow.value;
    liveUniforms.weatherCloud.value=overcast;
    liveUniforms.weatherFlash.value=weatherUniforms.weatherFlash.value;
    const dust=weatherUniforms.weatherDust.value;
    liveUniforms.zenith.value.copy(colors.night).lerp(colors.day, sample.daylight);
    liveUniforms.horizon.value.copy(colors.nightFog).lerp(colors.dayFog, sample.daylight).lerp(colors.dusk, sample.twilight * .7);
    colors.mistShade.copy(colors.mistNight).lerp(colors.mistDay,sample.daylight);
    liveUniforms.zenith.value.lerp(colors.mistShade,fog*.8+snow*.15);
    liveUniforms.horizon.value.lerp(colors.mistShade,Math.min(1,fog*.9+snow*.3));
    liveUniforms.zenith.value.lerp(colors.sand,dust*.65);
    liveUniforms.horizon.value.lerp(colors.sand,dust*.8);
    liveUniforms.sun.value.set(...sample.sun); liveUniforms.daylight.value = sample.daylight;
    sky.current.position.copy(camera.position); stars.current.position.copy(camera.position);
    stars.current.material.opacity = sample.stars * .85;
    scene.fog.color.copy(liveUniforms.horizon.value).multiplyScalar(1-overcast*.25);
    const mist = Math.sin(motionUniforms.m8Time.value * .05) * motionUniforms.m8Strength.value;
    scene.fog.near = (45 + mist * 2 - overcast*15-snow*5)*(1-fog)+8*fog;
    scene.fog.far = (110 + mist * 3 - overcast*30-snow*8)*(1-fog)+32*fog;
    const seaMist=weatherUniforms.weatherMist.value;
    scene.fog.near*=1-seaMist*.4;scene.fog.far*=1-seaMist*.3;
    scene.fog.near=scene.fog.near*(1-dust)+10*dust;
    scene.fog.far=scene.fog.far*(1-dust)+38*dust;
    ambient.current.intensity = sample.ambient*(1-overcast*.2);
    ambient.current.color.copy(colors.moon).lerp(colors.white, sample.daylight);
    light.current.intensity = 2.65 * Math.min(1, Math.max(0, sample.elevation / .3))*(1-overcast*.85);
    light.current.color.copy(colors.noon).lerp(colors.dusk, sample.twilight);
    light.current.position.set(camera.position.x + sample.sun[0]*.4, camera.position.y + sample.sun[1]*.4, camera.position.z + sample.sun[2]*.4);
    moon.current.intensity = sample.stars * .45*(1-overcast*.7);
    moon.current.position.set(-sample.sun[0], -sample.sun[1], -sample.sun[2]);
    caveShade.current+=((undergroundState.inside?1:0)-caveShade.current)*(1-Math.exp(-Math.min(delta,.1)*3));
    ambient.current.intensity*=1-caveShade.current*.82;
    light.current.intensity*=1-caveShade.current*.98;moon.current.intensity*=1-caveShade.current;
    if(caveShade.current>.01){scene.fog.color.lerp(colors.nightFog,caveShade.current*.85);scene.fog.near=scene.fog.near*(1-caveShade.current)+8*caveShade.current;scene.fog.far=scene.fog.far*(1-caveShade.current)+40*caveShade.current;}
    light.current.target.position.copy(camera.position);
    light.current.target.updateMatrixWorld();
    gl.domElement.dataset.timeOfDay = worldClock.hour.toFixed(4);
    gl.domElement.dataset.daylight = sample.daylight.toFixed(3);
    gl.domElement.dataset.fogRange = `${scene.fog.near.toFixed(2)},${scene.fog.far.toFixed(2)}`;
    gl.domElement.dataset.cameraAspect = camera.aspect.toFixed(5);
  });
  return <>
    <fog attach="fog" args={['#c4d8cb',45,110]} />
    <mesh ref={sky} renderOrder={-10}>
      <sphereGeometry args={[150,24,16]} />
      <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} side={BackSide} depthWrite={false} />
    </mesh>
    <points ref={stars} renderOrder={-9}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[starPositions,3]} /></bufferGeometry>
      <pointsMaterial color="#e5efff" size={1.6} sizeAttenuation={false} transparent depthWrite={false} fog={false} onBeforeCompile={maskCloudStars} customProgramCacheKey={()=>'garden-cloud-stars-v1'} />
    </points>
    <ambientLight ref={ambient} />
    <directionalLight ref={moon} color="#b8cdf6" />
    <directionalLight ref={light} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}
      shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={25} shadow-camera-bottom={-25} shadow-normalBias={.03} />
  </>;
}
