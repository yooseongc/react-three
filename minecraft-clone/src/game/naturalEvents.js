export const natureUniforms={natureTime:{value:0},auroraStrength:{value:0},rainbowStrength:{value:0}};
export function advanceNature(state,{weather,hour,mapType,running,delta,sheltered=false}){
 const dt=running?Math.min(.1,Math.max(0,delta)):0;
 let afterRain=weather==='rain'?600:Math.max(0,state.afterRain-dt);
 if(weather==='clear'&&state.weather!=='clear')afterRain=Math.min(90,afterRain);
 const night=hour>=20||hour<5,clear=weather==='clear'&&!sheltered;
 const time=state.time+dt;
 return {time,afterRain,weather,aurora:mapType==='snow'&&clear&&night?.55+.2*Math.sin(time*.015):0,
  rainbow:clear&&hour>6&&hour<18&&afterRain>0?Math.min(1,afterRain/15):0,
  fireflies:clear&&night&&!['snow','oasis','sky','canal'].includes(mapType),
  meteor:clear&&night&&(time%150)>36&&(time%150)<39?(time%150)-36:-1};
}
export const natureSkyShader=`
  float polar=atan(d.z,d.x);
  float curtain=.25+.07*sin(polar*7.+natureTime*.08)+.04*sin(polar*17.-natureTime*.12);
  float ribbons=exp(-pow((d.y-curtain)*13.,2.))*(.45+.55*pow(.5+.5*sin(polar*80.+natureTime*.2),2.));
  vec3 auroraColor=mix(vec3(.16,.85,.55),vec3(.5,.3,.85),smoothstep(.23,.5,d.y));
  color+=auroraColor*ribbons*auroraStrength*smoothstep(0.,.15,d.y);
  float antiSun=acos(clamp(dot(d,normalize(-sun)),-1.,1.));
  float band=(antiSun-.69)/.065;
  vec3 rainbow=.55+.45*cos(6.28318*(band+vec3(0.,.67,.33)));
  float bow=smoothstep(0.,.13,band)*(1.-smoothstep(.85,1.,band))*smoothstep(0.,.08,d.y);
  color=mix(color,rainbow,bow*rainbowStrength*.32);
`;
