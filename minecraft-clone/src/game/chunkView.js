import { CHUNK_SIZE } from './voxels';
// Beyond the farthest terrain fog (116); one cell of slack prevents visible pop-in.
export const CHUNK_VIEW_RADIUS=144;
export function chunkInView(coords,center,radius=CHUNK_VIEW_RADIUS){
 const x=(center[0]+.5)*CHUNK_SIZE,z=(center[1]+.5)*CHUNK_SIZE;
 const minX=coords[0]*CHUNK_SIZE-.5,minZ=coords[2]*CHUNK_SIZE-.5;
 const dx=Math.max(minX-x,0,x-(minX+CHUNK_SIZE)),dz=Math.max(minZ-z,0,z-(minZ+CHUNK_SIZE));
 return dx*dx+dz*dz<=radius*radius;
}
