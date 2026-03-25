# Minecraft Clone

React Three Fiber를 활용한 간단한 Minecraft 클론 프로젝트입니다.

**Demo:** https://yooseongc.github.io/react-three

## Tech Stack

- React 17
- [react-three-fiber](https://github.com/pmndrs/react-three-fiber) - React renderer for Three.js
- [@react-three/cannon](https://github.com/pmndrs/use-cannon) - Physics engine
- [@react-three/drei](https://github.com/pmndrs/drei) - Useful helpers (Sky, etc.)
- [zustand](https://github.com/pmndrs/zustand) - State management

## Project Structure

```
src/
├── App.js              # Main app - Canvas, Sky, Physics setup
├── components/
│   ├── Cube.js         # Single block
│   ├── Cubes.js        # Block collection manager
│   ├── FPVControls.js  # First-person view controls
│   ├── Ground.js       # Ground plane
│   ├── Hud.js          # HUD overlay
│   └── Player.js       # Player controller
├── hooks/              # Custom hooks
├── images/             # Texture images
└── textures.js         # Texture loader
```

## Getting Started

```bash
npm install
npm start
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | 개발 서버 실행 (localhost:3000) |
| `npm run build` | 프로덕션 빌드 |
| `npm run deploy` | GitHub Pages 배포 |
