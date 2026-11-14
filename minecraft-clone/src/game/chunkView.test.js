import { chunkInView } from './chunkView';
test('render window follows the camera while retaining a margin beyond fog',()=>{
 expect(chunkInView([0,0,0],[0,0])).toBe(true);
 expect(chunkInView([7,0,0],[0,0])).toBe(true);
 expect(chunkInView([12,0,0],[0,0])).toBe(false);
 expect(chunkInView([12,3,0],[12,0])).toBe(true);
 expect(chunkInView([0,0,0],[12,0])).toBe(false);
 expect(chunkInView([-13,0,-13],[-13,-13])).toBe(true);
});
