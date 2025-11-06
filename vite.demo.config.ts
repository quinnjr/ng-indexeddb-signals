import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './demo',
  server: {
    port: 4200,
    strictPort: true,
  },
  resolve: {
    alias: {
      '../src/lib': resolve(__dirname, './src/lib'),
    },
  },
  optimizeDeps: {
    include: [
      '@angular/core',
      '@angular/common',
      '@angular/forms',
      '@angular/platform-browser',
      '@angular/compiler',
    ],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  esbuild: {
    target: 'es2020',
  },
});
