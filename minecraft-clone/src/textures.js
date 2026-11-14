
import dirtImg from './images/dirt.jpg';
import grassImg from './images/grass.jpg';
import glassImg from './images/glass.png';
import logImg from './images/log.jpg';
import woodImg from './images/wood.png';
import { TextureLoader, RepeatWrapping, NearestFilter, SRGBColorSpace, DataTexture, RGBAFormat } from 'three';

export const dirt = new TextureLoader().load(dirtImg);
export const grass = new TextureLoader().load(grassImg);
export const glass = new TextureLoader().load(glassImg);
export const wood = new TextureLoader().load(woodImg);
export const log = new TextureLoader().load(logImg);

// Small deterministic pixel palettes keep new natural materials crisp and self-contained.
function naturalTexture(rgb) {
    const pixels = new Uint8Array(16 * 16 * 4);
    for (let i = 0; i < 256; i++) {
        const shade = ((Math.imul(i + 7, 1103515245) >>> 16) % 23) - 11;
        rgb.forEach((v, c) => { pixels[i * 4 + c] = Math.max(0, Math.min(255, v + shade)); });
        pixels[i * 4 + 3] = 255;
    }
    const texture = new DataTexture(pixels, 16, 16, RGBAFormat);
    texture.magFilter = NearestFilter; texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
}
export const sand = naturalTexture([216, 197, 145]);
export const stone = naturalTexture([132, 143, 145]);
export const leaves = naturalTexture([94, 139, 76]);

// Keep ground repetition separate from grass block UVs.
export const ground = new TextureLoader().load(grassImg);
ground.wrapS = ground.wrapT = RepeatWrapping;
ground.repeat.set(100, 100);
[dirt, grass, glass, log, wood, ground].forEach(texture => {
    texture.magFilter = NearestFilter;
    // Shared materials are constructed outside R3F's JSX color conversion path.
    texture.colorSpace = SRGBColorSpace;
});
