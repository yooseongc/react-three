import { ShaderChunk } from 'three';
import { weatherUniforms } from './weatherMaterials';

// Shared uniforms animate existing batches; no per-frame geometry rebuilds.
export const motionUniforms = { m8Time: { value: 0 }, m8Strength: { value: 1 } };
export const MAX_WAVE_HEIGHT = .07;
export function advanceMotion(time, delta, running) {
  return time + (running ? Math.min(.1, Math.max(0, delta)) : 0);
}
const declarations = 'uniform float m8Time; uniform float m8Strength; varying vec3 m8Position;\n';
export function animateSurface(material, kind) {
  material.customProgramCacheKey = () => `garden-motion-v1-${kind}`;
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, motionUniforms);
    shader.vertexShader = declarations + shader.vertexShader;
    shader.fragmentShader = declarations + shader.fragmentShader;
    let displacement = '';
    if (kind === 'water') {
      displacement = `transformed.y += m8Strength * (.045*sin(position.x*.8+position.z*.4+m8Time*1.3) + .025*sin(position.x*-.5+position.z*1.1-m8Time*.9));`;
      shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
        #include <beginnormal_vertex>
        float waveA = cos(position.x*.8+position.z*.4+m8Time*1.3);
        float waveB = cos(position.x*-.5+position.z*1.1-m8Time*.9);
        objectNormal = normalize(vec3(-m8Strength*(.036*waveA-.0125*waveB),1.,-m8Strength*(.018*waveA+.0275*waveB)));`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
        #include <color_fragment>
        float ripple = sin(m8Position.x*4.0+m8Position.z*2.3+m8Time*1.8) * sin(m8Position.z*3.5-m8Time*1.2);
        diffuseColor.rgb *= 1.0 + m8Strength * (.09*ripple + .12*pow(max(0.,ripple),6.));`);
    } else if (kind === 'grass') {
      displacement = `float tip = pow(clamp((position.y+.2)/.4,0.,1.),2.);
        float phase = instanceMatrix[3].x*.45+instanceMatrix[3].z*.3;
        float sway = m8Strength * tip * (.08*sin(m8Time*1.7+phase)+.025*sin(m8Time*3.1+phase*.7));
        transformed.x += sway; transformed.z += sway*.45;`;
    } else if (kind === 'leaves') {
      // Keep editable voxel boundaries and their shadows exact; rustle the surface only.
      const map = ShaderChunk.map_fragment.replace('vMapUv );', 'vMapUv + m8Strength * .012 * vec2(sin(m8Time*1.8+m8Position.x*.7+m8Position.z*.4), cos(m8Time*1.2+m8Position.y)) );');
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', map);
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
        #include <color_fragment>
        diffuseColor.rgb *= 1.0 + m8Strength*.055*sin(m8Position.x*.7+m8Position.z*.4+m8Time*1.8);`);
    }
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      m8Position = position;
      ${displacement}`);
  };
  return material;
}

// One cloud field is shared by the sky and star mask, so stars do not shine through clouds.
export const cloudShader = `
uniform float m8Time; uniform float m8Strength;
uniform float weatherCloud;
float cloudHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float cloudNoise(vec2 p){
  vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(cloudHash(i),cloudHash(i+vec2(1.,0.)),f.x),mix(cloudHash(i+vec2(0.,1.)),cloudHash(i+vec2(1.,1.)),f.x),f.y);
}
float cloudCover(vec3 direction){
  vec3 d=normalize(direction);
  vec2 p=d.xz/(max(d.y,0.)+.25)*3. + vec2(m8Time*m8Strength*.018,m8Time*m8Strength*.007);
  float n=cloudNoise(p)*.6+cloudNoise(p*2.03)*.27+cloudNoise(p*4.01)*.13;
  float clearCloud=smoothstep(.48,.72,n)*smoothstep(.04,.3,d.y)*.85;
  return mix(clearCloud,.8+n*.2,weatherCloud);
}`;
export function maskCloudStars(shader) {
  Object.assign(shader.uniforms, motionUniforms);
  Object.assign(shader.uniforms, weatherUniforms);
  shader.vertexShader = 'varying vec3 cloudDirection;\n' + shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ncloudDirection=position;');
  shader.fragmentShader = 'varying vec3 cloudDirection;\n' + cloudShader + shader.fragmentShader;
  shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= 1.-cloudCover(cloudDirection);');
}
