
import dirtImg from './images/dirt.jpg';
import grassImg from './images/grass.jpg';
import glassImg from './images/glass.png';
import logImg from './images/log.jpg';
import woodImg from './images/wood.png';
import { TextureLoader, RepeatWrapping, NearestFilter, SRGBColorSpace, DataTexture, RGBAFormat } from 'three';
import { activeMap } from './game/mapConfig';

export const dirt = new TextureLoader().load(dirtImg);
export const grass = new TextureLoader().load(grassImg);
export const glass = new TextureLoader().load(glassImg);
export const wood = new TextureLoader().load(woodImg);
export const log = new TextureLoader().load(logImg);

// Small deterministic pixel palettes keep new natural materials crisp and self-contained.
function naturalTexture(rgb, pattern) {
    const pixels = new Uint8Array(16 * 16 * 4);
    for (let i = 0; i < 256; i++) {
        const shade = ((Math.imul(i + 7, 1103515245) >>> 16) % 23) - 11;
        const x = i % 16, y = Math.floor(i / 16);
        const line = pattern === 'brick' ? y % 8 === 0 || (x + (y >= 8 ? 4 : 0)) % 8 === 0
          : pattern === 'bamboo' ? y%6===0 || x%8===0 : pattern === 'roof' ? y % 4 === 0 : pattern === 'slate' ? x === 0 || y === 0 : false;
        rgb.forEach((v, c) => { pixels[i * 4 + c] = Math.max(0, Math.min(255, v + shade - (line ? 32 : 0))); });
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
export const brick = naturalTexture([179, 107, 82], 'brick');
export const plaster = naturalTexture([231, 223, 200]);
export const roof = naturalTexture([105, 126, 134], 'roof');
export const slate = naturalTexture([158, 170, 166], 'slate');
export const snow = naturalTexture([229,239,241]);
export const lantern = naturalTexture([255,207,130], 'slate');

// Keep ground repetition separate from grass block UVs.
export const ground = new TextureLoader().load(grassImg);
ground.wrapS = ground.wrapT = RepeatWrapping;
ground.repeat.set(activeMap.size, activeMap.size);
[dirt, grass, glass, log, wood, ground].forEach(texture => {
    texture.magFilter = NearestFilter;
    // Shared materials are constructed outside R3F's JSX color conversion path.
    texture.colorSpace = SRGBColorSpace;
});

export const limestone = naturalTexture([221, 216, 185], 'slate');
export const terracotta = naturalTexture([185, 94, 67], 'roof');
export const ochreWall = naturalTexture([223, 184, 112]);
export const roseWall = naturalTexture([220, 163, 147]);
export const tealWall = naturalTexture([166, 197, 181]);
export const darkWood = naturalTexture([97, 80, 68], 'roof');
export const bamboo = naturalTexture([142, 170, 91], 'bamboo');
export const sandstone = naturalTexture([212, 172, 117], 'brick');
export const redSand = naturalTexture([180, 123, 88]);
export const mapleLeaves = naturalTexture([189, 101, 72]);
export const goldenLeaves = naturalTexture([212, 171, 70]);
export const cherryLeaves = naturalTexture([232, 182, 200]);
export const coralPink = naturalTexture([220, 142, 157]);
export const coralBlue = naturalTexture([108, 183, 184]);
export const whiteStone = naturalTexture([232, 232, 223], 'slate');
export const blackTile = naturalTexture([70, 81, 85], 'roof');
export const jadeTile = naturalTexture([87, 141, 129], 'roof');
export const vermilion = naturalTexture([167, 71, 54], 'roof');
export const gravel = naturalTexture([196, 191, 174]);
export const palmLeaves = naturalTexture([100, 142, 89]);
