import { resolve } from 'node:path';
import { defineConfig as defineViteConfig, mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

const viteConfig = defineViteConfig({
  plugins: [
    react(),
    dts({
      include: ['lib'],
    }),
  ],
  build: {
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, 'lib/main.ts'),
      formats: ['es'],
      fileName: 'main',
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', 'graphql'],
    },
  },
});

const vitestConfig = defineVitestConfig({
  test: {
    silent: true,
  },
});

export default mergeConfig(viteConfig, vitestConfig);
