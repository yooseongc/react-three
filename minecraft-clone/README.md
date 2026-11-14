# Minecraft Clone

React Three Fiber를 활용한 간단한 Minecraft 클론 프로젝트입니다.

**Demo:** https://yooseongc.github.io/react-three

## 개발 계획과 진행 기록

[복셀 정원 로드맵](./ROADMAP.md)에서 마일스톤, 완료 기준, 검증 및 진행 내역을 관리합니다.

## Tech Stack

- Node.js 26.13.1 LTS / npm 11.20.0
- React / React DOM 19.3.1
- [react-three-fiber](https://github.com/pmndrs/react-three-fiber) - React renderer for Three.js
- [@react-three/drei](https://github.com/pmndrs/drei) - Useful helpers (Sky, etc.)
- [zustand](https://github.com/pmndrs/zustand) - State management

Three.js 0.187.0, R3F 9.8.2, Drei 10.7.9, Zustand 5.1.0을 사용합니다.
빌드는 Vite 8.3.8, 테스트는 Vitest 5.1.0 / jsdom 31.0.1입니다.
플레이어 충돌은 `src/game/world.js`의 고정 간격 AABB 계산으로 처리합니다.
사용하지 않는 Cannon 및 CRA 의존성은 M2.5에서 제거했습니다.

## Project Structure

```
src/
├── App.jsx             # Main app - Canvas, Sky, lighting
├── components/
│   ├── Chunk.jsx       # Exposed faces batched by chunk/material
│   ├── Cubes.jsx       # Chunk rendering and shared materials
│   ├── Decorations.jsx # Instanced decorative grass
│   ├── FPVControls.jsx # First-person view controls
│   ├── Ground.jsx      # Ground plane
│   ├── Hud.jsx         # HUD overlay
│   └── Player.jsx      # Player controller
├── hooks/              # Custom hooks
├── images/             # Texture images
├── game/               # Voxel index, meshing, collision, ray traversal, fixtures
└── textures.js         # Shared texture loader
```

## Getting Started

```bash
nvm install 26.13.1
nvm use 26.13.1
npm ci
npm start
```

개발 주소는 `http://127.0.0.1:5173/react-three/`입니다.
`.nvmrc`에 Node 버전을 기록했습니다. nvm-windows에서는 위처럼 버전을 명시합니다.
OpenSSL 호환 옵션은 더 이상 필요하지 않습니다.

## M1 조작과 저장

- **산책 시작 / 계속하기** 버튼으로 마우스를 잠급니다.
- **WASD** 이동, **Shift** 달리기, **Space** 점프, 마우스로 시점을 조절합니다.
- 이동은 실제 카메라의 수평 시선 방향을 기준으로 합니다. 위아래를 봐도 이동 속도는 같습니다.
- 오른쪽 미니맵은 북쪽(-Z) 고정이며 블록 배치, 현재 위치·시선 방향, 시작점과 X/Z 좌표를 표시합니다.
- **좌클릭** 블록 파괴, **우클릭** 블록 설치, **1–6** 현재 페이지 블록 선택입니다.
- **Q/E** 재료 페이지 전환, **휠** 전체 12종 재료 순환입니다.
- **F** 비행 전환, 비행 중 **Space** 상승 / **C** 하강입니다. 비행 중에도 블록을 통과할 수 없습니다.
- 조작 거리는 6칸이며 몸 안이나 같은 위치에 블록을 설치할 수 없습니다.
- **ESC** 또는 창 포커스 이탈 시 일시정지합니다. 재개하려면 버튼을 누릅니다.
- 변경 후 0.5초, 일시정지, 탭 숨김 및 페이지 종료 시 저장을 시도합니다.
- 저장 상태를 화면 오른쪽 위에서 확인하고 메뉴의 **지금 저장**으로 재시도할 수 있습니다.
- 저장 키는 `voxel-garden.world.v1`입니다. 이전 `world` 저장은 읽기만 하고 보존합니다.
- 현재 저장이 손상되면 원본을 `voxel-garden.world.v1.backup`에 보존한 뒤 연습 월드를 엽니다.
  백업이나 저장소 접근에 실패하면 저장을 비활성화하고 안내합니다.
- 플레이어 위치는 아직 저장하지 않으며 재접속 시 안전한 시작 위치로 이동합니다.
- 현재 월드는 100×100 평면, 건축 중심 좌표 범위는 X/Z ±49, Y 1–64입니다.
  지형 생성과 대규모 월드 최적화는 M2 이후 범위입니다.

## 검증

```bash
npm run test:ci
npm run build
npm run preview
```

의존성 파일 누락으로 컴파일이 실패하면 서버를 종료한 후 `npm ci`로 잠금 파일 기준 설치를 복구합니다.

`npm run preview`는 빌드 결과를 `http://127.0.0.1:4173/react-three/`에서 제공합니다.
GitHub Pages와 같은 하위 경로로 실행하는 로컬 데모이며 외부 배포는 하지 않습니다.

## M2 청크 월드

- [청크 연습장](http://127.0.0.1:4173/react-three/?demo=chunks): 16,384블록 기반 플랫폼, 경계를 가로지르는 목재·유리 구조물, 인스턴싱 잔디 장식.
- [성능 측정 월드](http://127.0.0.1:4173/react-three/?demo=benchmark): 64×64×4 고정 월드. 저장하지 않으며 새로고침하면 초기화됩니다.
- 기본 주소는 기존 개인 월드를 그대로 사용합니다. 연습장만 별도 `voxel-garden.m2-demo.v1` 키에 저장합니다.
- 청크는 16×16×16 크기입니다. 내부 면을 제거하고 청크·재질별로 메시를 합칩니다.
- 편집한 청크와 면을 공유하는 경계 이웃만 다시 만들며, 제거한 지오메트리는 해제합니다.
- 충돌은 플레이어 주변의 점유 셀만 조회하고, 조준은 메시 삼각형 대신 격자를 따라 탐색합니다.
- 장식 잔디는 단일 InstancedMesh이며 충돌·파괴 대상이 아닙니다.
- 화면 성능 패널은 데모에서만 표시되며 드로콜에는 그림자 패스를 포함합니다.
- 저장 형식은 기존 v1을 유지합니다. 청크 인덱스는 불러올 때 재구성합니다.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Vite 개발 서버 실행 (127.0.0.1:5173) |
| `npm run test:ci` | 전체 단위 테스트 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | build 폴더를 /react-three/ 경로에서 미리보기 |
| `npm run deploy` | GitHub Pages 배포 |

M2.5 검증 내역은 [환경 업데이트 검증](docs/M2.5-VALIDATION.md), 이후 경고 검토 결과는 [M3 검증](docs/M3-VALIDATION.md)을 참고합니다.
Windows에서 `npm ci` 전에 개발·미리보기 서버를 종료해야 네이티브 모듈 파일 잠금을 피할 수 있습니다.

## M3 물빛 숲

- [물빛 숲 탐험](http://127.0.0.1:4173/react-three/?world=willow): 기존 월드 메뉴의 탐험 링크로도 이동할 수 있습니다.
- `?world=cedar`처럼 시드를 바꾸면 다른 지형과 숲이 생성됩니다. 같은 시드는 같은 풍경을 재현합니다.
- 북서쪽은 호수·언덕, 동쪽은 모래 해변입니다. 산책로를 따라 걷고 한 칸 단차는 Space로 넘으세요.
- 나무·지형도 파괴하고 건축할 수 있습니다. 물은 얕은 수면 표현이며 수영·유체 시뮬레이션은 없습니다.
- 시드별 저장에는 생성기 버전과 편집한 블록만 기록합니다. 기존 개인 월드와 M2 연습장 저장은 유지됩니다.
- 플레이어 위치는 아직 저장하지 않습니다. 새로고침하면 안전한 시작점으로 돌아갑니다.
- [M3 검증과 화면](docs/M3-VALIDATION.md)

## M4 건축

- [작은 집 데모](http://127.0.0.1:4173/react-three/?demo=build): 실제 조작으로 만든 96블록 집. 기존 월드와 별도 키 `voxel-garden.m4-demo.v1`에 저장합니다.
- 12종 재료: 흙·잔디·유리·목재·원목·모래·돌·잎·벽돌·회벽·기와·판석.
- 선택한 블록에 모서리 테두리가 표시됩니다. 설치 미리보기는 아직 없습니다.
- 설치·파괴 효과음과 파편 효과가 있습니다. ESC 메뉴에서 효과음을 끌 수 있습니다.
- 비행/음소거/선택 재료는 새로고침 시 초기화됩니다. 블록 변경은 자동 저장됩니다.
- [M4 검증과 조작](docs/M4-VALIDATION.md)
