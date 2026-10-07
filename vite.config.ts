import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import path from 'node:path';

export default defineConfig({
  root: 'client',
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss({ config: path.resolve(__dirname, 'tailwind.config.js') }), autoprefixer()] } },
  server: { port: 5173, proxy: { '/api': 'http://localhost:3000' } },
  build: { outDir: '../dist', emptyOutDir: true, sourcemap: false, chunkSizeWarningLimit: 900 },
});
