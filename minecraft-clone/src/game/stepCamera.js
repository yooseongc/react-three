// Collision steps immediately onto solid ground; only the eye catches up.
// Ordinary jumps, gravity and horizontal movement keep their original timing.
export function stepCameraOffset(offset,rise,delta,reset=false){
 if(reset)return 0;
 const remaining=Math.max(-1,offset-Math.max(0,rise||0));
 const next=remaining*Math.exp(-Math.min(Math.max(delta,0),.05)/.09);
 return Math.abs(next)<.001?0:next;
}
