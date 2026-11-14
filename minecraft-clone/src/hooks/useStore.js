import { create } from 'zustand';
import { BLOCK_TYPES, ALL_BLOCK_TYPES, loadWorld, STORAGE_KEY, validPosition } from '../game/world';
import { landscape, landscapeSeed } from '../game/landscape';
import { serializeTerrain, restoreTerrain } from '../game/terrain';
import { createVoxelWorld, editVoxel } from '../game/voxels';
import { createBenchmarkWorld, createDemoWorld, createBuildingDemo, demoMode, isDemo } from '../game/demo';
import { slotId, slotData, slotError } from '../game/session';
import { exportWorld, SLOT_PREFIX } from '../game/transfer';
import { loadSettings, cleanSettings, SETTINGS_KEY } from '../game/settings';
import { placementError } from '../game/placement';
import { playerView } from '../game/navigation';

export const HISTORY_LIMIT = 100;

const storageKey = slotId ? SLOT_PREFIX + slotId : landscape ? 'voxel-garden.terrain.v1.' + encodeURIComponent(landscapeSeed)
  : demoMode === 'build' ? 'voxel-garden.m4-demo.v1' : isDemo ? 'voxel-garden.m2-demo.v1' : STORAGE_KEY;
const terrainBase = landscape ? new Map(landscape.cubes.map(c => [c.key, c])) : null;
const load = storage => loadWorld(storage, storageKey, isDemo ? null : 'world',
  demoMode === 'build' ? createBuildingDemo : demoMode === 'chunks' ? createDemoWorld : undefined);
let initial;
if (!landscape && !slotId) {
  try { initial = load(window.localStorage); }
  catch { initial = load(null); }
  if (demoMode === 'benchmark') initial = { cubes: createBenchmarkWorld(), canSave: false, notice: '성능 측정 월드입니다. 변경 사항은 저장하지 않습니다.' };
}
if (landscape && !slotId) {
  initial = { cubes: landscape.cubes, canSave: true, notice: '' };
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw !== null) {
      try { initial.cubes = restoreTerrain(raw, landscapeSeed, landscape.cubes, validPosition, ALL_BLOCK_TYPES); }
      catch { localStorage.setItem(storageKey + '.backup', raw); initial.notice = '저장을 읽을 수 없어 시드 지형을 복원했습니다. 원본은 보존했습니다.'; }
    }
  } catch { initial.canSave = false; initial.notice = '저장소에 접근하지 못했습니다. 이번 탐험은 저장되지 않습니다.'; }
}
if (slotId) initial = slotData ? { cubes: slotData.cubes, canSave: true, notice: '가져온 월드의 별도 복사본입니다.' }
  : { cubes: [], canSave: false, notice: slotError + ' 월드 메뉴에서 다른 월드를 선택하세요.' };
let settings;
try { settings = loadSettings(localStorage); } catch { settings = cleanSettings(null); }

export const useStore = create((set, get) => ({
  ...initial,
  world: createVoxelWorld(initial.cubes),
  texture: 'dirt',
  palettePage: 0,
  flying: false,
  ...settings,
  settingsNotice: '',
  updateSettings: patch => {
    const next = cleanSettings({ ...get(), ...patch });
    set(next);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); set({ settingsNotice: '' }); }
    catch { set({ settingsNotice: '설정을 저장하지 못했습니다. 현재 세션에만 적용합니다.' }); }
  },
  toggleFlight: () => set(state => ({ flying: !state.flying })),
  toggleSound: () => get().updateSettings({ soundEnabled: !get().soundEnabled }),
  changePage: () => set(state => ({ palettePage: 1 - state.palettePage })),
  playing: false,
  ready: false,
  dirty: false,
  undoStack: [],
  redoStack: [],
  historyNotice: '',
  saveStatus: '저장 대기',
  saveRevision: 0,
  controlError: '',
  setPlaying: playing => set({ playing }),
  setReady: ready => set({ ready }),
  setControlError: controlError => set({ controlError }),
  setTexture: texture => { if (BLOCK_TYPES.includes(texture)) set({ texture, palettePage: Math.floor(BLOCK_TYPES.indexOf(texture) / 6) }); },
  addCube: (x, y, z, player = null) => {
    const pos = [x, y, z];
    const error = placementError(get().world, pos, player);
    if (error) { set({ historyNotice: error }); return false; }
    const world = editVoxel(get().world, pos, get().texture);
    const edit = { pos, before: null, after: get().texture };
    set({ world, cubes: [...world.blocks.values()], dirty: true,
      undoStack: [...get().undoStack, edit].slice(-HISTORY_LIMIT), redoStack: [], historyNotice: '' });
    return true;
  },
  removeCube: (x, y, z) => {
    const key = [x, y, z].join(',');
    if (!get().world.blocks.has(key)) return;
    const edit = { pos: [x, y, z], before: get().world.blocks.get(key).texture, after: null };
    const world = editVoxel(get().world, [x, y, z], null);
    set({ world, cubes: [...world.blocks.values()], dirty: true,
      undoStack: [...get().undoStack, edit].slice(-HISTORY_LIMIT), redoStack: [], historyNotice: '' });
    return true;
  },
  undoEdit: (player = playerView) => get().replayEdit(false, player),
  redoEdit: (player = playerView) => get().replayEdit(true, player),
  replayEdit: (redo, player) => {
    const state = get(), source = redo ? state.redoStack : state.undoStack;
    const edit = source.at(-1);
    if (!edit) { set({ historyNotice: redo ? '다시 실행할 작업이 없습니다' : '취소할 작업이 없습니다' }); return false; }
    const texture = redo ? edit.after : edit.before;
    const expected = redo ? edit.before : edit.after;
    if ((state.world.blocks.get(edit.pos.join(','))?.texture ?? null) !== expected) {
      set({ historyNotice: '월드 상태가 변경되어 이 작업을 복원할 수 없습니다' }); return false;
    }
    const error = texture ? placementError(state.world, edit.pos, player) : '';
    if (error) { set({ historyNotice: '복원 불가 · ' + error + ' — 이동한 뒤 다시 시도하세요' }); return false; }
    const world = editVoxel(state.world, edit.pos, texture);
    set({ world, cubes: [...world.blocks.values()], dirty: true,
      undoStack: redo ? [...state.undoStack, edit].slice(-HISTORY_LIMIT) : source.slice(0, -1),
      redoStack: redo ? source.slice(0, -1) : [...state.redoStack, edit].slice(-HISTORY_LIMIT),
      historyNotice: redo ? '다시 실행했습니다' : '실행을 취소했습니다' });
    return true;
  },
  saveWorld: () => {
    if (!get().canSave) { set({ saveStatus: '저장 불가 · 브라우저 저장소 확인' }); return false; }
    try {
      localStorage.setItem(storageKey, slotId ? JSON.stringify(exportWorld(get().cubes, landscapeSeed)) : landscape
        ? serializeTerrain(landscapeSeed, terrainBase, get().world.blocks)
        : JSON.stringify({ version: 1, cubes: get().cubes }));
      set({ dirty: false, saveStatus: '저장 완료', saveRevision: get().saveRevision + 1 });
      return true;
    } catch {
      set({ saveStatus: '저장 실패 · 저장 공간 / 권한 확인' });
      return false;
    }
  },
}));
