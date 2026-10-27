import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// AFTERCODE: plain Vite + React (MediaPipe's wasm and model load from /public at run time).
export default defineConfig({
  plugins: [react()],
  server: { port: 54210, strictPort: false, hmr: process.env.AC_NO_HMR ? false : undefined },
  build: { target: 'es2022', chunkSizeWarningLimit: 4000 },
});
