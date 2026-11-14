import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/react-three/',
  build: {
    outDir: 'build', sourcemap: true,
    rolldownOptions: { output: { codeSplitting: { groups: [
      { name: 'three-core', test: /three[\\/]build[\\/]three.core.js/, priority: 30 },
      { name: 'three-renderer', test: /node_modules[\\/]three[\\/]/, priority: 20 },
      { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|react-reconciler|scheduler)[\\/]/, priority: 10 },
    ] } } },
  },
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{js,jsx}'],
    environmentOptions: { jsdom: { url: 'http://localhost/react-three/' } },
    restoreMocks: true,
  },
});
