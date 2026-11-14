import { create } from 'zustand';
import { BLOCK_TYPES, ALL_BLOCK_TYPES, loadWorld, STORAGE_KEY, validPosition } from '../game/world';
import { landscape, landscapeSeed } from '../game/landscape';
import { serializeTerrain, restoreTerrain } from '../game/terrain';
import { createVoxelWorld, editVoxel } from '../game/voxels';
import { createBenchmarkWorld, createDemoWorld, createBuildingDemo, demoMode, isDemo } from '../game/demo';

const storageKey = landscape ? 'voxel-garden.terrain.v1.' + encodeURIComponent(landscapeSeed)
  : demoMode === 'build' ? 'voxel-garden.m4-demo.v1' : isDemo ? 'voxel-garden.m2-demo.v1' : STORAGE_KEY;
const terrainBase = landscape ? new Map(landscape.cubes.map(c => [c.key, c])) : null;
const load = storage => loadWorld(storage, storageKey, isDemo ? null : 'world',
  demoMode === 'build' ? createBuildingDemo : demoMode === 'chunks' ? createDemoWorld : undefined);
let initial;
if (!landscape) {
  try { initial = load(window.localStorage); }
  catch { initial = load(null); }
  if (demoMode === 'benchmark') initial = { cubes: createBenchmarkWorld(), canSave: false, notice: '성능 측정 월드입니다. 변경 사항은 저장하지 않습니다.' };
}
if (landscape) {
  initial = { cubes: landscape.cubes, canSave: true, notice: '' };
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw !== null) {
      try { initial.cubes = restoreTerrain(raw, landscapeSeed, landscape.cubes, validPosition, ALL_BLOCK_TYPES); }
      catch { localStorage.setItem(storageKey + '.backup', raw); initial.notice = '저장을 읽을 수 없어 시드 지형을 복원했습니다. 원본은 보존했습니다.'; }
    }
  } catch { initial.canSave = false; initial.notice = '저장소에 접근하지 못했습니다. 이번 탐험은 저장되지 않습니다.'; }
}

export const useStore = create((set, get) => ({
  ...initial,
  world: createVoxelWorld(initial.cubes),
  texture: 'dirt',
  palettePage: 0,
  flying: false,
  soundEnabled: true,
  toggleFlight: () => set(state => ({ flying: !state.flying })),
  toggleSound: () => set(state => ({ soundEnabled: !state.soundEnabled })),
  changePage: () => set(state => ({ palettePage: 1 - state.palettePage })),
  playing: false,
  ready: false,
  dirty: false,
  saveStatus: '저장 대기',
  controlError: '',
  setPlaying: playing => set({ playing }),
  setReady: ready => set({ ready }),
  setControlError: controlError => set({ controlError }),
  setTexture: texture => { if (BLOCK_TYPES.includes(texture)) set({ texture, palettePage: Math.floor(BLOCK_TYPES.indexOf(texture) / 6) }); },
  addCube: (x, y, z) => {
    const pos = [x, y, z];
    const key = pos.join(',');
    if (!validPosition(pos) || get().world.blocks.has(key)) return;
    const world = editVoxel(get().world, pos, get().texture);
    set({ world, cubes: [...world.blocks.values()], dirty: true });
  },
  removeCube: (x, y, z) => {
    const key = [x, y, z].join(',');
    if (!get().world.blocks.has(key)) return;
    const world = editVoxel(get().world, [x, y, z], null);
    set({ world, cubes: [...world.blocks.values()], dirty: true });
  },
  saveWorld: () => {
    if (!get().canSave) { set({ saveStatus: '저장 불가 · 브라우저 저장소 확인' }); return false; }
    try {
      localStorage.setItem(storageKey, landscape
        ? serializeTerrain(landscapeSeed, terrainBase, get().world.blocks)
        : JSON.stringify({ version: 1, cubes: get().cubes }));
      set({ dirty: false, saveStatus: '저장 완료' });
      return true;
    } catch {
      set({ saveStatus: '저장 실패 · 저장 공간 / 권한 확인' });
      return false;
    }
  },
}));
