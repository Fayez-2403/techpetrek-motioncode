import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ASTRA.EXE: plain Vite + React. Rapier's compat build inlines its WebAssembly, so no wasm plugin is needed.
export default defineConfig({
  plugins: [react()],
  server: { port: 54200, strictPort: false, hmr: process.env.ASTRA_NO_HMR ? false : undefined },
  worker: { format: 'es' },
  build: { target: 'es2022', chunkSizeWarningLimit: 4000 },
});
