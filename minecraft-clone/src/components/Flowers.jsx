import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { BufferGeometry, Float32BufferAttribute, MeshStandardMaterial, DoubleSide, Object3D, Color } from 'three';
import { landscape } from '../game/landscape';
import { useStore } from '../hooks/useStore';

export default function Flowers(){
 const world=useStore(s=>s.world),mesh=useRef();
 const positions=useMemo(()=>landscape?.flowers.filter(([x,y,z],i)=>i%3===0&&world.blocks.get(`${x},${Math.round(y-.75)},${z}`)?.texture==='grass'&&!world.blocks.has(`${x},${Math.round(y+.25)},${z}`))||[],[world]);
 const geometry=useMemo(()=>{
  const vertices=[],colors=[];
  const triangle=(a,b,c,color)=>{vertices.push(...a,...b,...c);for(let i=0;i<3;i++)colors.push(...color);};
  triangle([-.018,0,0],[.018,0,0],[0,.42,0],[.25,.5,.15]);
  triangle([0,0,-.018],[0,0,.018],[0,.42,0],[.25,.5,.15]);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5,b=a+.65;triangle([0,.4,0],[Math.cos(a)*.18,.44,Math.sin(a)*.18],[Math.cos(b)*.18,.44,Math.sin(b)*.18],[1,1,1]);}
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(vertices,3));g.setAttribute('color',new Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
 },[]);
 const material=useMemo(()=>new MeshStandardMaterial({vertexColors:true,side:DoubleSide,roughness:1}),[]);
 useEffect(()=>()=>{geometry.dispose();material.dispose();},[geometry,material]);
 useLayoutEffect(()=>{if(!mesh.current)return;const obj=new Object3D(),color=new Color();positions.forEach(([x,y,z],i)=>{obj.position.set(x,y-.25,z);obj.rotation.y=i*2.4;obj.updateMatrix();mesh.current.setMatrixAt(i,obj.matrix);mesh.current.setColorAt(i,color.set(['#f9e6a2','#e4b2c9','#d7c5ef','#fff5d9'][i%4]));});mesh.current.instanceMatrix.needsUpdate=true;if(mesh.current.instanceColor)mesh.current.instanceColor.needsUpdate=true;},[positions]);
 if(!positions.length)return null;
 return <instancedMesh key={positions.length} ref={mesh} args={[geometry,material,positions.length]} frustumCulled={false} name="wildflowers" />;
}
