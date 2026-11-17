import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// SERVER SIEGE: plain Vite + React + R3F. Everything runs locally; the simulation never touches the network.
export default defineConfig({
  plugins: [react()],
  server: { port: 54240, strictPort: false, hmr: process.env.SS_NO_HMR ? false : undefined },
  build: { target: 'es2022', chunkSizeWarningLimit: 4000 },
});
