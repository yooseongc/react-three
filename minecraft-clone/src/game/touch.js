export const touchInput = { moveForward:0, moveRight:0, ascend:false, descend:false, jump:false, lookX:0, lookY:0 };
export function clearTouchInput() {
  Object.assign(touchInput,{moveForward:0,moveRight:0,ascend:false,descend:false,jump:false,lookX:0,lookY:0});
}
export function stickAxes(dx,dy,radius=44) {
  const length=Math.hypot(dx,dy);
  if(length<7)return {moveForward:0,moveRight:0};
  const scale=Math.max(radius,length);
  return {moveForward:-dy/scale,moveRight:dx/scale};
}
