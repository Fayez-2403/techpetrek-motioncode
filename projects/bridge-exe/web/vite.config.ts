import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BRIDGE.EXE: plain Vite + React + R3F. The solver runs in the page; nothing touches the network.
export default defineConfig({
  plugins: [react()],
  server: { port: 54250, strictPort: false, hmr: process.env.BX_NO_HMR ? false : undefined, fs: { allow: ['..'] } },   // .. = SCENE_TIMINGS.json + solver/crosscheck_report.json
  build: { target: 'es2022', chunkSizeWarningLimit: 4000 },
  optimizeDeps: { exclude: ['@dimforge/rapier3d-compat'] },
});
