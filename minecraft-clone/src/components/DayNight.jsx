import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide, Color, Vector3 } from 'three';
import { useStore } from '../hooks/useStore';
import { advanceTime, sampleDay, worldClock } from '../game/daylight';
import { cloudShader, maskCloudStars, motionUniforms } from '../game/motion';

// A camera-centred sky keeps the horizon continuous across dawn and midnight.
const vertexShader = `varying vec3 direction;
void main(){ direction = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const fragmentShader = `varying vec3 direction;
uniform vec3 zenith; uniform vec3 horizon; uniform vec3 sun; uniform float daylight;
${cloudShader}
void main(){
  vec3 d = normalize(direction);
  vec3 color = mix(horizon, zenith, smoothstep(-.08,.65,d.y));
  float sunDisc = smoothstep(.9994,.9997,dot(d,normalize(sun)));
  float moonDisc = smoothstep(.99965,.9998,dot(d,-normalize(sun)));
  color = mix(color,vec3(1.0,.85,.55),sunDisc);
  color = mix(color,vec3(.8,.88,1.0),moonDisc * (1.0-daylight));
  vec3 cloudColor = mix(horizon * .7, mix(horizon,vec3(.92,.96,1.),.65),daylight);
  color = mix(color,cloudColor,cloudCover(d));
  gl_FragColor=vec4(color,1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
export default function DayNight() {
  const selectedHour = useStore(s => s.timeOfDay);
  const sky = useRef(); const stars = useRef(); const ambient = useRef(); const light = useRef(); const moon = useRef();
  const wasPlaying = useRef(false);
  useEffect(() => { worldClock.hour = selectedHour; }, [selectedHour]);
  const colors = useMemo(() => ({ night: new Color('#101d38'), day: new Color('#72b9e5'),
    nightFog: new Color('#34465f'), dayFog: new Color('#c4d8cb'), dusk: new Color('#eea16d'), noon: new Color('#fff4dc'),
    moon: new Color('#bbcdf5'), white: new Color('#ffffff') }), []);
  const uniforms = useMemo(() => ({ zenith: { value: new Color() }, horizon: { value: new Color() },
    sun: { value: new Vector3() }, daylight: { value: 1 }, ...motionUniforms }), []);
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
    liveUniforms.m8Strength.value = motionUniforms.m8Strength.value;
    liveUniforms.zenith.value.copy(colors.night).lerp(colors.day, sample.daylight);
    liveUniforms.horizon.value.copy(colors.nightFog).lerp(colors.dayFog, sample.daylight).lerp(colors.dusk, sample.twilight * .7);
    liveUniforms.sun.value.set(...sample.sun); liveUniforms.daylight.value = sample.daylight;
    sky.current.position.copy(camera.position); stars.current.position.copy(camera.position);
    stars.current.material.opacity = sample.stars * .85;
    scene.fog.color.copy(liveUniforms.horizon.value);
    const mist = Math.sin(motionUniforms.m8Time.value * .05) * motionUniforms.m8Strength.value;
    scene.fog.near = 45 + mist * 2;
    scene.fog.far = 110 + mist * 3;
    ambient.current.intensity = sample.ambient;
    ambient.current.color.copy(colors.moon).lerp(colors.white, sample.daylight);
    light.current.intensity = 2.65 * Math.min(1, Math.max(0, sample.elevation / .3));
    light.current.color.copy(colors.noon).lerp(colors.dusk, sample.twilight);
    light.current.position.set(camera.position.x + sample.sun[0]*.4, camera.position.y + sample.sun[1]*.4, camera.position.z + sample.sun[2]*.4);
    moon.current.intensity = sample.stars * .45;
    moon.current.position.set(-sample.sun[0], -sample.sun[1], -sample.sun[2]);
    light.current.target.position.copy(camera.position);
    light.current.target.updateMatrixWorld();
    gl.domElement.dataset.timeOfDay = worldClock.hour.toFixed(4);
    gl.domElement.dataset.daylight = sample.daylight.toFixed(3);
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
