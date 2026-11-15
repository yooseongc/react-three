import { MeshStandardMaterial, ShaderLib } from 'three';
import { animateSurface } from './motion';
import { wetSurface } from './weatherMaterials';
test.each(['leaves','grass','water'])('%s shader composition has no duplicate uniforms',kind=>{
 const material=animateSurface(new MeshStandardMaterial(),kind);
 if(kind!=='water')wetSurface(material);
 const shader={vertexShader:ShaderLib.standard.vertexShader,fragmentShader:ShaderLib.standard.fragmentShader,uniforms:{}};
 material.onBeforeCompile(shader);
 for(const source of [shader.vertexShader,shader.fragmentShader]){
  const names=[...source.matchAll(/uniform\s+\w+\s+(\w+)\s*;/g)].map(m=>m[1]);
  expect(new Set(names).size).toBe(names.length);
 }
 expect(shader.uniforms.weatherWind).toBeDefined();
 material.dispose();
});
