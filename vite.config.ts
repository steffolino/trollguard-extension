import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, cpSync, mkdirSync, existsSync } from 'fs';
import type { Plugin } from 'vite';

function webExtPlugin(mode: string): Plugin {
  const targetBrowser = mode === 'firefox' ? 'firefox' : 'chrome';
  return {
    name: 'web-ext-build',
    closeBundle() {
      copyFileSync(
        resolve(__dirname, `manifest.${targetBrowser}.json`),
        resolve(__dirname, 'dist/manifest.json'),
      );
      const srcIcons = resolve(__dirname, 'public/icons');
      if (existsSync(srcIcons)) {
        const destIcons = resolve(__dirname, 'dist/icons');
        mkdirSync(destIcons, { recursive: true });
        cpSync(srcIcons, destIcons, { recursive: true });
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  // Set root to src/ so that popup/index.html outputs to dist/popup/index.html
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        content: resolve(__dirname, 'src/content/index.ts'),
        background: resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        // Stable names for extension manifests; popup assets get hashed names
        entryFileNames: (chunkInfo) =>
          chunkInfo.name === 'content' || chunkInfo.name === 'background'
            ? '[name].js'
            : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  plugins: [webExtPlugin(mode)],
}));
