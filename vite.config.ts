import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import type { Plugin } from 'vite';

/**
 * Identificador de versión: se escribe en dist/version.json y dentro del código.
 * La app lo compara al abrirse para recargar sola si el celular tenía guardada una versión vieja.
 */
const BUILD_ID = new Date().toISOString();
const versionFile = (): Plugin => ({
  name: 'version-file',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD_ID }) });
  },
});

// base: './' permite publicar la carpeta dist en cualquier subruta o hosting estático.
export default defineConfig({
  base: './',
  plugins: [react(), versionFile()],
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
  server: { host: true },
});
