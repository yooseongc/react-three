
import { nanoid } from 'nanoid';
import create from 'zustand';

const getLocalStorage = (key) => JSON.parse(localStorage.getItem(key));
const setLocalStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export const useStore = create(set => ({
    cubes: getLocalStorage('world') || [],
    addCube: (x, y, z) => set(state => ({
        cubes: [...state.cubes, { key: nanoid(), pos: [x, y, z], texture: state.texture } ],
    })),
    removeCube: (x, y, z) => set(state => ({
        cubes: state.cubes.filter(cube => cube.pos[0] !== x || cube.pos[1] !== y || cube.pos[2] !== z)
    })),
    texture: 'dirt',
    setTexture: (texture) => set(state => ({ texture })),
    saveWorld: () => set(state => setLocalStorage('world', state.cubes))
}));