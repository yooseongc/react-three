import { DataTexture, FloatType, RedFormat } from 'three';

const roofTexture = new DataTexture(new Float32Array(99*99).fill(.5),99,99,RedFormat,FloatType);
roofTexture.needsUpdate = true;
export const weatherUniforms = { weatherCloud: {value:0}, weatherWet: {value:0}, weatherFog: {value:0}, weatherSnow: {value:0}, weatherRoof: {value:roofTexture} };
export function wetSurface(material) {
  const previous = material.onBeforeCompile.bind(material);
  const key = material.customProgramCacheKey();
  material.customProgramCacheKey = () => `${key}-wet-v1`;
  material.onBeforeCompile = shader => {
    previous(shader);
    Object.assign(shader.uniforms,weatherUniforms);
    const varying='varying vec3 weatherPosition; varying vec3 weatherNormal;\n';
    shader.vertexShader = varying + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      weatherPosition=(modelMatrix*vec4(position,1.)).xyz;
      weatherNormal=normalize(mat3(modelMatrix)*normal);`);
    shader.fragmentShader = varying + 'uniform float weatherWet; uniform sampler2D weatherRoof;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      vec2 roofUv=(floor(weatherPosition.xz+.5)+49.5)/99.;
      float roofHeight=texture2D(weatherRoof,roofUv).r;
      float wetMask=weatherWet*step(.5,weatherNormal.y)*step(roofHeight-.08,weatherPosition.y);
      diffuseColor.rgb *= 1.-wetMask*.2;`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `
      #include <roughnessmap_fragment>
      roughnessFactor=mix(roughnessFactor,.25,wetMask);`);
  };
  return material;
}
