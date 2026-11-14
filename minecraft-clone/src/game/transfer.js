import { ALL_BLOCK_TYPES, validPosition } from './world';
export const MAX_IMPORT_BYTES = 8 * 1024 * 1024;
export const SLOT_PREFIX = 'voxel-garden.copy.';
export const RECENT_KEY = 'voxel-garden.recent.v1';
export function exportWorld(cubes, seed = null) {
  return { format: 'voxel-garden', version: 1, kind: seed === null ? 'flat' : 'terrain',
    ...(seed === null ? {} : { seed, generator: 1 }), cubes };
}
export function parseTransfer(raw) {
  if (typeof raw !== 'string' || raw.length > MAX_IMPORT_BYTES) throw Error('파일은 8MB 이하만 지원합니다.');
  let data;
  try { data = JSON.parse(raw); } catch { throw Error('올바른 JSON 파일이 아닙니다.'); }
  const legacy = Array.isArray(data) || (data?.version === 1 && !data.format && Array.isArray(data.cubes));
  if (legacy) data = exportWorld(Array.isArray(data) ? data : data.cubes);
  if (data?.format !== 'voxel-garden' || data.version !== 1 || !['flat','terrain'].includes(data.kind)) throw Error('지원하지 않는 월드 파일입니다.');
  if (data.kind === 'terrain' && (data.generator !== 1 || typeof data.seed !== 'string' || !data.seed.trim() || Array.from(data.seed).length > 64)) throw Error('지원하지 않는 지형 버전 또는 시드입니다.');
  if (!Array.isArray(data.cubes) || data.cubes.length > 150000) throw Error('블록 목록이 없거나 15만 개를 초과합니다.');
  const seen = new Set();
  const cubes = data.cubes.map(cube => {
    if (!cube || !validPosition(cube.pos) || !ALL_BLOCK_TYPES.includes(cube.texture)) throw Error('유효하지 않은 블록이 포함되어 있습니다.');
    const key = cube.pos.join(',');
    if (seen.has(key)) throw Error('같은 위치의 블록이 중복되어 있습니다.');
    seen.add(key); return { key, pos: [...cube.pos], texture: cube.texture };
  });
  return exportWorld(cubes, data.kind === 'terrain' ? data.seed : null);
}
export function safeWorldQuery(query) {
  if (query === '?') return query;
  if (typeof query !== 'string' || !query.startsWith('?')) return null;
  const p = new URLSearchParams(query);
  if ([...p.keys()].length !== 1) return null;
  if (p.has('world') && p.get('world').trim() && Array.from(p.get('world')).length <= 64) return '?world=' + encodeURIComponent(p.get('world'));
  if (/^[a-zA-Z0-9-]{1,80}$/.test(p.get('slot') || '')) return '?slot=' + p.get('slot');
  if (['build','chunks'].includes(p.get('demo'))) return '?demo=' + p.get('demo');
  return null;
}
export function listWorlds(storage) {
  const items = [{ label: '기존 건축 월드', query: '?' }];
  for (let i=0;i<storage.length;i++) {
    const key = storage.key(i);
    if (key.startsWith('voxel-garden.terrain.v1.') && !key.endsWith('.backup')) {
      try { const seed = decodeURIComponent(key.slice('voxel-garden.terrain.v1.'.length)); items.push({label:'숲 · '+seed,query:'?world='+encodeURIComponent(seed)}); } catch { /* Ignore unrelated keys. */ }
    }
    if (key.startsWith(SLOT_PREFIX) && !key.endsWith('.backup')) {
      const id = key.slice(SLOT_PREFIX.length);
      if (/^[a-zA-Z0-9-]{1,80}$/.test(id)) items.push({label:'가져온 월드 · '+id.slice(0,8),query:'?slot='+id});
    }
  }
  return items;
}
