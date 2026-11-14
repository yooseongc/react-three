import { validPosition, overlapsPlayer } from './world';

export function placementPosition(hit) {
  if (!hit) return null;
  return hit.block ? hit.block.map((n, i) => n + hit.normal[i])
    : [Math.round(hit.point[0]), 1, Math.round(hit.point[2])];
}

export function placementError(world, pos, player) {
  if (!pos) return '6칸 안의 블록이나 지면을 바라보세요';
  if (!validPosition(pos)) return '건축 가능한 범위를 벗어났습니다';
  if (world.blocks.has(pos.join(','))) return '이미 블록이 있는 자리입니다';
  if (player && overlapsPlayer(pos, player)) return '플레이어와 겹치는 자리입니다';
  return '';
}
