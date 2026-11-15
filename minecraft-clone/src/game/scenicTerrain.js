// Larger silhouettes with quiet valleys and deliberate shorelines.
export function scenicHeight(kind,x,z,phase,limit) {
 const hill=(cx,cz,r,h)=>h*Math.exp(-((x-cx)**2+(z-cz)**2)/(r*r));
 const river=Math.abs(x-(-14+7*Math.sin(z/17+phase)));
 let h;
 if(kind==='forest'){
  h=6+2*Math.sin(x/19+phase)*Math.cos(z/23)+hill(-32,28,17,14)+hill(12,-34,13,7);
  const shore=limit*.54+3*Math.sin(z/16+phase);
  if(x>shore)h=Math.min(h,Math.max(1,6-(x-shore)*1.6));
  const lake=Math.hypot((x+20)/1.2,z+14);if(lake<10)h=Math.min(h,Math.max(1,lake-6));
 }else if(kind==='meadow'){
  h=6+2.5*Math.sin(x/17+phase)*Math.cos(z/22)+hill(25,-28,19,11)+hill(-32,30,20,7);
 }else if(kind==='islands'){
  h=1+hill(-24,-22,13,17)+hill(16,20,16,14)+hill(26,-26,10,10)+hill(-25,29,10,7);
  if(limit>60)h+=Math.max(0,Math.sin(x/19+phase)*Math.cos(z/21)-.25)*14;
 }else{
  h=7+2*Math.sin(z/20+phase)+hill(-28,-26,15,22)+hill(28,-30,13,25)+hill(-35,28,18,15);
 }
 if(kind!=='islands'&&river<4)h=Math.min(h,Math.max(1,(river-1)*2));
 // A pond stays readable from above in the meadow and snowy valley.
 if(kind==='meadow'||kind==='snow'){const pond=Math.hypot((x-20)/1.4,z-25);if(pond<9)h=Math.min(h,Math.max(1,(pond-5)*2));}
 const spawn=Math.hypot(x,z-10);if(spawn<8)h=5+(h-5)*Math.max(0,(spawn-4)/4);
 return Math.max(1,Math.min(35,Math.round(h)));
}
