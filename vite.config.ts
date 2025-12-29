import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteSingleFile()
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Ensure small assets are also inlined
    assetsInlineLimit: 100000000, 
    // Prevent code splitting to keep everything in one chunk for the plugin to inline
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    host: true
  }
});