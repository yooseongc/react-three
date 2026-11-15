import { useEffect, useRef } from 'react';
import { useStore } from '../hooks/useStore';
import { playerView } from '../game/navigation';
import { landscape } from '../game/landscape';
import { BLOCK_TYPES, BLOCK_COLORS } from '../game/world';
import { activeMap } from '../game/mapConfig';

const SIZE = 192;
const PAD = 14;
const SCALE = (SIZE - PAD * 2) / activeMap.size;
const project = value => SIZE / 2 + value * SCALE;
const colors = Object.fromEntries(BLOCK_TYPES.map((type,i)=>[type,BLOCK_COLORS[i]]));

export default function Minimap() {
  const canvas = useRef();
  const coordinates = useRef();
  const cubes = useStore(state => state.cubes);
  useEffect(() => {
    const ctx = canvas.current.getContext('2d');
    if (!ctx) return undefined;
    // Cache terrain until blocks change. Only the player marker redraws at 10 Hz.
    const terrain = document.createElement('canvas');
    terrain.width = terrain.height = SIZE;
    const map = terrain.getContext('2d');
    map.fillStyle = '#263d31';
    map.fillRect(0, 0, SIZE, SIZE);
    map.fillStyle = '#647c48';
    map.fillRect(PAD, PAD, SIZE - 2 * PAD, SIZE - 2 * PAD);
    map.strokeStyle = '#e4edc51c';
    map.lineWidth = 1;
    for (let i = -activeMap.size/2+10; i < activeMap.size/2; i += 10) {
      map.beginPath();
      map.moveTo(project(i), PAD); map.lineTo(project(i), SIZE - PAD);
      map.moveTo(PAD, project(i)); map.lineTo(SIZE - PAD, project(i));
      map.stroke();
    }
    const top=new Map();
    for(const cube of cubes){const key=cube.pos[0]+','+cube.pos[2];if(!top.has(key)||top.get(key).pos[1]<cube.pos[1])top.set(key,cube);}
    [...top.values()].forEach(({ pos, texture }) => {
      map.fillStyle = texture==='lantern'?'#ffd28b':colors[texture];
      map.fillRect(project(pos[0] - 0.5), project(pos[2] - 0.5), SCALE, SCALE);
    });
    if (landscape) {
      map.fillStyle = '#70b9c4';
      landscape.water.forEach(([x,y,z]) => { if ((top.get(`${x},${z}`)?.pos[1]||0)+.5<y) map.fillRect(project(x-.5),project(z-.5),SCALE,SCALE); });
      for(const site of landscape.sites||[]){map.fillStyle='#fff0ba';map.fillRect(project(site.x)-2,project(site.z)-2,4,4);}
    }
    const draw = () => {
      const { x, y, z, heading } = playerView;
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.drawImage(terrain, 0, 0);
      // Spawn marker (0, 10); north is always -Z, at the top of the map.
      ctx.strokeStyle = '#d6e4bf';
      ctx.strokeRect(project(0) - 3, project(10) - 3, 6, 6);
      ctx.save();
      ctx.translate(project(x), project(z));
      ctx.rotate(-heading);
      ctx.fillStyle = '#fff2b31f';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 25, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(0, 2); ctx.lineTo(-5, 5); ctx.closePath();
      ctx.fillStyle = '#fff3bc'; ctx.fill();
      ctx.strokeStyle = '#233a2b'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
      canvas.current.dataset.position = [x, z].map(n => n.toFixed(3)).join(',');
      canvas.current.dataset.heading = String(heading);
      coordinates.current.textContent = 'X ' + x.toFixed(1) + ' · Y ' + y.toFixed(1) + ' · Z ' + z.toFixed(1);
    };
    draw();
    const timer = setInterval(draw, 100);
    return () => clearInterval(timer);
  }, [cubes]);
  return <aside className="minimap" aria-label="미니맵 · 북쪽 고정">
    <div className="minimap-title">주변 지도 <span>N ↑</span></div>
    <canvas ref={canvas} width={SIZE} height={SIZE} role="img" aria-label="블록 배치와 현재 위치 및 시선 방향" />
    <div ref={coordinates} className="minimap-coordinates" title="X·Z는 수평 위치, Y는 플레이어 발밑 높이입니다" />
    <small>▲ 나 · □ 시작점 · {activeMap.size} × {activeMap.size}</small>
  </aside>;
}
